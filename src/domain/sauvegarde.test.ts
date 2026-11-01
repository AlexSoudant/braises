import { expect, test } from 'vitest';
import type { Ami, Echange } from './model';
import { construireSauvegarde, lireSauvegarde, nomFichierSauvegarde } from './sauvegarde';

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

const PAS_BRAISES = 'Ce fichier n’est pas une sauvegarde Braises.';

const fichier = (contenu: object) => JSON.stringify(contenu);
const valide = (changements: object = {}) =>
  fichier({
    app: 'braises',
    version: 1,
    exporteLe: '2026-11-01T09:30:00.000Z',
    amis: [zoe],
    echanges: [appel],
    ...changements,
  });

test('une sauvegarde exportée se relit à l’identique', () => {
  const sauvegarde = construireSauvegarde(
    [zoe, { id: 'a2', nom: 'Malik', rythme: 7 }],
    [appel],
    new Date(Date.UTC(2026, 10, 1)),
  );

  expect(lireSauvegarde(JSON.stringify(sauvegarde))).toEqual({ ok: true, sauvegarde });
});

test('les noms et notes sont nettoyés comme à la saisie', () => {
  const resultat = lireSauvegarde(
    valide({
      amis: [{ ...zoe, nom: '  Zoé ', notes: '   ' }],
      echanges: [{ ...appel, note: ' Long appel ' }],
    }),
  );

  expect(resultat.ok && resultat.sauvegarde.amis).toEqual([
    { id: 'a1', nom: 'Zoé', rythme: 30, anniversaire: '--03-14' },
  ]);
  expect(resultat.ok && resultat.sauvegarde.echanges).toEqual([appel]);
});

test('les champs inconnus sont ignorés', () => {
  const resultat = lireSauvegarde(valide({ amis: [{ ...zoe, couleur: 'bleu' }], theme: 'sombre' }));

  expect(resultat).toEqual({ ok: true, sauvegarde: expect.objectContaining({ amis: [zoe] }) });
  expect(resultat.ok && 'theme' in resultat.sauvegarde).toBe(false);
});

test.each([
  ['un texte qui n’est pas du JSON', 'pas du json', PAS_BRAISES],
  ['un JSON qui n’est pas un objet', '[1, 2]', PAS_BRAISES],
  ['une sauvegarde du prototype', fichier({ friends: [] }), PAS_BRAISES],
  ['une autre app', fichier({ app: 'autre', version: 1, amis: [], echanges: [] }), PAS_BRAISES],
  [
    'une version non prise en charge',
    valide({ version: 2 }),
    'Cette sauvegarde vient d’une version de Braises non prise en charge.',
  ],
  ['une liste d’Amis absente', valide({ amis: undefined }), 'Cette sauvegarde est incomplète.'],
  ['une liste d’Échanges absente', valide({ echanges: 'aucun' }), 'Cette sauvegarde est incomplète.'],
])('refuse %s', (_, contenu, erreur) => {
  expect(lireSauvegarde(contenu)).toEqual({ ok: false, erreur });
});

test.each([
  ['sans identifiant', { ...zoe, id: '' }],
  ['sans nom', { ...zoe, nom: '  ' }],
  ['avec un Rythme nul', { ...zoe, rythme: 0 }],
  ['avec un Rythme non entier', { ...zoe, rythme: 2.5 }],
  ['avec un Rythme écrit en texte', { ...zoe, rythme: '30' }],
  ['avec un anniversaire impossible', { ...zoe, anniversaire: '1990-02-30' }],
  ['avec un anniversaire mal écrit', { ...zoe, anniversaire: '14/03' }],
  ['avec des notes qui ne sont pas du texte', { ...zoe, notes: 42 }],
  ['en double', zoe],
])('refuse un Ami %s', (_, ami) => {
  expect(lireSauvegarde(valide({ amis: [zoe, ami] }))).toEqual({
    ok: false,
    erreur: 'Cette sauvegarde est abîmée : l’Ami n° 2 est invalide.',
  });
});

test.each([
  ['sans identifiant', { ...appel, id: undefined }],
  ['d’un Type inconnu', { ...appel, type: 'visio' }],
  ['à une date impossible', { ...appel, date: '2026-13-01' }],
  ['à une date mal écrite', { ...appel, date: '02/10/2026' }],
  ['avec une note qui n’est pas du texte', { ...appel, note: true }],
  ['en double', appel],
])('refuse un Échange %s', (_, echange) => {
  expect(lireSauvegarde(valide({ echanges: [appel, echange] }))).toEqual({
    ok: false,
    erreur: 'Cette sauvegarde est abîmée : l’Échange n° 2 est invalide.',
  });
});

test('refuse un Échange qui concerne un Ami absent du fichier', () => {
  expect(lireSauvegarde(valide({ echanges: [{ ...appel, amiId: 'inconnu' }] }))).toEqual({
    ok: false,
    erreur: 'Cette sauvegarde est abîmée : un Échange concerne un Ami absent du fichier.',
  });
});
