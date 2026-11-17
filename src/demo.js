// Données de démonstration (VITE_DEMO=1) : permettent de voir l'application sans serveur.
// Les vraies photos et les vrais articles viennent de Koloun Gestion.
import { lire, ecrire } from './utils';

const FORMES = {
  basket: '<path d="M62 332c0-30 20-50 50-55l60-25c20-10 30-35 45-45h30c10 25 35 40 75 50 30 7 40 35 35 65v23H62z"/><path d="M56 355h306v14c0 6-5 11-11 11H67c-6 0-11-5-11-11z" opacity=".55"/><path d="M200 232l40 18M190 248l40 18M180 264l40 18" stroke="CLR2" stroke-width="5" stroke-linecap="round" fill="none"/>',
  mocassin: '<path d="M48 334c6-32 42-42 82-44 40-2 70-18 110-16 60 3 105 18 112 46v22H48z"/><path d="M44 350h314v12c0 6-5 10-11 10H55c-6 0-11-4-11-10z" opacity=".55"/><path d="M150 300c30-14 70-16 100-6" stroke="CLR2" stroke-width="5" fill="none" stroke-linecap="round"/>',
  sac: '<path d="M150 240c0-62 100-62 100 0" stroke="CLR" stroke-width="14" fill="none"/><path d="M104 240h192l22 162H82z"/><rect x="180" y="276" width="40" height="22" rx="4" fill="CLR2"/>',
  chemise: '<path d="M140 160l40-15q20 20 40 0l40 15 60 50-25 35-25-17v172H130V228l-25 17-25-35z"/><path d="M200 168v232" stroke="CLR2" stroke-width="4"/><circle cx="200" cy="210" r="4" fill="CLR2"/><circle cx="200" cy="250" r="4" fill="CLR2"/><circle cx="200" cy="290" r="4" fill="CLR2"/>',
  robe: '<path d="M176 150h48l12 62 66 198H98l66-198z"/><path d="M176 150l-6-40M224 150l6-40" stroke="CLR" stroke-width="6"/><path d="M160 214h80" stroke="CLR2" stroke-width="6"/>',
  talon: '<path d="M70 345l22-80c30 20 80 32 120 32 52 0 90-22 118 30v18H232l-16-24-96 8-10 74H96z"/><path d="M312 330h20" stroke="CLR2" stroke-width="6"/>',
  montre: '<rect x="176" y="110" width="48" height="280" rx="14" opacity=".55"/><circle cx="200" cy="250" r="72"/><circle cx="200" cy="250" r="56" fill="CLR2"/><path d="M200 250v-36M200 250l24 14" stroke="CLR" stroke-width="6" stroke-linecap="round"/>',
};

