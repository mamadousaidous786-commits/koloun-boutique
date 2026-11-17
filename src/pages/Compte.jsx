import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useBoutique } from '../store';
import useCharger from '../useCharger';
import Img from '../components/Img';
import { STATUTS, gnf, lienWhatsApp } from '../utils';

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const telephoneLisible = (t) => {
  const n = String(t || '');
  if (n.length === 12 && n.startsWith('224')) return `+224 ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)} ${n.slice(10)}`;
  return n;
};

// Bouton officiel « Continuer avec Google » (affiché seulement quand la clé Google est configurée)
function BoutonGoogle({ onJeton }) {
  const zone = useRef(null);
  const rappel = useRef(onJeton);
  rappel.current = onJeton;
  useEffect(() => {
    if (!GOOGLE_ID) return undefined;
    const dessiner = () => {
      if (!window.google?.accounts?.id || !zone.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_ID, callback: (r) => rappel.current(r.credential) });
      window.google.accounts.id.renderButton(zone.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'fr', width: Math.min(360, zone.current.offsetWidth || 320) });
    };
    if (window.google?.accounts?.id) { dessiner(); return undefined; }
    let script = document.getElementById('gsi');
    if (!script) {
      script = document.createElement('script');
      script.id = 'gsi';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', dessiner);
    return () => script.removeEventListener('load', dessiner);
  }, []);
  if (!GOOGLE_ID) return null;
  return (
    <>
      <div className="separateur"><span>ou</span></div>
      <div ref={zone} className="zone-google" />
    </>
  );
}

function Authentification() {
  const { setCompte, setVendeur } = useBoutique();
  const naviguer = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'inscription' ? 'inscription' : 'connexion');
  const [champs, setChamps] = useState({ nom: '', contact: '', identifiant: '', mdp: '', confirmation: '' });
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const retour = params.get('retour') || '/compte';

  const maj = (k) => (e) => setChamps((c) => ({ ...c, [k]: e.target.value }));

  const reussi = (r) => {
    if (r.type === 'vendeur') {
      setVendeur({ token: r.token, utilisateur: r.utilisateur });
      naviguer('/vendeur', { replace: true });
    } else {
      setCompte({ token: r.token, compte: r.compte });
      naviguer(retour, { replace: true });
    }
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    if (mode === 'inscription') {
      if (champs.nom.trim().length < 2) return setErreur('Indiquez votre nom.');
      if (!champs.contact.trim()) return setErreur('Indiquez votre numéro de téléphone ou votre email.');
      if (champs.mdp.length < 6) return setErreur('Le mot de passe doit contenir au moins 6 caractères.');
      if (champs.mdp !== champs.confirmation) return setErreur('Les deux mots de passe ne sont pas identiques.');
    }
    setEnvoi(true);
    try {
      const r = mode === 'inscription'
        ? await api.sInscrire({ nom: champs.nom.trim(), contact: champs.contact.trim(), mot_de_passe: champs.mdp, confirmation: champs.confirmation })
        : await api.seConnecter(champs.identifiant.trim(), champs.mdp);
      reussi(r);
    } catch (err) {
      setErreur(err.message);
    } finally { setEnvoi(false); }
  };

  const google = async (credential) => {
    setErreur('');
    try { reussi(await api.connexionGoogle(credential)); } catch (err) { setErreur(err.message); }
  };

  const confirmationFausse = mode === 'inscription' && champs.confirmation && champs.confirmation !== champs.mdp;

  return (
    <div className="page connexion">
      <h1 className="titre-page">{mode === 'connexion' ? 'Connexion' : 'Créer un compte'}</h1>
      <div className="onglets" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'connexion'} className={mode === 'connexion' ? 'actif' : ''} onClick={() => { setMode('connexion'); setErreur(''); }}>Se connecter</button>
        <button type="button" role="tab" aria-selected={mode === 'inscription'} className={mode === 'inscription' ? 'actif' : ''} onClick={() => { setMode('inscription'); setErreur(''); }}>S'inscrire</button>
      </div>

      <p className="intro-compte">
        {mode === 'connexion'
          ? 'Retrouvez vos commandes et commandez plus vite. Les comptes Koloun Gestion ouvrent l\'espace vendeur.'
          : 'Un compte garde vos commandes sur tous vos téléphones, et vos coordonnées sont déjà remplies quand vous commandez.'}
      </p>

      <form className="formulaire" onSubmit={soumettre} noValidate>
        {mode === 'inscription' ? (
          <>
            <label><span>Nom complet</span><input value={champs.nom} onChange={maj('nom')} autoComplete="name" /></label>
            <label><span>Numéro de téléphone ou email</span><input value={champs.contact} onChange={maj('contact')} autoComplete="username" placeholder="620 00 00 00 ou nom@mail.com" /></label>
          </>
        ) : (
          <label><span>Téléphone ou email</span><input value={champs.identifiant} onChange={maj('identifiant')} autoComplete="username" placeholder="620 00 00 00 ou nom@mail.com" /></label>
        )}
        <div className="champ">
          <label htmlFor="champ-mdp">Mot de passe</label>
          <span className="champ-mdp">
            <input id="champ-mdp" type={voir ? 'text' : 'password'} value={champs.mdp} onChange={maj('mdp')} autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'} />
            <button type="button" onClick={() => setVoir((v) => !v)} aria-pressed={voir}>{voir ? 'Masquer' : 'Afficher'}</button>
          </span>
        </div>
        {mode === 'inscription' && (
          <label>
            <span>Confirmer le mot de passe</span>
            <input type={voir ? 'text' : 'password'} value={champs.confirmation} onChange={maj('confirmation')} autoComplete="new-password" aria-invalid={!!confirmationFausse} />
            {confirmationFausse && <small className="erreur">Les deux mots de passe ne sont pas identiques.</small>}
          </label>
        )}
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-sombre btn-large" disabled={envoi}>
          {envoi ? 'Patientez…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <BoutonGoogle onJeton={google} />

      {mode === 'connexion' && (
        <p className="petit centre">
          Mot de passe oublié ?{' '}
          <a href={lienWhatsApp("Bonjour Koloun Luxure 👋 J'ai oublié le mot de passe de mon compte sur l'application.")} target="_blank" rel="noreferrer">Écrivez à la boutique sur WhatsApp</a>
        </p>
      )}
    </div>
  );
}

