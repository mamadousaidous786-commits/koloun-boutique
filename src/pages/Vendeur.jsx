import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import useCharger from '../useCharger';
import { useBoutique } from '../store';
import Img from '../components/Img';
import { Erreur } from './Accueil';
import { STATUTS, gnf } from '../utils';

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

function Connexion() {
  const { setVendeur } = useBoutique();
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const valider = async (e) => {
    e.preventDefault();
    setEnvoi(true); setErreur('');
    try {
      const r = await api.connexion(email.trim(), mdp);
      setVendeur({ token: r.token, utilisateur: r.utilisateur });
    } catch (err) {
      setErreur(err.message);
    } finally { setEnvoi(false); }
  };

  return (
    <div className="page connexion">
      <h1 className="titre-page">Espace vendeur</h1>
      <p>Connectez-vous avec votre compte Koloun Gestion pour voir les commandes, accorder des prix et publier des paires en commande spéciale.</p>
      <form className="formulaire" onSubmit={valider}>
        <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label><span>Mot de passe</span><input type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} autoComplete="current-password" required /></label>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-sombre btn-large" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </div>
  );
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

export default function Vendeur() {
  const { vendeur, setVendeur } = useBoutique();
  const [onglet, setOnglet] = useState('commandes');
  if (!vendeur) return <Connexion />;

  return (
    <div className="page page-vendeur">
      <div className="tete-vendeur">
        <h1 className="titre-page">Espace vendeur</h1>
        <p className="petit">Connecté : {vendeur.utilisateur?.prenom} {vendeur.utilisateur?.nom} · <button type="button" className="lien-discret" onClick={() => setVendeur(null)}>Se déconnecter</button></p>
      </div>
      <div className="onglets" role="tablist">
        {[['commandes', 'Commandes'], ['speciale', 'Spéciales'], ['articles', 'Articles']].map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={onglet === v} className={onglet === v ? 'actif' : ''} onClick={() => setOnglet(v)}>{l}</button>
        ))}
      </div>
      {onglet === 'commandes' && <Commandes />}
      {onglet === 'speciale' && <CatalogueSpecial />}
      {onglet === 'articles' && <Articles />}
    </div>
  );
}
