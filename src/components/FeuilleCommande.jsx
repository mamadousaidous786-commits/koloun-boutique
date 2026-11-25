import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useBoutique } from '../store';
import { gnf } from '../utils';
import { IcoFermer } from './Icones';

// Dernière étape : le client (connecté) choisit livraison ou retrait, puis valide.
// La commande arrive dans Koloun Gestion (Livraisons → À confirmer) et le client la retrouve dans « Mes commandes ».
// lignes = [{ cle, source, produit_taille_id, taille, quantite, nom, prix, image }]
export default function FeuilleCommande({ ouverte, onFermer, lignes, onEnvoye }) {
  const { client, setClient, viderLignes, compte, notifier } = useBoutique();
  const naviguer = useNavigate();
  const { pathname } = useLocation();
  const telCompte = compte?.compte?.telephone ? String(compte.compte.telephone).replace(/^224(?=\d{9}$)/, '') : '';
  const [nom, setNom] = useState(compte?.compte?.nom || client.nom || '');
  const [tel, setTel] = useState(telCompte || client.telephone || '');
  const [mode, setMode] = useState(client.mode || 'livraison');
  const [adresse, setAdresse] = useState(client.adresse || '');
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!ouverte) return undefined;
    setErreur('');
    if (compte?.compte) { setNom((n) => n || compte.compte.nom); setTel((t) => t || telCompte); }
    const echap = (e) => e.key === 'Escape' && onFermer();
    document.addEventListener('keydown', echap);
    document.body.classList.add('fige');
    return () => { document.removeEventListener('keydown', echap); document.body.classList.remove('fige'); };
  }, [ouverte, onFermer, compte]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ouverte) return null;
  const total = lignes.reduce((s, l) => s + l.prix * l.quantite, 0);

  const valider = async (e) => {
    e.preventDefault();
    setErreur('');
    if (nom.trim().length < 2) return setErreur('Indiquez votre nom.');
    if (tel.replace(/\D/g, '').length < 8) return setErreur('Indiquez un numéro de téléphone valide : la boutique vous appelle pour la livraison.');
    if (mode === 'livraison' && adresse.trim().length < 3) return setErreur('Indiquez votre quartier ou votre adresse de livraison.');
    setEnvoi(true);
    try {
      const r = await api.creerCommande({
        client_nom: nom.trim(),
        client_telephone: tel.trim(),
        mode_livraison: mode,
        adresse: mode === 'livraison' ? adresse.trim() : undefined,
        note: note.trim() || undefined,
        lignes: lignes.map((l) => ({ source: 'stock', produit_taille_id: l.produit_taille_id, quantite: l.quantite })),
      });
      setClient({ nom: nom.trim(), telephone: tel.trim(), mode, adresse: adresse.trim() });
      viderLignes(lignes.map((l) => l.cle).filter(Boolean));
      onEnvoye?.();
      onFermer();
      notifier(`Commande ${r.reference} envoyée à la boutique`);
      naviguer(`/compte?onglet=attente&nouvelle=${encodeURIComponent(r.reference)}`);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="feuille-fond" onClick={onFermer}>
      <div className="feuille" role="dialog" aria-modal="true" aria-labelledby="titre-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-poignee" aria-hidden="true" />
        <div className="feuille-tete">
          <h2 id="titre-feuille">Commander</h2>
          <button type="button" className="btn-ico" onClick={onFermer} aria-label="Fermer"><IcoFermer /></button>
        </div>

        <ul className="feuille-resume">
          {lignes.map((l, i) => (
            <li key={l.cle || i}>
              <span>{l.nom}{l.taille ? ` · T.${l.taille}` : ''} × {l.quantite}</span>
              <strong>{gnf(l.prix * l.quantite)}</strong>
            </li>
          ))}
          <li className="feuille-total"><span>Total des articles</span><strong>{gnf(total)}</strong></li>
        </ul>

        {!compte ? (
          <div className="exige-compte">
            <p>Connectez-vous pour valider : vous suivrez ensuite votre commande dans « Mes commandes ».</p>
            <div className="deux">
              <Link to={`/compte?retour=${encodeURIComponent(pathname)}`} className="btn btn-contour" onClick={onFermer}>Se connecter</Link>
              <Link to={`/compte?mode=inscription&retour=${encodeURIComponent(pathname)}`} className="btn btn-sombre" onClick={onFermer}>Créer un compte</Link>
            </div>
            <p className="petit">Votre panier est gardé.</p>
          </div>
        ) : (
          <form className="formulaire" onSubmit={valider}>
            <div className="choix-mode" role="radiogroup" aria-label="Mode de réception">
              <button type="button" role="radio" aria-checked={mode === 'livraison'} className={mode === 'livraison' ? 'actif' : ''} onClick={() => setMode('livraison')}>
                <strong>🛵 Livraison</strong><small>Frais selon le quartier</small>
              </button>
              <button type="button" role="radio" aria-checked={mode === 'retrait'} className={mode === 'retrait' ? 'actif' : ''} onClick={() => setMode('retrait')}>
                <strong>🏬 Retrait en boutique</strong><small>Lambanyi, sans frais</small>
              </button>
            </div>
            {mode === 'livraison' && (
              <label><span>Quartier / adresse de livraison</span><input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Ex. : Kipé, près de la pharmacie" autoComplete="street-address" /></label>
            )}
            <div className="deux">
              <label><span>Nom</span><input value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" /></label>
              <label><span>Téléphone</span><input value={tel} onChange={(e) => setTel(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="620 00 00 00" /></label>
            </div>
            <label><span>Message pour la boutique (facultatif)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : appeler avant de venir" /></label>

            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button type="submit" className="btn btn-sombre btn-large" disabled={envoi}>{envoi ? 'Envoi…' : `Commander · ${gnf(total)}`}</button>
            <p className="petit">
              {mode === 'livraison'
                ? 'La boutique confirme votre commande et les frais de livraison. Vous payez à la réception.'
                : 'La boutique confirme quand votre commande est prête. Vous payez au retrait.'}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
