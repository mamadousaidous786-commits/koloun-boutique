import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useBoutique } from '../store';
import { recupererConnexionGoogle } from '../googleIphone';

const dansLApplication = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// Page de retour après « Continuer avec Google » sur iPhone (application installée)
export default function ConnexionGoogle() {
  const [params] = useSearchParams();
  const { setCompte } = useBoutique();
  const naviguer = useNavigate();
  const nonce = params.get('n');
  const [etat, setEtat] = useState(params.get('erreur') ? 'erreur' : 'attente');
  const [message, setMessage] = useState(params.get('erreur') || '');

  useEffect(() => {
    if (!nonce || etat === 'erreur') return undefined;
    // iOS a ouvert Google dans une fenêtre Safari : la connexion sera récupérée par l'application elle-même
    if (!dansLApplication()) { setEtat('revenir'); return undefined; }
    let fini = false;
    (async () => {
      for (let essai = 0; essai < 5 && !fini; essai += 1) {
        try {
          const r = await recupererConnexionGoogle(nonce);
          if (r) { setCompte({ token: r.token, compte: r.compte }); naviguer('/compte', { replace: true }); return; }
        } catch (e) { setMessage(e.message); setEtat('erreur'); return; }
        await new Promise((ok) => setTimeout(ok, 1200));
      }
      if (!fini) { setMessage('La connexion a pris trop de temps. Réessayez.'); setEtat('erreur'); }
    })();
    return () => { fini = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page page-connexion-google">
      {etat === 'attente' && <p className="centre">Connexion en cours…</p>}
      {etat === 'revenir' && (
        <div className="bandeau-ok" role="status">
          <p><strong>Connexion réussie.</strong> Touchez « OK » ou « Terminé » en haut de l'écran pour revenir dans l'application Koloun Luxure : vous y serez connecté.</p>
        </div>
      )}
      {etat === 'erreur' && (
        <>
          <p className="erreur" role="alert">{message || 'La connexion Google a échoué.'}</p>
          <Link className="btn btn-sombre" to="/compte">Revenir à la connexion</Link>
        </>
      )}
    </div>
  );
}
