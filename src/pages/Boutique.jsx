import { useEffect, useState } from 'react';
import InfosBoutique from '../components/InfosBoutique';

// Page « La boutique » : adresse, plan, contacts, installation de l'application
export default function Boutique() {
  const [installation, setInstallation] = useState(null);
  useEffect(() => {
    const f = (e) => { e.preventDefault(); setInstallation(e); };
    window.addEventListener('beforeinstallprompt', f);
    return () => window.removeEventListener('beforeinstallprompt', f);
  }, []);

  return (
    <div className="page-boutique">
      <div className="page">
        <h1 className="titre-page">La boutique</h1>
        <p className="intro">Koloun Luxure, à Lambanyi (Forage Dadis). Tous les articles de l'application sont ceux présents en boutique, mis à jour en temps réel.</p>
      </div>
      <InfosBoutique complet />
      <div className="page">
        <section className="installer">
          <h2>Installer l'application</h2>
          <p>Ajoutez Koloun Luxure à l'écran d'accueil de votre téléphone pour l'ouvrir comme une application.</p>
          {installation ? (
            <button type="button" className="btn btn-sombre" onClick={async () => { installation.prompt(); await installation.userChoice; setInstallation(null); }}>Installer sur ce téléphone</button>
          ) : (
            <p className="petit">Sur Android : menu ⋮ du navigateur → « Ajouter à l'écran d'accueil ». Sur iPhone : bouton Partager → « Sur l'écran d'accueil ».</p>
          )}
        </section>
      </div>
    </div>
  );
}
