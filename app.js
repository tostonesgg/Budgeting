const installHelp = document.getElementById('install-help');
installHelp.addEventListener('click', () => {
  alert('Open in Safari → Share → Add to Home Screen to install.');
});

// Register Service Worker so it works offline (paths are relative for GitHub Pages)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Placeholder: not storing data yet
document.getElementById('add').addEventListener('click', () => {
  alert('This is just a placeholder. We\'ll wire up storage next.');
});
