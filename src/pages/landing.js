function navigateTo(page) {
    window.electronAPI.navigateTo(page);
}

function downloadPDF() {
    window.electronAPI.generatePDF();
}

function openConfigModal() {
    document.getElementById('configModal').style.display = 'block';
    window.electronAPI.getConfig().then(config => {
        document.getElementById('minScore').value = config.minScore;
        document.getElementById('maxScore').value = config.maxScore;
    });
}

function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

document.getElementById('configForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const newConfig = {
        minScore: document.getElementById('minScore').value,
        maxScore: document.getElementById('maxScore').value
    };
    window.electronAPI.setConfig(newConfig).then(() => {
        alert('Configurações salvas!');
        closeConfigModal();
    });
});

function closeApp() {
    window.electronAPI.closeApp();
}

function openQRCodeModal() {
    document.getElementById('qrCodeModal').style.display = 'block';
    window.electronAPI.generateQRCode().then(qrCodeDataURL => {
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        qrCodeContainer.innerHTML = ''; // Clear any existing QR code
        const img = document.createElement('img');
        img.src = qrCodeDataURL;
        qrCodeContainer.appendChild(img);
    });
}

function closeQRCodeModal() {
    document.getElementById('qrCodeModal').style.display = 'none';
}