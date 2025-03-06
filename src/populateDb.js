// populateDb.js
const path = require('path');
const { processFilesInFolder } = require('./database/fillDatabase'); // Correct path to your fillDatabase.js

async function main() {
  try {
    console.log('Starting database population...');
    const folderPath = path.join(__dirname, 'assets', 'musicas');
    await processFilesInFolder(folderPath);
    console.log('Database population completed successfully.');
  } catch (error) {
    console.error('Error during database population:', error);
  }
}

main();
