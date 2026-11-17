import { useState } from 'react';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Img from '../components/Img';
import FeuilleCommande from '../components/FeuilleCommande';
import { Erreur, GrilleSquelette } from './Accueil';
import { IcoMoins, IcoPlus, IcoWhatsApp } from '../components/Icones';
import { gnf, lienWhatsApp } from '../utils';

function CarteSpeciale({ s, selection, onChoisir }) {
  const [img, setImg] = useState(0);
  const choix = selection.filter((l) => l.special_id === s.id);
  const [taille, setTaille] = useState('');

  return (
    <article className="carte-speciale">
      <div className="carte-visuel" onClick={() => s.images.length > 1 && setImg((i) => (i + 1) % s.images.length)}>
        <Img src={s.images[img]} alt={s.nom} />
        {s.images.length > 1 && (
          <span className="points" aria-hidden="true">{s.images.map((_, i) => <i key={i} className={i === img ? 'actif' : ''} />)}</span>
        )}
        <span className="carte-badges"><span className="badge">{s.delai}</span></span>
      </div>
      <div className="carte-speciale-corps">
        <h3>{s.nom}</h3>
        <p className="carte-prix">{gnf(s.prix)}</p>
        {s.description && <p className="petit">{s.description}</p>}
        {s.tailles.length > 0 && (
          <div className="tailles petites" role="radiogroup" aria-label={`Pointure pour ${s.nom}`}>
            {s.tailles.map((t) => (
              <button type="button" key={t} role="radio" aria-checked={taille === t} className={`taille ${taille === t ? 'actif' : ''}`} onClick={() => setTaille(t)}>{t}</button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn btn-sombre"
          disabled={s.tailles.length > 0 && !taille}
          onClick={() => onChoisir(s, taille)}
        >
          {s.tailles.length > 0 && !taille ? 'Choisissez une pointure' : 'Ajouter cette paire'}
        </button>
        {choix.length > 0 && (
          <p className="choisi">{choix.map((l) => `${l.quantite} × T.${l.taille || '—'}`).join(' · ')} dans votre sélection</p>
        )}
      </div>
    </article>
  );
}

export default function Speciales() {
  const liste = useCharger(() => api.speciales(), []);
  const { notifier } = useBoutique();
  const [selection, setSelection] = useState([]);
  const [feuille, setFeuille] = useState(null);

  const choisir = (s, taille) => {
    const cle = `s-${s.id}-${taille}`;
    setSelection((sel) => {
      const ex = sel.find((l) => l.cle === cle);
      if (ex) return sel.map((l) => (l.cle === cle ? { ...l, quantite: Math.min(10, l.quantite + 1) } : l));
      return [...sel, { cle, source: 'speciale', special_id: s.id, taille, quantite: 1, nom: s.nom, prix: s.prix, image: s.images[0] }];
    });
    notifier(`${s.nom}${taille ? ` (T.${taille})` : ''} ajoutée à votre sélection`);
  };

  const changer = (cle, d) => setSelection((sel) => sel.map((l) => (l.cle === cle ? { ...l, quantite: l.quantite + d } : l)).filter((l) => l.quantite > 0));
  const total = selection.reduce((s, l) => s + l.prix * l.quantite, 0);
  const nb = selection.reduce((s, l) => s + l.quantite, 0);

  return (
    <div className="page page-speciale">
      <header className="tete-speciale">
        <h1 className="titre-page">Commande spéciale</h1>
        <p>Choisissez une ou plusieurs paires et votre pointure. Nous les commandons pour vous : livraison en 2 à 3 semaines, à récupérer à la boutique.</p>
      </header>

      {liste.chargement ? <GrilleSquelette n={6} /> : liste.erreur ? <Erreur message={liste.erreur} recharger={liste.recharger} /> : (
        <div className="grille grille-speciale">
          {liste.donnees.map((s) => <CarteSpeciale key={s.id} s={s} selection={selection} onChoisir={choisir} />)}
        </div>
      )}

      {liste.donnees && !liste.donnees.length && <p className="vide-texte">Aucune paire publiée pour le moment.</p>}

      <div className="encart-photo">
        <p>Le modèle que vous voulez n'est pas dans la liste ?</p>
        <a className="btn btn-contour" href={lienWhatsApp("Bonjour Koloun Luxure 👋 Je cherche un modèle précis pour une commande spéciale. Je vous envoie la photo :")} target="_blank" rel="noreferrer">
          <IcoWhatsApp /> Envoyer une photo du modèle
        </a>
      </div>

      {nb > 0 && (
        <div className="barre-selection" role="region" aria-label="Votre sélection">
          <details>
            <summary><strong>{nb} paire{nb > 1 ? 's' : ''}</strong> · {gnf(total)}</summary>
            <ul>
              {selection.map((l) => (
                <li key={l.cle}>
                  <Img src={l.image} alt="" />
                  <span>{l.nom}<small>{l.taille ? `Pointure ${l.taille}` : ''}</small></span>
                  <span className="stepper petit-stepper">
                    <button type="button" onClick={() => changer(l.cle, -1)} aria-label="Moins"><IcoMoins width="16" height="16" /></button>
                    <span>{l.quantite}</span>
                    <button type="button" onClick={() => changer(l.cle, 1)} aria-label="Plus"><IcoPlus width="16" height="16" /></button>
                  </span>
                </li>
              ))}
            </ul>
          </details>
          <div className="barre-selection-actions">
            <button type="button" className="btn btn-contour-clair" onClick={() => setFeuille('discuter')}>Discuter</button>
            <button type="button" className="btn btn-wa" onClick={() => setFeuille('valider')}><IcoWhatsApp /> Valider</button>
          </div>
        </div>
      )}

      <FeuilleCommande
        ouverte={!!feuille}
        intentionInitiale={feuille || 'valider'}
        onFermer={() => setFeuille(null)}
        lignes={selection}
        onEnvoye={() => setSelection([])}
      />
    </div>
  );
}
