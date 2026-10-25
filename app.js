import { startApp } from './ui.js';

startApp().catch(() => {
  document.querySelector('#subscription-list').innerHTML = '<div class="empty-state"><strong>Local storage is unavailable.</strong><span>Enable IndexedDB in your browser to keep subscriptions on this device.</span></div>';
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js');
}
