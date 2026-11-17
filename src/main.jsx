import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// « Télécharger l'application » : le navigateur propose l'installation très tôt, on garde sa proposition
// pour l'afficher quand le client appuie sur le bouton.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__kbInstallation = e;
  window.dispatchEvent(new Event('kb-installation'));
});
window.addEventListener('appinstalled', () => {
  window.__kbInstallation = null;
  window.dispatchEvent(new Event('kb-installation'));
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Application installable (écran d'accueil du téléphone, puis Play Store)
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_HASH !== '1') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
