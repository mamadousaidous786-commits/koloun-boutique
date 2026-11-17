import { useEffect, useRef, useState } from 'react';
import Img from './Img';

// Présentoir 3D : l'article s'incline sous le doigt / la souris avec un reflet,
// et un glissement le fait pivoter vers le modèle suivant.
export default function Vue3D({ images, index, onChange, alt }) {
  const zone = useRef(null);
  const glisse = useRef(null);
  const [incl, setIncl] = useState({ x: 0, y: 0, gx: 50, gy: 30 });
  const [sens, setSens] = useState(1); // sens de la bascule entre modèles
  const [glisseX, setGlisseX] = useState(0);
  const reduit = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { setGlisseX(0); }, [index]);

  const bouger = (e) => {
    const r = zone.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (glisse.current) {
      const dx = e.clientX - glisse.current.x;
      glisse.current.dx = dx;
      setGlisseX(Math.max(-60, Math.min(60, dx / 3)));
      return;
    }
    if (reduit || e.pointerType === 'touch') return;
    setIncl({ x: (0.5 - py) * 14, y: (px - 0.5) * 18, gx: px * 100, gy: py * 100 });
  };

  const changer = (sens) => {
    if (images.length < 2) return;
    setSens(sens);
    onChange((index + sens + images.length) % images.length);
  };

  const lacher = () => {
    const dx = glisse.current?.dx || 0;
    glisse.current = null;
    setGlisseX(0);
    if (Math.abs(dx) > 50) changer(dx < 0 ? 1 : -1);
  };

  return (
    <div className="vue3d">
      <div
        ref={zone}
        className="vue3d-zone"
        onPointerMove={bouger}
        onPointerDown={(e) => { glisse.current = { x: e.clientX, dx: 0 }; }}
        onPointerUp={lacher}
        onPointerCancel={lacher}
        onPointerLeave={() => { if (glisse.current) lacher(); setIncl({ x: 0, y: 0, gx: 50, gy: 30 }); }}
      >
        <div
          className="vue3d-carte"
          style={{
            transform: `rotateX(${incl.x}deg) rotateY(${incl.y + glisseX}deg)`,
            '--gx': `${incl.gx}%`,
            '--gy': `${incl.gy}%`,
          }}
        >
          <div className="vue3d-pivot" key={index} data-sens={sens > 0 ? 'avant' : 'arriere'}>
            <Img src={images[index]} alt={alt} eager />
          </div>
          <span className="vue3d-reflet" aria-hidden="true" />
        </div>
        <div className="vue3d-ombre" aria-hidden="true" style={{ transform: `translateX(${incl.y * -1.2}px) scaleX(${1 - Math.abs(glisseX) / 300})` }} />
      </div>

      {images.length > 1 && (
        <div className="vue3d-vignettes" role="tablist" aria-label="Modèles">
          {images.map((src, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} className={i === index ? 'actif' : ''} onClick={() => { if (i !== index) { setSens(i > index ? 1 : -1); onChange(i); } }} aria-label={`Modèle ${i + 1}`}>
              <Img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
      {images.length > 1 && <p className="vue3d-aide">Glissez l'article pour voir les autres modèles</p>}
    </div>
  );
}
