// Format du fichier de sauvegarde : la seule copie des données hors de l'appareil (ADR 0002).
import { versDateJour, type Ami, type Echange } from './model';

export interface Sauvegarde {
  app: 'braises';
  version: 1;
  /** Instant de l'export, ISO 8601. */
  exporteLe: string;
  amis: Ami[];
  echanges: Echange[];
}

export function construireSauvegarde(amis: Ami[], echanges: Echange[], maintenant: Date): Sauvegarde {
  return { app: 'braises', version: 1, exporteLe: maintenant.toISOString(), amis, echanges };
}

/** Nom du fichier daté du jour, pour distinguer les sauvegardes entre elles. */
export function nomFichierSauvegarde(aujourdhui: Date): string {
  return `braises-${versDateJour(aujourdhui)}.json`;
}
