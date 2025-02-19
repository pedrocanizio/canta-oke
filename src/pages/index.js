let currentSong = null; // Variable to store the currently searched song

document.addEventListener('DOMContentLoaded', async () => {
    await updateSelectedSongsList();
    const inputElement = document.getElementById('search');
    inputElement.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown);
});

async function updateSelectedSongsList() {
    const selectedSongs = await window.electronAPI.getSelectedSongs();
    const selectedSongsListDiv = document.getElementById('selectedSongsList');

    if (selectedSongs.length === 0) {
        selectedSongsListDiv.innerHTML = '<p>Nenhuma musica selecionada.</p>';
        return;
    }

    let songsHTML = '<table><tr><th>Identificador</th><th>Artista</th><th>Nome</th></tr>';
    let youtubeSongsCount = 0;

    selectedSongs.forEach((song) => {
        if (!song.addedYoutubeLink) {
            songsHTML += `<tr><td>${song.identificador}</td><td>${song.artista}</td><td>${song.nome}</td></tr>`;
        } else {
            youtubeSongsCount++;
        }
    });
    songsHTML += '</table>';

    if (youtubeSongsCount > 0) {
        songsHTML += `<p>${youtubeSongsCount} músicas do YouTube adicionadas.</p>`;
    }

    selectedSongsListDiv.innerHTML = songsHTML;
}

// Validate input to allow only numbers and ensure it is 6 digits long
function validateInput(inputElement) {
    const lastChar = inputElement.value.slice(-1);

    // Remove non-numeric characters
    let rawValue = inputElement.value.replace(/[^0-9]/g, '');

    // If the last character is not a number, return
    if (isNaN(lastChar)) {
        inputElement.value = rawValue;
        return;
    }

    rawValue = Number(rawValue).toString()

    // Limit the input to a maximum of 6 digits
    if (rawValue.length > 6) {
        rawValue = rawValue.slice(0, 6);
    }

    // Pad the value with leading zeros to make it 6 characters long
    const paddedValue = rawValue.padStart(6, '0');

    // Update the input field with the formatted value
    inputElement.value = paddedValue;

    // Call searchSong after validating the input
    searchSong(paddedValue);
}

async function searchSong(identificador) {
    const resultDiv = document.getElementById('result');

    if (!identificador) {
        resultDiv.innerHTML = '<p>Please enter an identificador.</p>';
        return;
    }

    try {
        const song = await window.electronAPI.searchSong(identificador);

        if (song) {
            resultDiv.innerHTML = `
                <p><strong>Nome:</strong> ${song.nome}</p>
                <p><strong>Artista:</strong> ${song.artista}</p>
            `;
            currentSong = song;
        } else {
            resultDiv.innerHTML = '<p>Nenhuma Musica selecionada.</p>';
            currentSong = null;
        }
    } catch (error) {
        console.error('Error searching for song:', error);
        resultDiv.innerHTML = '<p>An error occurred while searching for the song.</p>';
    }
}

// Add the current song to the selected songs array
function addCurrentSong() {
    const youtubeLink = document.getElementById('youtubeLink').value;

    if (!currentSong && !youtubeLink) {
        alert('Nenhuma Música selecionada.');
        return;
    }

    let song = {};
    if (youtubeLink) {
        song = {
            identificador: document.getElementById('search').value,
            caminho: youtubeLink,
            addedYoutubeLink: true
        };
    } else {
        song = {
            ...currentSong,
            addedYoutubeLink: false
        };
    }

    window.electronAPI.addSong(song);
    updateSelectedSongsList();

    // Clear the input fields and reset the current song
    const inputElement = document.getElementById('search');
    inputElement.removeEventListener('input', handleInput);
    inputElement.value = '';
    document.getElementById('youtubeLink').value = '';
    currentSong = null; // Reset the current song
    document.getElementById('result').innerHTML = ''; // Clear the result div
    inputElement.addEventListener('input', handleInput);
}

// Remove the first song from the selected songs array
function removeFirstSong() {
    window.electronAPI.removeFirstSong();
    updateSelectedSongsList();
}

// Remove the last song from the selected songs array
function removeLastSong() {
    window.electronAPI.removeLastSong();
    updateSelectedSongsList();
}

// Clear all songs from the selected songs array
function clearSelectedSongs() {
    window.electronAPI.clearSelectedSongs();
    updateSelectedSongsList();
}

// Handle input event
function handleInput(event) {
    validateInput(event.target);
}

// Handle keydown event
function handleKeydown(event) {
    switch (event.key) {
        case 'a':
            if (currentSong) {
                addCurrentSong();
            }
            break;
        case 'r':
            removeLastSong();
            break;
        case 'p':
            removeFirstSong();
            break;
        case 'l':
            clearSelectedSongs();
            break;
        case 'Enter':
            const youtubeLink = document.getElementById('youtubeLink').value;
            if (currentSong || youtubeLink) {
                addCurrentSong();
            }
            navigateTo('video');
            break;
        default:
            break;
    }
}

function navigateTo(page) {
    window.electronAPI.navigateTo(page);
}