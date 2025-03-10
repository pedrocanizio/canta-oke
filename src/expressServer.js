const express = require('express');
const http = require('http');
const os = require('os');
const { db } = require('./database/index'); // Import the database logic

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const details of iface) {
            if (details.family === 'IPv4' && !details.internal) {
                return details.address;
            }
        }
    }
    return 'localhost';
}

const app = express();
const server = http.createServer(app);

app.get('/songs', async (req, res) => {
    try {
        const rows = await new Promise((resolve, reject) => {
            db.all('SELECT identificador, artista, nome FROM Musicas ORDER BY artista', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        let html = `
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #6a0dad;
                    color: #fff;
                }
                th, td {
                    border: 1px solid #fff;
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #4b0082;
                }
                h1 {
                    text-align: center;
                    color: #fff;
                }
            </style>
            <h1 style='color: #4b0082;'>Lista de Musicas</h1>
            <table>
                <tr>
                    <th>Identificador</th>
                    <th>Artista</th>
                    <th>Musica</th>
                </tr>`;
        rows.forEach(song => {
            html += `<tr><td>${song.identificador}</td><td>${song.artista}</td><td>${song.nome}</td></tr>`;
        });
        html += `</table>`;

        res.send(html);
    } catch (error) {
        res.status(500).send('Error fetching songs');
    }
});

const PORT = 3000;
const localIP = getLocalIP();
const serverURL = `http://${localIP}:${PORT}`;

function startServer() {
    server.listen(PORT, () => {
        console.log(`Server running at ${serverURL}`);
    });
    return serverURL;
}

module.exports = { startServer };