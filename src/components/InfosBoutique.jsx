import { Link } from 'react-router-dom';
import { BOUTIQUE, WHATSAPP } from '../config';
import { IcoBulle, IcoPosition, IcoTel } from './Icones';

// Adresse, contacts et plan d'accès
export default function InfosBoutique({ complet = false }) {
  const maps = BOUTIQUE.mapsUrl;
  const recherche = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Koloun Luxure ${BOUTIQUE.adresse}`)}`;
  return (
    <section className="infos-boutique" aria-labelledby="titre-infos">
      <div className="infos-texte">
        <h2 id="titre-infos">Passez nous voir</h2>
        <p className="infos-adresse"><IcoPosition /> {BOUTIQUE.adresse}</p>
        <p className="infos-sous">Essayez les articles sur place ou commandez ici et récupérez-les en boutique.</p>
        <div className="infos-actions">
          <a className="btn btn-or" href={maps || recherche} target="_blank" rel="noreferrer"><IcoPosition width="18" height="18" /> Itinéraire</a>
          <Link className="btn btn-wa" to="/messages"><IcoBulle /> Discuter</Link>
          <a className="btn btn-contour-clair" href={`tel:+${WHATSAPP}`}><IcoTel width="18" height="18" /> {BOUTIQUE.telephone}</a>
        </div>
      </div>
      {complet && (
        <div className="infos-carte">
          {maps && /google\.[^/]+\/maps\/embed/.test(maps) ? (
            <iframe title="Plan d'accès à la boutique" src={maps} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <a href={maps || recherche} target="_blank" rel="noreferrer" className="infos-carte-lien">
              <IcoPosition width="40" height="40" />
              <span>Ouvrir le plan dans Google Maps</span>
              <small>{BOUTIQUE.adresse}</small>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
