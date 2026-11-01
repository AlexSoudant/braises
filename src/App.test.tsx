import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp, revenirAuPremierPlan } from './test/afficherApp';

test('les exemples remplissent le Registre, les plus froids en tête', async () => {
  afficherApp(new Date(2026, 9, 31));
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));

  const lignes = within(await screen.findByRole('list', { name: 'Amis' })).getAllByRole('listitem');
  expect(lignes).toHaveLength(6);
  expect(within(lignes[0]).getByText('Karim')).toBeInTheDocument();
  expect(within(lignes[0]).getByText('Glacé')).toBeInTheDocument();
  expect(within(lignes[5]).getByText('Inès')).toBeInTheDocument();
  expect(within(lignes[5]).getByText('Brûlant')).toBeInTheDocument();
});

test('revenir dans l’app un autre jour met à jour les jours écoulés et la Chaleur', async () => {
  afficherApp(new Date(2026, 9, 31));
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await screen.findByText('Inès');
  const ines = () => screen.getByText('Inès').closest('li')!;
  expect(within(ines()).getByText(/hier/)).toBeInTheDocument();
  expect(within(ines()).getByText('Brûlant')).toBeInTheDocument();

  revenirAuPremierPlan(new Date(2026, 11, 15));

  expect(await within(ines()).findByText(/il y a 46 j/)).toBeInTheDocument();
  expect(within(ines()).getByText('Refroidi')).toBeInTheDocument();
});
