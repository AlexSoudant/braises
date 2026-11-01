import { expect, test } from 'vitest';
import type { Ami, Echange } from './model';
import { construireSauvegarde, nomFichierSauvegarde } from './sauvegarde';

const zoe: Ami = { id: 'a1', nom: 'Zoé', rythme: 30, anniversaire: '--03-14', notes: 'Voisine' };
const appel: Echange = { id: 'e1', amiId: 'a1', date: '2026-10-02', type: 'tel', note: 'Long appel' };

test('la sauvegarde version 1 contient tous les Amis et Échanges, et sa date d’export', () => {
  const maintenant = new Date(Date.UTC(2026, 10, 1, 9, 30));

  expect(construireSauvegarde([zoe], [appel], maintenant)).toEqual({
    app: 'braises',
    version: 1,
    exporteLe: '2026-11-01T09:30:00.000Z',
    amis: [zoe],
    echanges: [appel],
  });
});

test('une base vide donne une sauvegarde vide, pas une erreur', () => {
  const sauvegarde = construireSauvegarde([], [], new Date(2026, 10, 1));

  expect(sauvegarde.amis).toEqual([]);
  expect(sauvegarde.echanges).toEqual([]);
});

test.each([
  [new Date(2026, 10, 1), 'braises-2026-11-01.json'],
  [new Date(2027, 0, 5, 23, 59), 'braises-2027-01-05.json'],
])('le fichier du %s s’appelle %s', (jour, nom) => {
  expect(nomFichierSauvegarde(jour)).toBe(nom);
});
