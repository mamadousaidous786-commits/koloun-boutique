import { useState } from 'react';

// Photo avec chargement progressif ; si elle manque, un fond aux couleurs de la boutique
export default function Img({ src, alt, className = '', eager = false, ...rest }) {
  const [etat, setEtat] = useState(src ? 'charge' : 'erreur');
  if (!src || etat === 'erreur') {
    return (
      <div className={`img-vide ${className}`} role="img" aria-label={alt} {...rest}>
        <span>KL</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`img ${etat === 'pret' ? 'img-pret' : ''} ${className}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
      onLoad={() => setEtat('pret')}
      onError={() => setEtat('erreur')}
      {...rest}
    />
  );
}
