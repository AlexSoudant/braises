// Seul module qui parle à la base. Les écrans passent par ici, jamais par Dexie directement.
import Dexie, { type EntityTable } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  suivre,
  versDateJour,
  type Ami,
  type AmiSuivi,
  type Echange,
  type TypeEchange,
} from '../domain/model';

export const db = new Dexie('braises') as Dexie & {
  amis: EntityTable<Ami, 'id'>;
  echanges: EntityTable<Echange, 'id'>;
};

db.version(1).stores({
  amis: 'id, nom',
  echanges: 'id, amiId, date',
});

/** Tous les Amis avec leur dernier Échange ; `undefined` tant que la base n'a pas répondu. */
export function useRegistre(): AmiSuivi[] | undefined {
  return useLiveQuery(async () => suivre(await db.amis.toArray(), await db.echanges.toArray()));
}

export interface ResumeAmi {
  suivi: AmiSuivi;
  nombreEchanges: number;
}

/** Un Ami et le résumé de ses Échanges ; `null` s'il n'existe pas, `undefined` tant que la base n'a pas répondu. */
export function useResumeAmi(id: string): ResumeAmi | null | undefined {
  return useLiveQuery(async () => {
    const ami = await db.amis.get(id);
    if (!ami) return null;
    const echanges = await db.echanges.where('amiId').equals(id).toArray();
    return { suivi: suivre([ami], echanges)[0], nombreEchanges: echanges.length };
  }, [id]);
}

/** Enregistre un nouvel Ami et renvoie son identifiant. */
export async function ajouterAmi(ami: Omit<Ami, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.amis.add({ ...ami, id });
  return id;
}

/** Remplace toutes les infos d'un Ami ; un anniversaire ou des notes absents sont effacés. */
export async function modifierAmi(id: string, ami: Omit<Ami, 'id'>): Promise<void> {
  await db.amis.put({ ...ami, id });
}

/** Enregistre un Échange avec un Ami et renvoie son identifiant. */
export async function noterEchange(amiId: string, echange: Omit<Echange, 'id' | 'amiId'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.echanges.add({ ...echange, id, amiId });
  return id;
}

export async function chargerExemples(aujourdhui: Date): Promise<void> {
  const ilYa = (n: number) =>
    versDateJour(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - n));
  const exemples: [string, string, number, string, [number, TypeEchange, string?][]][] = [
    [
      'Camille',
      '1993-11-04',
      14,
      'Aime le jazz. Vient de changer de boulot.',
      [
        [3, 'resto', 'Pizza chez Gino'],
        [21, 'tel'],
        [40, 'bar'],
      ],
    ],
    [
      'Hugo',
      '1990-02-17',
      30,
      'Papa depuis juin.',
      [
        [9, 'msg'],
        [33, 'bar', 'Afterwork'],
      ],
    ],
    [
      'Léa',
      '1995-11-12',
      7,
      'Coloc de fac.',
      [
        [18, 'tel'],
        [30, 'spont', 'Croisée au marché'],
      ],
    ],
    [
      'Thomas',
      '1988-06-30',
      90,
      'Vit à Lyon.',
      [
        [130, 'anniv'],
        [200, 'bar'],
      ],
    ],
    [
      'Inès',
      '1996-12-02',
      30,
      '',
      [
        [1, 'spont', 'Café improvisé'],
        [12, 'msg'],
      ],
    ],
    ['Karim', '1987-09-21', 60, 'Rencontré au club d’escalade.', []],
  ];
  const amis: Ami[] = [];
  const echanges: Echange[] = [];
  for (const [nom, anniversaire, rythme, notes, liste] of exemples) {
    const id = crypto.randomUUID();
    amis.push({ id, nom, anniversaire, rythme, notes });
    for (const [n, type, note] of liste)
      echanges.push({ id: crypto.randomUUID(), amiId: id, date: ilYa(n), type, note });
  }
  await db.transaction('rw', db.amis, db.echanges, async () => {
    await db.amis.bulkAdd(amis);
    await db.echanges.bulkAdd(echanges);
  });
}
