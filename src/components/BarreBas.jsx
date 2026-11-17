import { NavLink } from 'react-router-dom';
import { useBoutique } from '../store';
import { IcoAccueil, IcoAvion, IcoCoeur, IcoGrille, IcoPanier } from './Icones';

// Barre d'onglets en bas de l'écran (téléphone), comme dans les applications de shopping
export default function BarreBas() {
  const { nbArticles } = useBoutique();
  const onglets = [
    ['/', 'Accueil', IcoAccueil],
    ['/catalogue', 'Catalogue', IcoGrille],
    ['/commande-speciale', 'Spéciale', IcoAvion],
    ['/favoris', 'Favoris', IcoCoeur],
    ['/panier', 'Panier', IcoPanier],
  ];
  return (
    <nav className="barre-bas" aria-label="Navigation">
      {onglets.map(([to, libelle, Ico]) => (
        <NavLink key={to} to={to} end={to === '/'} className="onglet">
          <span className="onglet-ico">
            <Ico width="22" height="22" />
            {to === '/panier' && nbArticles > 0 && <span className="pastille">{nbArticles}</span>}
          </span>
          <span>{libelle}</span>
        </NavLink>
      ))}
    </nav>
  );
}
