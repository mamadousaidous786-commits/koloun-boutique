import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import CarteProduit from '../components/CarteProduit';
import { Erreur, GrilleSquelette } from './Accueil';
import { IcoFermer, IcoFiltre, IcoRecherche } from '../components/Icones';
import { stockTotal } from '../utils';

const TRIS = [
  ['recent', 'Plus récents'],
  ['prix_asc', 'Prix croissant'],
  ['prix_desc', 'Prix décroissant'],
  ['nom', 'Nom (A → Z)'],
];

const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const cat = params.get('cat') || '';
  const [tri, setTri] = useState('recent');
  const [taille, setTaille] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [enStock, setEnStock] = useState(false);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const champ = useRef(null);

  const tout = useCharger(() => api.produits(), []);
  const infos = useCharger(() => api.infos(), []);

  useEffect(() => { if (params.get('chercher')) champ.current?.focus(); }, [params]);

  const toutesTailles = useMemo(() => {
    const s = new Set();
    (tout.donnees || []).forEach((p) => p.variantes.forEach((v) => v.tailles.forEach((t) => s.add(t.taille))));
    return [...s].sort((a, b) => (Number(a) && Number(b) ? Number(a) - Number(b) : a.localeCompare(b)));
  }, [tout.donnees]);

  const liste = useMemo(() => {
    const r = sansAccents(q.trim());
    let l = (tout.donnees || []).filter((p) => {
      if (cat && p.categorie !== cat) return false;
      if (r && !sansAccents(`${p.nom} ${p.description} ${p.categorie || ''}`).includes(r)) return false;
      if (prixMax && p.prix > Number(prixMax)) return false;
      if (enStock && stockTotal(p) === 0) return false;
      if (taille && !p.variantes.some((v) => v.tailles.some((t) => t.taille === taille && t.stock > 0))) return false;
      return true;
    });
    if (tri === 'prix_asc') l = [...l].sort((a, b) => a.prix - b.prix);
    if (tri === 'prix_desc') l = [...l].sort((a, b) => b.prix - a.prix);
    if (tri === 'nom') l = [...l].sort((a, b) => a.nom.localeCompare(b.nom));
    return l;
  }, [tout.donnees, q, cat, tri, taille, prixMax, enStock]);

  const choisirCat = (c) => {
    const p = new URLSearchParams(params);
    if (c) p.set('cat', c); else p.delete('cat');
    p.delete('chercher');
    setParams(p, { replace: true });
  };

  const nbFiltres = [taille, prixMax, enStock].filter(Boolean).length;

  return (
    <div className="page">
      <h1 className="titre-page">Catalogue</h1>
      <div className="barre-recherche">
        <IcoRecherche />
        <input ref={champ} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Basket, robe, sac…" aria-label="Chercher un article" type="search" />
        {q && <button type="button" className="btn-ico" onClick={() => setQ('')} aria-label="Effacer"><IcoFermer width="18" height="18" /></button>}
      </div>

      <div className="puces" role="group" aria-label="Catégories">
        <button type="button" className={!cat ? 'puce actif' : 'puce'} onClick={() => choisirCat('')}>Tout</button>
        {(infos.donnees?.categories || []).map((c) => <button type="button" key={c} className={cat === c ? 'puce actif' : 'puce'} onClick={() => choisirCat(c)}>{c}</button>)}
      </div>

      <div className="barre-outils">
        <p className="compte">{tout.chargement ? 'Chargement…' : `${liste.length} article${liste.length > 1 ? 's' : ''}`}</p>
        <button type="button" className={`btn-filtre ${nbFiltres ? 'actif' : ''}`} onClick={() => setFiltresOuverts((o) => !o)} aria-expanded={filtresOuverts}>
          <IcoFiltre width="18" height="18" /> Filtres{nbFiltres ? ` (${nbFiltres})` : ''}
        </button>
        <select value={tri} onChange={(e) => setTri(e.target.value)} aria-label="Trier">
          {TRIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {filtresOuverts && (
        <div className="panneau-filtres">
          <div>
            <p className="etiquette">Taille disponible</p>
            <div className="tailles">
              {toutesTailles.map((t) => <button type="button" key={t} className={taille === t ? 'taille actif' : 'taille'} onClick={() => setTaille(taille === t ? '' : t)}>{t}</button>)}
            </div>
          </div>
          <label className="champ-ligne">
            <span className="etiquette">Prix maximum (GNF)</span>
            <input type="number" inputMode="numeric" min="0" step="10000" value={prixMax} onChange={(e) => setPrixMax(e.target.value)} placeholder="Sans limite" />
          </label>
          <label className="case">
            <input type="checkbox" checked={enStock} onChange={(e) => setEnStock(e.target.checked)} /> Seulement les articles disponibles
          </label>
          {nbFiltres > 0 && <button type="button" className="lien-discret" onClick={() => { setTaille(''); setPrixMax(''); setEnStock(false); }}>Effacer les filtres</button>}
        </div>
      )}

      {tout.chargement ? <GrilleSquelette /> : tout.erreur ? <Erreur message={tout.erreur} recharger={tout.recharger} /> : liste.length ? (
        <div className="grille">{liste.map((p, i) => <CarteProduit key={p.id} produit={p} eager={i < 4} />)}</div>
      ) : (
        <div className="vide">
          <p>Aucun article ne correspond à votre recherche.</p>
          <p className="petit">Vous cherchez un modèle précis ? Passez par la commande spéciale.</p>
        </div>
      )}
    </div>
  );
}
