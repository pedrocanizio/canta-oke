
function capitalizeWords(text) {
    return text.replace(/\w\S*/g, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

function cleanText(textC) {
    let text = textC ? textC : '';
    return capitalizeWords(text.replaceAll('(Versão Karaokê)', '')
        .replaceAll('(Karaokê Version)', '')
        .replaceAll('Karaokê', '')
        .replaceAll('(Karaokê)', '')
        .replaceAll('(Personal)', '')
        .replaceAll('(Karaoke Version)', '')
        .replaceAll('( KARAOKE )', '')
        .replaceAll(' 🎤', '')
        .replaceAll('-', '')
        .replaceAll('.', '')
        .replaceAll('"', '')
        .trim());
}
module.exports = { capitalizeWords, cleanText };
