const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite");
const path = require('path');
const { app } = require('electron');

// Get the user data path for the app
// const userDataPath = app.getPath('userData');
const dbPath = path.join(__dirname, 'music.db'); // Store the database in the root of this folder
// Initialize the database
const db = new sqlite3.Database(dbPath);

// Create the Musicas table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Musicas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identificador TEXT,
            artista TEXT,
            nome TEXT,
            caminho TEXT,
            caminhoOriginal TEXT
        )
    `);

    // Insert 5 random rows if the table is empty
    // db.get("SELECT COUNT(*) as count FROM Musicas", (err, row) => {
    //     if (err) throw err;

    //     if (row.count === 0) {
    //         const stmt = db.prepare("INSERT INTO Musicas (identificador, artista, nome, caminho) VALUES (?, ?, ?, ?)";

    //         const sampleData = [
    //             ["000001", "Artist X", "Song A", "000001 - Evidências - Chitãozinho and Xororó.mp4"],
    //             ["000002", "Artist Y", "Song B", "000002 - Sorriso Resplandecente - Ricardo Junior.mp4"],
    //             ["000003", "Artist Z", "Song C", "000003 - Tempo Perdido - Legião Urbana.mp4"],
    //             ["000004", "Artist W", "Song D", "000004 - Another Song - Another Artist.mp4"],
    //             ["000005", "Artist V", "Song E", "000005 - Yet Another Song - Yet Another Artist.mp4"]
    //         ];

    //         sampleData.forEach((data) => {
    //             stmt.run(data);
    //         });

    //         stmt.finalize();
    //     }
    // });
});

async function openDb() {
    return open({
        filename: dbPath,
        driver: sqlite3.Database
    });
}

module.exports = { db, openDb };