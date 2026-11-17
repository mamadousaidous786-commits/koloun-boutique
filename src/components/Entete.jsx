import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useBoutique } from '../store';
import { IcoCoeur, IcoCompte, IcoPanier, IcoRecherche } from './Icones';

export default function Entete() {
  const { nbArticles, favoris, compte, vendeur } = useBoutique();
  const { pathname } = useLocation();
  const naviguer = useNavigate();
  const [defile, setDefile] = useState(false);
  const [q, setQ] = useState('');
  const surAffiche = pathname === '/';

  useEffect(() => {
    const f = () => setDefile(window.scrollY > 40);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const chercher = (e) => {
    e.preventDefault();
    naviguer(`/catalogue${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <header className={`entete ${surAffiche && !defile ? 'entete-sombre' : 'entete-claire'}`}>
      <div className="entete-int">
        <Link to="/" className="marque" aria-label="Koloun Luxure, accueil">
          <span className="marque-kl">KL</span>
          <span className="marque-nom">Koloun Luxure</span>
        </Link>

        <nav className="nav-bureau" aria-label="Navigation principale">
          <NavLink to="/" end>Accueil</NavLink>
          <NavLink to="/catalogue">Catalogue</NavLink>
          <NavLink to="/commande-speciale">Commande spéciale</NavLink>
          <NavLink to="/boutique">La boutique</NavLink>
        </nav>

        <form className="recherche-bureau" onSubmit={chercher} role="search">
          <IcoRecherche width="18" height="18" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un article" aria-label="Chercher un article" />
        </form>

        <div className="entete-actions">
          <Link to="/catalogue?chercher=1" className="btn-ico mobile-seul" aria-label="Chercher"><IcoRecherche /></Link>
          <Link to={vendeur ? '/vendeur' : '/compte'} className="btn-ico" aria-label={vendeur ? 'Espace vendeur' : compte ? 'Mon compte' : 'Connexion ou inscription'}>
            <IcoCompte />
            {(compte || vendeur) && <span className="point-connecte" aria-hidden="true" />}
          </Link>
          <Link to="/favoris" className="btn-ico bureau-seul" aria-label={`Favoris (${favoris.length})`}>
            <IcoCoeur />
            {favoris.length > 0 && <span className="pastille">{favoris.length}</span>}
          </Link>
          <Link to="/panier" className="btn-ico" aria-label={`Panier (${nbArticles} articles)`}>
            <IcoPanier />
            {nbArticles > 0 && <span className="pastille" key={nbArticles}>{nbArticles}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
