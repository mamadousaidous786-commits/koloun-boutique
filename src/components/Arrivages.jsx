import { useEffect, useState } from 'react';
import { etatNotifications, activerNotifications, desactiverNotifications } from '../notifications';

function IcoCloche(p) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16zM10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function useNotifications() {
  const [etat, setEtat] = useState(null);
  useEffect(() => {
    const maj = () => etatNotifications().then(setEtat).catch(() => setEtat('indisponible'));
    maj();
    window.addEventListener('kb-notifications', maj);
    window.addEventListener('kb-installation', maj);
    return () => { window.removeEventListener('kb-notifications', maj); window.removeEventListener('kb-installation', maj); };
  }, []);
  return etat;
}

const MASQUE = 'kb_arrivages_masque';

// Accueil : invitation à être prévenu des nouveaux arrivages (disparaît une fois activé ou fermé)
export function EncartArrivages() {
  const etat = useNotifications();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [masque, setMasque] = useState(() => { try { return localStorage.getItem(MASQUE) === '1'; } catch { return false; } });
  if (etat !== 'inactif' || masque) return null;

  const activer = async () => {
    setEnvoi(true); setErreur('');
    try { await activerNotifications(); } catch (e) { setErreur(e.message); } finally { setEnvoi(false); }
  };
  const fermer = () => { try { localStorage.setItem(MASQUE, '1'); } catch { /* rien */ } setMasque(true); };

  return (
    <section className="encart-appli encart-arrivages" aria-labelledby="titre-arrivages">
      <span className="pastille-cloche"><IcoCloche /></span>
      <div className="encart-appli-texte">
        <h2 id="titre-arrivages">Nouveaux arrivages</h2>
        <p>Recevez une notification dès qu'un nouvel article arrive en boutique, avec sa photo et son prix.</p>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </div>
      <div className="encart-arrivages-actions">
        <button type="button" className="btn btn-or" onClick={activer} disabled={envoi}>{envoi ? 'Activation…' : 'Me prévenir'}</button>
        <button type="button" className="lien-discret" onClick={fermer}>Plus tard</button>
      </div>
    </section>
  );
}

// Mon compte : réglage permanent (activer / désactiver)
export function ReglageArrivages() {
  const etat = useNotifications();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  if (!etat || etat === 'indisponible') return null;

  const basculer = async () => {
    setEnvoi(true); setErreur('');
    try { await (etat === 'actif' ? desactiverNotifications() : activerNotifications()); } catch (e) { setErreur(e.message); } finally { setEnvoi(false); }
  };

  const textes = {
    actif: 'Activées : vous êtes prévenu de chaque nouvel article.',
    inactif: 'Soyez prévenu dès qu\'un nouvel article arrive.',
    refuse: 'Bloquées sur ce téléphone. Autorisez les notifications pour Koloun Luxure dans les réglages du téléphone.',
    installer: 'Sur iPhone, installez d\'abord l\'application (bouton Partager, puis « Sur l\'écran d\'accueil »), puis ouvrez-la depuis son icône.',
  };

  return (
    <div className="reglage-arrivages">
      <span className="pastille-cloche"><IcoCloche /></span>
      <div>
        <p className="reglage-titre">Notifications des nouveaux arrivages</p>
        <p className="petit">{textes[etat]}</p>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </div>
      {(etat === 'actif' || etat === 'inactif') && (
        <button type="button" className={`btn ${etat === 'actif' ? 'btn-contour' : 'btn-or'}`} onClick={basculer} disabled={envoi}>
          {envoi ? '…' : etat === 'actif' ? 'Désactiver' : 'Activer'}
        </button>
      )}
    </div>
  );
}
