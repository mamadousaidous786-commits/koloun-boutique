import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Affiche from '../components/Affiche';
import CarteProduit from '../components/CarteProduit';
import InfosBoutique from '../components/InfosBoutique';
import Img from '../components/Img';
import { EncartTelecharger } from '../components/Telecharger';
import { EncartArrivages } from '../components/Arrivages';
import { IcoFleche } from '../components/Icones';

export function GrilleSquelette({ n = 8 }) {
  return (
    <div className="grille" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <div key={i} className="carte squelette"><div className="carte-visuel" /><p /><p /></div>)}
    </div>
  );
}

export function Erreur({ message, recharger }) {
  return (
    <div className="bloc-erreur" role="alert">
      <p>{message}</p>
      {recharger && <button type="button" className="btn btn-sombre" onClick={recharger}>Réessayer</button>}
    </div>
  );
}

export default function Accueil() {
  const nouveautes = useCharger(() => api.nouveautes(), []);
  const tout = useCharger(() => api.produits(), []);
  const infos = useCharger(() => api.infos(), []);
  const speciales = useCharger(() => api.speciales(), []);
  const { vus } = useBoutique();
  const [cat, setCat] = useState('');
  const [nbVisibles, setNbVisibles] = useState(12);

  const liste = useMemo(() => (tout.donnees || []).filter((p) => !cat || p.categorie === cat), [tout.donnees, cat]);
  const recents = useMemo(() => vus.map((id) => (tout.donnees || []).find((p) => p.id === id)).filter(Boolean).slice(0, 8), [vus, tout.donnees]);
  const categories = infos.donnees?.categories || [];

  return (
    <div className="accueil">
      {nouveautes.chargement ? (
        <section className="affiche affiche-attente" aria-busy="true"><div className="affiche-int"><div className="ligne-attente" /><div className="poster-attente" /></div></section>
      ) : nouveautes.donnees?.length ? (
        <Affiche produits={nouveautes.donnees} />
      ) : (
        <section className="affiche affiche-vide">
          <div className="affiche-int">
            <div className="affiche-texte">
              <h1 className="affiche-titre">Koloun Luxure</h1>
              <p className="affiche-prix">Qualité & Élégance</p>
              {nouveautes.erreur && <p className="affiche-epuise">{nouveautes.erreur}</p>}
              <div className="affiche-actions"><Link to="/commande-speciale" className="btn btn-or">Voir les commandes spéciales</Link></div>
            </div>
          </div>
        </section>
      )}

      {infos.donnees?.promotion && <BandeauPromo promo={infos.donnees.promotion} onVoir={() => document.getElementById('titre-articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}
      <div className="page page-accueil">
        <Link to="/commande-speciale" className="bandeau-special">
          <div className="bandeau-visuels" aria-hidden="true">
            {(speciales.donnees || []).slice(0, 3).map((s) => <Img key={s.id} src={s.images[0]} alt="" />)}
          </div>
          <div className="bandeau-texte">
            <h2>Commande spéciale</h2>
            <p>Choisissez votre modèle et votre pointure : 50 % d'avance à la commande, livraison en 2 à 3 semaines.</p>
          </div>
          <span className="bandeau-cta">Voir les modèles <IcoFleche width="18" height="18" /></span>
        </Link>

        <EncartTelecharger />
        <EncartArrivages />

        <section aria-labelledby="titre-articles">
          <div className="titre-section">
            <h2 id="titre-articles">Tous les articles</h2>
            <Link to="/catalogue" className="lien-discret">Filtrer et trier <IcoFleche width="16" height="16" /></Link>
          </div>
          {categories.length > 0 && (
            <div className="puces" role="group" aria-label="Catégories">
              <button type="button" className={!cat ? 'puce actif' : 'puce'} onClick={() => setCat('')}>Tout</button>
              {categories.map((c) => <button type="button" key={c} className={cat === c ? 'puce actif' : 'puce'} onClick={() => setCat(c)}>{c}</button>)}
            </div>
          )}
          {tout.chargement ? <GrilleSquelette /> : tout.erreur ? <Erreur message={tout.erreur} recharger={tout.recharger} /> : (
            <>
              <div className="grille">
                {liste.slice(0, nbVisibles).map((p, i) => <CarteProduit key={p.id} produit={p} eager={i < 4} />)}
              </div>
              {liste.length > nbVisibles && (
                <div className="centre"><button type="button" className="btn btn-contour" onClick={() => setNbVisibles((n) => n + 12)}>Voir plus d'articles ({liste.length - nbVisibles})</button></div>
              )}
              {!liste.length && <p className="vide-texte">Aucun article dans cette catégorie pour le moment.</p>}
            </>
          )}
        </section>

        {recents.length > 0 && (
          <section aria-labelledby="titre-vus">
            <div className="titre-section"><h2 id="titre-vus">Vus récemment</h2></div>
            <div className="rangee">{recents.map((p) => <CarteProduit key={p.id} produit={p} />)}</div>
          </section>
        )}
      </div>

      <InfosBoutique />
    </div>
  );
}

// Promotion en cours (ex. : Black Friday) : bandeau avec le temps restant
function BandeauPromo({ promo, onVoir }) {
  const [maintenant, setMaintenant] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 30000); return () => clearInterval(t); }, []);
  const reste = new Date(promo.fin) - maintenant;
  if (reste <= 0) return null;
  const j = Math.floor(reste / 86400000); const h = Math.floor((reste % 86400000) / 3600000); const m = Math.floor((reste % 3600000) / 60000);
  return (
    <button type="button" className="bandeau-promo" onClick={onVoir}>
      <strong>{promo.nom}</strong>
      <span className="bandeau-promo-pc">-{promo.pourcentage} %</span>
      <span>sur les articles en stock · encore {j > 0 ? `${j} j ${h} h` : `${h} h ${String(m).padStart(2, '0')}`}</span>
    </button>
  );
}
