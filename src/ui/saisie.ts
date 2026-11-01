// Comportements communs aux formulaires : envoi protégé, erreurs accessibles. Composants : formulaire.tsx.
import { useEffect, useRef, useState, type RefObject } from 'react';

/** Attributs qui lient un contrôle invalide à son message d'erreur, pour les lecteurs d'écran. */
export function ariaErreur(erreur: string | undefined, idMessage: string) {
  return { 'aria-invalid': !!erreur, 'aria-describedby': erreur ? idMessage : undefined };
}

/**
 * Envoi protégé : un second appui pendant l'enregistrement est ignoré, et un échec est signalé.
 * Une référence plutôt qu'un état : deux appuis rapprochés arrivent avant le prochain rendu.
 */
export function useEnvoi() {
  const enCours = useRef(false);
  const [echec, setEchec] = useState(false);
  const envoyer = async (enregistrer: () => Promise<void>) => {
    if (enCours.current) return;
    enCours.current = true;
    setEchec(false);
    try {
      await enregistrer();
    } catch {
      setEchec(true);
    } finally {
      enCours.current = false;
    }
  };
  return { envoyer, echec };
}

/** Après une saisie refusée, place le focus sur le premier contrôle invalide (ou le premier de son groupe). */
export function useFocusPremiereErreur(formulaire: RefObject<HTMLFormElement | null>, erreurs: object) {
  useEffect(() => {
    if (!Object.keys(erreurs).length) return;
    const invalide = formulaire.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const cible = invalide?.matches('input, select, textarea, button')
      ? invalide
      : invalide?.querySelector<HTMLElement>('input, select, textarea, button');
    cible?.focus();
  }, [formulaire, erreurs]);
}
