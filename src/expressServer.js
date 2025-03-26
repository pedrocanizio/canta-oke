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

// Update the styles in both routes
const commonStyles = `
    nav {
        display: flex;
        justify-content: center;
        margin: 20px 0;
        gap: 10px;
    }
    nav button {
        padding: 10px 20px;
        border: 2px solid #73c4e5;
        background-color: white;
        color: #73c4e5;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    nav button.active {
        background-color: #73c4e5;
        color: white;
    }
    nav button:hover {
        background-color: #5fb3d5;
        color: white;
    }
`;

// Update /songs route
app.get('/songs', (req, res) => {
    db.all("SELECT * FROM Musicas", (err, songs) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Músicas</title>
                <style>
                    ${commonStyles}
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background-color: #ffffff;
                        color: #000000;
                    }
                    th, td {
                        border: 1px solid #000000;
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f0f0f0;
                    }
                    h1 {
                        text-align: center;
                        color: #000000;
                    }
                    .add-button {
                        background-color: #73c4e5;
                        color: #ffffff;
                        border: none;
                        padding: 5px 10px;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                    .notification {
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background-color: #4CAF50;
                        color: white;
                        padding: 15px;
                        border-radius: 5px;
                        z-index: 1000;
                        animation: fadein 0.5s, fadeout 0.5s 2.5s;
                        max-width: 90%;
                        box-sizing: border-box;
                        transform: translateZ(0);
                    }
                    @keyframes fadein {
                        from {bottom: 0; opacity: 0;}
                        to {bottom: 20px; opacity: 1;}
                    }
                    @keyframes fadeout {
                        from {bottom: 20px; opacity: 1;}
                        to {bottom: 0; opacity: 0;}
                    }
                </style>
            </head>
            <body>
                <nav>
                    <button class="active" onclick="navigateTo('songs')">Lista Completa</button>
                    <button onclick="navigateTo('selected-songs')">Músicas Selecionadas</button>
                </nav>
                <div id="notification" class="notification" style="display: none;">Música adicionada com sucesso!</div>
                <table>
                    <thead>
                        <tr>
                            <th>Ação</th>
                            <th>Identificador</th>
                            <th>Artista</th>
                            <th>Música</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${songs.map(song => `
                            <tr>
                                <td><button class="add-button" onclick="addSong('${song.id}')">Adicionar</button></td>
                                <td>${song.identificador}</td>
                                <td>${song.artista}</td>
                                <td>${song.nome}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    function navigateTo(route) {
                        window.location.href = '/' + route;
                    }
                    async function addSong(id) {
                        try {
                            const response = await fetch('/add-song/' + id);
                            const song = await response.json();
                            if (song) {
                                const notification = document.getElementById('notification');
                                notification.style.display = 'block';
                                setTimeout(() => {
                                    notification.style.display = 'none';
                                }, 3000);
                            }
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    }
                </script>
            </body>
            </html>
        `;
        res.send(html);
    });
});

// Add new route to handle song addition
app.get('/add-song/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM Musicas WHERE id = ?", [id], (err, song) => {
        if (err || !song) {
            res.status(500).json({ error: 'Song not found' });
            return;
        }
        songs.push(song);
        // Send IPC message to main process
        mainWindow.webContents.send('update-selected-songs', song);
        
        res.json(song);
    });
});

