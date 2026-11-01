import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp, revenirAuPremierPlan } from './test/afficherApp';
import { imiterPartage } from './test/imitations';

const AUJOURDHUI = new Date(2026, 9, 31, 18, 45);

const rappel = () => screen.queryByRole('region', { name: 'Rappel de sauvegarde' });

async function chargerExemples() {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await screen.findByText('Inès');
}

test('sans Ami, aucun rappel', async () => {
  afficherApp(AUJOURDHUI);

  await screen.findByRole('button', { name: 'Essayer avec des exemples' });

  expect(rappel()).not.toBeInTheDocument();
});

test('avec des Amis et jamais d’export, le rappel invite à exporter et disparaît après l’export', async () => {
  const partages = imiterPartage();
  await chargerExemples();
  expect(rappel()).toHaveTextContent('Tu n’as encore jamais exporté tes données');

  await userEvent.click(within(rappel()!).getByRole('button', { name: 'Exporter maintenant' }));

  await waitFor(() => expect(partages).toHaveLength(1));
  await waitFor(() => expect(rappel()).not.toBeInTheDocument());
  // Le bouton touché a disparu avec le rappel : le focus reste dans le Registre.
  expect(screen.getByRole('button', { name: 'Ajouter un ami' })).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent('Sauvegarde exportée');
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  expect(within(menu).getByText('Dernier export : aujourd’hui')).toBeInTheDocument();
});

test('le rappel revient quand le dernier export a plus de 30 jours', async () => {
  imiterPartage();
  await chargerExemples();
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));
  await waitFor(() => expect(rappel()).not.toBeInTheDocument());
  await userEvent.click(within(menu).getByRole('button', { name: 'Fermer' }));

  revenirAuPremierPlan(new Date(2026, 10, 30));
  // Le Registre a bien changé de jour : le dernier Échange avec Inès date maintenant d'il y a 31 j.
  await screen.findByText(/Spontané · il y a 31 j/);
  expect(rappel()).not.toBeInTheDocument();

  revenirAuPremierPlan(new Date(2026, 11, 1));
  expect(await screen.findByRole('region', { name: 'Rappel de sauvegarde' })).toHaveTextContent(
    'Ton dernier export date d’il y a 31 j',
  );
});
