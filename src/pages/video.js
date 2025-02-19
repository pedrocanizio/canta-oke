function onYouTubeIframeAPIReady() {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const iframePlayer = document.getElementById('player');

    function convertToEmbedLink(youtubeLink) {
        const videoId = youtubeLink.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        const finalVideoId = ampersandPosition !== -1 ? videoId.substring(0, ampersandPosition) : videoId;

        return finalVideoId;
    }

    async function loadNextSong() {
        const selectedSongs = await window.electronAPI.getSelectedSongs();
        if (selectedSongs.length > 0) {
            const firstSong = selectedSongs[0];
            if (firstSong.addedYoutubeLink) {
                videoPlayer.style.display = 'none';
                iframePlayer.style.display = 'block';
                const videoId = convertToEmbedLink(firstSong.caminho);
                createYouTubePlayer(videoId);
            } else {
                iframePlayer.style.display = 'none';
                videoPlayer.style.display = 'block';
                videoSource.src = `../assets/musicas/${firstSong.caminho}`;
                videoPlayer.load();
            }
        } else {
            navigateTo('index');
        }
    }

    videoPlayer.onended = async () => {
        navigateTo('score');
    };

    var player;
    function createYouTubePlayer(videoId) {
        player = new YT.Player('player', {
            videoId: videoId, // Replace with your YouTube Video ID
            playerVars: { autoplay: 1, controls: 1 }, // Enable autoplay
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            navigateTo('score');
        }
    }

    document.addEventListener('keydown', async (event) => {
        switch (event.key) {
            case 'p': // Remove the first song and load the next one
                await window.electronAPI.removeFirstSong();
                loadNextSong();
                break;
            case 'r': // Remove the last song and check if there are any songs left                
                let selectedSongs = await window.electronAPI.getSelectedSongs();
                if (selectedSongs.length > 1) {
                    await window.electronAPI.removeLastSong();
                }
                if (selectedSongs.length === 1) {
                    await window.electronAPI.removeLastSong();
                    navigateTo('index');
                }
                break;
            case 's': // Remove the first song and navigate to the score page
                navigateTo('score');
                break;
            case 'v': // Remove the first song and navigate to the score page
                navigateTo('index');
                break;

            default:
                break;
        }
    });
    loadNextSong();
}