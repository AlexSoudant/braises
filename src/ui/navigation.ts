// Routage par le hash, sans bibliothèque : `#/` pour le Registre, `#/ami/<id>` pour une fiche,
// `#/ami/nouveau` pour la création d'un Ami, `#/menu` pour le menu.
import { useSyncExternalStore } from 'react';

export type Adresse =
  { page: 'registre' } | { page: 'ami'; id: string } | { page: 'nouvelAmi' } | { page: 'menu' };

const NOUVEAU = 'nouveau';
const MENU = '#/menu';

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
  if (hash === MENU) return { page: 'menu' };
  const ami = /^#\/ami\/(.+)$/.exec(hash);
  if (!ami) return { page: 'registre' };
  return ami[1] === NOUVEAU ? { page: 'nouvelAmi' } : { page: 'ami', id: decoder(ami[1]) };
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
  history.pushState({ panneauOuvertDansLApp: true }, '', `#/ami/${encodeURIComponent(id)}`);
  prevenir();
}

/** Ouvre le formulaire de création d'un Ami, comme une fiche. */
export function ouvrirCreation() {
  history.pushState({ panneauOuvertDansLApp: true }, '', `#/ami/${NOUVEAU}`);
  prevenir();
}

/** Ouvre le menu comme une fiche : « retour » le referme. */
export function ouvrirMenu() {
  history.pushState({ panneauOuvertDansLApp: true }, '', MENU);
  prevenir();
}

/** Remplace la fiche affichée par celle d'un autre Ami (après une création), sans nouvelle entrée d'historique. */
export function remplacerParFiche(id: string) {
  history.replaceState(history.state, '', `#/ami/${encodeURIComponent(id)}`);
  prevenir();
}

/**
 * Referme la fiche ou le menu : revient en arrière si l'app l'a ouvert, sinon remplace l'adresse (lien direct,
 * rechargement). Sans effet si aucun panneau n'est ouvert, pour pouvoir l'appeler sur chaque fermeture du dialogue.
 */
export function fermerPanneau() {
  if (!location.hash.startsWith('#/ami/') && location.hash !== MENU) return;
  if (history.state?.panneauOuvertDansLApp) history.back();
  else allerAuRegistre();
}

/** Affiche le Registre sans ajouter d'entrée d'historique. */
export function allerAuRegistre() {
  history.replaceState(null, '', '#/');
  prevenir();
}
