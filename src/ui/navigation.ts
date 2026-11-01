// Routage par le hash, sans bibliothèque : `#/` pour le Registre, `#/ami/<id>` pour une fiche.
import { useSyncExternalStore } from 'react';

export type Adresse = { page: 'registre' } | { page: 'ami'; id: string };

const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

function sAbonner(f: () => void) {
  abonnes.add(f);
  if (abonnes.size === 1) {
    window.addEventListener('popstate', prevenir);
    window.addEventListener('hashchange', prevenir);
  }
  return () => {
    abonnes.delete(f);
    if (abonnes.size === 0) {
      window.removeEventListener('popstate', prevenir);
      window.removeEventListener('hashchange', prevenir);
    }
  };
}

const lireHash = () => location.hash;

export function useAdresse(): Adresse {
  const hash = useSyncExternalStore(sAbonner, lireHash);
  const ami = /^#\/ami\/(.+)$/.exec(hash);
  return ami ? { page: 'ami', id: decoder(ami[1]) } : { page: 'registre' };
}

// Une adresse mal encodée est gardée telle quelle : aucun Ami ne la porte, la fiche renverra au Registre.
function decoder(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

/** Ouvre une fiche en ajoutant une entrée d'historique, pour que « retour » la referme. */
export function ouvrirFiche(id: string) {
  history.pushState({ ficheOuverteDansLApp: true }, '', `#/ami/${encodeURIComponent(id)}`);
  prevenir();
}

/**
 * Referme la fiche : revient en arrière si l'app l'a ouverte, sinon remplace l'adresse (lien direct, rechargement).
 * Sans effet si aucune fiche n'est ouverte, pour pouvoir l'appeler sur chaque fermeture du dialogue.
 */
export function fermerFiche() {
  if (!location.hash.startsWith('#/ami/')) return;
  if (history.state?.ficheOuverteDansLApp) history.back();
  else allerAuRegistre();
}

/** Affiche le Registre sans ajouter d'entrée d'historique. */
export function allerAuRegistre() {
  history.replaceState(null, '', '#/');
  prevenir();
}
