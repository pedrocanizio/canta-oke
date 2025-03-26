const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const { processFilesInFolder } = require("../database/fillDatabase");
const { db } = require("../database");

async function getPlaylistVideos(url) {
    try {
        // Check if URL is a playlist
        if (url.includes('playlist?list=')) {
            const playlist = await ytpl(url, { limit: Infinity });
            return playlist.items.map(item => item.url);
        }
        // If not a playlist, return the single video URL
        return [url];
    } catch (error) {
        console.error(`Error processing playlist: ${url}`, error);
        return [url]; // Return original URL if not a playlist
    }
}

async function downloadVideos() {
    const outputFolder = path.join(__dirname, '..', 'assets', 'musicas');
    const linksFile = path.join(__dirname, '..', 'assets', 'youtube-links.txt');

    // Read links file (one URL per line)
    const rawLinks = fs.readFileSync(linksFile, 'utf-8')
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

    // Process playlists and gather all video URLs
    let allLinks = [];
    for (const link of rawLinks) {
        const videos = await getPlaylistVideos(link);
        allLinks = allLinks.concat(videos);
    }

    // Create output folder if needed
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Create or read skipped files log
    const skippedFilesPath = path.join(__dirname, '..', 'assets', 'skipped-downloads.json');
    let skippedFiles = {};
    if (fs.existsSync(skippedFilesPath)) {
        skippedFiles = JSON.parse(fs.readFileSync(skippedFilesPath, 'utf-8'));
    }

    // Get existing files and database entries
    const existingFiles = fs.readdirSync(outputFolder);
    const existingDbFiles = await new Promise((resolve, reject) => {
        db.all("SELECT caminhoOriginal FROM Musicas", (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(row => row.caminhoOriginal));
        });
    });

    // Download all videos
    for (const link of allLinks) {
        // Check if link was previously skipped and not old enough to retry
        if (skippedFiles[link]) {
            console.log(`Skipping previously failed link: ${link}`);
            continue;
        }

        try {
            const info = await ytdl.getInfo(link);
            const videoTitleFormat = info.videoDetails.title.replace(/[^\w\s]/gi, '');
            const videoTitle = info.videoDetails.title.replace(/[\\\/|":*?=–]/g, '');
            const outputPath = path.join(outputFolder, `${videoTitle}.mp4`);

            // Check if file exists in folder or database
            if (existingFiles.includes(`${videoTitle}.mp4`)) {
                console.log(`Skipping: ${videoTitle} (file already exists in musicas folder)`);
                // Record the skip time
                skippedFiles[link] = Date.now();
                fs.writeFileSync(skippedFilesPath, JSON.stringify(skippedFiles, null, 2));
                continue;
            }
            if (existingDbFiles.includes(`${videoTitle}.mp4`)) {
                console.log(`Skipping: ${videoTitle} (file already registered in database)`);
                // Record the skip time
                skippedFiles[link] = Date.now();
                fs.writeFileSync(skippedFilesPath, JSON.stringify(skippedFiles, null, 2));
                continue;
            }

            console.log(`Downloading: ${videoTitle}`);
            try {
                await new Promise((resolve, reject) => {
                    let writeStream = null;
                    
                    const cleanup = () => {
                        if (writeStream) {
                            writeStream.end();
                        }
                        if (fs.existsSync(outputPath)) {
                            try {
                                fs.unlinkSync(outputPath);
                            } catch (unlinkError) {
                                console.error(`Error deleting partial file: ${unlinkError.message}`);
                            }
                        }
                    };

                    try {
                        writeStream = fs.createWriteStream(outputPath);
                        const download = ytdl(link, {
                            quality: 'highest',
                            filter: 'audioandvideo',
                            requestOptions: {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                }
                            }
                        });

                        // Handle ytdl errors
                        download.on('error', (err) => {
                            cleanup();
                            console.error(`YTDL Error: ${err.message}`);
                            reject(err);
                        });                        

                        // Handle write stream errors
                        writeStream.on('error', (err) => {
                            cleanup();
                            console.error(`Write Stream Error: ${err.message}`);
                            reject(err);
                        });

                        writeStream.on('finish', () => {
                            console.log(`Download completed: ${videoTitle}`);
                            resolve();
                        });

                        // Start the download
                        download.pipe(writeStream);

                    } catch (setupError) {
                        cleanup();
                        console.error(`Setup Error: ${setupError.message}`);
                        reject(setupError);
                    }
                });
                console.log(`Successfully processed: ${videoTitle}`);
            } catch (downloadError) {
                console.error(`Download failed for ${videoTitle}: ${downloadError.message}`);
                throw downloadError; // Re-throw to be caught by outer try-catch
            }
        } catch (error) {
            console.error(`Complete error for ${link}:`, error);
            // Continue with next video instead of stopping the entire process
            continue;
        }
    }

    // Update database after all downloads
    console.log('Processing files for database...');
    await processFilesInFolder(outputFolder);
    console.log('Database update completed!');
}

module.exports = { downloadVideos };