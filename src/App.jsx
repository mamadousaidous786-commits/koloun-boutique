import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTEUR_HASH, BOUTIQUE } from './config';
import { FournisseurBoutique, useBoutique } from './store';
import Entete from './components/Entete';
import BarreBas from './components/BarreBas';
import Accueil from './pages/Accueil';
import Catalogue from './pages/Catalogue';
import Produit from './pages/Produit';
import Speciales from './pages/Speciales';
import SpecialeDetail from './pages/SpecialeDetail';
import { BoutonTelecharger } from './components/Telecharger';
import Panier from './pages/Panier';
import Commande from './pages/Commande';
import Favoris from './pages/Favoris';
import Vendeur from './pages/Vendeur';
import Boutique from './pages/Boutique';

const Routeur = ROUTEUR_HASH ? HashRouter : BrowserRouter;

function RemonterEnHaut() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Toast() {
  const { toast } = useBoutique();
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.message}</span>
      {toast.action && <Link to={toast.action.to}>{toast.action.libelle}</Link>}
    </div>
  );
}

function PiedPage() {
  return (
    <footer className="pied">
      <div className="pied-int">
        <p className="pied-marque">Koloun Luxure</p>
        <p>{BOUTIQUE.slogan} · {BOUTIQUE.adresse}</p>
        <p className="pied-liens">
          <Link to="/mes-commandes">Mes commandes</Link>
          <Link to="/boutique">Nous trouver</Link>
          <Link to="/vendeur">Espace vendeur</Link>
        </p>
        <div className="pied-appli"><BoutonTelecharger className="btn btn-contour-clair" /></div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <FournisseurBoutique>
      <Routeur>
        <RemonterEnHaut />
        <Entete />
        <main>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/article/:id" element={<Produit />} />
            <Route path="/commande-speciale" element={<Speciales />} />
            <Route path="/commande-speciale/:id" element={<SpecialeDetail />} />
            <Route path="/panier" element={<Panier />} />
            <Route path="/c/:code" element={<Commande />} />
            <Route path="/favoris" element={<Favoris />} />
            <Route path="/mes-commandes" element={<Favoris onglet="commandes" />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/vendeur" element={<Vendeur />} />
            <Route path="*" element={<div className="page vide"><h1>Page introuvable</h1><Link className="btn btn-sombre" to="/">Retour à l'accueil</Link></div>} />
          </Routes>
        </main>
        <PiedPage />
        <BarreBas />
        <Toast />
      </Routeur>
    </FournisseurBoutique>
  );
}
