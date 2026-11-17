import { WHATSAPP, urlSite } from './config';

export const gnf = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} GNF`;

export function lienWhatsApp(texte, numero = WHATSAPP) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`;
}

// 620 00 00 00 → 224620000000 ; +224 620… → 224620…
export function numeroInternational(tel) {
  let n = String(tel || '').replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.length === 9) n = `224${n}`;
  return n;
}

export const lienCommande = (code) => `${urlSite()}/c/${code}`;

export function messageCommande({ reference, code, lignes, total, client_nom }, intention) {
  const details = lignes
    .map((l) => `• ${l.nom}${l.taille ? ` — T.${l.taille}` : ''} × ${l.quantite} — ${gnf(l.prix * l.quantite)}${l.source === 'speciale' ? ' (commande spéciale)' : ''}`)
    .join('\n');
  const entete = intention === 'discuter'
    ? `Bonjour Koloun Luxure 👋\nJe voudrais discuter du prix de ma commande ${reference} :`
    : `Bonjour Koloun Luxure 👋\nJe valide ma commande ${reference} :`;
  return `${entete}\n${details}\n\nTotal : ${gnf(total)}\nNom : ${client_nom}\n\nVoir ma commande : ${lienCommande(code)}`;
}

export const stockTotal = (p) => p.variantes.reduce((s, v) => s + v.tailles.reduce((a, t) => a + t.stock, 0), 0);
export const imagePrincipale = (p) => p.variantes?.[0]?.image || p.images?.[0] || null;

export function estNouveau(date) {
  return date && Date.now() - new Date(date).getTime() < 10 * 864e5;
}

export const lire = (cle, defaut) => {
  try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch { return defaut; }
};
export const ecrire = (cle, valeur) => {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible */ }
};

export const STATUTS = {
  nouvelle: { libelle: 'Reçue', etape: 1 },
  en_discussion: { libelle: 'Prix en discussion', etape: 1 },
  validee: { libelle: 'Confirmée par la boutique', etape: 2 },
  livree: { libelle: 'Livrée', etape: 3 },
  annulee: { libelle: 'Annulée', etape: 0 },
};
