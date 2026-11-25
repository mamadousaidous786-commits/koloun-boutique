import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useBoutique } from '../store';
import { activerNotifications, etatNotifications, resynchroniserNotifications } from '../notifications';

// Taille épuisée : « Me prévenir quand elle revient ». Le client reçoit une notification dès qu'elle est de nouveau en stock
// (et la retrouve dans son compte, même sans notifications).
let cacheAlertes = null; // alertes du compte, chargées une fois par visite
export function oublierAlertes() { cacheAlertes = null; }

export default function AlerteTaille({ taille }) {
  const { compte } = useBoutique();
  const { pathname } = useLocation();
  const [suivies, setSuivies] = useState(cacheAlertes);
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!compte || cacheAlertes) return;
    api.mesAlertes().then((l) => { cacheAlertes = new Set(l.filter((a) => a.statut === 'attente').map((a) => a.produit_taille_id)); setSuivies(cacheAlertes); }).catch(() => {});
  }, [compte]);
  useEffect(() => setMsg(null), [taille?.id]);

  if (!taille) return null;
  const suivie = suivies?.has(taille.id);

  const prevenir = async () => {
    setEnvoi(true); setMsg(null);
    let avertissement = null;
    // Les notifications d'abord (le téléphone ne les autorise que juste après un toucher)
    try {
      const etat = await etatNotifications();
      if (etat === 'inactif') await activerNotifications();
      else if (etat === 'actif') await resynchroniserNotifications();
      else if (etat === 'installer') avertissement = "Pour recevoir la notification sur iPhone, installez l'application (Partager → Sur l'écran d'accueil). Sinon, vous le verrez dans votre compte.";
      else if (etat === 'refuse') avertissement = 'Notifications bloquées sur ce téléphone : vous le verrez dans votre compte.';
    } catch (e) { avertissement = `${e.message} Vous le verrez quand même dans votre compte.`; }
    try {
      const r = await api.creerAlerte(taille.id);
      cacheAlertes = new Set([...(cacheAlertes || []), taille.id]); setSuivies(cacheAlertes);
      setMsg({ ok: true, texte: avertissement || r.message });
    } catch (e) { setMsg({ ok: false, texte: e.message }); }
    setEnvoi(false);
  };

  const retirer = async () => {
    try {
      await api.supprimerAlerte(taille.id);
      cacheAlertes = new Set([...(cacheAlertes || [])].filter((x) => x !== taille.id)); setSuivies(cacheAlertes);
      setMsg(null);
    } catch (e) { setMsg({ ok: false, texte: e.message }); }
  };

  return (
    <div className="alerte-taille" role="status">
      <p><strong>Taille {taille.taille} épuisée.</strong> {suivie ? 'Nous vous prévenons dès son retour.' : 'Elle peut revenir avec le prochain arrivage.'}</p>
      {!compte ? (
        <Link to={`/compte?retour=${encodeURIComponent(pathname)}`} className="btn btn-contour">🔔 Me prévenir (connexion)</Link>
      ) : suivie ? (
        <button type="button" className="lien-annuler" onClick={retirer}>Ne plus me prévenir</button>
      ) : (
        <button type="button" className="btn btn-sombre" onClick={prevenir} disabled={envoi}>{envoi ? '…' : '🔔 Me prévenir quand elle revient'}</button>
      )}
      {msg && <p className={msg.ok ? 'petit' : 'erreur'}>{msg.texte}</p>}
    </div>
  );
}