function affiche(forme, fond, couleur, accent) {
  const corps = FORMES[forme].replaceAll('CLR2', accent).replaceAll('CLR', couleur);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="g" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="${fond[0]}"/><stop offset="1" stop-color="${fond[1]}"/></radialGradient></defs><rect width="400" height="500" fill="url(#g)"/><ellipse cx="200" cy="420" rx="150" ry="16" fill="#000" opacity=".18"/><g fill="${couleur}">${corps}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const jours = (n) => new Date(Date.now() - n * 864e5).toISOString();
let idT = 1;
const tailles = (liste) => liste.map(([taille, stock]) => ({ id: idT++, taille: String(taille), stock }));

const PRODUITS = [
  { id: 101, nom: 'Basket montante cuir blanc', prix: 650000, categorie: 'Chaussures', date_ajout: jours(0), description: 'Cuir pleine fleur, semelle cousue. Se porte avec un jean brut comme avec un ensemble.',
    variantes: [
      { id: 1, image: affiche('basket', ['#2B3A55', '#141B28'], '#F4F1EA', '#C9A24B'), tailles: tailles([[40, 1], [41, 3], [42, 2], [43, 0]]) },
      { id: 2, image: affiche('basket', ['#5B4A3A', '#241C15'], '#1C1814', '#D8C29A'), tailles: tailles([[41, 2], [42, 4]]) },
    ] },
  { id: 102, nom: 'Mocassin velours bordeaux', prix: 480000, categorie: 'Chaussures', date_ajout: jours(1), description: 'Velours italien, mors doré. Idéal pour les cérémonies.',
    variantes: [
      { id: 3, image: affiche('mocassin', ['#E8E2D6', '#BDB3A2'], '#6E1E2B', '#C9A24B'), tailles: tailles([[40, 2], [41, 1], [42, 1], [44, 1]]) },
      { id: 4, image: affiche('mocassin', ['#DCE3EA', '#9FB0C2'], '#1B2840', '#C9A24B'), tailles: tailles([[42, 3]]) },
    ] },
  { id: 103, nom: 'Sac à main structuré', prix: 720000, categorie: 'Sacs', date_ajout: jours(1), description: 'Cuir grainé, fermoir aimanté, bandoulière amovible.',
    variantes: [{ id: 5, image: affiche('sac', ['#F1E9DC', '#C8B79B'], '#2A1E14', '#C9A24B'), tailles: tailles([['Unique', 4]]) }] },
  { id: 104, nom: 'Chemise lin manches longues', prix: 260000, categorie: 'Vêtements', date_ajout: jours(2), description: 'Lin lavé, coupe droite. Respirante pour la chaleur de Conakry.',
    variantes: [
      { id: 6, image: affiche('chemise', ['#E3ECF4', '#A9BED3'], '#F7F7F4', '#8AA0B8'), tailles: tailles([['M', 3], ['L', 5], ['XL', 2]]) },
      { id: 7, image: affiche('chemise', ['#2C2A26', '#11100E'], '#C9B48A', '#5B4F3A'), tailles: tailles([['M', 1], ['L', 0], ['XL', 2]]) },
    ] },
  { id: 105, nom: 'Robe fluide longue', prix: 540000, categorie: 'Vêtements', date_ajout: jours(3), description: 'Crêpe léger, taille marquée, longueur cheville.',
    variantes: [{ id: 8, image: affiche('robe', ['#F3E4E0', '#C99A8F'], '#7A2E2A', '#E8C7BF'), tailles: tailles([['S', 2], ['M', 2], ['L', 1]]) }] },
  { id: 106, nom: 'Escarpin vernis', prix: 590000, categorie: 'Chaussures', date_ajout: jours(4), description: 'Talon 9 cm, cuir verni, semelle intérieure rembourrée.',
    variantes: [
      { id: 9, image: affiche('talon', ['#1F1A17', '#0F0C0A'], '#C9A24B', '#7A6233'), tailles: tailles([[37, 1], [38, 2], [39, 2], [40, 0]]) },
      { id: 10, image: affiche('talon', ['#F2EDE6', '#CFC3B2'], '#B3122E', '#2A1E14'), tailles: tailles([[38, 1], [39, 1]]) },
    ] },
  { id: 107, nom: 'Montre acier cadran nuit', prix: 850000, categorie: 'Accessoires', date_ajout: jours(5), description: 'Boîtier 40 mm, verre saphir, étanche 50 m.',
    variantes: [{ id: 11, image: affiche('montre', ['#26303E', '#0E131B'], '#C9CDD3', '#16202E'), tailles: tailles([['Unique', 2]]) }] },
  { id: 108, nom: 'Basket running légère', prix: 420000, categorie: 'Chaussures', date_ajout: jours(6), description: 'Mesh respirant, semelle amortissante.',
    variantes: [{ id: 12, image: affiche('basket', ['#E7EEE9', '#AFC4B5'], '#1E3B2E', '#F4F1EA'), tailles: tailles([[39, 2], [40, 2], [41, 1], [42, 0], [43, 3]]) }] },
  { id: 109, nom: 'Pochette soirée dorée', prix: 310000, categorie: 'Sacs', date_ajout: jours(8), description: 'Finition métallisée, chaîne amovible.',
    variantes: [{ id: 13, image: affiche('sac', ['#1E1A15', '#0B0907'], '#C9A24B', '#1E1A15'), tailles: tailles([['Unique', 1]]) }] },
  { id: 110, nom: 'Chemise wax ajustée', prix: 290000, categorie: 'Vêtements', date_ajout: jours(9), description: 'Coton wax, coupe ajustée, col français.',
    variantes: [{ id: 14, image: affiche('chemise', ['#F6E7C8', '#D9A44A'], '#1D3C78', '#F6E7C8'), tailles: tailles([['M', 2], ['L', 2]]) }] },
  { id: 111, nom: 'Derby cuir marron', prix: 560000, categorie: 'Chaussures', date_ajout: jours(14), description: 'Cuir patiné à la main, semelle cuir.',
    variantes: [{ id: 15, image: affiche('mocassin', ['#EFE6D8', '#C6B08D'], '#5A3420', '#2A1E14'), tailles: tailles([[41, 1], [42, 2], [43, 1]]) }] },
  { id: 112, nom: 'Robe courte satinée', prix: 380000, categorie: 'Vêtements', date_ajout: jours(20), description: 'Satin fluide, dos ouvert.',
    variantes: [{ id: 16, image: affiche('robe', ['#1D2433', '#0B0F18'], '#C9A24B', '#1D2433'), tailles: tailles([['S', 0], ['M', 1]]) }] },
].map((p) => ({ ...p, stock_total: p.variantes.reduce((s, v) => s + v.tailles.reduce((a, t) => a + t.stock, 0), 0) }));

let SPECIALES = [
  { id: 201, nom: 'Jordan 4 Retro « Military Black »', prix: 1150000, delai: '2 à 3 semaines', tailles: ['40', '41', '42', '43', '44', '45'], description: 'Modèle commandé à la pointure exacte.', date_ajout: jours(0),
    images: [affiche('basket', ['#F2F2EF', '#BFC3C7'], '#1A1A1A', '#F2F2EF'), affiche('basket', ['#26303E', '#0E131B'], '#E9E9E4', '#6B7480')] },
  { id: 202, nom: 'Air Force 1 blanche', prix: 780000, delai: '2 à 3 semaines', tailles: ['38', '39', '40', '41', '42', '43', '44'], description: 'Blanc intégral.', date_ajout: jours(2),
    images: [affiche('basket', ['#DCE7F2', '#9DB3CA'], '#FAFAF7', '#C8D2DC')] },
  { id: 203, nom: 'Mocassin Gucci horsebit noir', prix: 1650000, delai: '2 à 3 semaines', tailles: ['40', '41', '42', '43', '44'], description: 'Cuir lisse, mors doré.', date_ajout: jours(3),
    images: [affiche('mocassin', ['#F0E9DE', '#C9B79A'], '#141210', '#C9A24B')] },
  { id: 204, nom: 'New Balance 550 vert', prix: 820000, delai: '2 à 3 semaines', tailles: ['39', '40', '41', '42', '43'], description: '', date_ajout: jours(5),
    images: [affiche('basket', ['#EEF2EC', '#B9C8B3'], '#F7F6F0', '#2F5A3C')] },
  { id: 205, nom: 'Escarpin Louboutin So Kate', prix: 2400000, delai: '3 semaines', tailles: ['36', '37', '38', '39', '40'], description: 'Semelle rouge, talon 12 cm.', date_ajout: jours(7),
    images: [affiche('talon', ['#1A1714', '#0A0807'], '#141210', '#B3122E')] },
  { id: 206, nom: 'Timberland 6-inch premium', prix: 990000, delai: '2 à 3 semaines', tailles: ['40', '41', '42', '43', '44', '45'], description: 'Nubuck imperméable.', date_ajout: jours(9),
    images: [affiche('basket', ['#F3E6CF', '#D2AE6D'], '#B7832F', '#5A3B14')] },
];

const pause = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const copie = (x) => JSON.parse(JSON.stringify(x));
const commandes = () => lire('kb_demo_commandes', []);

export async function infos() { await pause(80); return { nom: 'Koloun Luxure', adresse: 'Lambanyi, Forage Dadis, Conakry', telephone: '+224 627 25 84 97', categories: ['Chaussures', 'Vêtements', 'Sacs', 'Accessoires'] }; }
export async function produits(f = {}) {
  await pause();
  const r = (f.recherche || '').toLowerCase();
  return copie(PRODUITS.filter((p) => (!r || p.nom.toLowerCase().includes(r)) && (!f.categorie || p.categorie === f.categorie)));
}
export async function nouveautes() { await pause(); return copie(PRODUITS.slice(0, 10)); }
export async function produit(id) { await pause(120); const p = PRODUITS.find((x) => x.id === Number(id)); if (!p) throw new Error("Cet article n'est plus disponible."); return copie(p); }
export async function speciales() { await pause(); return copie(SPECIALES); }

export async function creerCommande(corps) {
  await pause(500);
  const lignes = corps.lignes.map((l, i) => {
    if (l.source === 'speciale') {
      const s = SPECIALES.find((x) => x.id === l.special_id);
      return { id: i + 1, source: 'speciale', special_id: s.id, nom: s.nom, image: s.images[0], taille: l.taille, quantite: l.quantite, prix_unitaire: s.prix, prix_negocie: null };
    }
    for (const p of PRODUITS) for (const v of p.variantes) {
      const t = v.tailles.find((x) => x.id === l.produit_taille_id);
      if (t) {
        if (t.stock < l.quantite) throw new Error(`« ${p.nom} » taille ${t.taille} : il n'en reste que ${t.stock}.`);
        return { id: i + 1, source: 'stock', produit_id: p.id, nom: p.nom, image: v.image, taille: t.taille, quantite: l.quantite, prix_unitaire: p.prix, prix_negocie: null };
      }
    }
    throw new Error("Un article de votre panier n'existe plus.");
  });
  const total = lignes.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0);
  const code = Math.random().toString(16).slice(2, 12);
  const d = new Date();
  const reference = `KB-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const c = { id: Date.now(), reference, code, type: 'panier', statut: corps.intention === 'discuter' ? 'en_discussion' : 'nouvelle', client_nom: corps.client_nom, client_telephone: corps.client_telephone, note_client: corps.note || null, note_vendeur: null, total_initial: total, remise: 0, total_final: total, created_at: d.toISOString(), lignes };
  ecrire('kb_demo_commandes', [c, ...commandes()]);
  return { reference, code, total };
}
export async function voirCommande(code) { await pause(150); const c = commandes().find((x) => x.code === code); if (!c) throw new Error('Commande introuvable. Vérifiez le lien reçu.'); return c; }

export async function connexion(email) { await pause(300); return { token: 'demo', utilisateur: { nom: 'Sow', prenom: '', email, role: 'admin' } }; }
export async function commandesAdmin(statut) { await pause(); return commandes().filter((c) => !statut || c.statut === statut).map((c) => ({ ...c, nb_lignes: c.lignes.length, image: c.lignes[0]?.image })); }
export async function commandeAdmin(id) { await pause(); return commandes().find((c) => c.id === Number(id)); }
export async function commandeAdminParCode(code) { await pause(); return commandes().find((c) => c.code === code); }
export async function modifierCommande(id, corps) {
  await pause(300);
  const liste = commandes();
  const c = liste.find((x) => x.id === Number(id));
  for (const nl of corps.lignes || []) {
    const l = c.lignes.find((x) => x.id === nl.id);
    const prix = nl.prix_negocie === '' || nl.prix_negocie == null ? null : Math.round(Number(nl.prix_negocie));
    if (prix != null && prix > l.prix_unitaire) throw new Error(`« ${l.nom} » : le nouveau prix doit être inférieur ou égal au prix affiché.`);
    l.prix_negocie = prix === l.prix_unitaire ? null : prix;
  }
  const sous = c.lignes.reduce((s, l) => s + (l.prix_negocie ?? l.prix_unitaire) * l.quantite, 0);
  c.remise = Math.min(Math.max(0, Math.round(Number(corps.remise ?? c.remise) || 0)), sous);
  c.total_final = sous - c.remise;
  if (corps.statut) c.statut = corps.statut;
  if (corps.note_vendeur !== undefined) c.note_vendeur = corps.note_vendeur || null;
  ecrire('kb_demo_commandes', liste);
  return c;
}
export async function specialesAdmin() { await pause(); return copie(SPECIALES).map((s) => ({ ...s, actif: true })); }
export async function publierSpeciale(form) {
  await pause(400);
  const fichiers = form.getAll('images');
  const images = await Promise.all(fichiers.map((f) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); })));
  SPECIALES = [{ id: Date.now(), nom: form.get('nom'), prix: Number(form.get('prix')), delai: form.get('delai') || '2 à 3 semaines', tailles: String(form.get('tailles') || '').split(/[,;\s]+/).filter(Boolean), description: form.get('description') || '', images, date_ajout: new Date().toISOString() }, ...SPECIALES];
  return { message: 'Paire publiée.' };
}
export async function modifierSpeciale() { await pause(); return { message: 'Paire mise à jour.' }; }
export async function retirerSpeciale(id) { await pause(); SPECIALES = SPECIALES.filter((s) => s.id !== id); return { message: "Paire retirée de l'application." }; }
export async function produitsAdmin() { await pause(); return PRODUITS.map((p) => ({ id: p.id, nom: p.nom, prix: p.prix, categorie: p.categorie, visible: true, image: p.variantes[0].image })); }
export async function reglerProduit(id, corps) { await pause(); const p = PRODUITS.find((x) => x.id === id); if (p && corps.categorie !== undefined) p.categorie = corps.categorie; return { message: 'Produit mis à jour.' }; }

// Comptes (démonstration) : un email contenant « admin » ouvre l'espace vendeur
export async function seConnecter(identifiant) {
  await pause(300);
  if (/admin/i.test(identifiant)) return { type: 'vendeur', token: 'demo', utilisateur: { nom: 'Sow', prenom: '', email: identifiant, role: 'admin' } };
  return { type: 'client', token: 'demo-client', compte: { id: 1, nom: 'Client démo', telephone: '224620000000', email: null, google: false } };
}
export async function sInscrire(c) { await pause(300); return { type: 'client', token: 'demo-client', compte: { id: 1, nom: c.nom, telephone: /@/.test(c.contact) ? null : c.contact, email: /@/.test(c.contact) ? c.contact : null, google: false } }; }
export async function connexionGoogle() { await pause(200); throw new Error('Connexion Google indisponible en démonstration.'); }
export async function monCompte() { await pause(200); const c = lire('kb_compte', null)?.compte; return { compte: c, commandes: commandes().map((x) => ({ reference: x.reference, code: x.code, statut: x.statut, total: x.total_final, total_initial: x.total_initial, date: x.created_at, nb: x.lignes.length, image: x.lignes[0]?.image })) }; }
export async function modifierCompte(corps) { await pause(200); return { compte: { ...lire('kb_compte', null)?.compte, nom: corps.nom } }; }
export async function clientsInscrits() { await pause(200); return [{ id: 1, nom: 'Mariama Bah', telephone: '224621112233', email: null, actif: true, google: false, avec_mdp: true, created_at: new Date().toISOString(), derniere_connexion: new Date().toISOString(), nb_commandes: 2, total_confirme: 930000 }, { id: 2, nom: 'Ibrahima Sow', telephone: null, email: 'ibra@mail.com', actif: true, google: true, avec_mdp: false, created_at: new Date().toISOString(), derniere_connexion: null, nb_commandes: 0, total_confirme: 0 }]; }
export async function commandesDuClient() { await pause(200); return []; }
export async function reglerClient() { await pause(200); return {}; }
export async function reinitialiserClient() { await pause(200); return { mot_de_passe: 'KL123456' }; }
