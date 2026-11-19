import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Img from '../components/Img';
import { Erreur } from './Accueil';
import { IcoWhatsApp } from '../components/Icones';
import { STATUTS, gnf, libelleStatut, lienCommande, lienWhatsApp, messageDiscuter, numeroInternational } from '../utils';

const prixLigne = (l) => l.prix_negocie ?? l.prix_unitaire;

// Panneau réservé aux utilisateurs de Koloun Gestion : réduire le prix, accepter ou refuser
function PanneauVendeur({ commande, onMaj }) {
  const [prix, setPrix] = useState({});
  const [remise, setRemise] = useState(commande.remise || '');
  const [note, setNote] = useState(commande.note_vendeur || '');
  const [frais, setFrais] = useState('');
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState(null);
  const enAttente = ['nouvelle', 'en_discussion'].includes(commande.statut);

  useEffect(() => {
    setPrix(Object.fromEntries(commande.lignes.map((l) => [l.id, l.prix_negocie ?? ''])));
    setRemise(commande.remise || '');
    setNote(commande.note_vendeur || '');
  }, [commande]);

  const sousTotal = commande.lignes.reduce((s, l) => s + (prix[l.id] === '' || prix[l.id] == null ? l.prix_unitaire : Number(prix[l.id])) * l.quantite, 0);
  const apercu = Math.max(0, sousTotal - (Number(remise) || 0));

  const action = async (fn, succes) => {
    setEnvoi(true); setMsg(null);
    try { onMaj(await fn()); setMsg({ ok: true, texte: succes }); } catch (e) { setMsg({ ok: false, texte: e.message }); } finally { setEnvoi(false); }
  };
  const enregistrerPrix = () => action(() => api.modifierCommande(commande.id, {
    lignes: commande.lignes.map((l) => ({ id: l.id, prix_negocie: prix[l.id] })), remise: Number(remise) || 0, note_vendeur: note,
  }), 'Prix enregistré : le client le voit sur sa commande.');
  const accepter = async () => {
    await action(async () => {
      await api.modifierCommande(commande.id, { lignes: commande.lignes.map((l) => ({ id: l.id, prix_negocie: prix[l.id] })), remise: Number(remise) || 0, note_vendeur: note });
      return api.accepterCommande(commande.id, { frais_livraison: Number(frais) || 0 });
    }, 'Commande acceptée : elle est dans les livraisons du jour de Koloun Gestion.');
  };
  const refuser = () => {
    if (!motif.trim()) return setMsg({ ok: false, texte: 'Indiquez le motif du refus : le client le verra.' });
    return action(() => api.refuserCommande(commande.id, motif.trim()), 'Commande refusée.');
  };

  return (
    <section className="panneau-vendeur" aria-labelledby="titre-vendeur">
      <h2 id="titre-vendeur">Espace vendeur</h2>
      {!enAttente && <p className="petit">Cette commande est {libelleStatut(commande.statut, commande.mode_livraison).toLowerCase()}. Son suivi se fait dans Koloun Gestion → Livraisons{commande.livraison_numero ? ` (${commande.livraison_numero})` : ''}.</p>}
      {enAttente && (
        <>
          <p className="petit">Le prix ne peut que baisser. Accepter crée la livraison dans Koloun Gestion.</p>
          <div className="pv-lignes">
            {commande.lignes.map((l) => (
              <label key={l.id} className="pv-ligne">
                <span>{l.nom}{l.taille ? ` · T.${l.taille}` : ''} × {l.quantite}<small>Prix affiché : {gnf(l.prix_unitaire)}</small></span>
                <input type="number" inputMode="numeric" min="0" max={l.prix_unitaire} step="5000" placeholder={String(l.prix_unitaire)} value={prix[l.id] ?? ''} onChange={(e) => setPrix((p) => ({ ...p, [l.id]: e.target.value }))} aria-label={`Nouveau prix unitaire pour ${l.nom}`} />
              </label>
            ))}
          </div>
          <div className="pv-grille">
            <label><span className="etiquette">Réduction sur le total (GNF)</span><input type="number" inputMode="numeric" min="0" step="5000" value={remise} onChange={(e) => setRemise(e.target.value)} placeholder="0" /></label>
            {commande.mode_livraison !== 'retrait' && <label><span className="etiquette">Frais de livraison (GNF)</span><input type="number" inputMode="numeric" min="0" step="5000" value={frais} onChange={(e) => setFrais(e.target.value)} placeholder="0" /></label>}
          </div>
          <label><span className="etiquette">Message affiché au client (facultatif)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : prix spécial fidélité" /></label>
          <p className="pv-apercu">Articles : <strong>{gnf(apercu)}</strong>{apercu < commande.total_initial && <s>{gnf(commande.total_initial)}</s>}</p>
          <div className="pv-actions">
            <button type="button" className="btn btn-contour-clair" onClick={enregistrerPrix} disabled={envoi}>Enregistrer le prix</button>
            <button type="button" className="btn btn-or" onClick={accepter} disabled={envoi}>{envoi ? 'Patientez…' : 'Accepter la commande'}</button>
          </div>
          <div className="pv-refus">
            <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif du refus (ex. : taille plus disponible)" aria-label="Motif du refus" />
            <button type="button" className="btn btn-contour-clair" onClick={refuser} disabled={envoi}>Refuser</button>
          </div>
        </>
      )}
      {msg && <p className={msg.ok ? 'succes' : 'erreur'} role="status">{msg.texte}</p>}
      <a className="btn btn-wa" href={lienWhatsApp(`Bonjour ${commande.client_nom} 👋 Au sujet de votre commande ${commande.reference} : ${lienCommande(commande.code)}`, numeroInternational(commande.client_telephone))} target="_blank" rel="noreferrer"><IcoWhatsApp /> Écrire au client</a>
    </section>
  );
}

