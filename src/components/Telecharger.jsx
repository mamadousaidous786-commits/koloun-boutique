import { useEffect, useState } from 'react';
import { IcoFermer } from './Icones';

const estInstallee = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const surIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useInstallation() {
  const [proposition, setProposition] = useState(() => window.__kbInstallation || null);
  const [installee, setInstallee] = useState(estInstallee);
  useEffect(() => {
    const maj = () => { setProposition(window.__kbInstallation || null); setInstallee(estInstallee()); };
    window.addEventListener('kb-installation', maj);
    return () => window.removeEventListener('kb-installation', maj);
  }, []);
  return { proposition, installee };
}

function IcoTelecharger(p) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

// Bouton « Télécharger l'application » : installation directe quand le téléphone le permet, sinon les étapes à suivre
export function BoutonTelecharger({ className = 'btn btn-or', libelle = "Télécharger l'application" }) {
  const { proposition, installee } = useInstallation();
  const [aide, setAide] = useState(false);
  if (installee) return null;

  const installer = async () => {
    if (proposition) {
      proposition.prompt();
      await proposition.userChoice.catch(() => {});
      window.__kbInstallation = null;
      window.dispatchEvent(new Event('kb-installation'));
    } else {
      setAide(true);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={installer}><IcoTelecharger /> {libelle}</button>
      {aide && (
        <div className="feuille-fond" onClick={() => setAide(false)}>
          <div className="feuille" role="dialog" aria-modal="true" aria-labelledby="titre-installer" onClick={(e) => e.stopPropagation()}>
            <div className="feuille-poignee" aria-hidden="true" />
            <div className="feuille-tete">
              <h2 id="titre-installer">Installer Koloun Luxure</h2>
              <button type="button" className="btn-ico" onClick={() => setAide(false)} aria-label="Fermer"><IcoFermer /></button>
            </div>
            {surIphone() ? (
              <ol className="etapes-installation">
                <li>Ouvrez cette page dans <strong>Safari</strong>.</li>
                <li>Appuyez sur le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).</li>
                <li>Choisissez <strong>« Sur l'écran d'accueil »</strong>, puis <strong>Ajouter</strong>.</li>
              </ol>
            ) : (
              <ol className="etapes-installation">
                <li>Ouvrez cette page dans <strong>Chrome</strong>.</li>
                <li>Appuyez sur le menu <strong>⋮</strong> en haut à droite.</li>
                <li>Choisissez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
              </ol>
            )}
            <p className="petit">L'icône Koloun Luxure apparaît ensuite sur votre téléphone, comme une application.</p>
          </div>
        </div>
      )}
    </>
  );
}

// Encart affiché sur l'accueil (disparaît une fois l'application installée)
export function EncartTelecharger() {
  const { installee } = useInstallation();
  if (installee) return null;
  return (
    <section className="encart-appli" aria-labelledby="titre-appli">
      <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width="64" height="64" />
      <div className="encart-appli-texte">
        <h2 id="titre-appli">L'application Koloun Luxure</h2>
        <p>Installez-la sur votre téléphone : nouveautés et commandes spéciales en un geste, même avec une connexion faible.</p>
      </div>
      <BoutonTelecharger />
    </section>
  );
}
