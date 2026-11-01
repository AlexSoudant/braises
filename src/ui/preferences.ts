// Préférences et repères de l'app dans localStorage : hors des données métier et de la sauvegarde.
// Toujours dans un try/catch : le stockage peut être plein, désactivé ou absent (navigation privée).
import { useSyncExternalStore } from 'react';
import { TRIS, type DateJour, type Tri } from '../domain/model';

const DERNIER_EXPORT = 'braises.dernierExport';

// Le rappel de sauvegarde et le menu affichent la même date : chacun est prévenu quand elle change,
// dans cet onglet comme dans un autre (événement « storage »).
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());
const surStockage = (e: StorageEvent) => {
  if (e.key === DERNIER_EXPORT || e.key === null) prevenir();
};

function sAbonner(f: () => void) {
  abonnes.add(f);
  if (abonnes.size === 1) window.addEventListener('storage', surStockage);
  return () => {
    abonnes.delete(f);
    if (abonnes.size === 0) window.removeEventListener('storage', surStockage);
  };
}

function lireDernierExport(): DateJour | null {
  try {
    const jour = localStorage.getItem(DERNIER_EXPORT);
    // Une valeur abîmée vaut « jamais » plutôt qu'une date illisible.
    return jour && /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : null;
  } catch {
    return null;
  }
}

/** Jour du dernier export réussi, `null` s'il n'y en a jamais eu. */
export function useDernierExport(): DateJour | null {
  return useSyncExternalStore(sAbonner, lireDernierExport);
}

export function retenirDernierExport(jour: DateJour): void {
  try {
    localStorage.setItem(DERNIER_EXPORT, jour);
    prevenir();
  } catch {
    // Sans stockage, l'app oublie seulement la date du dernier export.
  }
}

const INSTALLATION_MASQUEE = 'braises.installationMasquee';

export function lireInstallationMasquee(): boolean {
  try {
    return localStorage.getItem(INSTALLATION_MASQUEE) === 'oui';
  } catch {
    return false;
  }
}

export function retenirInstallationMasquee(): void {
  try {
    localStorage.setItem(INSTALLATION_MASQUEE, 'oui');
  } catch {
    // Sans stockage, le bandeau reviendra au prochain lancement.
  }
}

const TRI = 'braises.tri';

/** Le tri choisi dans le Registre ; « à relancer » par défaut ou si la valeur retenue est inconnue. */
export function lireTri(): Tri {
  try {
    const tri = localStorage.getItem(TRI);
    return TRIS.find((t) => t === tri) ?? 'aRelancer';
  } catch {
    return 'aRelancer';
  }
}

export function retenirTri(tri: Tri): void {
  try {
    localStorage.setItem(TRI, tri);
  } catch {
    // Sans stockage, le Registre reviendra au tri par défaut au prochain lancement.
  }
}
