document.addEventListener('DOMContentLoaded', () => {
  const back = document.getElementById('backBtn');
  back.addEventListener('click', () => navigateTo('landing'));
});

function navigateTo(page) {
  if (window && window.electronAPI && window.electronAPI.navigateTo) {
    window.electronAPI.navigateTo(page);
  } else {
    window.location.href = page + '.html';
  }
}

// Allow escape key to return to main menu
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') navigateTo('landing');
});
