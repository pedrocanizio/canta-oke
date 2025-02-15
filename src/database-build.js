const { processFilesInFolder } = require("./database/fillDatabase");

const folderPath = path.join(__dirname, 'assets', 'musicas');
processFilesInFolder(folderPath);