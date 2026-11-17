import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Application installable (écran d'accueil du téléphone, puis Play Store)
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_HASH !== '1') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
