// Notifications « Nouvel arrivage » : le client accepte une fois, il est prévenu à chaque nouveau produit.
import { api } from './api';
import { DEMO } from './config';

const estInstallee = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const surIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const pris_en_charge = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// 'actif' | 'inactif' | 'refuse' | 'installer' (iPhone : il faut d'abord installer l'application) | 'indisponible'
export async function etatNotifications() {
  if (DEMO) return 'indisponible';
  if (!pris_en_charge()) return surIphone() && !estInstallee() ? 'installer' : 'indisponible';
  if (Notification.permission === 'denied') return 'refuse';
  const reg = await navigator.serviceWorker.getRegistration();
  const abonnement = await reg?.pushManager.getSubscription();
  return abonnement && Notification.permission === 'granted' ? 'actif' : 'inactif';
}

function cleBinaire(base64) {
  const remplissage = '='.repeat((4 - (base64.length % 4)) % 4);
  const brut = atob((base64 + remplissage).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

// À appeler sur un geste du client (bouton) : demande l'autorisation puis enregistre le téléphone
export async function activerNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied'
    ? 'Notifications bloquées. Autorisez-les dans les réglages du téléphone pour Koloun Luxure.'
    : 'Notifications non autorisées.');
  const reg = await navigator.serviceWorker.ready;
  const { cle } = await api.cleNotifications();
  let abonnement = await reg.pushManager.getSubscription();
  if (!abonnement) {
    try {
      abonnement = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleBinaire(cle) });
    } catch {
      throw new Error(surIphone()
        ? "Impossible d'activer les notifications. Ouvrez Koloun Luxure depuis son icône sur l'écran d'accueil, puis réessayez."
        : "Ce navigateur ne permet pas les notifications. Ouvrez Koloun Luxure dans Chrome, puis réessayez.");
    }
  }
  await api.abonnerNotifications(abonnement.toJSON());
  window.dispatchEvent(new Event('kb-notifications'));
}

export async function desactiverNotifications() {
  const reg = await navigator.serviceWorker.getRegistration();
  const abonnement = await reg?.pushManager.getSubscription();
  if (abonnement) {
    await api.desabonnerNotifications(abonnement.endpoint).catch(() => {});
    await abonnement.unsubscribe().catch(() => {});
  }
  window.dispatchEvent(new Event('kb-notifications'));
}

// Au démarrage : si le client avait accepté, on renvoie son abonnement (il peut changer avec le temps)
export async function resynchroniserNotifications() {
  try {
    if (DEMO || !pris_en_charge() || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const abonnement = await reg.pushManager.getSubscription();
    if (abonnement) await api.abonnerNotifications(abonnement.toJSON());
  } catch { /* hors ligne : on réessaiera au prochain démarrage */ }
}
