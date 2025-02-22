document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#editTable tbody');
    const songs = await window.electronAPI.getAllSongs();
    songs.forEach(song => {
        const row = document.createElement('tr');

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

async function handleInputChange(event) {
    event.preventDefault(); // Prevent the default form submission behavior
    const input = event.target;
    const id = input.dataset.id;
    const column = input.dataset.column;
    const value = input.value;

    await window.electronAPI.updateSong(id, column, value);

    // Optionally, you can add a visual indicator to show the update was successful
    input.classList.add('updated');
    setTimeout(() => {
        input.classList.remove('updated');
    }, 1000);
}