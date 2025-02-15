const fs = require('fs');
const path = require('path');
const { Ollama } = require('ollama');
const { openDb } = require('./index.js');

let ollama = new Ollama({
    url: 'http://localhost:11434'
});

async function discoverFileInfo(fileName) {
    const response = await ollama.chat({
        model: 'llama3.2:latest',
        messages: [{
            role: 'user', content: `I need you to return your response on the distinct fromat "[artist name]||[song name]".
      If you cant find the file name infer it.
      You have to do this using only the file name and not the file content.
      Only awnser me with what i asked for. I dont require additional information. dont add space nor /n.
      When you find the artist confirm if he has the song with the name you think it is. If you dont find try to look on the file name again because maybe you missed something and then try to figure out the song name again.
      I have a file called '${fileName}' can you say to me from witch artist it is and the song name?`
        }],
    });
    const fileInfoArr = response.message.content.replace(`/n`, '').trimEnd().split(`||`);
    const fileInfo = {
        artist: fileInfoArr[0].replaceAll('(Versão Karaokê)', '').replaceAll('(Karaokê Version)', '').replaceAll('Karaokê', ''),
        song: fileInfoArr[1].replaceAll('(Versão Karaokê)', '').replaceAll('(Karaokê Version)', '').replaceAll('Karaokê', '')
    };
    return Promise.resolve(fileInfo);
}

async function processFilesInFolder(folderPath) {
    const files = await fs.promises.readdir(folderPath);
    let identificadorLength = 0;


    const dbInical = await openDb();
    const musicasTable = await dbInical.get(`SELECT MAX(id) as maxId FROM Musicas`);
    identificadorLength = musicasTable.maxId || 0;
    dbInical.close();

    for (const [index, file] of files.entries()) {

        const db = await openDb();

        // Check if the file name is present in the database
        const isFileInDatabase = await db.get(
            'SELECT COUNT(*) as count FROM Musicas WHERE caminho = ?',
            [file]
        );

        if (isFileInDatabase.count > 0) {
            // Skip the rest of the loop if the file is already in the database
            db.close()
            continue;
        }
        identificadorLength += 1;
        const identificador = `${String(identificadorLength).padStart(6, '0')}`;
        const fileInfo = await discoverFileInfo(file);
        const fileExtension = path.extname(file);
        const newFileName = `${identificador} - ${fileInfo.song.trim()} - ${fileInfo.artist.trim()}${fileExtension}`;
        const oldFilePath = path.join(folderPath, file);
        const newFilePath = path.join(folderPath, newFileName);
        fs.rename(oldFilePath, newFilePath, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                return;
            }
            console.log(`Renamed: ${file} to ${newFileName}`);
        });
        console.log(`Index: ${index}, File: ${file}, Info: ${fileInfo}`);

        // Insert or update database
        const row = await db.get(`SELECT 1 FROM Musicas WHERE identificador = ?`, [identificador])
        console.log(row)
        if (row) {
            db.run(`UPDATE Musicas SET nome = ?, artista = ?, caminho = ? WHERE identificador = ?`,
                [fileInfo.song.trim(), fileInfo.artist.trim(), newFileName, identificador],
                (err) => {
                    if (err) {
                        console.error('Error updating database:', err.message);
                    } else {
                        console.log(`Updated database: ${newFileName}`);
                    }
                });
        } else {
            db.run(`INSERT INTO Musicas (identificador, nome, artista, caminho) VALUES (?, ?, ?, ?)`,
                [identificador, fileInfo.song.trim(), fileInfo.artist.trim(), newFileName],
                (err) => {
                    if (err) {
                        console.error('Error inserting into database:', err.message);
                    } else {
                        console.log(`Inserted into database: ${newFileName}`);
                    }
                });
        }
        db.close()
    }
}


module.exports = { processFilesInFolder };

// Example usage
// const folderPath = 'C:/Projeto/canta-oke-vue/src/assets/musicas'
// processFilesInFolder(folderPath);