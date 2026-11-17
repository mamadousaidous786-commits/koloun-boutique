import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { lire, ecrire } from './utils';

const Contexte = createContext(null);

// Panier, favoris, articles vus, commandes passées et session vendeur — gardés sur le téléphone
export function FournisseurBoutique({ children }) {
  const [panier, setPanier] = useState(() => lire('kb_panier', []));
  const [favoris, setFavoris] = useState(() => lire('kb_favoris', []));
  const [vus, setVus] = useState(() => lire('kb_vus', []));
  const [mesCommandes, setMesCommandes] = useState(() => lire('kb_mes_commandes', []));
  const [client, setClient] = useState(() => lire('kb_client', { nom: '', telephone: '' }));
  const [vendeur, setVendeurEtat] = useState(() => lire('kb_vendeur', null));
  // Enregistré tout de suite : les requêtes lisent le jeton juste après la connexion
  const setVendeur = useCallback((v) => { ecrire('kb_vendeur', v); setVendeurEtat(v); }, []);
  const [compte, setCompteEtat] = useState(() => lire('kb_compte', null)); // { token, compte }
  const setCompte = useCallback((c) => { ecrire('kb_compte', c); setCompteEtat(c); }, []);
  const [toast, setToast] = useState(null);
  const minuteur = useRef();

  useEffect(() => ecrire('kb_panier', panier), [panier]);
  useEffect(() => ecrire('kb_favoris', favoris), [favoris]);
  useEffect(() => ecrire('kb_vus', vus), [vus]);
  useEffect(() => ecrire('kb_mes_commandes', mesCommandes), [mesCommandes]);
  useEffect(() => ecrire('kb_client', client), [client]);

  useEffect(() => {
    const f = () => setVendeur(null);
    const g = () => setCompte(null);
    window.addEventListener('kb-deconnexion', f);
    window.addEventListener('kb-deconnexion-client', g);
    return () => { window.removeEventListener('kb-deconnexion', f); window.removeEventListener('kb-deconnexion-client', g); };
  }, [setVendeur, setCompte]);

  const notifier = useCallback((message, action) => {
    clearTimeout(minuteur.current);
    setToast({ message, action, id: Date.now() });
    minuteur.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // Une ligne = un article précis (taille de stock, ou paire spéciale + pointure)
  const ajouter = useCallback((ligne) => {
    const cle = ligne.source === 'speciale' ? `s-${ligne.special_id}-${ligne.taille || ''}` : `t-${ligne.produit_taille_id}`;
    setPanier((p) => {
      const existe = p.find((l) => l.cle === cle);
      if (existe) {
        const max = ligne.stock ?? 20;
        return p.map((l) => (l.cle === cle ? { ...l, quantite: Math.min(max, l.quantite + (ligne.quantite || 1)) } : l));
      }
      return [...p, { ...ligne, cle, quantite: ligne.quantite || 1 }];
    });
  }, []);

  const valeur = useMemo(() => ({
    panier,
    ajouter,
    changerQuantite: (cle, q) => setPanier((p) => p.map((l) => (l.cle === cle ? { ...l, quantite: Math.max(1, Math.min(l.stock ?? 20, q)) } : l))),
    retirer: (cle) => setPanier((p) => p.filter((l) => l.cle !== cle)),
    viderLignes: (cles) => setPanier((p) => p.filter((l) => !cles.includes(l.cle))),
    nbArticles: panier.reduce((s, l) => s + l.quantite, 0),
    favoris,
    basculerFavori: (id) => setFavoris((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f])),
    vus,
    marquerVu: (id) => setVus((v) => [id, ...v.filter((x) => x !== id)].slice(0, 16)),
    mesCommandes,
    memoriserCommande: (c) => setMesCommandes((m) => [c, ...m.filter((x) => x.code !== c.code)].slice(0, 30)),
    client,
    setClient,
    vendeur,
    setVendeur,
    compte,
    setCompte,
    toast,
    notifier,
  }), [panier, ajouter, favoris, vus, mesCommandes, client, vendeur, toast, notifier, setVendeur, compte, setCompte]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export const useBoutique = () => useContext(Contexte);
