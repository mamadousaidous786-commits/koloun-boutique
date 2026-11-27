import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Vue3D from '../components/Vue3D';
import CarteProduit from '../components/CarteProduit';
import FeuilleCommande from '../components/FeuilleCommande';
import AlerteTaille from '../components/AlerteTaille';
import { Erreur } from './Accueil';
import { IcoBulle, IcoCoeur, IcoMoins, IcoPartager, IcoPlus, IcoRetour } from '../components/Icones';
import { gnf, ouvrirDiscussion } from '../utils';
import { urlSite } from '../config';

export default function Produit() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const produit = useCharger(() => api.produit(id), [id]);
  const tous = useCharger(() => api.produits(), []);
  const { ajouter, favoris, basculerFavori, marquerVu, notifier } = useBoutique();
  const [iv, setIv] = useState(0);
  const [tailleId, setTailleId] = useState(null);
  const [qte, setQte] = useState(1);
  const [feuille, setFeuille] = useState(false);
  const [alerteTaille, setAlerteTaille] = useState(false);
  const [epuiseeId, setEpuiseeId] = useState(null); // taille épuisée touchée → « Me prévenir »

  const p = produit.donnees;
  useEffect(() => { setIv(0); setTailleId(null); setQte(1); setEpuiseeId(null); }, [id]);
  useEffect(() => { if (p) marquerVu(p.id); }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setTailleId(null); setQte(1); setEpuiseeId(null); }, [iv]);

  const similaires = useMemo(() => {
    if (!p || !tous.donnees) return [];
    return tous.donnees.filter((x) => x.id !== p.id && (!p.categorie || x.categorie === p.categorie)).slice(0, 8);
  }, [p, tous.donnees]);

  if (produit.chargement) return <div className="page"><div className="fiche fiche-attente"><div className="vue3d-zone squelette" /><div><p className="ligne-attente" /><p className="ligne-attente courte" /></div></div></div>;
  if (produit.erreur) return <div className="page"><Erreur message={produit.erreur} recharger={produit.recharger} /><div className="centre"><Link to="/catalogue" className="btn btn-contour">Voir le catalogue</Link></div></div>;

  const variante = p.variantes[iv];
  const taille = variante.tailles.find((t) => t.id === tailleId);
  const fav = favoris.includes(p.id);
  const stockVariante = variante.tailles.reduce((s, t) => s + t.stock, 0);

  const ligne = () => ({ source: 'stock', produit_id: p.id, produit_taille_id: taille.id, taille: taille.taille, quantite: qte, stock: taille.stock, nom: p.nom, prix: p.prix, image: variante.image });

  const exigerTaille = () => {
    if (taille) return true;
    setAlerteTaille(true);
    setTimeout(() => setAlerteTaille(false), 1600);
    return false;
  };

  const auPanier = () => {
    if (!exigerTaille()) return;
    ajouter(ligne());
    notifier('Ajouté au panier', { to: '/panier', libelle: 'Voir le panier' });
  };

  const partager = async () => {
    const url = `${urlSite()}/article/${p.id}`;
    const texte = `${p.nom} — ${gnf(p.prix)} chez Koloun Luxure`;
    if (navigator.share) {
      try { await navigator.share({ title: p.nom, text: texte, url }); } catch { /* partage annulé */ }
    } else {
      try { await navigator.clipboard.writeText(`${texte}\n${url}`); notifier('Lien copié : collez-le pour le partager'); } catch { /* ignoré */ }
    }
  };

  return (
    <div className="page page-produit">
      <button type="button" className="retour" onClick={() => (window.history.length > 1 ? naviguer(-1) : naviguer('/catalogue'))}><IcoRetour width="18" height="18" /> Retour</button>

      <div className="fiche">
        <Vue3D images={p.variantes.map((v) => v.image)} index={iv} onChange={setIv} alt={p.nom} />

        <div className="fiche-infos">
          {p.categorie && <p className="fiche-cat">{p.categorie}</p>}
          <h1 className="fiche-titre">{p.nom}</h1>
          <p className={`fiche-prix ${p.promo ? 'en-promo' : ''}`}>{gnf(p.prix)}{p.prix_avant && <><s>{gnf(p.prix_avant)}</s><span className="badge badge-promo">-{p.promo.pourcentage} %</span></>}</p>
          {p.promo && <p className="fiche-promo">{p.promo.nom} · jusqu'au {new Date(p.promo.fin).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {new Date(p.promo.fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}

          {p.variantes.length > 1 && (
            <div className="bloc">
              <p className="etiquette">Modèle {iv + 1} sur {p.variantes.length}{variante.description ? ` · ${variante.description}` : ''}</p>
            </div>
          )}

          <div className={`bloc ${alerteTaille ? 'secoue' : ''}`}>
            <p className="etiquette">{taille ? `Taille ${taille.taille}` : 'Choisissez votre taille'}</p>
            {variante.tailles.length ? (
              <div className="tailles" role="radiogroup" aria-label="Taille">
                {variante.tailles.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={t.id === tailleId}
                    aria-label={t.stock === 0 ? `Taille ${t.taille}, épuisée : être prévenu de son retour` : undefined}
                    className={`taille ${t.id === tailleId ? 'actif' : ''} ${t.stock === 0 ? 'epuisee' : ''} ${t.id === epuiseeId ? 'visee' : ''}`}
                    onClick={() => (t.stock === 0 ? (setEpuiseeId(t.id), setTailleId(null)) : (setTailleId(t.id), setEpuiseeId(null), setQte(1)))}
                  >
                    {t.taille}
                    {t.stock > 0 && t.stock <= 2 && <small>{t.stock} restant{t.stock > 1 ? 's' : ''}</small>}
                  </button>
                ))}
              </div>
            ) : <p className="petit">Tailles non renseignées : demandez sur WhatsApp.</p>}
            <AlerteTaille taille={variante.tailles.find((t) => t.id === epuiseeId)} />
            {stockVariante === 0 && <p className="info-epuise">Ce modèle est épuisé. <Link to="/commande-speciale">Le commander en commande spéciale</Link></p>}
          </div>

          {taille && (
            <div className="bloc qte">
              <p className="etiquette">Quantité</p>
              <div className="stepper">
                <button type="button" onClick={() => setQte((q) => Math.max(1, q - 1))} aria-label="Moins"><IcoMoins width="18" height="18" /></button>
                <span aria-live="polite">{qte}</span>
                <button type="button" onClick={() => setQte((q) => Math.min(taille.stock, q + 1))} disabled={qte >= taille.stock} aria-label="Plus"><IcoPlus width="18" height="18" /></button>
              </div>
            </div>
          )}

          <div className="fiche-actions">
            <button type="button" className="btn btn-sombre btn-large" onClick={auPanier} disabled={stockVariante === 0}>Ajouter au panier</button>
            <button type="button" className="btn btn-or btn-large" onClick={() => exigerTaille() && setFeuille(true)} disabled={stockVariante === 0}>Commander maintenant</button>
            <div className="fiche-secondaires">
              <button type="button" className="btn btn-contour btn-discuter" onClick={() => ouvrirDiscussion(naviguer, { produit_id: p.id, produit_taille_id: taille?.id })}><IcoBulle /> Discuter</button>
              <button type="button" className={`btn-rond clair ${fav ? 'actif' : ''}`} onClick={() => basculerFavori(p.id)} aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}><IcoCoeur plein={fav} /></button>
              <button type="button" className="btn-rond clair" onClick={partager} aria-label="Partager"><IcoPartager /></button>
            </div>
          </div>

          {p.description && (
            <div className="bloc description">
              <p className="etiquette">Description</p>
              <p>{p.description}</p>
            </div>
          )}
          <ul className="garanties">
            <li>Essayage et retrait possibles en boutique à Lambanyi</li>
            <li>Paiement en boutique : cash, Orange Money ou paiement marchand</li>
          </ul>
        </div>
      </div>

      {similaires.length > 0 && (
        <section aria-labelledby="titre-similaires">
          <div className="titre-section"><h2 id="titre-similaires">Vous aimerez aussi</h2></div>
          <div className="rangee">{similaires.map((x) => <CarteProduit key={x.id} produit={x} />)}</div>
        </section>
      )}

      <FeuilleCommande ouverte={feuille} onFermer={() => setFeuille(false)} lignes={taille ? [{ ...ligne(), cle: null }] : []} />
    </div>
  );
}
