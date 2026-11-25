import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useBoutique } from '../store';
import { gnf } from '../utils';
import { IcoFermer } from './Icones';

// Réservation : le client (connecté) met des articles du stock de côté et passe les payer à la boutique.
// Elle arrive dans Koloun Gestion → Réservations, « À confirmer ». Rien n'est payé en ligne.
// Compte Google sans numéro : on le demande ici (une seule fois, il est gardé dans le compte).
const aujourdhui = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function FeuilleReservation({ ouverte, onFermer, lignes }) {
  const { compte, setCompte, viderLignes, notifier } = useBoutique();
  const naviguer = useNavigate();
  const { pathname } = useLocation();
  const [tel, setTel] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!ouverte) return undefined;
    setErreur('');
    const echap = (e) => e.key === 'Escape' && onFermer();
    document.addEventListener('keydown', echap);
    document.body.classList.add('fige');
    return () => { document.removeEventListener('keydown', echap); document.body.classList.remove('fige'); };
  }, [ouverte, onFermer]);

  if (!ouverte) return null;
  const stock = lignes.filter((l) => l.source === 'stock' && l.produit_taille_id);
  const autres = lignes.length - stock.length;
  const total = stock.reduce((s, l) => s + l.prix * l.quantite, 0);
  const telCompte = compte?.compte?.telephone || '';

  const reserver = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!stock.length) return setErreur('Aucun article de votre panier ne peut être réservé.');
    if (!telCompte && tel.replace(/\D/g, '').length < 8) return setErreur('Indiquez votre numéro de téléphone : la boutique vous appelle pour confirmer la réservation.');
    setEnvoi(true);
    try {
      const r = await api.reserver({
        lignes: stock.map((l) => ({ produit_taille_id: l.produit_taille_id, quantite: l.quantite })),
        articles: stock.map((l) => ({ nom: l.nom, taille: l.taille, quantite: l.quantite, prix: l.prix })), // mode démo
        image: stock[0]?.image,
        telephone: telCompte ? undefined : tel.trim(),
        date_retrait_prevue: date || undefined,
        note: note.trim() || undefined,
      });
      if (r.compte) setCompte({ ...compte, compte: r.compte });
      viderLignes(stock.map((l) => l.cle));
      onFermer();
      notifier(`Réservation ${r.numero} envoyée à la boutique`);
      naviguer(`/compte?onglet=reservations&reservee=${encodeURIComponent(r.numero)}`);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="feuille-fond" onClick={onFermer}>
      <div className="feuille" role="dialog" aria-modal="true" aria-labelledby="titre-reservation" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-poignee" aria-hidden="true" />
        <div className="feuille-tete">
          <h2 id="titre-reservation">Réserver</h2>
          <button type="button" className="btn-ico" onClick={onFermer} aria-label="Fermer"><IcoFermer /></button>
        </div>
        <p className="petit intro-resa">La boutique met ces articles de côté pour vous. Vous passez les payer et les récupérer à Lambanyi.</p>

        <ul className="feuille-resume">
          {stock.map((l) => (
            <li key={l.cle}>
              <span>{l.nom}{l.taille ? ` · T.${l.taille}` : ''} × {l.quantite}</span>
              <strong>{gnf(l.prix * l.quantite)}</strong>
            </li>
          ))}
          <li className="feuille-total"><span>À payer au retrait</span><strong>{gnf(total)}</strong></li>
        </ul>
        {autres > 0 && <p className="petit avertissement-resa">{autres === 1 ? "L'article en commande spéciale reste" : `Les ${autres} articles en commande spéciale restent`} dans votre panier : ils ne se réservent pas (passez par « Commander »).</p>}

        {!compte ? (
          <div className="exige-compte">
            <p>Connectez-vous pour réserver : vous suivrez ensuite votre réservation dans votre compte.</p>
            <div className="deux">
              <Link to={`/compte?retour=${encodeURIComponent(pathname)}`} className="btn btn-contour" onClick={onFermer}>Se connecter</Link>
              <Link to={`/compte?mode=inscription&retour=${encodeURIComponent(pathname)}`} className="btn btn-sombre" onClick={onFermer}>Créer un compte</Link>
            </div>
            <p className="petit">Votre panier est gardé.</p>
          </div>
        ) : (
          <form className="formulaire" onSubmit={reserver}>
            {telCompte ? (
              <p className="infos-resa"><span>Au nom de</span><strong>{compte.compte.nom} · {String(telCompte).replace(/^224(?=\d{9}$)/, '').replace(/(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4')}</strong></p>
            ) : (
              <label>
                <span>Votre numéro de téléphone</span>
                <input value={tel} onChange={(e) => setTel(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="620 00 00 00" autoFocus />
                <small className="petit">Il est gardé dans votre compte : on ne vous le redemandera pas.</small>
              </label>
            )}
            <div className="deux">
              <label><span>Je passe le (facultatif)</span><input type="date" value={date} min={aujourdhui()} onChange={(e) => setDate(e.target.value)} /></label>
              <label><span>Message (facultatif)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : après 17 h" /></label>
            </div>
            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button type="submit" className="btn btn-sombre btn-large" disabled={envoi || !stock.length}>{envoi ? 'Envoi…' : `Réserver · ${gnf(total)}`}</button>
            <p className="petit">La boutique confirme la réservation puis vous envoie le reçu par WhatsApp. Vous payez au retrait.</p>
          </form>
        )}
      </div>
    </div>
  );
}
