import { useCallback, useEffect, useState } from 'react';

// Charge des données et expose { donnees, chargement, erreur, recharger }
export default function useCharger(fn, deps = []) {
  const [etat, setEtat] = useState({ donnees: null, chargement: true, erreur: '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const charger = useCallback(fn, deps);

  const recharger = useCallback(() => {
    let actif = true;
    setEtat((e) => ({ ...e, chargement: true, erreur: '' }));
    charger()
      .then((donnees) => actif && setEtat({ donnees, chargement: false, erreur: '' }))
      .catch((e) => actif && setEtat({ donnees: null, chargement: false, erreur: e.message }));
    return () => { actif = false; };
  }, [charger]);

  useEffect(() => recharger(), [recharger]);
  return { ...etat, recharger };
}
