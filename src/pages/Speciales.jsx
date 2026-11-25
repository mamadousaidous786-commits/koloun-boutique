import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import Img from '../components/Img';
import { Erreur, GrilleSquelette } from './Accueil';
import { IcoBulle } from '../components/Icones';
import { gnf, ouvrirDiscussion } from '../utils';

export const avance = (prix) => Math.round(prix / 2);

// Liste des modèles en commande spéciale : on touche un modèle pour voir ses photos et choisir sa pointure
export default function Speciales() {
  const liste = useCharger(() => api.speciales(), []);
  const naviguer = useNavigate();

  return (
    <div className="page page-speciale">
      <header className="tete-speciale">
        <h1 className="titre-page">Commande spéciale</h1>
        <p>Choisissez un modèle et votre pointure, puis validez sur WhatsApp en versant une avance de 50 %. Le reste est réglé à l'arrivée, sous 2 à 3 semaines.</p>
      </header>

      {liste.chargement ? <GrilleSquelette n={8} /> : liste.erreur ? <Erreur message={liste.erreur} recharger={liste.recharger} /> : liste.donnees.length ? (
        <div className="grille">
          {liste.donnees.map((s, i) => (
            <article key={s.id} className="carte">
              <Link to={`/commande-speciale/${s.id}`} className="carte-visuel">
                <Img src={s.images[0]} alt={s.nom} eager={i < 4} />
                {s.images[1] && <Img src={s.images[1]} alt="" className="carte-alt" />}
                <span className="carte-badges"><span className="badge">{s.delai}</span></span>
                {s.images.length > 1 && <span className="nb-photos">{s.images.length} photos</span>}
              </Link>
              <Link to={`/commande-speciale/${s.id}`} className="carte-texte">
                <h3>{s.nom}</h3>
                <p className="carte-prix">{gnf(s.prix)}</p>
                <p className="carte-variantes">Avance : {gnf(avance(s.prix))}</p>
              </Link>
            </article>
          ))}
        </div>
      ) : <p className="vide-texte">Aucun modèle publié pour le moment.</p>}

      <div className="encart-photo">
        <p>Le modèle que vous voulez n'est pas dans la liste ?</p>
        <button type="button" className="btn btn-contour" onClick={() => ouvrirDiscussion(naviguer, { prerempli: 'Bonjour, je cherche ce modèle en commande spéciale (photo ci-dessous) :' })}>
          <IcoBulle /> Envoyer une photo du modèle
        </button>
      </div>
    </div>
  );
}
