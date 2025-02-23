const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    navigateTo: (page) => ipcRenderer.send('navigate-to', page),
    closeApp: () => ipcRenderer.invoke('close-app'),
    searchSong: (identificador) => ipcRenderer.invoke('search-song', identificador),
    getSelectedSongs: () => ipcRenderer.invoke('get-selected-songs'),
    addSong: (song) => ipcRenderer.invoke('add-song', song),
    removeFirstSong: () => ipcRenderer.invoke('remove-first-song'),
    removeLastSong: () => ipcRenderer.invoke('remove-last-song'),
    clearSelectedSongs: () => ipcRenderer.invoke('clear-selected-songs'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (newConfig) => ipcRenderer.invoke('set-config', newConfig),
    closeConfigWindow: () => ipcRenderer.send('close-config-window'),
    generatePDF: () => ipcRenderer.invoke('generate-pdf'),
    getAllSongs: () => ipcRenderer.invoke('get-all-songs'),
    updateSong: (id, column, value) => ipcRenderer.invoke('update-song', id, column, value),
    deleteSong: (id, filePath) => ipcRenderer.invoke('delete-song', id, filePath) // Add deleteSong method
});