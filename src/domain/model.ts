// Logique pure de Braises : dates, Chaleur, anniversaires, tri. Aucun accès au DOM ni à la base.

export const TYPES_ECHANGE = {
  tel: 'Téléphone',
  msg: 'Message',
  bar: 'Bar',
  resto: 'Restaurant',
  anniv: 'Anniversaire',
  spont: 'Spontané',
} as const;

export type TypeEchange = keyof typeof TYPES_ECHANGE;

/** Date au jour, sans heure : `AAAA-MM-JJ`. */
export type DateJour = string;

/** Date d'anniversaire : `AAAA-MM-JJ`, ou `--MM-JJ` quand l'année de naissance est inconnue. */
export type Anniversaire = string;

export interface Ami {
  id: string;
  nom: string;
  anniversaire?: Anniversaire;
  /** Intervalle souhaité entre deux Échanges, en jours. */
  rythme: number;
  notes?: string;
}

export interface Echange {
  id: string;
  amiId: string;
  date: DateJour;
  type: TypeEchange;
  note?: string;
}

/** Un Ami accompagné de son Échange le plus récent. */
export interface AmiSuivi {
  ami: Ami;
  dernier: Echange | null;
}

export const NIVEAUX_CHALEUR = ['Brûlant', 'Chaud', 'Tiède', 'Refroidi', 'Glacé'] as const;
export type Chaleur = 0 | 1 | 2 | 3 | 4;

export const RYTHMES: [number, string][] = [
  [7, 'Chaque semaine'],
  [14, 'Toutes les 2 sem.'],
  [30, 'Chaque mois'],
  [60, 'Tous les 2 mois'],
  [90, 'Chaque trimestre'],
  [180, 'Deux fois par an'],
];

const JOUR = 86_400_000;

