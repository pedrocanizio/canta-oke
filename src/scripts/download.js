const { downloadVideos } = require('../utils/youtubeDownloader');

downloadVideos()
    .then(() => console.log('All done!'))
    .catch(console.error);