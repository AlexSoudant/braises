import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp } from './test/afficherApp';

const AUJOURDHUI = new Date(2026, 9, 31);

async function afficherAvecExemples(jour = AUJOURDHUI) {
  afficherApp(jour);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await screen.findByText('Inès');
}

const PRENOMS = /(Camille|Hugo|Inès|Karim|Léa|Thomas)/;
/** Les prénoms du Registre, dans l'ordre affiché. */
const ordre = () => {
  const liste = screen.queryByRole('list', { name: 'Amis' });
  if (!liste) return [];
  return within(liste)
    .getAllByRole('listitem')
    .map((li) => PRENOMS.exec(within(li).getByRole('button').textContent!)?.[1]);
};

const trier = (option: string) => userEvent.selectOptions(screen.getByLabelText('Trier'), option);

test('le Registre se trie à relancer, par nom ou par anniversaire ; le tri survit à un rechargement', async () => {
  await afficherAvecExemples();
  expect(screen.getByLabelText('Trier')).toHaveDisplayValue('À relancer');
  expect(ordre()).toEqual(['Karim', 'Léa', 'Thomas', 'Hugo', 'Camille', 'Inès']);

  await trier('Par nom');
  expect(ordre()).toEqual(['Camille', 'Hugo', 'Inès', 'Karim', 'Léa', 'Thomas']);

  await trier('Par anniversaire');
  expect(ordre()).toEqual(['Camille', 'Léa', 'Inès', 'Hugo', 'Thomas', 'Karim']);

  cleanup();
  afficherApp(AUJOURDHUI);
  await screen.findByText('Inès');
  expect(screen.getByLabelText('Trier')).toHaveDisplayValue('Par anniversaire');
  expect(ordre()).toEqual(['Camille', 'Léa', 'Inès', 'Hugo', 'Thomas', 'Karim']);
});

test('le filtre ne garde que les Amis dont le dernier Échange est de ce Type, et se retire d’un geste', async () => {
  await afficherAvecExemples();

  await userEvent.selectOptions(screen.getByLabelText('Dernier échange'), 'Téléphone');

  expect(ordre()).toEqual(['Léa']);
  await userEvent.click(screen.getByRole('button', { name: 'Retirer le filtre Téléphone' }));
  expect(ordre()).toHaveLength(6);
  expect(screen.getByLabelText('Dernier échange')).toHaveDisplayValue('Tous les types');
  expect(screen.getByLabelText('Dernier échange')).toHaveFocus();
});

test('la recherche par nom ignore majuscules et accents', async () => {
  await afficherAvecExemples();

  await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher un ami' }), 'LEA');

  expect(ordre()).toEqual(['Léa']);
});

test.each([
  [
    'une recherche',
    () => userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher un ami' }), 'Zoé'),
  ],
  ['un filtre', () => userEvent.selectOptions(screen.getByLabelText('Dernier échange'), 'Bar')],
])('%s sans résultat affiche un message, et un geste ramène tout le Registre', async (_, chercher) => {
  await afficherAvecExemples();

  await chercher();

  expect(ordre()).toEqual([]);
  expect(screen.getByText('Aucun ami ne correspond.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tout afficher' }));
  expect(ordre()).toHaveLength(6);
  expect(screen.getByRole('searchbox', { name: 'Rechercher un ami' })).toHaveValue('');
});

test('la légende explique les cinq niveaux de Chaleur', async () => {
  await afficherAvecExemples();

  await userEvent.click(screen.getByText('Que veulent dire les couleurs ?'));

  const legende = screen.getByRole('list', { name: 'Niveaux de Chaleur' });
  expect(
    within(legende)
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toEqual([
    'Brûlant : moins de la moitié du Rythme',
    'Chaud : dans le Rythme',
    'Tiède : un peu en retard, jusqu’à 1,5 fois le Rythme',
    'Refroidi : en retard, jusqu’à 2,5 fois le Rythme',
    'Glacé : très en retard, ou aucun Échange',
  ]);
});

test('l’anniversaire du jour est mis en évidence, avec l’âge atteint', async () => {
  await afficherAvecExemples(new Date(2026, 10, 4));

  const camille = screen.getByRole('button', { name: /Camille/ });
  expect(within(camille).getByText('🎂 Anniversaire aujourd’hui · 33 ans')).toBeInTheDocument();
  expect(within(screen.getByRole('button', { name: /Léa/ })).getByText('🎂 J-8')).toBeInTheDocument();
});
