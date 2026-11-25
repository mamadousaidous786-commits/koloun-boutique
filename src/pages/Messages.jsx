import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useBoutique } from '../store';
import Img from '../components/Img';
import { IcoEnvoyer, IcoPhoto } from '../components/Icones';
import { gnf, libelleStatut } from '../utils';

// Discussion avec la boutique, comme sur 1688 : texte, photos, cartes produit / panier / commande.
// La boutique peut modifier le prix d'une commande : la carte se met à jour ici.
const heure = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const jour = (d) => {
  const x = new Date(d); const auj = new Date();
  const hier = new Date(); hier.setDate(auj.getDate() - 1);
  if (x.toDateString() === auj.toDateString()) return "Aujourd'hui";
  if (x.toDateString() === hier.toDateString()) return 'Hier';
  return x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const STATUTS_RESA = { a_confirmer: 'À confirmer', en_attente: 'Mise de côté', retiree: 'Retirée', annulee: 'Annulée' };

// Photo réduite avant l'envoi (plus rapide sur la 3G/4G)
async function reduire(fichier) {
  try {
    const bitmap = await createImageBitmap(fichier);
    const echelle = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bitmap.width * echelle); c.height = Math.round(bitmap.height * echelle);
    c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : fichier;
  } catch { return fichier; }
}

function CarteCommande({ c, prix }) {
  if (!c) return <p className="petit">Commande introuvable.</p>;
  const reduit = c.total_final < c.total_initial;
  return (
    <div className="carte-chat">
      {prix && <p className="carte-chat-titre">💰 La boutique a modifié le prix</p>}
      <div className="carte-chat-tete">
        <strong>Commande {c.reference}</strong>
        <span className={`statut statut-${c.statut}`}>{libelleStatut(c.statut, c.mode_livraison)}</span>
      </div>
      {!prix && (
        <ul className="carte-chat-lignes">
          {c.lignes.slice(0, 4).map((l) => (
            <li key={l.id}>
              <Img src={l.image} alt="" />
              <span>{l.nom}{l.taille ? ` · T.${l.taille}` : ''} × {l.quantite}</span>
              <span className="prix-ligne">{l.prix_negocie != null && <s>{gnf(l.prix_unitaire)}</s>}{gnf(l.prix_negocie ?? l.prix_unitaire)}</span>
            </li>
          ))}
          {c.lignes.length > 4 && <li className="petit">+ {c.lignes.length - 4} autre(s)</li>}
        </ul>
      )}
      <div className="carte-chat-total">
        <span>Total</span>
        <span>{reduit && <s>{gnf(c.total_initial)}</s>} <strong>{gnf(c.total_final)}</strong></span>
      </div>
      <Link to={`/c/${c.code}`} className="btn btn-contour petit-btn">Voir la commande</Link>
    </div>
  );
}

