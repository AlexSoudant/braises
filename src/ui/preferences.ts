// Préférences et repères de l'app dans localStorage : hors des données métier et de la sauvegarde.
// Toujours dans un try/catch : le stockage peut être plein, désactivé ou absent (navigation privée).
import { useSyncExternalStore } from 'react';
import type { DateJour } from '../domain/model';

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
