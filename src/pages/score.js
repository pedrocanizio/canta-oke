const drumrollSound = new Audio('../assets/sound/drumroll3.mp3');

const firstDigitElement = document.getElementById('firstDigit');
const secondDigitElement = document.getElementById('secondDigit');
const messageWrapper = document.getElementById('messageWrapper');
const messageText = document.getElementById('messageText');
const messages = {
    0: ['Continue praticando, você vai conseguir!', 'Mais sorte na próxima vez!', 'Não desista, tente novamente!', 'A prática leva à perfeição!'],
    1: ['Nada mal, mas você pode fazer melhor!', 'Continue cantando, você está melhorando!', 'Você está no caminho certo!', 'Quase lá, continue assim!'],
    2: ['Bom trabalho, você está chegando lá!', 'Bom esforço, continue assim!', 'Você está indo muito bem, continue praticando!', 'Muito bem, continue assim!'],
    3: ['Ótima performance, quase um profissional!', 'Você é muito bom, continue assim!', 'Fantástico, você está quase lá!', 'Você é um natural, continue assim!'],
    4: ['Incrível, você é uma estrela!', 'Você arrasou, trabalho fantástico!', 'Incrível, você é uma superestrela!', 'Excepcional, você é o melhor!']
};

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch selected songs at startup
    const config = await window.electronAPI.getConfig();
    window.minScore = config.minScore;
    window.maxScore = config.maxScore;

    // Generate a random score between minScore and maxScore
    window.randomScore = Math.floor(Math.random() * (Number(window.maxScore) - Number(window.minScore) + 1)) + Number(window.minScore)

    drumrollSound.currentTime = 0;
    drumrollSound.play();
    drumrollSound.addEventListener('ended', onSoundEnd);
    changeDigits();
});

let intervalId = null;
function changeDigits() {
    intervalId = setInterval(() => {
        firstDigitElement.textContent = Math.floor(Math.random() * 10);
        secondDigitElement.textContent = Math.floor(Math.random() * 10);
        firstDigitElement.className = 'spinning';
        secondDigitElement.className = 'spinning';
    }, 200);

    setTimeout(() => {
        clearInterval(intervalId);
        const firstDigit = Math.floor(window.randomScore / 10);
        firstDigitElement.textContent = firstDigit;
        firstDigitElement.className = '';
        intervalId = setInterval(() => {
            secondDigitElement.textContent = Math.floor(Math.random() * 10);
        }, 200);

        setTimeout(() => {
            clearInterval(intervalId);
            const secondDigit = window.randomScore % 10;
            secondDigitElement.textContent = secondDigit;
            secondDigitElement.className = '';
            setSuccessMessage();
        }, 2500);
    }, 2500);
}

function setSuccessMessage() {
    const score = parseInt(firstDigitElement.textContent) * 10 + parseInt(secondDigitElement.textContent);
    const messageIndex = Math.floor(score / 20);
    const messageArray = messages[messageIndex];
    const successMessage = messageArray[Math.floor(Math.random() * messageArray.length)];
    showMessage(successMessage);
}

function showMessage(message) {
    messageText.textContent = message;
    messageWrapper.style.display = 'block';
}

function onSoundEnd() {
    window.electronAPI.removeFirstSong(); // Assuming this is the function in preload.js to remove the first song
    window.electronAPI.getSelectedSongs().then(selectedSongs => {
        if (selectedSongs.length > 0) {
            window.location.href = 'video.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}