function Bulle({ m }) {
  if (m.auteur === 'systeme') return <p className="chat-systeme">{m.texte}</p>;
  const moi = m.auteur === 'client';
  const d = m.donnees || {};
  let contenu;
  if (m.type === 'image' && d.expiree) {
    contenu = <p className="photo-expiree">📷 Photo effacée (les photos restent 24 h)</p>;
  } else if (m.type === 'image') {
    contenu = <><a href={d.url} target="_blank" rel="noreferrer"><img className="chat-photo" src={d.url} alt="Photo envoyée" loading="lazy" /></a>{m.texte && <p>{m.texte}</p>}</>;
  } else if (m.type === 'produit') {
    contenu = (
      <Link to={`/article/${d.produit_id}`} className="carte-chat carte-produit-chat">
        <Img src={d.image} alt="" />
        <span><strong>{d.nom}</strong>{d.taille && <small>Taille {d.taille}</small>}<b>{gnf(d.prix)}</b></span>
      </Link>
    );
  } else if (m.type === 'panier') {
    contenu = (
      <div className="carte-chat">
        <p className="carte-chat-titre">🛒 Mon panier</p>
        <ul className="carte-chat-lignes">
          {(d.lignes || []).map((l, i) => <li key={i}><Img src={l.image} alt="" /><span>{l.nom}{l.taille ? ` · T.${l.taille}` : ''} × {l.quantite}</span><span className="prix-ligne">{gnf(l.prix * l.quantite)}</span></li>)}
        </ul>
        <div className="carte-chat-total"><span>Total</span><strong>{gnf(d.total)}</strong></div>
      </div>
    );
  } else if (m.type === 'commande' || m.type === 'prix') {
    contenu = (
      <>
        {m.type === 'prix' && <p className="chat-prix">{gnf(d.ancien)} → <strong>{gnf(d.nouveau)}</strong></p>}
        <CarteCommande c={m.commande} prix={m.type === 'prix'} />
      </>
    );
  } else if (m.type === 'reservation') {
    const r = m.reservation;
    contenu = r ? (
      <div className="carte-chat">
        <div className="carte-chat-tete"><strong>Réservation {r.numero}</strong><span className={`statut statut-resa-${r.statut}`}>{STATUTS_RESA[r.statut]}</span></div>
        <ul className="carte-chat-lignes">{r.articles.map((a, i) => <li key={i}><Img src={a.image} alt="" /><span>{a.nom} · T.{a.taille} × {a.quantite}</span><span className="prix-ligne">{gnf(a.prix * a.quantite)}</span></li>)}</ul>
        <div className="carte-chat-total"><span>À payer au retrait</span><strong>{gnf(r.total)}</strong></div>
        <Link to="/compte?onglet=reservations" className="btn btn-contour petit-btn">Mes réservations</Link>
      </div>
    ) : <p className="petit">Réservation introuvable.</p>;
  } else {
    contenu = <p>{m.texte}</p>;
  }
  const carte = ['produit', 'panier', 'commande', 'prix', 'reservation'].includes(m.type);
  return (
    <div className={`chat-ligne ${moi ? 'moi' : 'eux'}`}>
      <div className={`bulle ${carte ? 'bulle-carte' : ''}`}>
        {!moi && m.auteur === 'agent' && <span className="bulle-auteur">Assistant Koloun</span>}
        {contenu}
        <span className="bulle-heure">{m.temporaire ? 'envoi…' : heure(m.created_at)}</span>
      </div>
    </div>
  );
}

