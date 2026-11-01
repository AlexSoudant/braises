// Format du fichier de sauvegarde : la seule copie des données hors de l'appareil (ADR 0002).
import {
  estDateJour,
  joursEntre,
  lireDateJour,
  TYPES_ECHANGE,
  versDateJour,
  type Ami,
  type DateJour,
  type Echange,
  type TypeEchange,
} from './model';

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

/** Au-delà de ce délai sans export, un rappel invite à sauvegarder. */
export const DELAI_RAPPEL_EXPORT = 30;

/** Jours écoulés depuis le dernier export, `null` s'il n'y en a jamais eu. */
export function joursSansExport(dernierExport: DateJour | null, aujourdhui: Date): number | null {
  return dernierExport === null ? null : Math.max(0, joursEntre(aujourdhui, lireDateJour(dernierExport)));
}

/** Les données ne sont que sur l'appareil : il faut les sauvegarder si elles existent et que l'export date. */
export function rappelerExport(
  nombreAmis: number,
  dernierExport: DateJour | null,
  aujourdhui: Date,
): boolean {
  const jours = joursSansExport(dernierExport, aujourdhui);
  return nombreAmis > 0 && (jours === null || jours > DELAI_RAPPEL_EXPORT);
}

export type LectureSauvegarde = { ok: true; sauvegarde: Sauvegarde } | { ok: false; erreur: string };

/**
 * Lit un fichier de sauvegarde et le valide entièrement avant toute écriture : le moindre défaut fait refuser
 * tout le fichier. Les champs inconnus sont ignorés.
 */
export function lireSauvegarde(texte: string): LectureSauvegarde {
  const PAS_BRAISES = 'Ce fichier n’est pas une sauvegarde Braises.';
  const refus = (erreur: string): LectureSauvegarde => ({ ok: false, erreur });
  let contenu: unknown;
  try {
    contenu = JSON.parse(texte);
  } catch {
    return refus(PAS_BRAISES);
  }
  // Les sauvegardes du prototype (clé `friends`) n'ont pas de champ `app` : elles tombent ici.
  if (!estObjet(contenu) || contenu.app !== 'braises') return refus(PAS_BRAISES);
  if (contenu.version !== 1)
    return refus('Cette sauvegarde vient d’une version de Braises non prise en charge.');
  if (!Array.isArray(contenu.amis) || !Array.isArray(contenu.echanges))
    return refus('Cette sauvegarde est incomplète.');

  const amis: Ami[] = [];
  for (const [i, brut] of contenu.amis.entries()) {
    const ami = lireAmi(brut);
    if (!ami || amis.some((a) => a.id === ami.id))
      return refus(`Cette sauvegarde est abîmée : l’Ami n° ${i + 1} est invalide.`);
    amis.push(ami);
  }
  const echanges: Echange[] = [];
  for (const [i, brut] of contenu.echanges.entries()) {
    const echange = lireEchange(brut);
    if (!echange || echanges.some((e) => e.id === echange.id))
      return refus(`Cette sauvegarde est abîmée : l’Échange n° ${i + 1} est invalide.`);
    echanges.push(echange);
  }
  const ids = new Set(amis.map((a) => a.id));
  if (echanges.some((e) => !ids.has(e.amiId)))
    return refus('Cette sauvegarde est abîmée : un Échange concerne un Ami absent du fichier.');

  const exporteLe = typeof contenu.exporteLe === 'string' ? contenu.exporteLe : '';
  return { ok: true, sauvegarde: { app: 'braises', version: 1, exporteLe, amis, echanges } };
}

function lireAmi(brut: unknown): Ami | null {
  if (!estObjet(brut) || !texteNonVide(brut.id) || !texteNonVide(brut.nom)) return null;
  if (typeof brut.rythme !== 'number' || !Number.isInteger(brut.rythme) || brut.rythme <= 0) return null;
  if (!facultatif(brut.notes) || !facultatif(brut.anniversaire)) return null;
  if (brut.anniversaire !== undefined && !anniversaireValide(brut.anniversaire)) return null;
  // Comme dans le formulaire : espaces superflus retirés, notes vides omises.
  const ami: Ami = { id: brut.id, nom: brut.nom.trim(), rythme: brut.rythme };
  if (brut.anniversaire) ami.anniversaire = brut.anniversaire;
  if (brut.notes?.trim()) ami.notes = brut.notes.trim();
  return ami;
}

// Une date future n'est pas refusée : l'appareil qui a exporté pouvait avoir une autre horloge ou un autre fuseau.
function lireEchange(brut: unknown): Echange | null {
  if (!estObjet(brut) || !texteNonVide(brut.id) || !texteNonVide(brut.amiId)) return null;
  if (typeof brut.date !== 'string' || !estDateJour(brut.date)) return null;
  if (typeof brut.type !== 'string' || !Object.hasOwn(TYPES_ECHANGE, brut.type)) return null;
  if (!facultatif(brut.note)) return null;
  const echange: Echange = {
    id: brut.id,
    amiId: brut.amiId,
    date: brut.date,
    type: brut.type as TypeEchange,
  };
  if (brut.note?.trim()) echange.note = brut.note.trim();
  return echange;
}

const estObjet = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const texteNonVide = (x: unknown): x is string => typeof x === 'string' && x.trim() !== '';
const facultatif = (x: unknown): x is string | undefined => x === undefined || typeof x === 'string';

// `--MM-JJ` (année inconnue) est vérifié sur une année bissextile, pour accepter le 29 février.
const anniversaireValide = (s: string) => estDateJour(s.startsWith('--') ? `2000${s.slice(1)}` : s);
