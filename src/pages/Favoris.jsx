import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import CarteProduit from '../components/CarteProduit';
import Img from '../components/Img';
import { GrilleSquelette } from './Accueil';
import { gnf } from '../utils';

export default function Favoris({ onglet = 'favoris' }) {
  const { favoris, mesCommandes } = useBoutique();
  const naviguer = useNavigate();
  const tout = useCharger(() => api.produits(), []);
  const liste = favoris.map((id) => (tout.donnees || []).find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="page">
      <div className="onglets" role="tablist">
        <button type="button" role="tab" aria-selected={onglet === 'favoris'} className={onglet === 'favoris' ? 'actif' : ''} onClick={() => naviguer('/favoris')}>Favoris ({favoris.length})</button>
        <button type="button" role="tab" aria-selected={onglet === 'commandes'} className={onglet === 'commandes' ? 'actif' : ''} onClick={() => naviguer('/compte')}>Mes commandes ({mesCommandes.length})</button>
      </div>

      {onglet === 'favoris' ? (
        tout.chargement && favoris.length ? <GrilleSquelette n={4} /> : liste.length ? (
          <div className="grille">{liste.map((p) => <CarteProduit key={p.id} produit={p} />)}</div>
        ) : (
          <div className="vide">
            <p>Touchez le cœur d'un article pour le retrouver ici.</p>
            <Link to="/catalogue" className="btn btn-sombre">Parcourir le catalogue</Link>
          </div>
        )
      ) : mesCommandes.length ? (
        <ul className="liste-commandes">
          {mesCommandes.map((c) => (
            <li key={c.code}>
              <Link to={`/c/${c.code}`}>
                <Img src={c.image} alt="" />
                <span><strong>{c.reference}</strong><small>{new Date(c.date).toLocaleDateString('fr-FR')} · {c.nb} article{c.nb > 1 ? 's' : ''}</small></span>
                <span className="montant">{gnf(c.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="vide"><p>Vos commandes envoyées depuis ce téléphone apparaîtront ici, avec leur prix à jour.</p></div>
      )}
    </div>
  );
}
