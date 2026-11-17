import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useBoutique } from '../store';
import { gnf, lienWhatsApp, messageCommande } from '../utils';
import { IcoFermer, IcoWhatsApp } from './Icones';

// Dernière étape : nom + téléphone, puis la commande part sur WhatsApp avec son lien.
// lignes = [{ cle, source, produit_taille_id | special_id, taille, quantite, nom, prix, image }]
export default function FeuilleCommande({ ouverte, onFermer, lignes, intentionInitiale = 'valider', onEnvoye }) {
  const { client, setClient, viderLignes, memoriserCommande } = useBoutique();
  const naviguer = useNavigate();
  const [nom, setNom] = useState(client.nom);
  const [tel, setTel] = useState(client.telephone);
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(null);
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
  const total = lignes.reduce((s, l) => s + l.prix * l.quantite, 0);

  const envoyer = async (intention) => {
    setErreur('');
    if (nom.trim().length < 2) return setErreur('Indiquez votre nom pour que la boutique vous reconnaisse.');
    if (tel.replace(/\D/g, '').length < 8) return setErreur('Indiquez un numéro de téléphone valide.');
    setEnvoi(intention);
    try {
      const r = await api.creerCommande({
        client_nom: nom.trim(),
        client_telephone: tel.trim(),
        note: note.trim() || undefined,
        intention,
        lignes: lignes.map((l) => (l.source === 'speciale'
          ? { source: 'speciale', special_id: l.special_id, taille: l.taille, quantite: l.quantite }
          : { source: 'stock', produit_taille_id: l.produit_taille_id, quantite: l.quantite })),
      });
      setClient({ nom: nom.trim(), telephone: tel.trim() });
      memoriserCommande({ code: r.code, reference: r.reference, total: r.total, date: new Date().toISOString(), nb: lignes.reduce((s, l) => s + l.quantite, 0), image: lignes[0]?.image });
      const texte = messageCommande({ reference: r.reference, code: r.code, lignes, total: r.total, client_nom: nom.trim() }, intention);
      viderLignes(lignes.map((l) => l.cle).filter(Boolean));
      onEnvoye?.();
      onFermer();
      naviguer(`/c/${r.code}?envoyee=1`);
      window.location.href = lienWhatsApp(texte);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(null);
    }
  };

  return (
    <div className="feuille-fond" onClick={onFermer}>
      <div className="feuille" role="dialog" aria-modal="true" aria-labelledby="titre-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-poignee" aria-hidden="true" />
        <div className="feuille-tete">
          <h2 id="titre-feuille">Finaliser sur WhatsApp</h2>
          <button type="button" className="btn-ico" onClick={onFermer} aria-label="Fermer"><IcoFermer /></button>
        </div>

        <ul className="feuille-resume">
          {lignes.map((l, i) => (
            <li key={l.cle || i}>
              <span>{l.nom}{l.taille ? ` · T.${l.taille}` : ''} × {l.quantite}</span>
              <strong>{gnf(l.prix * l.quantite)}</strong>
            </li>
          ))}
          <li className="feuille-total"><span>Total</span><strong>{gnf(total)}</strong></li>
        </ul>

        <form className="formulaire" onSubmit={(e) => { e.preventDefault(); envoyer(intentionInitiale); }}>
          <label>
            <span>Votre nom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" required />
          </label>
          <label>
            <span>Votre numéro de téléphone</span>
            <input value={tel} onChange={(e) => setTel(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="620 00 00 00" required />
          </label>
          <label>
            <span>Message pour la boutique (facultatif)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : livraison à Kipé, couleur préférée…" />
          </label>

          {erreur && <p className="erreur" role="alert">{erreur}</p>}

          {intentionInitiale === 'discuter' ? (
            <>
              <button type="submit" className="btn btn-wa btn-large" disabled={!!envoi}>
                <IcoWhatsApp /> {envoi === 'discuter' ? 'Envoi…' : 'Discuter du prix sur WhatsApp'}
              </button>
              <button type="button" className="btn btn-contour btn-large" disabled={!!envoi} onClick={() => envoyer('valider')}>
                {envoi === 'valider' ? 'Envoi…' : 'Valider directement au prix affiché'}
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="btn btn-wa btn-large" disabled={!!envoi}>
                <IcoWhatsApp /> {envoi === 'valider' ? 'Envoi…' : 'Valider ma commande'}
              </button>
              <button type="button" className="btn btn-contour btn-large" disabled={!!envoi} onClick={() => envoyer('discuter')}>
                {envoi === 'discuter' ? 'Envoi…' : 'Discuter du prix avant'}
              </button>
            </>
          )}
          <p className="petit">WhatsApp s'ouvre avec votre commande et son lien. Si la boutique vous accorde un prix, il s'affichera sur ce lien.</p>
        </form>
      </div>
    </div>
  );
}
