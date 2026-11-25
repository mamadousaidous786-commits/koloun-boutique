const base = (d, props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{d}</svg>
);

export const IcoPanier = (p) => base(<><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 7V6a3 3 0 0 1 6 0v1" /></>, p);
export const IcoCoeur = ({ plein, ...p }) => base(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={plein ? 'currentColor' : 'none'} />, p);
export const IcoRecherche = (p) => base(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>, p);
export const IcoAccueil = (p) => base(<><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>, p);
export const IcoGrille = (p) => base(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>, p);
export const IcoAvion = (p) => base(<><path d="M3 12 21 4l-6 17-3.5-7.5z" /><path d="m11.5 13.5 3-3" /></>, p);
export const IcoFermer = (p) => base(<path d="M6 6l12 12M18 6 6 18" />, p);
export const IcoPlus = (p) => base(<path d="M12 5v14M5 12h14" />, p);
export const IcoMoins = (p) => base(<path d="M5 12h14" />, p);
export const IcoPartager = (p) => base(<><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>, p);
export const IcoPosition = (p) => base(<><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>, p);
export const IcoTel = (p) => base(<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />, p);
export const IcoFleche = (p) => base(<path d="m9 6 6 6-6 6" />, p);
export const IcoRetour = (p) => base(<path d="m15 6-6 6 6 6" />, p);
export const IcoPoubelle = (p) => base(<><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></>, p);
export const IcoCompte = (p) => base(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></>, p);
export const IcoFiltre = (p) => base(<path d="M4 6h16M7 12h10M10 18h4" />, p);

export const IcoWhatsApp = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.2.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2l-.5-.3z" />
  </svg>
);

export const IcoBulle = (p) => base(<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" />, p);
export const IcoPhoto = (p) => base(<><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><circle cx="9" cy="10.5" r="1.8" /><path d="m20.5 16-5-5-8 7.5" /></>, p);
export const IcoEnvoyer = (p) => base(<path d="M4 12 20 4l-5 16-3-6.5z" />, p);