app.get('/selected-songs', (req, res) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Músicas Selecionadas</title>
            <style>
                /* Reuse the same styles from /songs route */
                ${commonStyles}
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #ffffff;
                    color: #000000;
                }
                th, td {
                    border: 1px solid #000000;
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #f0f0f0;
                }
                .remove-button {
                    background-color: #ff4444;
                    color: #ffffff;
                    border: none;
                    padding: 5px 10px;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .notification {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background-color: #ff4444;
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    z-index: 1000;
                    animation: fadein 0.5s, fadeout 0.5s 2.5s;
                    max-width: 90%;
                    box-sizing: border-box;
                    transform: translateZ(0);
                }
            </style>
        </head>
        <body>
            <nav>
                <button onclick="navigateTo('songs')">Lista Completa</button>
                <button class="active" onclick="navigateTo('selected-songs')">Músicas Selecionadas</button>
            </nav>
            <div id="notification" class="notification" style="display: none;">Música removida</div>
            <table>
                <thead>
                    <tr>
                        <th>Ordem</th>
                        <th>Identificador</th>
                        <th>Artista</th>
                        <th>Música</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${songs.map((song, index) => `
                        <tr data-index="${index}">
                            <td>${index + 1}</td>
                            <td>${song.identificador}</td>
                            <td>${song.artista}</td>
                            <td>${song.nome}</td>
                            <td><button class="remove-button" onclick="removeSong(${index})">Remover</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>
                let songs = ${JSON.stringify(songs)};
                function navigateTo(route) {
                    window.location.href = '/' + route;
                }

                async function removeSong(index) {
                    const songData = songs[index];
                    try {
                        // Remove the song from the array immediately
                        songs.splice(index, 1);
                        
                        // Regenerate the entire table with updated indexes
                        regenerateTable();
                        
                        const response = await fetch('/remove-selected-song/' + index);
                        if (!response.ok) {
                            throw new Error('Failed to remove song');
                        }
                        
                        const notification = document.getElementById('notification');
                        notification.style.display = 'block';
                        setTimeout(() => {
                            notification.style.display = 'none';
                        }, 3000);
                    } catch (error) {
                        // Restore the song if there was an error
                        songs.splice(index, 0, songData);
                        regenerateTable();
                        alert('Erro ao remover música. Tente novamente.');
                    }
                }
                
                function regenerateTable() {
                    const tbody = document.querySelector('table tbody');
                    tbody.innerHTML = '';
                    
                    songs.forEach((song, idx) => {
                        const row = document.createElement('tr');
                        row.setAttribute('data-index', idx);
                        row.innerHTML = [
                            '<td>', idx + 1, '</td>',
                            '<td>', song.identificador, '</td>',
                            '<td>', song.artista, '</td>',
                            '<td>', song.nome, '</td>',
                            '<td><button class="remove-button" onclick="removeSong(', idx, ')">Remover</button></td>'
                        ].join('');
                        tbody.appendChild(row);
                    });
                }
            </script>
        </body>
        </html>
    `;
    res.send(html);
});

// Add new route to handle song removal
app.get('/remove-selected-song/:index', (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < songs.length) {
        const removedSong = songs.splice(index, 1);
        // Send IPC message to main process
        mainWindow.webContents.send('update-selected-songs', songs);
        res.status(200).send();
    } else {
        res.status(400).json({ error: 'Invalid index' });
    }
});

app.get('/songs', (req, res) => {
    db.all("SELECT * FROM Musicas", (err, songs) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Músicas</title>
                <style>
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background-color: #ffffff;
                        color: #000000;
                    }
                    th, td {
                        border: 1px solid #000000;
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f0f0f0;
                    }
                    h1 {
                        text-align: center;
                        color: #000000;
                    }
                    .add-button {
                        background-color: #73c4e5;
                        color: #ffffff;
                        border: none;
                        padding: 5px 10px;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                    .notification {
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background-color: #4CAF50;
                        color: white;
                        padding: 15px;
                        border-radius: 5px;
                        z-index: 1000;
                        animation: fadein 0.5s, fadeout 0.5s 2.5s;
                        max-width: 90%;
                        box-sizing: border-box;
                        transform: translateZ(0);
                    }
                    @keyframes fadein {
                        from {bottom: 0; opacity: 0;}
                        to {bottom: 20px; opacity: 1;}
                    }
                    @keyframes fadeout {
                        from {bottom: 20px; opacity: 1;}
                        to {bottom: 0; opacity: 0;}
                    }
                </style>
            </head>
            <body>
                <nav>
                    <button onclick="navigateTo('songs')">Lista Completa</button>
                    <button onclick="navigateTo('selected-songs')">Músicas Selecionadas</button>
                </nav>
                <div id="notification" class="notification" style="display: none;">Música adicionada com sucesso!</div>
                <table>
                    <thead>
                        <tr>
                            <th>Ação</th>
                            <th>Identificador</th>
                            <th>Artista</th>
                            <th>Música</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${songs.map(song => `
                            <tr>
                                <td><button class="add-button" onclick="addSong('${song.id}')">Adicionar</button></td>
                                <td>${song.identificador}</td>
                                <td>${song.artista}</td>
                                <td>${song.nome}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    async function addSong(id) {
                        try {
                            const response = await fetch('/add-song/' + id);
                            const song = await response.json();
                            if (song) {
                                const notification = document.getElementById('notification');
                                notification.style.display = 'block';
                                setTimeout(() => {
                                    notification.style.display = 'none';
                                }, 3000);
                            }
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    }
                </script>
            </body>
            </html>
        `;
        res.send(html);
    });
});

const PORT = 3000;
const localIP = getLocalIP();
const serverURL = `http://${localIP}:${PORT}`;

let mainWindow;
let songs = [];
function startServer(electronWindow,selectedSongs) {
    server.listen(PORT, () => {
        console.log(`Server running at ${serverURL}`);
    });
    mainWindow = electronWindow;
    songs = selectedSongs
    return serverURL;
}

module.exports = { startServer };