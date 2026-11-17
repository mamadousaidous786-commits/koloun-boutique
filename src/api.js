import { API, DEMO } from './config';
import { lire } from './utils';

let demoModule = null;
const demo = async () => (demoModule ||= await import('./demo.js'));

async function requete(chemin, { methode = 'GET', corps, token, formulaire } = {}) {
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
    if (token && (reponse.status === 401 || reponse.status === 403)) {
      window.dispatchEvent(new Event('kb-deconnexion')); // session vendeur expirée
      throw new Error('Votre session a expiré. Reconnectez-vous dans l\'espace vendeur.');
    }
    const err = new Error(donnees.message || `Erreur ${reponse.status}`);
    err.statut = reponse.status;
    throw err;
  }
  return donnees;
}

const jeton = () => lire('kb_vendeur', null)?.token;

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
  creerCommande: appel('creerCommande', (corps) => requete('/boutique/commandes', { methode: 'POST', corps })),
  voirCommande: appel('voirCommande', (code) => requete(`/boutique/commandes/${code}`)),

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
  reglerProduit: appel('reglerProduit', (id, corps) => requete(`/boutique/admin/produits/${id}`, { methode: 'PATCH', corps, token: jeton() })),
};
