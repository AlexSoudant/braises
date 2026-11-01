import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { expect, test } from 'vitest';
import { db } from './data/db';
import { afficherApp } from './test/afficherApp';

const AUJOURDHUI = new Date(2026, 9, 31);

async function ouvrirFicheDe(nom: string) {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(nom) }));
  return screen.findByRole('dialog', { name: nom });
}

const lignesHistorique = (fiche: HTMLElement) =>
  within(within(fiche).getByRole('list', { name: 'Historique' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

test('l’historique liste les Échanges du plus récent au plus ancien, avec Type, date et note', async () => {
  const fiche = await ouvrirFicheDe('Camille');

  await waitFor(() =>
    expect(lignesHistorique(fiche)).toEqual([
      expect.stringContaining('Restaurant · 28 oct. 2026 — Pizza chez Gino'),
      expect.stringContaining('Téléphone · 10 oct. 2026'),
      expect.stringContaining('Bar · 21 sept. 2026'),
    ]),
  );
});

async function fermer(fiche: HTMLElement) {
  await userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

test('supprimer un Échange le retire de l’historique et recalcule la Chaleur', async () => {
  const fiche = await ouvrirFicheDe('Camille');
  expect(within(fiche).getByText('Brûlant')).toBeInTheDocument();

  await userEvent.click(
    await within(fiche).findByRole('button', { name: 'Supprimer l’échange Restaurant du 28 oct. 2026' }),
  );

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Échange supprimé'));
  expect(await within(fiche).findByText('Refroidi')).toBeInTheDocument();
  expect(lignesHistorique(fiche)).toEqual([
    expect.stringContaining('Téléphone · 10 oct. 2026'),
    expect.stringContaining('Bar · 21 sept. 2026'),
  ]);
  expect(within(fiche).getByText('Téléphone · il y a 21 j')).toBeInTheDocument();
  expect(within(fiche).getByRole('heading', { name: 'Historique' })).toHaveFocus();
  await fermer(fiche);
  expect(within(screen.getByRole('button', { name: /Camille/ })).getByText('Refroidi')).toBeInTheDocument();
});

test('« Annuler » dans le toast restaure l’Échange et la Chaleur précédente', async () => {
  const fiche = await ouvrirFicheDe('Camille');
  await userEvent.click(
    await within(fiche).findByRole('button', { name: 'Supprimer l’échange Restaurant du 28 oct. 2026' }),
  );
  await within(fiche).findByText('Refroidi');

  await userEvent.click(within(fiche).getByRole('button', { name: 'Annuler' }));

  expect(await within(fiche).findByText('Brûlant')).toBeInTheDocument();
  expect(lignesHistorique(fiche)).toEqual([
    expect.stringContaining('Restaurant · 28 oct. 2026 — Pizza chez Gino'),
    expect.stringContaining('Téléphone · 10 oct. 2026'),
    expect.stringContaining('Bar · 21 sept. 2026'),
  ]);
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  expect(within(fiche).getByRole('heading', { name: 'Historique' })).toHaveFocus();
});

test('supprimer le seul Échange garde le focus dans la fiche', async () => {
  const fiche = await ouvrirFicheDe('Karim');
  await userEvent.click(within(fiche).getByRole('radio', { name: 'Bar' }));
  await userEvent.click(within(fiche).getByRole('button', { name: 'Noter l’échange' }));

  await userEvent.click(
    await within(fiche).findByRole('button', { name: 'Supprimer l’échange Bar du 31 oct. 2026' }),
  );

  expect(await within(fiche).findByText('Aucun échange noté.')).toBeInTheDocument();
  expect(within(fiche).getByText('Jamais')).toBeInTheDocument();
  expect(within(fiche).getByRole('heading', { name: 'Historique' })).toHaveFocus();
});

test('une base en version 1 contenant des données s’ouvre en version 2 sans perte', async () => {
  db.close();
  await Dexie.delete('braises');
  const ancienne = new Dexie('braises');
  ancienne.version(1).stores({ amis: 'id, nom', echanges: 'id, amiId, date' });
  await ancienne.table('amis').add({ id: 'a1', nom: 'Zoé', rythme: 30 });
  await ancienne.table('echanges').bulkAdd([
    { id: 'e1', amiId: 'a1', date: '2026-09-01', type: 'tel' },
    { id: 'e2', amiId: 'a1', date: '2026-10-25', type: 'bar', note: 'Concert' },
  ]);
  ancienne.close();
  await db.open();

  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: /Zoé/ }));
  const fiche = await screen.findByRole('dialog', { name: 'Zoé' });

  await waitFor(() =>
    expect(lignesHistorique(fiche)).toEqual([
      expect.stringContaining('Bar · 25 oct. 2026 — Concert'),
      expect.stringContaining('Téléphone · 1 sept. 2026'),
    ]),
  );
  expect(db.verno).toBe(2);
});
