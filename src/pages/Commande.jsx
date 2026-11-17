import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Img from '../components/Img';
import { Erreur } from './Accueil';
import { IcoWhatsApp } from '../components/Icones';
import { STATUTS, gnf, lienCommande, lienWhatsApp, messageCommande, numeroInternational } from '../utils';

const ETAPES = ['Reçue', 'Confirmée', 'Livrée'];

function prixLigne(l) { return l.prix_negocie ?? l.prix_unitaire; }

// Panneau réservé aux utilisateurs de Koloun Gestion : réduire le prix, changer le statut
function PanneauVendeur({ commande, onMaj }) {
  const [prix, setPrix] = useState({});
  const [remise, setRemise] = useState(commande.remise || '');
  const [note, setNote] = useState(commande.note_vendeur || '');
  const [statut, setStatut] = useState(commande.statut);
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setPrix(Object.fromEntries(commande.lignes.map((l) => [l.id, l.prix_negocie ?? ''])));
    setRemise(commande.remise || '');
    setNote(commande.note_vendeur || '');
    setStatut(commande.statut);
  }, [commande]);

  const sousTotal = commande.lignes.reduce((s, l) => s + (prix[l.id] === '' || prix[l.id] == null ? l.prix_unitaire : Number(prix[l.id])) * l.quantite, 0);
  const apercu = Math.max(0, sousTotal - (Number(remise) || 0));

  const enregistrer = async () => {
    setEnvoi(true); setMsg(null);
    try {
      const maj = await api.modifierCommande(commande.id, {
        lignes: commande.lignes.map((l) => ({ id: l.id, prix_negocie: prix[l.id] })),
        remise: Number(remise) || 0,
        note_vendeur: note,
        statut,
      });
      onMaj(maj);
      setMsg({ ok: true, texte: 'Enregistré. Le client voit le nouveau prix sur son lien.' });
    } catch (e) {
      setMsg({ ok: false, texte: e.message });
    } finally { setEnvoi(false); }
  };

  const texteClient = `Bonjour ${commande.client_nom} 👋\nPour votre commande ${commande.reference}, la boutique vous propose : ${gnf(commande.total_final)}${commande.total_final < commande.total_initial ? ` (au lieu de ${gnf(commande.total_initial)})` : ''}.\n${commande.note_vendeur ? `${commande.note_vendeur}\n` : ''}Détails : ${lienCommande(commande.code)}`;

  return (
    <section className="panneau-vendeur" aria-labelledby="titre-vendeur">
      <h2 id="titre-vendeur">Espace vendeur</h2>
      <p className="petit">Visible seulement par les utilisateurs de Koloun Gestion. Le prix ne peut que baisser.</p>
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
        <label><span className="etiquette">Statut</span>
          <select value={statut} onChange={(e) => setStatut(e.target.value)}>
            {Object.entries(STATUTS).map(([v, s]) => <option key={v} value={v}>{s.libelle}</option>)}
          </select>
        </label>
      </div>
      <label><span className="etiquette">Message affiché au client (facultatif)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : prix spécial fidélité" /></label>
      <p className="pv-apercu">Nouveau total : <strong>{gnf(apercu)}</strong>{apercu < commande.total_initial && <s>{gnf(commande.total_initial)}</s>}</p>
      {statut === 'validee' && commande.lignes.some((l) => l.source === 'speciale') && !commande.commande_speciale_id && (
        <p className="petit">En confirmant, les paires spéciales seront ajoutées dans « Commandes spéciales » de Koloun Gestion.</p>
      )}
      {msg && <p className={msg.ok ? 'succes' : 'erreur'} role="status">{msg.texte}</p>}
      <div className="pv-actions">
        <button type="button" className="btn btn-or" onClick={enregistrer} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
        <a className="btn btn-wa" href={lienWhatsApp(texteClient, numeroInternational(commande.client_telephone))} target="_blank" rel="noreferrer"><IcoWhatsApp /> Envoyer le prix au client</a>
      </div>
    </section>
  );
}

export default function Commande() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const { vendeur } = useBoutique();
  const res = useCharger(() => (vendeur ? api.commandeAdminParCode(code).catch(() => api.voirCommande(code)) : api.voirCommande(code)), [code, vendeur?.token]);
  const [commande, setCommande] = useState(null);

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
  const sousTotal = c.lignes.reduce((s, l) => s + prixLigne(l) * l.quantite, 0);
  const reductionLignes = c.total_initial - sousTotal;
  const texteRelance = messageCommande({ reference: c.reference, code: c.code, client_nom: c.client_nom, total: c.total_final, lignes: c.lignes.map((l) => ({ ...l, prix: prixLigne(l) })) }, c.statut === 'en_discussion' ? 'discuter' : 'valider');

  return (
    <div className="page page-commande">
      {params.get('envoyee') && (
        <div className="bandeau-ok" role="status">
          <p><strong>Commande enregistrée.</strong> WhatsApp va s'ouvrir avec votre message.</p>
          <a className="btn btn-wa" href={lienWhatsApp(texteRelance)}><IcoWhatsApp /> Ouvrir WhatsApp</a>
        </div>
      )}

      <header className="tete-commande">
        <p className="petit">Commande du {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h1 className="titre-page">{c.reference}</h1>
        <span className={`statut statut-${c.statut}`}>{st.libelle}</span>
      </header>

      {c.statut !== 'annulee' && (
        <ol className="etapes" aria-label="Avancement">
          {ETAPES.map((e, i) => <li key={e} className={i < st.etape ? 'faite' : ''}>{e}</li>)}
        </ol>
      )}

      {c.note_vendeur && <p className="mot-boutique"><strong>Message de la boutique :</strong> {c.note_vendeur}</p>}

      <ul className="lignes lignes-commande">
        {c.lignes.map((l) => (
          <li key={l.id} className="ligne">
            <span className="ligne-img"><Img src={l.image} alt={l.nom} /></span>
            <div className="ligne-infos">
              <p className="ligne-nom">{l.nom}</p>
              <p className="petit">{l.taille ? `Taille ${l.taille} · ` : ''}Quantité {l.quantite}{l.source === 'speciale' ? ' · Commande spéciale' : ''}</p>
            </div>
            <p className="ligne-prix">
              {l.prix_negocie != null && <s>{gnf(l.prix_unitaire * l.quantite)}</s>}
              <span>{gnf(prixLigne(l) * l.quantite)}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="recap">
        <div className="recap-ligne"><span>Prix affiché</span><span>{gnf(c.total_initial)}</span></div>
        {reductionLignes > 0 && <div className="recap-ligne reduction"><span>Prix accordé sur les articles</span><span>− {gnf(reductionLignes)}</span></div>}
        {c.remise > 0 && <div className="recap-ligne reduction"><span>Réduction</span><span>− {gnf(c.remise)}</span></div>}
        <div className="recap-ligne recap-total"><span>Total à payer</span><strong>{gnf(c.total_final)}</strong></div>
        <a className="btn btn-wa btn-large" href={lienWhatsApp(`Bonjour Koloun Luxure 👋 Au sujet de ma commande ${c.reference} : ${lienCommande(c.code)}`)} target="_blank" rel="noreferrer"><IcoWhatsApp /> Écrire à la boutique</a>
      </div>

      {vendeur && c.id ? <PanneauVendeur commande={c} onMaj={setCommande} /> : (
        <p className="centre petit"><Link to="/catalogue">Continuer mes achats</Link></p>
      )}
    </div>
  );
}
