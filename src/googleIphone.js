// Connexion Google sur iPhone quand Koloun Boutique est installée sur l'écran d'accueil.
// La fenêtre Google n'y fonctionne qu'une fois : on passe par une redirection et un code secret à usage unique.
import { api } from './api';
import { API } from './config';

const CLE = 'kb_google_attente';
const DUREE = 15 * 60 * 1000;

export const estAppliIphone = () => {
  const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installee = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  return iphone && installee;
};

export const URL_RETOUR_GOOGLE = `${API}/boutique/auth/google/retour`;

function nouveauCode() {
  const octets = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const lire = () => { try { const a = JSON.parse(localStorage.getItem(CLE)); return a && Date.now() - a.t < DUREE ? a : null; } catch { return null; } };

// Prépare (ou réutilise) le code à mettre dans la demande Google
export async function preparerCodeGoogle() {
  let a = lire();
  if (!a) {
    a = { nonce: nouveauCode(), t: Date.now() };
    try { localStorage.setItem(CLE, JSON.stringify(a)); } catch { /* rien */ }
  }
  await api.preparerGoogle(a.nonce, window.location.origin);
  return a.nonce;
}

// Récupère la connexion si Google a répondu (null sinon). Le code est effacé une fois utilisé.
export async function recupererConnexionGoogle(nonce) {
  const n = nonce || lire()?.nonce;
  if (!n) return null;
  try {
    const r = await api.attenteGoogle(n);
    try { localStorage.removeItem(CLE); } catch { /* rien */ }
    return r;
  } catch (e) {
    if (e.statut === 404) return null;
    throw e;
  }
}

export const connexionGoogleEnAttente = () => !!lire();
