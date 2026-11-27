import { Link } from 'react-router-dom';
import Img from './Img';
import { IcoCoeur } from './Icones';
import { useBoutique } from '../store';
import { estNouveau, gnf, imagePrincipale, stockTotal } from '../utils';

export default function CarteProduit({ produit: p, eager = false }) {
  const { favoris, basculerFavori } = useBoutique();
  const fav = favoris.includes(p.id);
  const stock = stockTotal(p);
  const couleurs = p.variantes.length;

  return (
    <article className="carte">
      <Link to={`/article/${p.id}`} className="carte-visuel">
        <Img src={imagePrincipale(p)} alt={p.nom} eager={eager} />
        {p.variantes[1]?.image && <Img src={p.variantes[1].image} alt="" className="carte-alt" />}
        <span className="carte-badges">
          {p.promo && stock > 0 && <span className="badge badge-promo">-{p.promo.pourcentage} %</span>}
          {stock === 0 ? <span className="badge badge-sombre">Épuisé</span>
            : stock <= 2 ? <span className="badge badge-alerte">Plus que {stock}</span>
              : estNouveau(p.date_ajout) ? <span className="badge">Nouveau</span> : null}
        </span>
      </Link>
      <button type="button" className={`carte-fav ${fav ? 'actif' : ''}`} onClick={() => basculerFavori(p.id)} aria-pressed={fav} aria-label={fav ? `Retirer ${p.nom} des favoris` : `Ajouter ${p.nom} aux favoris`}>
        <IcoCoeur plein={fav} width="18" height="18" />
      </button>
      <Link to={`/article/${p.id}`} className="carte-texte">
        <h3>{p.nom}</h3>
        <p className={`carte-prix ${p.promo ? 'en-promo' : ''}`}>{gnf(p.prix)}{p.prix_avant && <s>{gnf(p.prix_avant)}</s>}</p>
        {couleurs > 1 && <p className="carte-variantes">{couleurs} modèles</p>}
      </Link>
    </article>
  );
}
