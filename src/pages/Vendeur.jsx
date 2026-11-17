import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Img from '../components/Img';
import { Erreur } from './Accueil';
import { STATUTS, gnf, lienWhatsApp, numeroInternational } from '../utils';
import { telephoneLisible } from './Compte';

// Réduit une photo avant l'envoi (plus rapide sur les connexions mobiles)
async function compresser(fichier, max = 1600) {
  try {
    const bitmap = await createImageBitmap(fichier);
    const echelle = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], fichier.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : fichier;
  } catch {
    return fichier; // format non lisible par le navigateur (ex. HEIC) : envoyé tel quel
  }
}

function Commandes() {
  const [filtre, setFiltre] = useState('');
  const res = useCharger(() => api.commandesAdmin(filtre), [filtre]);
  return (
    <>
      <div className="puces">
        {[['', 'Toutes'], ['nouvelle', 'Reçues'], ['en_discussion', 'Prix en discussion'], ['validee', 'Confirmées'], ['livree', 'Livrées'], ['annulee', 'Annulées']].map(([v, l]) => (
          <button type="button" key={v} className={filtre === v ? 'puce actif' : 'puce'} onClick={() => setFiltre(v)}>{l}</button>
        ))}
      </div>
      {res.chargement ? <p className="ligne-attente" /> : res.erreur ? <Erreur message={res.erreur} recharger={res.recharger} /> : res.donnees.length ? (
        <ul className="liste-commandes">
          {res.donnees.map((c) => (
            <li key={c.id}>
              <Link to={`/c/${c.code}`}>
                <Img src={c.image} alt="" />
                <span>
                  <strong>{c.client_nom} · {c.reference}</strong>
                  <small>{new Date(c.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {c.nb_lignes} article{c.nb_lignes > 1 ? 's' : ''} · {c.client_telephone}</small>
                  <span className={`statut statut-${c.statut}`}>{STATUTS[c.statut]?.libelle}</span>
                </span>
                <span className="montant">{gnf(c.total_final)}{c.total_final < c.total_initial && <s>{gnf(c.total_initial)}</s>}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="vide-texte">Aucune commande pour ce filtre.</p>}
    </>
  );
}

function CatalogueSpecial() {
  const res = useCharger(() => api.specialesAdmin(), []);
  const [form, setForm] = useState({ nom: '', prix: '', tailles: '39, 40, 41, 42, 43, 44', delai: '2 à 3 semaines', description: '' });
  const [photos, setPhotos] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState(null);

  const publier = async (e) => {
    e.preventDefault();
    if (!photos.length) return setMsg({ ok: false, texte: 'Ajoutez au moins une photo.' });
    setEnvoi(true); setMsg(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      for (const f of photos) fd.append('images', await compresser(f));
      await api.publierSpeciale(fd);
      setForm((f) => ({ ...f, nom: '', prix: '', description: '' }));
      setPhotos([]);
      setMsg({ ok: true, texte: "Paire publiée : elle est visible dans l'application." });
      res.recharger();
    } catch (err) {
      setMsg({ ok: false, texte: err.message });
    } finally { setEnvoi(false); }
  };

  const retirer = async (s) => {
    if (!window.confirm(`Retirer « ${s.nom} » de l'application ?`)) return;
    try { await api.retirerSpeciale(s.id); res.recharger(); } catch (err) { setMsg({ ok: false, texte: err.message }); }
  };

  const remettre = async (s) => {
    const fd = new FormData(); fd.append('actif', '1');
    try { await api.modifierSpeciale(s.id, fd); res.recharger(); } catch (err) { setMsg({ ok: false, texte: err.message }); }
  };

  return (
    <>
      <form className="formulaire carte-form" onSubmit={publier}>
        <h2>Publier une paire</h2>
        <label><span>Nom du modèle</span><input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required placeholder="Ex. : Jordan 4 Retro noire" /></label>
        <div className="deux">
          <label><span>Prix (GNF)</span><input type="number" inputMode="numeric" min="1" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required /></label>
          <label><span>Délai</span><input value={form.delai} onChange={(e) => setForm({ ...form, delai: e.target.value })} /></label>
        </div>
        <label><span>Pointures proposées (séparées par des virgules)</span><input value={form.tailles} onChange={(e) => setForm({ ...form, tailles: e.target.value })} /></label>
        <label><span>Description (facultatif)</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label className="champ-photos">
          <span>Photos ({photos.length})</span>
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos([...e.target.files].slice(0, 12))} />
        </label>
        {photos.length > 0 && <div className="apercus">{photos.map((f, i) => <img key={i} src={URL.createObjectURL(f)} alt="" />)}</div>}
        {msg && <p className={msg.ok ? 'succes' : 'erreur'} role="status">{msg.texte}</p>}
        <button type="submit" className="btn btn-sombre btn-large" disabled={envoi}>{envoi ? 'Publication…' : 'Publier la paire'}</button>
      </form>

      {res.chargement ? <p className="ligne-attente" /> : res.erreur ? <Erreur message={res.erreur} recharger={res.recharger} /> : (
        <ul className="liste-commandes">
          {res.donnees.map((s) => (
            <li key={s.id} className={s.actif ? '' : 'retire'}>
              <div className="lc-ligne">
                <Img src={s.images[0]} alt="" />
                <span><strong>{s.nom}</strong><small>{gnf(s.prix)} · {s.tailles.join(', ') || 'Pointures libres'}{s.actif ? '' : ' · retirée'}</small></span>
                {s.actif ? <button type="button" className="btn btn-contour petit-btn" onClick={() => retirer(s)}>Retirer</button>
                  : <button type="button" className="btn btn-contour petit-btn" onClick={() => remettre(s)}>Remettre</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Articles() {
  const res = useCharger(() => api.produitsAdmin(), []);
  const [msg, setMsg] = useState('');
  const regler = async (p, corps) => {
    try { await api.reglerProduit(p.id, corps); setMsg(`« ${p.nom} » mis à jour.`); res.recharger(); } catch (e) { setMsg(e.message); }
  };
  const categories = [...new Set((res.donnees || []).map((p) => p.categorie).filter(Boolean))];

  return (
    <>
      <p className="petit">Les articles viennent de Koloun Gestion. Ici, vous choisissez leur catégorie dans l'application, ou vous les masquez.</p>
      {msg && <p className="succes" role="status">{msg}</p>}
      {res.chargement ? <p className="ligne-attente" /> : res.erreur ? <Erreur message={res.erreur} recharger={res.recharger} /> : (
        <ul className="liste-commandes">
          <datalist id="cats">{['Chaussures', 'Vêtements', 'Sacs', 'Accessoires', ...categories].filter((v, i, a) => a.indexOf(v) === i).map((c) => <option key={c} value={c} />)}</datalist>
          {res.donnees.map((p) => (
            <li key={p.id} className={p.visible ? '' : 'retire'}>
              <div className="lc-ligne">
                <Img src={p.image} alt="" />
                <span><strong>{p.nom}</strong><small>{gnf(p.prix)}</small></span>
                <input className="champ-cat" list="cats" defaultValue={p.categorie || ''} placeholder="Catégorie" aria-label={`Catégorie de ${p.nom}`} onBlur={(e) => e.target.value !== (p.categorie || '') && regler(p, { categorie: e.target.value })} />
                <label className="case"><input type="checkbox" checked={p.visible} onChange={(e) => regler(p, { visible: e.target.checked })} /> Visible</label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Clients inscrits sur l'application (réservé à l'administrateur)
function ClientsInscrits() {
  const res = useCharger(() => api.clientsInscrits(), []);
  const [q, setQ] = useState('');
  const [ouvert, setOuvert] = useState(null);
  const [commandes, setCommandes] = useState({});
  const [provisoire, setProvisoire] = useState(null);
  const [msg, setMsg] = useState('');

  const liste = (res.donnees || []).filter((c) => {
    const r = q.trim().toLowerCase();
    return !r || `${c.nom} ${c.telephone || ''} ${c.email || ''}`.toLowerCase().includes(r.replace(/\s/g, '')) || c.nom.toLowerCase().includes(r);
  });

  const voirCommandes = async (c) => {
    if (ouvert === c.id) return setOuvert(null);
    setOuvert(c.id);
    if (!commandes[c.id]) {
      try { const l = await api.commandesDuClient(c.id); setCommandes((x) => ({ ...x, [c.id]: l })); } catch (e) { setMsg(e.message); }
    }
  };

  const reinitialiser = async (c) => {
    if (!window.confirm(`Créer un mot de passe provisoire pour ${c.nom} ?`)) return;
    try { const r = await api.reinitialiserClient(c.id); setProvisoire({ client: c, mdp: r.mot_de_passe }); } catch (e) { setMsg(e.message); }
  };

  const basculer = async (c) => {
    try { await api.reglerClient(c.id, { actif: !c.actif }); res.recharger(); } catch (e) { setMsg(e.message); }
  };

  const total = res.donnees?.length || 0;
  const actifsMois = (res.donnees || []).filter((c) => c.derniere_connexion && Date.now() - new Date(c.derniere_connexion).getTime() < 30 * 864e5).length;

  return (
    <>
      <div className="chiffres-clients">
        <div><strong>{total}</strong><span>clients inscrits</span></div>
        <div><strong>{actifsMois}</strong><span>connectés ce mois</span></div>
        <div><strong>{(res.donnees || []).filter((c) => c.nb_commandes > 0).length}</strong><span>ont déjà commandé</span></div>
      </div>
      <div className="barre-recherche">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un nom, un numéro, un email" aria-label="Chercher un client" type="search" />
      </div>
      {msg && <p className="erreur" role="alert">{msg}</p>}
      {provisoire && (
        <div className="bandeau-ok" role="status">
          <p>Mot de passe provisoire de <strong>{provisoire.client.nom}</strong> : <strong className="mdp-provisoire">{provisoire.mdp}</strong></p>
          {provisoire.client.telephone && (
            <a className="btn btn-wa" href={lienWhatsApp(`Bonjour ${provisoire.client.nom}, voici votre nouveau mot de passe pour l'application Koloun Luxure : ${provisoire.mdp}\nVous pourrez le changer dans « Mon compte ».`, numeroInternational(provisoire.client.telephone))} target="_blank" rel="noreferrer">Envoyer par WhatsApp</a>
          )}
          <button type="button" className="lien-discret" onClick={() => setProvisoire(null)}>Fermer</button>
        </div>
      )}
      {res.chargement ? <p className="ligne-attente" /> : res.erreur ? <Erreur message={res.erreur} recharger={res.recharger} /> : liste.length ? (
        <ul className="liste-clients">
          {liste.map((c) => (
            <li key={c.id} className={c.actif ? '' : 'retire'}>
              <div className="lc-client">
                <span className="avatar petit-avatar">{c.photo ? <img src={c.photo} alt="" referrerPolicy="no-referrer" /> : c.nom.slice(0, 1).toUpperCase()}</span>
                <span className="lc-client-texte">
                  <strong>{c.nom}{c.google && <em className="badge-google">Google</em>}{!c.actif && <em className="badge-off">désactivé</em>}</strong>
                  <small>{[c.telephone && telephoneLisible(c.telephone), c.email].filter(Boolean).join(' · ')}</small>
                  <small>Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')} · {c.nb_commandes} commande{c.nb_commandes > 1 ? 's' : ''}{c.total_confirme ? ` · ${gnf(c.total_confirme)} confirmés` : ''}</small>
                </span>
              </div>
              <div className="lc-actions">
                {c.telephone && <a className="btn btn-wa petit-btn" href={lienWhatsApp(`Bonjour ${c.nom} 👋`, numeroInternational(c.telephone))} target="_blank" rel="noreferrer">WhatsApp</a>}
                <button type="button" className="btn btn-contour petit-btn" onClick={() => voirCommandes(c)} aria-expanded={ouvert === c.id}>Commandes</button>
                {c.avec_mdp && <button type="button" className="btn btn-contour petit-btn" onClick={() => reinitialiser(c)}>Mot de passe</button>}
                <button type="button" className="btn btn-contour petit-btn" onClick={() => basculer(c)}>{c.actif ? 'Désactiver' : 'Réactiver'}</button>
              </div>
              {ouvert === c.id && (
                <ul className="lc-commandes">
                  {!commandes[c.id] ? <li className="petit">Chargement…</li> : commandes[c.id].length ? commandes[c.id].map((x) => (
                    <li key={x.code}><Link to={`/c/${x.code}`}>{x.reference}</Link><span>{new Date(x.created_at).toLocaleDateString('fr-FR')}</span><span className={`statut statut-${x.statut}`}>{STATUTS[x.statut]?.libelle}</span><strong>{gnf(x.total_final)}</strong></li>
                  )) : <li className="petit">Aucune commande pour le moment.</li>}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="vide-texte">{total ? 'Aucun client ne correspond à la recherche.' : "Aucun client inscrit pour le moment. Partagez le lien de l'application !"}</p>}
    </>
  );
}

export default function Vendeur() {
  const { vendeur, setVendeur } = useBoutique();
  const [onglet, setOnglet] = useState('commandes');
  if (!vendeur) return <Navigate to="/compte" replace />;
  const admin = vendeur.utilisateur?.role === 'admin';
  const onglets = [['commandes', 'Commandes'], ['speciale', 'Spéciales'], ['articles', 'Articles'], ...(admin ? [['clients', 'Clients']] : [])];

  return (
    <div className="page page-vendeur">
      <div className="tete-vendeur">
        <h1 className="titre-page">Espace vendeur</h1>
        <p className="petit">Connecté : {vendeur.utilisateur?.prenom} {vendeur.utilisateur?.nom} · <button type="button" className="lien-discret" onClick={() => setVendeur(null)}>Se déconnecter</button></p>
      </div>
      <div className="onglets" role="tablist">
        {onglets.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={onglet === v} className={onglet === v ? 'actif' : ''} onClick={() => setOnglet(v)}>{l}</button>
        ))}
      </div>
      {onglet === 'commandes' && <Commandes />}
      {onglet === 'speciale' && <CatalogueSpecial />}
      {onglet === 'articles' && <Articles />}
      {onglet === 'clients' && admin && <ClientsInscrits />}
    </div>
  );
}
