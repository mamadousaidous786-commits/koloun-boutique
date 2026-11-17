import InfosBoutique from '../components/InfosBoutique';
import { BoutonTelecharger, useInstallation } from '../components/Telecharger';

// Page « La boutique » : adresse, plan, contacts, installation de l'application
export default function Boutique() {
  const { installee } = useInstallation();

  return (
    <div className="page-boutique">
      <div className="page">
        <h1 className="titre-page">La boutique</h1>
        <p className="intro">Koloun Luxure, à Lambanyi (Forage Dadis). Tous les articles de l'application sont ceux présents en boutique, mis à jour en temps réel.</p>
      </div>
      <InfosBoutique complet />
      <div className="page">
        <section className="installer">
          <h2>Télécharger l'application</h2>
          <p>Ajoutez Koloun Luxure à l'écran d'accueil de votre téléphone pour l'ouvrir comme une application.</p>
          {installee ? <p className="petit">L'application est déjà installée sur cet appareil.</p> : <BoutonTelecharger className="btn btn-sombre" />}
        </section>
      </div>
    </div>
  );
}
