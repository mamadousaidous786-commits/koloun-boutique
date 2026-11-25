import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBoutique } from '../store';
import Img from '../components/Img';
import FeuilleCommande from '../components/FeuilleCommande';
import FeuilleReservation from '../components/FeuilleReservation';
import { IcoMoins, IcoPlus, IcoPoubelle, IcoWhatsApp } from '../components/Icones';
import { gnf, lienWhatsApp } from '../utils';

export default function Panier() {
  const { panier, changerQuantite, retirer, nbArticles } = useBoutique();
  const [feuille, setFeuille] = useState(null);
  const total = panier.reduce((s, l) => s + l.prix * l.quantite, 0);

  if (!panier.length) {
    return (
      <div className="page vide">
        <h1 className="titre-page">Votre panier est vide</h1>
        <p>Ajoutez des articles depuis le catalogue ou choisissez des paires en commande spéciale.</p>
        <div className="vide-actions">
          <Link to="/catalogue" className="btn btn-sombre">Voir le catalogue</Link>
          <Link to="/commande-speciale" className="btn btn-contour">Commande spéciale</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-panier">
      <h1 className="titre-page">Panier <span className="compte">({nbArticles} article{nbArticles > 1 ? 's' : ''})</span></h1>
      <div className="panier">
        <ul className="lignes">
          {panier.map((l) => (
            <li key={l.cle} className="ligne">
              <Link to={l.source === 'stock' ? `/article/${l.produit_id}` : '/commande-speciale'} className="ligne-img"><Img src={l.image} alt={l.nom} /></Link>
              <div className="ligne-infos">
                <p className="ligne-nom">{l.nom}</p>
                <p className="petit">{l.taille ? `Taille ${l.taille}` : ''}{l.source === 'speciale' ? ' · Commande spéciale (2 à 3 semaines)' : ''}</p>
                <p className="ligne-prix">{gnf(l.prix)}</p>
              </div>
              <div className="ligne-actions">
                <div className="stepper">
                  <button type="button" onClick={() => changerQuantite(l.cle, l.quantite - 1)} disabled={l.quantite <= 1} aria-label="Moins"><IcoMoins width="16" height="16" /></button>
                  <span>{l.quantite}</span>
                  <button type="button" onClick={() => changerQuantite(l.cle, l.quantite + 1)} disabled={l.quantite >= (l.stock ?? 20)} aria-label="Plus"><IcoPlus width="16" height="16" /></button>
                </div>
                <button type="button" className="btn-ico" onClick={() => retirer(l.cle)} aria-label={`Retirer ${l.nom}`}><IcoPoubelle width="20" height="20" /></button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="recap">
          <div className="recap-ligne"><span>Sous-total</span><span>{gnf(total)}</span></div>
          <div className="recap-ligne petit"><span>Retrait</span><span>En boutique, Lambanyi</span></div>
          <div className="recap-ligne recap-total"><span>Total</span><strong>{gnf(total)}</strong></div>
          <button type="button" className="btn btn-sombre btn-large" onClick={() => setFeuille('commander')}>Commander</button>
          <button type="button" className="btn btn-or btn-large" onClick={() => setFeuille('reserver')} disabled={!panier.some((l) => l.source === 'stock')}>Réserver</button>
          <a className="btn btn-contour btn-large" href={lienWhatsApp(`Bonjour Koloun Luxure 👋 J'ai une question sur ces articles :\n${panier.map((l) => `• ${l.nom}${l.taille ? ` (T.${l.taille})` : ''} × ${l.quantite}`).join('\n')}`)} target="_blank" rel="noreferrer"><IcoWhatsApp /> Discuter</a>
          <p className="petit">Rien n'est payé en ligne. <strong>Commander</strong> : livraison ou retrait. <strong>Réserver</strong> : la boutique met les articles de côté, vous passez les payer à Lambanyi.</p>
        </aside>
      </div>

      <FeuilleCommande ouverte={feuille === 'commander'} onFermer={() => setFeuille(null)} lignes={panier} />
      <FeuilleReservation ouverte={feuille === 'reserver'} onFermer={() => setFeuille(null)} lignes={panier} />
    </div>
  );
}
