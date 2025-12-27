const { app, BrowserWindow, ipcMain, Menu, Tray } = require("electron");
const path = require("path");
const QRCode = require("qrcode"); // Import the QRCode library
const { db } = require("./database/index"); // Import the database logic
const { generatePDF } = require("./generatePDF"); // Import the generatePDF function
const { startServer, stopServer } = require("./expressServer"); // Import the server helpers

const configPath = path.join(app.getPath("userData"), "config.json");

// Fix fs require and add regular fs for sync operations
const fs = require("fs");
const fsPromises = require("fs").promises;

// Update the config file check
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ minScore: 80, maxScore: 99 }));
}

if (process.env.NODE_ENV === "development") {
  const electronReload = require("electron-reload");
  electronReload(__dirname, {
    electron: require(`${__dirname}/../node_modules/electron`),
  });
  // const folderPath = path.join(__dirname, 'assets', 'musicas');
  // processFilesInFolder(folderPath);
}

let mainWindow;
let configWindow;
let tray;
let selectedSongs = [];

const createWindow = () => {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    icon: path.join(
      __dirname,
      "..",
      "assets",
      "icons",
      "win",
      "circular_toolbar_icon.ico"
    ),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.loadFile("src/pages/landing.html"); // Load the landing page
  if (process.env.NODE_ENV === "development")
    mainWindow.webContents.openDevTools(); // Uncomment to open DevTools

  mainWindow.on("close", () => {
    if (configWindow) {
      configWindow.close();
      configWindow = null;
    }
    app.quit();
  });
};

function createConfigWindow() {
  configWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false, // Remove the toolbar
    icon: path.join(__dirname, "assets/icons/win/icon.ico"), // Set the window icon
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  configWindow.loadFile("src/pages/config.html");
}

app.whenReady().then(() => {
  createWindow();
  const serverURL = startServer(mainWindow, selectedSongs); // Start the server and get the URL

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.handle("get-server-url", () => serverURL); // Expose the server URL to the renderer process

  ipcMain.handle("generate-qr-code", async () => {
    try {
      const qrCodeURL = `${serverURL}/songs`;
      const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL);
      return qrCodeDataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  });
});

ipcMain.on("close-config-window", () => {
  if (configWindow) {
    configWindow.close();
    configWindow = null;
  }
});

const template = [
  {
    label: "Atalhos",
    click: () => {
      if (mainWindow) mainWindow.loadFile("src/pages/shortcuts.html");
    },
  },
  {
    label: "Configuracoes",
    click: () => {
      createConfigWindow();
    },
  },
  {
    label: "Lista de Musicas",
    click: () => {
      generatePDF();
    },
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Handle navigation between pages
ipcMain.on("navigate-to", (event, page) => {
  let filePath;
  switch (page) {
    case "index":
      filePath = "src/pages/index.html";
      break;
    case "video":
      filePath = "src/pages/video.html";
      break;
    case "score":
      filePath = "src/pages/score.html";
      break;
    case "edit":
      filePath = "src/pages/edit.html";
      break;
    case "landing":
      filePath = "src/pages/landing.html";
      break;
    case "shortcuts":
      filePath = "src/pages/shortcuts.html";
      break;
    default:
      filePath = "src/pages/index.html";
      break;
  }
  mainWindow.loadFile(filePath);
});

// Handle searching for a song by identificador
ipcMain.handle("search-song", async (event, identificador) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM Musicas WHERE identificador = ?",
      [identificador],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
});

ipcMain.handle("get-selected-songs", () => {
  return selectedSongs;
});

ipcMain.handle("add-song", (event, song) => {
  selectedSongs.push({
    ...song,
    addedYoutubeLink: song.addedYoutubeLink || false,
  });
});

ipcMain.handle("remove-first-song", () => {
  if (selectedSongs.length > 0) {
    selectedSongs.shift();
  }
});

ipcMain.handle("remove-last-song", () => {
  if (selectedSongs.length > 0) {
    selectedSongs.pop();
  }
});

ipcMain.handle("clear-selected-songs", () => {
  selectedSongs = [];
});

// Expose an IPC method to get the environment
ipcMain.handle("get-environment", () => {
  return process.env.NODE_ENV;
});

// Handle getting and setting configuration
ipcMain.handle("get-config", async () => {
  const config = JSON.parse(await fsPromises.readFile(configPath, "utf-8"));
  return config;
});

ipcMain.handle("set-config", async (event, newConfig) => {
  await fsPromises.writeFile(configPath, JSON.stringify(newConfig));
});

// Update delete song handler
ipcMain.handle("delete-song", async (event, id, filePath) => {
  try {
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM Musicas WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await fsPromises.unlink(
      path.join(__dirname, "assets", "musicas", filePath)
    );
  } catch (error) {
    console.error("Error deleting song:", error);
    throw error;
  }
});

// Update updateSongWithFile handler
ipcMain.handle(
  "updateSongWithFile",
  async (_event, id, newFileName, identificador) => {
    try {
      const row = await new Promise((resolve, reject) => {
        db.get("SELECT caminho FROM Musicas WHERE id = ?", [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      const oldPath = path.join(__dirname, "assets", "musicas", row.caminho);
      const newPath = path.join(__dirname, "assets", "musicas", newFileName);

      await fsPromises.rename(oldPath, newPath);

      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE Musicas SET caminho = ? WHERE id = ?",
          [newFileName, id],
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      return true;
    } catch (error) {
      console.error("Error updating file:", error);
      throw error;
    }
  }
);

ipcMain.handle("generate-pdf", async () => {
  await generatePDF();
});

// Handle getting all songs
ipcMain.handle("get-all-songs", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM Musicas", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// Handle updating a song
ipcMain.handle("update-song", async (event, id, column, value) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Musicas SET ${column} = ? WHERE id = ?`,
      [value, id],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
});

// Handle deleting a song
// ipcMain.handle('delete-song', async (event, id, filePath) => {
//     return new Promise((resolve, reject) => {
//         db.run(`DELETE FROM Musicas WHERE id = ?`, [id], (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 fs.unlink(path.join(__dirname, 'assets', 'musicas', filePath), (err) => {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve();
//                     }
//                 });
//             }
//         });
//     });
// });

// Handle closing the application
ipcMain.handle("close-app", () => {
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Graceful shutdown: stop server and close DB before quitting.
app.on("before-quit", async () => {
  console.log("App quitting: stopping server and closing DB...");

  try {
    if (typeof stopServer === "function") {
      await stopServer();
    }
  } catch (err) {
    console.error("Error stopping server:", err);
  }

  if (db && typeof db.close === "function") {
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error("Error closing DB:", err);
        else console.log("Database closed.");
        resolve();
      });
    });
  }

  // Fallback force exit para evitar hang
  setTimeout(() => {
    console.warn("Forcing app exit.");
    app.exit(0);
  }, 2000);
});
