import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { db } from '../data/db';
import { Registre } from './Registre';

beforeEach(async () => {
  await db.amis.clear();
  await db.echanges.clear();
});

test('les exemples remplissent le Registre, les plus froids en tête', async () => {
  render(<Registre aujourdhui={new Date(2026, 9, 31)} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));

  const lignes = await screen.findAllByRole('listitem');
  expect(lignes).toHaveLength(6);
  expect(within(lignes[0]).getByText('Karim')).toBeInTheDocument();
  expect(within(lignes[0]).getByText('Glacé')).toBeInTheDocument();
  expect(within(lignes[5]).getByText('Inès')).toBeInTheDocument();
  expect(within(lignes[5]).getByText('Brûlant')).toBeInTheDocument();
});
