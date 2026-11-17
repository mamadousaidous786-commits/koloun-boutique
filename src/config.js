// Réglages de Koloun Boutique — tout ce qui change d'une installation à l'autre est ici.
const env = import.meta.env;

export const API = `${(env.VITE_API_URL || 'https://koloun-gestion-1.onrender.com').replace(/\/$/, '')}/api`;
export const DEMO = env.VITE_DEMO === '1';
export const ROUTEUR_HASH = env.VITE_HASH === '1';

// Numéro WhatsApp de la boutique (format international, sans + ni espaces)
export const WHATSAPP = '224627258497';

export const BOUTIQUE = {
  nom: 'Koloun Luxure',
  slogan: 'Qualité & Élégance',
  adresse: 'Lambanyi, Forage Dadis — Conakry',
  telephone: '+224 627 25 84 97',
  // Colle ici le lien Google Maps (ou renseigne VITE_MAPS_URL sur Vercel)
  mapsUrl: env.VITE_MAPS_URL || '',
};

// Adresse publique utilisée dans les liens envoyés sur WhatsApp
export function urlSite() {
  const base = (env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
  return ROUTEUR_HASH ? `${base}${window.location.pathname}#` : base;
}
