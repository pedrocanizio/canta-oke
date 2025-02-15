const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const { db } = require('./database/index'); // Import the database logic
const { processFilesInFolder } = require('./database/fillDatabase');
const { generatePDF } = require('./generatePDF'); // Import the generatePDF function

const configPath = path.join(app.getPath('userData'), 'config.json');

// Ensure the configuration file exists
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ minScore: 0, maxScore: 99 }));
}

if (process.env.NODE_ENV === 'development') {
    const electronReload = require('electron-reload');
    electronReload(__dirname, {
        electron: require(`${__dirname}/../node_modules/electron`)
    });
    const folderPath = path.join(__dirname, 'assets', 'musicas');
    processFilesInFolder(folderPath);
}

let mainWindow;
let configWindow;
let tray;
let selectedSongs = [];

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1792,
        height: 1024,
        icon: path.join(__dirname, 'assets/icons/canta-oke-logo.ico'), // Set the window icon
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('src/pages/index.html');
    if (process.env.NODE_ENV === 'development') mainWindow.webContents.openDevTools(); // Uncomment to open DevTools

    mainWindow.on('close', () => {
        if (configWindow) {
            configWindow.close();
            configWindow = null;
        }
        app.quit();
    });
}

function createConfigWindow() {
    configWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false, // Remove the toolbar
        icon: path.join(__dirname, 'assets/icons/canta-oke-logo.ico'), // Set the window icon
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    configWindow.loadFile('src/pages/config.html');
}

app.whenReady().then(() => {
    createWindow();

    // Create the tray icon
    // tray = new Tray(path.join(__dirname, 'assets/icons/canta-oke-logo.png'));
    // const contextMenu = Menu.buildFromTemplate([
    //     { label: 'Show App', click: () => { mainWindow.show(); } },
    //     { label: 'Quit', click: () => { app.quit(); } }
    // ]);
    // tray.setToolTip('Canta Oke');
    // tray.setContextMenu(contextMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.on('close-config-window', () => {
    if (configWindow) {
        configWindow.close();
        configWindow = null;
    }
});

const template = [
    {
        label: 'Configuracoes',
        click: () => {
            createConfigWindow();
        }
    },
    {
        label: 'Lista de Musicas',
        click: () => {
            generatePDF();
        }
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Handle navigation between pages
ipcMain.on('navigate-to', (event, page) => {
    let filePath;
    switch (page) {
        case 'index':
            filePath = 'src/pages/index.html';
            break;
        case 'video':
            filePath = 'src/pages/video.html';
            break;
        case 'score':
            filePath = 'src/pages/score.html';
            break;
        default:
            filePath = 'src/pages/index.html';
            break;
    }
    mainWindow.loadFile(filePath);
});

// Handle searching for a song by identificador
ipcMain.handle('search-song', async (event, identificador) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM Musicas WHERE identificador = ?", [identificador], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
});

ipcMain.handle('get-selected-songs', () => {
    return selectedSongs;
});

ipcMain.handle('add-song', (event, song) => {
    selectedSongs.push(song);
});

ipcMain.handle('remove-first-song', () => {
    if (selectedSongs.length > 0) {
        selectedSongs.shift();
    }
});

ipcMain.handle('remove-last-song', () => {
    if (selectedSongs.length > 0) {
        selectedSongs.pop();
    }
});

ipcMain.handle('clear-selected-songs', () => {
    selectedSongs = [];
});

// Expose an IPC method to get the environment
ipcMain.handle('get-environment', () => {
    return process.env.NODE_ENV;
});

// Handle getting and setting configuration
ipcMain.handle('get-config', () => {
    const config = JSON.parse(fs.readFileSync(configPath));
    return config;
});

ipcMain.handle('set-config', (event, newConfig) => {
    fs.writeFileSync(configPath, JSON.stringify(newConfig));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});