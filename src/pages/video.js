document.addEventListener('DOMContentLoaded', async () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');

    async function loadNextSong() {
        const selectedSongs = await window.electronAPI.getSelectedSongs();
        if (selectedSongs.length > 0) {
            const firstSong = selectedSongs[0];
            videoSource.src = `../assets/musicas/${firstSong.caminho}`;
            videoPlayer.load();
        } else {
            navigateTo('index');
        }
    }

    videoPlayer.onended = async () => {
        navigateTo('score');
    };

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
    loadNextSong()
});