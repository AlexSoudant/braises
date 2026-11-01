// Préférences et repères de l'app dans localStorage : hors des données métier et de la sauvegarde.
// Toujours dans un try/catch : le stockage peut être plein, désactivé ou absent (navigation privée).
import type { DateJour } from '../domain/model';

const DERNIER_EXPORT = 'braises.dernierExport';

export function lireDernierExport(): DateJour | null {
  try {
    const jour = localStorage.getItem(DERNIER_EXPORT);
    // Une valeur abîmée vaut « jamais » plutôt qu'une date illisible.
    return jour && /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : null;
  } catch {
    return null;
  }
}

export function retenirDernierExport(jour: DateJour): void {
  try {
    localStorage.setItem(DERNIER_EXPORT, jour);
  } catch {
    // Sans stockage, l'app oublie seulement la date du dernier export.
  }
}