export default function Commande() {
  const { code } = useParams();
  const { vendeur, compte, notifier } = useBoutique();
  const res = useCharger(() => (vendeur ? api.commandeAdminParCode(code).catch(() => api.voirCommande(code)) : api.voirCommande(code)), [code, vendeur?.token]);
  const [commande, setCommande] = useState(null);
  const [annulation, setAnnulation] = useState(false);

  useEffect(() => { if (res.donnees) setCommande(res.donnees); }, [res.donnees]);
  useEffect(() => {
    const f = () => !document.hidden && res.recharger();
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [res.recharger]); // eslint-disable-line react-hooks/exhaustive-deps

  if (res.chargement && !commande) return <div className="page"><p className="ligne-attente" /><p className="ligne-attente courte" /></div>;
  if (res.erreur && !commande) return <div className="page"><Erreur message={res.erreur} recharger={res.recharger} /></div>;
  if (!commande) return null;

  const c = commande;
  const st = STATUTS[c.statut] || STATUTS.nouvelle;
  const enAttente = st.onglet === 'attente';
  const retrait = c.mode_livraison === 'retrait';
  const etapes = ['En attente', retrait ? 'Prête à retirer' : 'Expédiée', retrait ? 'Retirée' : 'Livrée'];
  const sousTotal = c.lignes.reduce((s, l) => s + prixLigne(l) * l.quantite, 0);
  const reductionLignes = c.total_initial - sousTotal;

  const annuler = async () => {
    if (!window.confirm('Annuler cette commande ?')) return;
    setAnnulation(true);
    try { setCommande({ ...c, ...(await api.annulerCommande(c.code)) }); notifier('Commande annulée'); } catch (e) { notifier(e.message); } finally { setAnnulation(false); }
  };

  return (
    <div className="page page-commande">
      <header className="tete-commande">
        <p className="petit">Commande du {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h1 className="titre-page">{c.reference}</h1>
        <span className={`statut statut-${c.statut}`}>{libelleStatut(c.statut, c.mode_livraison)}</span>
      </header>

      {c.statut === 'annulee' ? (
        <p className="mot-boutique mot-annule"><strong>Commande annulée</strong>{c.motif ? ` — ${c.motif}` : ''}</p>
      ) : (
        <ol className="etapes" aria-label="Avancement">
          {etapes.map((e, i) => <li key={e} className={i < st.etape ? 'faite' : ''}>{e}</li>)}
        </ol>
      )}

      <div className="bloc-reception">
        <p><strong>{retrait ? '🏬 Retrait en boutique' : '🛵 Livraison'}</strong>{retrait ? ' — Lambanyi, Forage Dadis' : c.adresse ? ` — ${c.adresse}` : ''}</p>
        {enAttente && <p className="petit">La boutique va confirmer votre commande{retrait ? '' : ' et les frais de livraison'}.</p>}
        {c.statut === 'validee' && <p className="petit">{retrait ? 'Votre commande vous attend à la boutique.' : `Votre commande est en route${c.livreur ? ` avec ${c.livreur}` : ''}.`}</p>}
      </div>

      {c.note_vendeur && <p className="mot-boutique"><strong>Message de la boutique :</strong> {c.note_vendeur}</p>}

      <ul className="lignes lignes-commande">
        {c.lignes.map((l) => (
          <li key={l.id} className="ligne">
            <span className="ligne-img"><Img src={l.image} alt={l.nom} /></span>
            <div className="ligne-infos">
              <p className="ligne-nom">{l.nom}</p>
              <p className="petit">{l.taille ? `Taille ${l.taille} · ` : ''}Quantité {l.quantite}</p>
            </div>
            <p className="ligne-prix">
              {l.prix_negocie != null && <s>{gnf(l.prix_unitaire * l.quantite)}</s>}
              <span>{gnf(prixLigne(l) * l.quantite)}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="recap">
        <div className="recap-ligne"><span>Articles</span><span>{gnf(c.total_initial)}</span></div>
        {reductionLignes > 0 && <div className="recap-ligne reduction"><span>Prix accordé sur les articles</span><span>− {gnf(reductionLignes)}</span></div>}
        {c.remise > 0 && <div className="recap-ligne reduction"><span>Réduction</span><span>− {gnf(c.remise)}</span></div>}
        {!retrait && <div className="recap-ligne"><span>Frais de livraison</span><span>{enAttente ? 'à confirmer' : gnf(c.frais_livraison)}</span></div>}
        <div className="recap-ligne recap-total"><span>{c.statut === 'livree' ? 'Total payé' : 'Total à payer'}</span><strong>{gnf(c.a_payer ?? c.total_final)}</strong></div>
        <a className="btn btn-contour btn-large" href={lienWhatsApp(messageDiscuter(c))} target="_blank" rel="noreferrer"><IcoWhatsApp /> Discuter</a>
        {enAttente && compte && !vendeur && (
          <button type="button" className="btn btn-contour btn-large btn-annuler" onClick={annuler} disabled={annulation}>{annulation ? 'Annulation…' : 'Annuler la commande'}</button>
        )}
      </div>

      {vendeur && c.id ? <PanneauVendeur commande={c} onMaj={setCommande} /> : (
        <p className="centre petit"><Link to="/compte">Mes commandes</Link> · <Link to="/catalogue">Continuer mes achats</Link></p>
      )}
    </div>
  );
}