function MonCompte() {
  const { compte, setCompte } = useBoutique();
  const res = useCharger(() => api.monCompte(), [compte?.token]);
  const [edition, setEdition] = useState(false);
  const [champs, setChamps] = useState({ nom: '', telephone: '', ancien: '', nouveau: '' });
  const [msg, setMsg] = useState(null);
  const c = res.donnees?.compte || compte.compte;

  useEffect(() => {
    if (res.donnees?.compte) setCompte({ ...compte, compte: res.donnees.compte });
  }, [res.donnees]); // eslint-disable-line react-hooks/exhaustive-deps

  const ouvrirEdition = () => { setChamps({ nom: c.nom, telephone: c.telephone ? telephoneLisible(c.telephone) : '', ancien: '', nouveau: '' }); setMsg(null); setEdition(true); };

  const enregistrer = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const corps = { nom: champs.nom, telephone: champs.telephone };
      if (champs.nouveau) { corps.ancien = champs.ancien; corps.nouveau = champs.nouveau; }
      const r = await api.modifierCompte(corps);
      setCompte({ ...compte, compte: r.compte });
      setEdition(false);
      setMsg({ ok: true, texte: 'Vos informations sont enregistrées.' });
      res.recharger();
    } catch (err) { setMsg({ ok: false, texte: err.message }); }
  };

  const commandes = res.donnees?.commandes || [];

  return (
    <div className="page page-compte">
      <div className="tete-compte">
        <span className="avatar">{c.photo ? <img src={c.photo} alt="" referrerPolicy="no-referrer" /> : c.nom.slice(0, 1).toUpperCase()}</span>
        <div>
          <h1 className="titre-page">Bonjour {c.nom.split(' ')[0]}</h1>
          <p className="petit">{[c.telephone && telephoneLisible(c.telephone), c.email].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      {msg && <p className={msg.ok ? 'succes' : 'erreur'} role="status">{msg.texte}</p>}

      {edition ? (
        <form className="formulaire carte-form" onSubmit={enregistrer}>
          <h2>Mes informations</h2>
          <label><span>Nom complet</span><input value={champs.nom} onChange={(e) => setChamps({ ...champs, nom: e.target.value })} /></label>
          <label><span>Téléphone (pour la boutique)</span><input type="tel" value={champs.telephone} onChange={(e) => setChamps({ ...champs, telephone: e.target.value })} placeholder="620 00 00 00" /></label>
          {!c.google && <label><span>Mot de passe actuel (seulement pour le changer)</span><input type="password" value={champs.ancien} onChange={(e) => setChamps({ ...champs, ancien: e.target.value })} autoComplete="current-password" /></label>}
          <label><span>Nouveau mot de passe (facultatif)</span><input type="password" value={champs.nouveau} onChange={(e) => setChamps({ ...champs, nouveau: e.target.value })} autoComplete="new-password" /></label>
          <div className="deux">
            <button type="button" className="btn btn-contour" onClick={() => setEdition(false)}>Annuler</button>
            <button type="submit" className="btn btn-sombre">Enregistrer</button>
          </div>
        </form>
      ) : (
        <div className="actions-compte">
          <button type="button" className="btn btn-contour" onClick={ouvrirEdition}>Modifier mes informations</button>
          <button type="button" className="btn btn-contour" onClick={() => setCompte(null)}>Se déconnecter</button>
        </div>
      )}

      <section aria-labelledby="titre-mes-commandes">
        <div className="titre-section"><h2 id="titre-mes-commandes">Mes commandes</h2></div>
        {res.chargement && !res.donnees ? <p className="ligne-attente" /> : commandes.length ? (
          <ul className="liste-commandes">
            {commandes.map((x) => (
              <li key={x.code}>
                <Link to={`/c/${x.code}`}>
                  <Img src={x.image} alt="" />
                  <span>
                    <strong>{x.reference}</strong>
                    <small>{new Date(x.date).toLocaleDateString('fr-FR')} · {x.nb} article{x.nb > 1 ? 's' : ''}</small>
                    <span className={`statut statut-${x.statut}`}>{STATUTS[x.statut]?.libelle}</span>
                  </span>
                  <span className="montant">{gnf(x.total)}{x.total < x.total_initial && <s>{gnf(x.total_initial)}</s>}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="vide-compte">
            <p>Vous n'avez pas encore commandé avec ce compte.</p>
            <Link to="/catalogue" className="btn btn-sombre">Voir le catalogue</Link>
          </div>
        )}
      </section>
    </div>
  );
}

// /compte : connexion + inscription, ou « Mon compte » ; un compte Koloun Gestion va vers l'espace vendeur
export default function Compte() {
  const { compte, vendeur } = useBoutique();
  if (vendeur) return <Navigate to="/vendeur" replace />;
  return compte ? <MonCompte /> : <Authentification />;
}
