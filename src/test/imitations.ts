// Imitations des fonctions du navigateur absentes de jsdom, retirées après chaque test.
import { onTestFinished } from 'vitest';

export function imiter(objet: object, nom: string, valeur: unknown) {
  Object.defineProperty(objet, nom, { configurable: true, writable: true, value: valeur });
  onTestFinished(() => {
    delete (objet as Record<string, unknown>)[nom];
  });
}

/** Partage natif disponible ; `refus` simule la feuille de partage fermée sans choisir. */
export function imiterPartage(refus?: Error) {
  const partages: File[] = [];
  imiter(navigator, 'canShare', (donnees?: ShareData) => !!donnees?.files?.length);
  imiter(navigator, 'share', async (donnees: ShareData) => {
    partages.push(...(donnees.files ?? []));
    if (refus) throw refus;
  });
  return partages;
}

/** Pas de partage : on récupère les fichiers téléchargés. */
export function intercepterTelechargements() {
  const fichiers = new Map<string, Blob>();
  imiter(URL, 'createObjectURL', (fichier: Blob) => {
    const url = `blob:braises/${fichiers.size}`;
    fichiers.set(url, fichier);
    return url;
  });
  imiter(URL, 'revokeObjectURL', () => {});
  const telechargements: { nom: string; fichier?: Blob }[] = [];
  // jsdom ne sait pas naviguer : on intercepte le clic sur le lien de téléchargement.
  const intercepter = (e: MouseEvent) => {
    const lien = e.target as HTMLAnchorElement;
    if (!lien.download) return;
    e.preventDefault();
    telechargements.push({ nom: lien.download, fichier: fichiers.get(lien.href) });
  };
  document.addEventListener('click', intercepter, true);
  onTestFinished(() => document.removeEventListener('click', intercepter, true));
  return telechargements;
}