export function debutDuJour(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function versDateJour(d: Date): DateJour {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function lireDateJour(s: DateJour): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function joursEntre(apres: Date, avant: Date): number {
  return Math.round((debutDuJour(apres).getTime() - debutDuJour(avant).getTime()) / JOUR);
}

/** Associe à chaque Ami son Échange le plus récent. */
export function suivre(amis: Ami[], echanges: Echange[]): AmiSuivi[] {
  const derniers = new Map<string, Echange>();
  for (const e of echanges) {
    const d = derniers.get(e.amiId);
    if (!d || e.date > d.date) derniers.set(e.amiId, e);
  }
  return amis.map((ami) => ({ ami, dernier: derniers.get(ami.id) ?? null }));
}

export function joursDepuis({ dernier }: AmiSuivi, aujourdhui: Date): number | null {
  return dernier ? joursEntre(aujourdhui, lireDateJour(dernier.date)) : null;
}

// Rapport entre le temps écoulé et le Rythme : 1 = pile à l'heure.
export function retard(suivi: AmiSuivi, aujourdhui: Date): number {
  const j = joursDepuis(suivi, aujourdhui);
  return j === null ? Infinity : j / suivi.ami.rythme;
}

export function chaleurPour(jours: number | null, rythme: number): Chaleur {
  if (jours === null) return 4;
  const r = jours / rythme;
  if (r < 0.5) return 0;
  if (r < 1) return 1;
  if (r < 1.5) return 2;
  if (r < 2.5) return 3;
  return 4;
}

export function chaleur(suivi: AmiSuivi, aujourdhui: Date): Chaleur {
  return chaleurPour(joursDepuis(suivi, aujourdhui), suivi.ami.rythme);
}

export interface ProchainAnniversaire {
  date: Date;
  jours: number;
  /** `null` quand l'année de naissance est inconnue. */
  age: number | null;
}

export function prochainAnniversaire(ami: Ami, aujourdhui: Date): ProchainAnniversaire | null {
  if (!ami.anniversaire) return null;
  const { annee, mois, jour } = lireAnniversaire(ami.anniversaire);
  const t = debutDuJour(aujourdhui);
  let date = anniversaireEn(t.getFullYear(), mois, jour);
  if (date < t) date = anniversaireEn(t.getFullYear() + 1, mois, jour);
  return { date, jours: joursEntre(date, t), age: annee === null ? null : date.getFullYear() - annee };
}

/** Mois de 1 à 12. */
function lireAnniversaire(a: Anniversaire): { annee: number | null; mois: number; jour: number } {
  const [, annee, mois, jour] = /^(?:(\d{4})|-)-(\d{2})-(\d{2})$/.exec(a)!;
  return { annee: annee ? Number(annee) : null, mois: Number(mois), jour: Number(jour) };
}

// Un 29 février est fêté le 28 les années non bissextiles.
function anniversaireEn(annee: number, mois: number, jour: number): Date {
  const d = new Date(annee, mois - 1, jour);
  return d.getMonth() === mois - 1 ? d : new Date(annee, mois, 0);
}

export function libelleRythme(jours: number): string {
  return RYTHMES.find(([d]) => d === jours)?.[1] ?? `Tous les ${jours} j`;
}

export function joursRelatifs(n: number): string {
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'hier';
  if (n < 60) return `il y a ${n} j`;
  return `il y a ${Math.round(n / 30)} mois`;
}

export type Tri = 'aRelancer' | 'nom' | 'anniversaire';

const parNom = (a: AmiSuivi, b: AmiSuivi) => a.ami.nom.localeCompare(b.ami.nom, 'fr');

const TRIS: Record<Tri, (aujourdhui: Date) => (a: AmiSuivi, b: AmiSuivi) => number> = {
  aRelancer: (t) => (a, b) => retard(b, t) - retard(a, t) || parNom(a, b),
  nom: () => parNom,
  anniversaire: (t) => (a, b) =>
    (prochainAnniversaire(a.ami, t)?.jours ?? Infinity) -
      (prochainAnniversaire(b.ami, t)?.jours ?? Infinity) || parNom(a, b),
};

export interface Vue {
  tri: Tri;
  type?: TypeEchange;
  recherche?: string;
}

export function amisVisibles(
  suivis: AmiSuivi[],
  { tri, type, recherche }: Vue,
  aujourdhui: Date,
): AmiSuivi[] {
  const q = (recherche ?? '').trim().toLocaleLowerCase('fr');
  return suivis
    .filter((s) => !type || s.dernier?.type === type)
    .filter((s) => !q || s.ami.nom.toLocaleLowerCase('fr').includes(q))
    .sort(TRIS[tri](aujourdhui));
}

/** Ce que l'utilisateur tape dans le formulaire d'un Ami, avant validation. Tous les champs sont du texte brut. */
export interface SaisieAmi {
  nom: string;
  /** Nombre de jours. */
  rythme: string;
  /** Jour, mois (1 à 12) et année facultative de l'anniversaire ; tous vides s'il n'est pas renseigné. */
  jour: string;
  mois: string;
  annee: string;
  notes: string;
}

/** Saisie d'un nouvel Ami : rien de renseigné, Rythme mensuel par défaut. */
export const SAISIE_VIDE: SaisieAmi = { nom: '', rythme: '30', jour: '', mois: '', annee: '', notes: '' };

/** Pré-remplit la saisie avec un Ami existant, pour le modifier. */
export function saisieDepuis(ami: Ami): SaisieAmi {
  const anniv = ami.anniversaire ? lireAnniversaire(ami.anniversaire) : null;
  return {
    nom: ami.nom,
    rythme: String(ami.rythme),
    jour: anniv ? String(anniv.jour) : '',
    mois: anniv ? String(anniv.mois) : '',
    annee: anniv?.annee ? String(anniv.annee) : '',
    notes: ami.notes ?? '',
  };
}

export type ErreursAmi = Partial<Record<'nom' | 'rythme' | 'anniversaire', string>>;

export type ResultatSaisieAmi = { ok: true; ami: Omit<Ami, 'id'> } | { ok: false; erreurs: ErreursAmi };

export function validerAmi(saisie: SaisieAmi, aujourdhui: Date): ResultatSaisieAmi {
  const erreurs: ErreursAmi = {};
  const nom = saisie.nom.trim();
  if (!nom) erreurs.nom = 'Le nom est obligatoire.';
  // Chiffres seulement : `Number` accepterait aussi « 1e1 » ou « 0x10 ».
  const rythme = /^\d+$/.test(saisie.rythme.trim()) ? Number(saisie.rythme) : 0;
  if (rythme <= 0) erreurs.rythme = 'Le Rythme doit être un nombre entier de jours, supérieur à 0.';
  const anniversaire = validerAnniversaire(saisie, aujourdhui);
  if ('erreur' in anniversaire) erreurs.anniversaire = anniversaire.erreur;
  if (Object.keys(erreurs).length) return { ok: false, erreurs };

  const ami: Omit<Ami, 'id'> = { nom, rythme };
  if ('valeur' in anniversaire && anniversaire.valeur) ami.anniversaire = anniversaire.valeur;
  const notes = saisie.notes.trim();
  if (notes) ami.notes = notes;
  return { ok: true, ami };
}

function validerAnniversaire(
  { jour, mois, annee }: SaisieAmi,
  aujourdhui: Date,
): { valeur?: Anniversaire } | { erreur: string } {
  const [j, m, a] = [jour.trim(), mois.trim(), annee.trim()];
  if (!j && !m && !a) return {};
  if (!j || !m) return { erreur: 'Indique le jour et le mois de l’anniversaire.' };
  if (a && !/^\d{4}$/.test(a)) return { erreur: 'L’année s’écrit sur 4 chiffres.' };
  // Une année antérieure serait aussi mal comprise par `Date` (0050 → 1950).
  if (a && Number(a) < 1900) return { erreur: 'Cette année n’est pas plausible.' };
  // Sans année, on vérifie la date sur une année bissextile pour accepter le 29 février.
  const date = new Date(a ? Number(a) : 2000, Number(m) - 1, Number(j));
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(j))
    return { erreur: 'Cette date n’existe pas.' };
  if (a && date > debutDuJour(aujourdhui)) return { erreur: 'Cette date est dans le futur.' };
  const mmjj = `${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
  return { valeur: a ? `${a}-${mmjj}` : `--${mmjj}` };
}

/** Ce que l'utilisateur saisit pour noter un Échange, avant validation. */
export interface SaisieEchange {
  type: TypeEchange | '';
  date: DateJour;
  note: string;
}

export type ErreursEchange = Partial<Record<'type' | 'date', string>>;

export type ResultatSaisieEchange =
  { ok: true; echange: Omit<Echange, 'id' | 'amiId'> } | { ok: false; erreurs: ErreursEchange };

export function validerEchange(saisie: SaisieEchange, aujourdhui: Date): ResultatSaisieEchange {
  const erreurs: ErreursEchange = {};
  if (!saisie.type) erreurs.type = 'Choisis le type d’échange.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(saisie.date) || versDateJour(lireDateJour(saisie.date)) !== saisie.date)
    erreurs.date = 'Indique une date valide.';
  else if (saisie.date > versDateJour(aujourdhui)) erreurs.date = 'Cette date est dans le futur.';
  if (!saisie.type || Object.keys(erreurs).length) return { ok: false, erreurs };

  const echange: Omit<Echange, 'id' | 'amiId'> = { type: saisie.type, date: saisie.date };
  const note = saisie.note.trim();
  if (note) echange.note = note;
  return { ok: true, echange };
}