export default function Messages() {
  const { compte } = useBoutique();
  const [messages, setMessages] = useState(null);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const fin = useRef(null);
  const fichier = useRef(null);
  const dernier = useRef(0);
  const enBas = useRef(true);

  const charger = async (tout = false) => {
    const r = await api.chat(tout ? 0 : dernier.current);
    if (!r.messages.length && !tout) return;
    dernier.current = r.messages.at(-1)?.id || dernier.current;
    setMessages((avant) => {
      if (tout || !avant) return r.messages;
      // Le vrai message remplace celui affiché pendant l'envoi
      const base = r.messages.some((m) => m.auteur === 'client') ? avant.filter((a) => !a.temporaire) : avant;
      return [...base, ...r.messages.filter((m) => !base.some((a) => a.id === m.id))];
    });
    // Ouverture : on descend au dernier message, y compris quand les photos finissent de charger
    if (tout) { enBas.current = true; [0, 200, 500, 1000, 1800].forEach((t) => setTimeout(() => window.scrollTo(0, document.documentElement.scrollHeight), t)); }
    window.dispatchEvent(new Event('kb-chat-lu'));
  };

  // Ouverture : envoi de la carte (produit / panier) demandée par « Discuter », puis lecture toutes les 4 s
  useEffect(() => {
    if (!compte) return undefined;
    let arret = false;
    (async () => {
      let envoiEnAttente = null;
      try { envoiEnAttente = JSON.parse(sessionStorage.getItem('kb_chat_envoi') || 'null'); sessionStorage.removeItem('kb_chat_envoi'); } catch { /* ignoré */ }
      try {
        if (envoiEnAttente?.prerempli) setTexte(envoiEnAttente.prerempli);
        else if (envoiEnAttente) await api.envoyerChat(envoiEnAttente);
        await charger(true);
      } catch (e) { setErreur(e.message); setMessages((m) => m || []); }
    })();
    // Direct : la réponse de la boutique est signalée par l'en-tête (connexion ouverte) → on la récupère aussitôt
    const surMessage = () => { if (!arret) charger().catch(() => {}); };
    const auRetour = () => { if (!arret && document.visibilityState === 'visible') charger().catch(() => {}); };
    window.addEventListener('kb-chat-message', surMessage);
    document.addEventListener('visibilitychange', auRetour);
    const secours = setInterval(auRetour, 15000); // au cas où la connexion directe serait coupée
    return () => { arret = true; clearInterval(secours); window.removeEventListener('kb-chat-message', surMessage); document.removeEventListener('visibilitychange', auRetour); };
  }, [compte?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fil = useRef(null);
  const allerEnBas = () => window.scrollTo(0, document.documentElement.scrollHeight);
  useLayoutEffect(() => { if (enBas.current) allerEnBas(); }, [messages]);
  // Les photos se chargent après coup et allongent le fil : on reste collé en bas
  useEffect(() => {
    if (!fil.current || typeof ResizeObserver === 'undefined') return undefined;
    const o = new ResizeObserver(() => { if (enBas.current) allerEnBas(); });
    o.observe(fil.current);
    return () => o.disconnect();
  }, [messages === null]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const surDefilement = () => { enBas.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 220; };
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, []);

  const envoyer = async (e) => {
    e?.preventDefault();
    const t = texte.trim();
    if (!t) return;
    setErreur('');
    // Affiché tout de suite, comme sur WhatsApp ; remplacé par le vrai message dès que le serveur l'a
    const temp = { id: `t${Date.now()}`, temporaire: true, auteur: 'client', type: 'texte', texte: t, created_at: new Date().toISOString() };
    setMessages((m) => [...(m || []), temp]); setTexte(''); enBas.current = true;
    try { await api.envoyerChat({ texte: t }); await charger(); } catch (err) {
      setMessages((m) => (m || []).filter((x) => x.id !== temp.id)); setTexte(t); setErreur(err.message);
    }
  };

  const envoyerPhoto = async (f) => {
    if (!f) return;
    setEnvoi(true); setErreur('');
    const apercu = URL.createObjectURL(f);
    const temp = { id: `t${Date.now()}`, temporaire: true, auteur: 'client', type: 'image', texte: texte.trim() || null, donnees: { url: apercu }, created_at: new Date().toISOString() };
    setMessages((m) => [...(m || []), temp]); enBas.current = true;
    try {
      const fd = new FormData();
      fd.append('image', await reduire(f));
      if (texte.trim()) { fd.append('texte', texte.trim()); setTexte(''); }
      await api.envoyerChat(fd); await charger();
    } catch (err) { setMessages((m) => (m || []).filter((x) => x.id !== temp.id)); setErreur(err.message); }
    setEnvoi(false);
    if (fichier.current) fichier.current.value = '';
  };

  if (!compte) {
    return (
      <div className="page vide">
        <h1 className="titre-page">Discuter avec la boutique</h1>
        <p>Connectez-vous pour écrire à Koloun Luxure : vous retrouverez la discussion sur tous vos appareils.</p>
        <div className="vide-actions">
          <Link to="/compte?retour=%2Fmessages" className="btn btn-contour">Se connecter</Link>
          <Link to="/compte?mode=inscription&retour=%2Fmessages" className="btn btn-sombre">Créer un compte</Link>
        </div>
      </div>
    );
  }

  let jourPrecedent = '';
  return (
    <div className="page page-messages">
      <div className="chat-tete">
        <span className="chat-avatar">KL</span>
        <div><strong>Koloun Luxure</strong><small>Boutique de Lambanyi · répond en général dans la journée</small></div>
      </div>

      <div className="chat-fil" aria-live="polite" ref={fil}>
        {messages === null ? <p className="ligne-attente" /> : !messages.length ? (
          <p className="chat-systeme">Posez votre question : taille, prix, disponibilité… La boutique vous répond ici. Les photos envoyées sont effacées au bout de 24 h.</p>
        ) : messages.map((m) => {
          const j = jour(m.created_at);
          const separateur = j !== jourPrecedent; jourPrecedent = j;
          return <div key={m.id}>{separateur && <p className="chat-jour">{j}</p>}<Bulle m={m} /></div>;
        })}
        <div ref={fin} />
      </div>

      <form className="chat-saisie" onSubmit={envoyer}>
        {erreur && <p className="erreur chat-erreur" role="alert">{erreur}</p>}
        <button type="button" className="btn-ico" onClick={() => fichier.current?.click()} disabled={envoi} aria-label="Envoyer une photo (effacée après 24 h)" title="Photo (effacée après 24 h)"><IcoPhoto /></button>
        <input ref={fichier} type="file" accept="image/*" hidden onChange={(e) => envoyerPhoto(e.target.files?.[0])} />
        <textarea
          value={texte} onChange={(e) => setTexte(e.target.value)} rows={1} placeholder="Écrire un message…" aria-label="Message"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) envoyer(e); }}
        />
        <button type="submit" className="btn-envoyer" disabled={!texte.trim()} aria-label="Envoyer"><IcoEnvoyer width="20" height="20" /></button>
      </form>
    </div>
  );
}
