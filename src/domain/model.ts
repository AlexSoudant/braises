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

export interface Ami {
  id: string;
  nom: string;
  anniversaire?: DateJour;
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
  age: number;
}

export function prochainAnniversaire(ami: Ami, aujourdhui: Date): ProchainAnniversaire | null {
  if (!ami.anniversaire) return null;
  const naissance = lireDateJour(ami.anniversaire);
  const t = debutDuJour(aujourdhui);
  let date = anniversaireEn(naissance, t.getFullYear());
  if (date < t) date = anniversaireEn(naissance, t.getFullYear() + 1);
  return { date, jours: joursEntre(date, t), age: date.getFullYear() - naissance.getFullYear() };
}

// Un 29 février est fêté le 28 les années non bissextiles.
function anniversaireEn(naissance: Date, annee: number): Date {
  const d = new Date(annee, naissance.getMonth(), naissance.getDate());
  return d.getMonth() === naissance.getMonth() ? d : new Date(annee, naissance.getMonth() + 1, 0);
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
