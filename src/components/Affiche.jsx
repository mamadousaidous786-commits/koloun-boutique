import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Img from './Img';
import { gnf, imagePrincipale } from '../utils';
import { useBoutique } from '../store';
import { IcoCoeur, IcoFleche, IcoRetour } from './Icones';

const DUREE = 5500;

function depuis(date) {
  const j = Math.floor((Date.now() - new Date(date).getTime()) / 864e5);
  if (j <= 0) return "Arrivé aujourd'hui";
  if (j === 1) return 'Arrivé hier';
  if (j < 30) return `Arrivé il y a ${j} jours`;
  return 'En boutique';
}

function taillesDispo(p) {
  const s = new Set();
  p.variantes.forEach((v) => v.tailles.forEach((t) => t.stock > 0 && s.add(t.taille)));
  return [...s];
}

// En-tête façon Netflix : les 10 derniers articles défilent seuls, en affiches 3D
export default function Affiche({ produits }) {
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);
  const { favoris, basculerFavori } = useBoutique();
  const n = produits.length;
  const glisse = useRef(null);

  const aller = useCallback((i) => setActif(((i % n) + n) % n), [n]);

  useEffect(() => {
    if (pause || n < 2 || document.hidden) return undefined;
    const t = setTimeout(() => aller(actif + 1), DUREE);
    return () => clearTimeout(t);
  }, [actif, pause, n, aller]);

  useEffect(() => {
    const vis = () => setPause(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  if (!n) return null;
  const p = produits[actif];
  const tailles = taillesDispo(p);
  const fav = favoris.includes(p.id);

  const debut = (e) => { glisse.current = { x: e.clientX, y: e.clientY }; };
  const fin = (e) => {
    if (!glisse.current) return;
    const dx = e.clientX - glisse.current.x;
    const dy = e.clientY - glisse.current.y;
    glisse.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) aller(actif + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      className="affiche"
      aria-roledescription="carrousel"
      aria-label="Nouveaux articles"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div className="affiche-fonds" aria-hidden="true">
        {produits.map((x, i) => (
          <div key={x.id} className={`affiche-fond ${i === actif ? 'visible' : ''}`} style={{ backgroundImage: imagePrincipale(x) ? `url("${imagePrincipale(x)}")` : 'none' }} />
        ))}
      </div>
      <div className="affiche-voile" aria-hidden="true" />

      <div className="affiche-progres" role="tablist" aria-label="Choisir un article">
        {produits.map((x, i) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={i === actif}
            aria-label={x.nom}
            className={`segment ${i < actif ? 'fait' : ''} ${i === actif ? 'encours' : ''} ${pause ? 'fige' : ''}`}
            style={{ '--duree': `${DUREE}ms` }}
            onClick={() => aller(i)}
          >
            <span />
          </button>
        ))}
      </div>

      <div className="affiche-int">
        <div className="affiche-texte" key={p.id} aria-live="polite">
          <p className="affiche-meta">
            <span className="compteur">{String(actif + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            <span>{depuis(p.date_ajout)}</span>
          </p>
          <h1 className="affiche-titre">{p.nom}</h1>
          <p className="affiche-prix">{gnf(p.prix)}{p.prix_avant && <s className="affiche-avant">{gnf(p.prix_avant)}</s>}</p>
          {tailles.length > 0 ? (
            <p className="affiche-tailles">
              {tailles.slice(0, 7).map((t) => <span key={t}>{t}</span>)}
              {tailles.length > 7 && <span>+{tailles.length - 7}</span>}
            </p>
          ) : (
            <p className="affiche-epuise">Épuisé — disponible en commande spéciale</p>
          )}
          <div className="affiche-actions">
            <Link to={`/article/${p.id}`} className="btn btn-or">Voir l'article</Link>
            <button type="button" className={`btn-rond ${fav ? 'actif' : ''}`} onClick={() => basculerFavori(p.id)} aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
              <IcoCoeur plein={fav} />
            </button>
          </div>
        </div>

        <div className="scene-3d" onPointerDown={debut} onPointerUp={fin} onPointerCancel={() => { glisse.current = null; }}>
          {produits.map((x, i) => {
            let d = i - actif;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const abs = Math.abs(d);
            const visible = abs <= 3;
            return (
              <Link
                key={x.id}
                to={i === actif ? `/article/${x.id}` : '#'}
                onClick={(e) => { if (i !== actif) { e.preventDefault(); aller(i); } }}
                className={`poster ${i === actif ? 'poster-actif' : ''}`}
                tabIndex={i === actif ? 0 : -1}
                aria-hidden={i !== actif}
                style={{
                  '--d': d,
                  '--abs': abs,
                  zIndex: 20 - abs,
                  opacity: visible ? 1 - abs * 0.18 : 0,
                  pointerEvents: visible ? 'auto' : 'none',
                }}
              >
                <Img src={imagePrincipale(x)} alt={x.nom} eager={abs <= 1} />
                <span className="poster-reflet" aria-hidden="true" />
              </Link>
            );
          })}
          <button type="button" className="fleche fleche-g" onClick={() => aller(actif - 1)} aria-label="Article précédent"><IcoRetour /></button>
          <button type="button" className="fleche fleche-d" onClick={() => aller(actif + 1)} aria-label="Article suivant"><IcoFleche /></button>
        </div>
      </div>
    </section>
  );
}
