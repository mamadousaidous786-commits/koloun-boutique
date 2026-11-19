import { API, DEMO } from './config';
import { lire } from './utils';

let demoModule = null;
const demo = async () => (demoModule ||= await import('./demo.js'));

async function requete(chemin, { methode = 'GET', corps, token, formulaire, client = false } = {}) {
  const entetes = {};
  if (token) entetes.Authorization = `Bearer ${token}`;
  if (corps && !formulaire) entetes['Content-Type'] = 'application/json';
  let reponse;
  try {
    reponse = await fetch(`${API}${chemin}`, {
      method: methode,
      headers: entetes,
      body: formulaire || (corps ? JSON.stringify(corps) : undefined),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifiez votre internet puis réessayez.');
  }
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    if (token && client && reponse.status === 401) {
      window.dispatchEvent(new Event('kb-deconnexion-client')); // session client expirée
      throw new Error('Votre session a expiré. Reconnectez-vous.');
    }
    if (token && !client && (reponse.status === 401 || reponse.status === 403)) {
      window.dispatchEvent(new Event('kb-deconnexion')); // session vendeur expirée
      throw new Error('Votre session a expiré. Reconnectez-vous.');
    }
    const err = new Error(donnees.message || `Erreur ${reponse.status}`);
    err.statut = reponse.status;
    throw err;
  }
  return donnees;
}

const jeton = () => lire('kb_vendeur', null)?.token;
const jetonClient = () => lire('kb_compte', null)?.token;

// Chaque fonction bascule sur les données de démonstration si VITE_DEMO=1
const appel = (nom, reel) => async (...args) => (DEMO ? (await demo())[nom](...args) : reel(...args));

export const api = {
  infos: appel('infos', () => requete('/boutique/infos')),
  produits: appel('produits', (f = {}) => {
    const p = new URLSearchParams();
    if (f.recherche) p.set('recherche', f.recherche);
    if (f.categorie) p.set('categorie', f.categorie);
    return requete(`/boutique/produits${p.toString() ? `?${p}` : ''}`);
  }),
  nouveautes: appel('nouveautes', () => requete('/boutique/nouveautes')),
  produit: appel('produit', (id) => requete(`/boutique/produits/${id}`)),
  speciales: appel('speciales', () => requete('/boutique/speciales')),
  // La commande est rattachée au compte du client s'il est connecté
  creerCommande: appel('creerCommande', (corps) => requete('/boutique/commandes', { methode: 'POST', corps, token: jetonClient(), client: true })),
  voirCommande: appel('voirCommande', (code) => requete(`/boutique/commandes/${code}`)),

  // Comptes : une seule connexion (un compte Koloun Gestion ouvre l'espace vendeur)
  seConnecter: appel('seConnecter', (identifiant, mot_de_passe) => requete('/boutique/auth/connexion', { methode: 'POST', corps: { identifiant, mot_de_passe } })),
  sInscrire: appel('sInscrire', (corps) => requete('/boutique/auth/inscription', { methode: 'POST', corps })),
  connexionGoogle: appel('connexionGoogle', (credential) => requete('/boutique/auth/google', { methode: 'POST', corps: { credential } })),
  monCompte: appel('monCompte', () => requete('/boutique/compte', { token: jetonClient(), client: true })),
  annulerCommande: appel('annulerCommande', (code) => requete(`/boutique/compte/commandes/${code}/annuler`, { methode: 'POST', token: jetonClient(), client: true })),
  accepterCommande: appel('accepterCommande', (id, corps) => requete(`/boutique/admin/commandes/${id}/accepter`, { methode: 'POST', corps, token: jeton() })),
  refuserCommande: appel('refuserCommande', (id, motif) => requete(`/boutique/admin/commandes/${id}/refuser`, { methode: 'POST', corps: { motif }, token: jeton() })),
  modifierCompte: appel('modifierCompte', (corps) => requete('/boutique/compte', { methode: 'PUT', corps, token: jetonClient(), client: true })),
  clientsInscrits: appel('clientsInscrits', () => requete('/boutique/admin/clients', { token: jeton() })),
  commandesDuClient: appel('commandesDuClient', (id) => requete(`/boutique/admin/clients/${id}/commandes`, { token: jeton() })),
  reglerClient: appel('reglerClient', (id, corps) => requete(`/boutique/admin/clients/${id}`, { methode: 'PATCH', corps, token: jeton() })),
  reinitialiserClient: appel('reinitialiserClient', (id) => requete(`/boutique/admin/clients/${id}/reinitialiser`, { methode: 'POST', token: jeton() })),

  // Espace vendeur (identifiants Koloun Gestion)
  connexion: appel('connexion', (email, mot_de_passe) => requete('/auth/login', { methode: 'POST', corps: { email, mot_de_passe } })),
  commandesAdmin: appel('commandesAdmin', (statut) => requete(`/boutique/admin/commandes${statut ? `?statut=${statut}` : ''}`, { token: jeton() })),
  commandeAdmin: appel('commandeAdmin', (id) => requete(`/boutique/admin/commandes/${id}`, { token: jeton() })),
  commandeAdminParCode: appel('commandeAdminParCode', (code) => requete(`/boutique/admin/commandes/${code}?par=code`, { token: jeton() })),
  modifierCommande: appel('modifierCommande', (id, corps) => requete(`/boutique/admin/commandes/${id}`, { methode: 'PATCH', corps, token: jeton() })),
  specialesAdmin: appel('specialesAdmin', () => requete('/boutique/admin/speciales', { token: jeton() })),
  publierSpeciale: appel('publierSpeciale', (formulaire) => requete('/boutique/admin/speciales', { methode: 'POST', formulaire, token: jeton() })),
  modifierSpeciale: appel('modifierSpeciale', (id, formulaire) => requete(`/boutique/admin/speciales/${id}`, { methode: 'PUT', formulaire, token: jeton() })),
  retirerSpeciale: appel('retirerSpeciale', (id) => requete(`/boutique/admin/speciales/${id}`, { methode: 'DELETE', token: jeton() })),
  produitsAdmin: appel('produitsAdmin', () => requete('/boutique/admin/produits', { token: jeton() })),
  // Notifications « Nouvel arrivage »
  cleNotifications: () => requete('/boutique/notifications/cle'),
  abonnerNotifications: (abonnement) => requete('/boutique/notifications/abonner', { methode: 'POST', corps: abonnement, token: jetonClient() }),
  desabonnerNotifications: (endpoint) => requete('/boutique/notifications/desabonner', { methode: 'POST', corps: { endpoint } }),
  reglerProduit: appel('reglerProduit', (id, corps) => requete(`/boutique/admin/produits/${id}`, { methode: 'PATCH', corps, token: jeton() })),
};
