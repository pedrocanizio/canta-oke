document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#editTable tbody');
    const songs = await window.electronAPI.getAllSongs();
    
    // Sort songs by artist and song name
    songs.sort((a, b) => {
        const artistCompare = a.artista.localeCompare(b.artista);
        return artistCompare !== 0 ? artistCompare : a.nome.localeCompare(b.nome);
    });

    songs.forEach(song => {
        const row = document.createElement('tr');

        // Add delete button
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', () => deleteSong(song.id, song.caminho));
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        Object.keys(song).forEach(key => {
            const cell = document.createElement('td');
            if (key === 'id') {
                cell.textContent = song[key];
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = song[key];
                input.dataset.id = song.id;
                input.dataset.column = key;
                input.addEventListener('change', handleInputChange);
                cell.appendChild(input);
            }
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
});

// Add new function for reordering
function reorderTable() {
    const rows = Array.from(document.querySelectorAll('#editTable tbody tr'));
    const songs = rows.map(row => ({
        id: parseInt(row.querySelector('td:nth-child(2)').textContent),
        artista: row.querySelector('input[data-column="artista"]').value,
        nome: row.querySelector('input[data-column="nome"]').value,
        identificador: row.querySelector('input[data-column="identificador"]').value,
        caminho: row.querySelector('input[data-column="caminho"]').value,
        caminhoOriginal: row.querySelector('input[data-column="caminhoOriginal"]').value
    }));

    const sortByArtist = document.getElementById('sortByArtist').checked;
    if (sortByArtist) {
        songs.sort((a, b) => {
            const artistCompare = a.artista.localeCompare(b.artista);
            return artistCompare !== 0 ? artistCompare : a.nome.localeCompare(b.nome);
        });
    } else {
        songs.sort((a, b) => a.id - b.id);
    }

    const tableBody = document.querySelector('#editTable tbody');
    tableBody.innerHTML = '';
    
    songs.forEach(song => {
        const row = document.createElement('tr');
        
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', () => deleteSong(song.id, song.caminho));
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        Object.keys(song).forEach(key => {
            const cell = document.createElement('td');
            if (key === 'id') {
                cell.textContent = song[key];
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = song[key];
                input.dataset.id = song.id;
                input.dataset.column = key;
                input.addEventListener('change', handleInputChange);
                cell.appendChild(input);
            }
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    // Reapply current filter if exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value) {
        filterTable();
    }
}

async function handleInputChange(event) {
    event.preventDefault();
    const input = event.target;
    const id = input.dataset.id;
    const column = input.dataset.column;
    const value = input.value;

    const row = input.closest('tr');
    const identificador = row.querySelector('input[data-column="identificador"]').value;
    const musica = row.querySelector('input[data-column="nome"]').value;
    const artista = row.querySelector('input[data-column="artista"]').value;
    const currentPath = row.querySelector('input[data-column="caminho"]').value;
    const extension = currentPath.split('.').pop();

    // If editing artist or song name, update the path too
    if (column === 'artista' || column === 'nome') {
        const newPath = `${identificador} - ${musica} - ${artista}.${extension}`;
        row.querySelector('input[data-column="caminho"]').value = newPath;
        
        try {
            await window.electronAPI.updateSongWithFile(id, newPath, identificador);
        } catch (error) {
            console.error('Error updating file:', error);
            // Revert all changes if there's an error
            const songs = await window.electronAPI.getAllSongs();
            const song = songs.find(s => s.id === parseInt(id));
            input.value = song[column];
            row.querySelector('input[data-column="caminho"]').value = song.caminho;
            return;
        }
    }

    // Special handling for 'caminho' column
    if (column === 'caminho') {
        try {
            await window.electronAPI.updateSongWithFile(id, value, identificador);
        } catch (error) {
            console.error('Error updating file:', error);
            const songs = await window.electronAPI.getAllSongs();
            const song = songs.find(s => s.id === parseInt(id));
            input.value = song.caminho;
            return;
        }
    } else {
        // Normal update for other columns
        await window.electronAPI.updateSong(id, column, value);
    }

    // Visual feedback
    input.classList.add('updated');
    setTimeout(() => {
        input.classList.remove('updated');
    }, 1000);
}

async function deleteSong(id, filePath) {
    try {
        await window.electronAPI.deleteSong(id, filePath);
        // Find and remove the row from the table instead of reloading
        const row = document.querySelector(`tr input[data-id="${id}"]`).closest('tr');
        row.remove();
        
        // Re-apply current filter if search input has value
        const searchInput = document.getElementById('searchInput');
        if (searchInput.value) {
            filterTable();
        }
    } catch (error) {
        console.error('Error deleting song:', error);
    }
}