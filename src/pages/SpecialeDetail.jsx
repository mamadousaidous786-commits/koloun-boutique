import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import Vue3D from '../components/Vue3D';
import Img from '../components/Img';
import { Erreur } from './Accueil';
import { avance } from './Speciales';
import { IcoBulle, IcoMoins, IcoPartager, IcoPlus, IcoRetour } from '../components/Icones';
import { gnf, ouvrirDiscussion } from '../utils';
import { urlSite } from '../config';

// Fiche d'un modèle en commande spéciale : photos, pointure, puis validation sur WhatsApp avec l'avance de 50 %
export default function SpecialeDetail() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const liste = useCharger(() => api.speciales(), []);
  const [img, setImg] = useState(0);
  const [taille, setTaille] = useState('');
  const [qte, setQte] = useState(1);
  const [alerteTaille, setAlerteTaille] = useState(false);

  useEffect(() => { setImg(0); setTaille(''); setQte(1); }, [id]);

  const s = useMemo(() => (liste.donnees || []).find((x) => String(x.id) === String(id)), [liste.donnees, id]);
  const autres = useMemo(() => (liste.donnees || []).filter((x) => String(x.id) !== String(id)).slice(0, 8), [liste.donnees, id]);

  if (liste.chargement) return <div className="page"><div className="fiche fiche-attente"><div className="vue3d-zone squelette" /><div><p className="ligne-attente" /><p className="ligne-attente courte" /></div></div></div>;
  if (liste.erreur) return <div className="page"><Erreur message={liste.erreur} recharger={liste.recharger} /></div>;
  if (!s) {
    return (
      <div className="page vide">
        <h1 className="titre-page">Ce modèle n'est plus proposé</h1>
        <Link to="/commande-speciale" className="btn btn-sombre">Voir les autres modèles</Link>
      </div>
    );
  }

  const total = s.prix * qte;
  const montantAvance = avance(total);
  const lien = `${urlSite()}/commande-speciale/${s.id}`;

  const valider = () => {
    if (s.tailles.length && !taille) {
      setAlerteTaille(true);
      setTimeout(() => setAlerteTaille(false), 1600);
      return;
    }
    const texte = [
      'Bonjour Koloun Luxure 👋',
      'Je souhaite passer une commande spéciale :',
      `• Modèle : ${s.nom}`,
      taille ? `• Pointure : ${taille}` : null,
      `• Quantité : ${qte}`,
      `• Prix : ${gnf(total)}`,
      '',
      `Je souhaite valider ma commande en versant l'avance de 50 % (${gnf(montantAvance)}). Comment puis-je effectuer le versement ?`,
      '',
      `Voir le modèle : ${lien}`,
    ].filter((l) => l !== null).join('\n');
    ouvrirDiscussion(naviguer, { texte }); // part tout seul dans la discussion avec la boutique
  };

  const partager = async () => {
    const texte = `${s.nom} — ${gnf(s.prix)} en commande spéciale chez Koloun Luxure`;
    if (navigator.share) {
      try { await navigator.share({ title: s.nom, text: texte, url: lien }); } catch { /* partage annulé */ }
    } else {
      try { await navigator.clipboard.writeText(`${texte}\n${lien}`); } catch { /* ignoré */ }
    }
  };

  return (
    <div className="page page-produit">
      <button type="button" className="retour" onClick={() => (window.history.length > 1 ? naviguer(-1) : naviguer('/commande-speciale'))}><IcoRetour width="18" height="18" /> Retour</button>

      <div className="fiche">
        <Vue3D images={s.images.length ? s.images : [null]} index={img} onChange={setImg} alt={s.nom} />

        <div className="fiche-infos">
          <p className="fiche-cat">Commande spéciale · {s.delai}</p>
          <h1 className="fiche-titre">{s.nom}</h1>
          <p className="fiche-prix">{gnf(s.prix)}</p>

          {s.tailles.length > 0 && (
            <div className={`bloc ${alerteTaille ? 'secoue' : ''}`}>
              <p className="etiquette">{taille ? `Pointure ${taille}` : 'Choisissez votre pointure'}</p>
              <div className="tailles" role="radiogroup" aria-label="Pointure">
                {s.tailles.map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={taille === t} className={`taille ${taille === t ? 'actif' : ''}`} onClick={() => setTaille(t)}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <div className="bloc qte">
            <p className="etiquette">Quantité</p>
            <div className="stepper">
              <button type="button" onClick={() => setQte((q) => Math.max(1, q - 1))} disabled={qte <= 1} aria-label="Moins"><IcoMoins width="18" height="18" /></button>
              <span aria-live="polite">{qte}</span>
              <button type="button" onClick={() => setQte((q) => Math.min(10, q + 1))} aria-label="Plus"><IcoPlus width="18" height="18" /></button>
            </div>
          </div>

          <div className="paiement-avance" aria-label="Paiement">
            <div><span>À verser à la commande (50 %)</span><strong>{gnf(montantAvance)}</strong></div>
            <div><span>Reste à payer à l'arrivée</span><strong>{gnf(total - montantAvance)}</strong></div>
          </div>

          <div className="fiche-actions fiche-actions-speciale">
            <button type="button" className="btn btn-sombre btn-large" onClick={valider}>
              <IcoBulle /> Valider votre commande
            </button>
            <button type="button" className="btn-rond clair" onClick={partager} aria-label="Partager"><IcoPartager /></button>
          </div>
          <p className="petit">Votre demande part dans la discussion avec la boutique, qui vous explique comment verser l'avance. La commande est lancée dès réception de l'avance.</p>

          {s.description && (
            <div className="bloc description">
              <p className="etiquette">Description</p>
              <p>{s.description}</p>
            </div>
          )}
          <ul className="garanties">
            <li>Livraison en {s.delai}, à récupérer à la boutique de Lambanyi</li>
            <li>Avance de 50 % à la commande, le reste à l'arrivée</li>
          </ul>
        </div>
      </div>

      {autres.length > 0 && (
        <section aria-labelledby="titre-autres">
          <div className="titre-section"><h2 id="titre-autres">Autres modèles</h2></div>
          <div className="rangee">
            {autres.map((x) => (
              <article key={x.id} className="carte">
                <Link to={`/commande-speciale/${x.id}`} className="carte-visuel"><Img src={x.images[0]} alt={x.nom} /></Link>
                <Link to={`/commande-speciale/${x.id}`} className="carte-texte">
                  <h3>{x.nom}</h3>
                  <p className="carte-prix">{gnf(x.prix)}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
