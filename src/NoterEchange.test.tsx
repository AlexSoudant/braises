import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp, revenirAuPremierPlan } from './test/afficherApp';

const AUJOURDHUI = new Date(2026, 9, 31);

async function ouvrirFicheDe(nom: string) {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(nom) }));
  return screen.findByRole('dialog', { name: nom });
}

async function fermer(fiche: HTMLElement) {
  await userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

test('choisir un Type puis valider note un Échange du jour et réchauffe l’amitié', async () => {
  const fiche = await ouvrirFicheDe('Thomas');
  expect(within(fiche).getByText('Tiède')).toBeInTheDocument();

  await userEvent.click(within(fiche).getByRole('radio', { name: 'Restaurant' }));
  await userEvent.click(within(fiche).getByRole('button', { name: 'Noter l’échange' }));

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Échange noté'));
  expect(await within(fiche).findByText('Brûlant')).toBeInTheDocument();
  expect(within(fiche).getByText('Restaurant · aujourd’hui')).toBeInTheDocument();
  expect(within(fiche).getByText('3 échanges')).toBeInTheDocument();
  await fermer(fiche);
  const ligne = screen.getByRole('button', { name: /Thomas/ });
  expect(within(ligne).getByText('Brûlant')).toBeInTheDocument();
  expect(within(ligne).getByText(/Restaurant · aujourd’hui/)).toBeInTheDocument();
});

test('une date passée est acceptée, une date future refusée ; la note est gardée', async () => {
  const fiche = await ouvrirFicheDe('Karim');
  const date = within(fiche).getByLabelText('Date');
  expect(date).toHaveValue('2026-10-31');

  await userEvent.click(within(fiche).getByRole('radio', { name: 'Téléphone' }));
  await userEvent.clear(date);
  await userEvent.type(date, '2026-11-05');
  await userEvent.click(within(fiche).getByRole('button', { name: 'Noter l’échange' }));
  expect(date).toHaveAccessibleDescription('Cette date est dans le futur.');
  expect(within(fiche).getByText('Aucun échange')).toBeInTheDocument();

  await userEvent.clear(date);
  await userEvent.type(date, '2026-10-21');
  await userEvent.type(within(fiche).getByLabelText('Note (facultative)'), 'Long appel');
  await userEvent.click(within(fiche).getByRole('button', { name: 'Noter l’échange' }));

  expect(await within(fiche).findByText('Téléphone · il y a 10 j — Long appel')).toBeInTheDocument();
  expect(within(fiche).getByText('1 échange')).toBeInTheDocument();
});

test('sans Type choisi, rien n’est noté', async () => {
  const fiche = await ouvrirFicheDe('Karim');

  await userEvent.click(within(fiche).getByRole('button', { name: 'Noter l’échange' }));

  expect(within(fiche).getByRole('radiogroup', { name: 'Type d’échange' })).toHaveAccessibleDescription(
    'Choisis le type d’échange.',
  );
  expect(within(fiche).getByRole('radio', { name: 'Téléphone' })).toHaveFocus();
  expect(within(fiche).getByText('Aucun échange')).toBeInTheDocument();
});

test('un Échange antidaté avant le dernier ne change pas le dernier Échange affiché', async () => {
  const fiche = await ouvrirFicheDe('Camille');

  await userEvent.click(within(fiche).getByRole('radio', { name: 'Bar' }));
  const date = within(fiche).getByLabelText('Date');
  await userEvent.clear(date);
  await userEvent.type(date, '2026-10-20');
  await userEvent.click(within(fiche).getByRole('button', { name: 'Noter l’échange' }));

  expect(await within(fiche).findByText('4 échanges')).toBeInTheDocument();
  expect(within(fiche).getByText('Restaurant · il y a 3 j — Pizza chez Gino')).toBeInTheDocument();
  await fermer(fiche);
  expect(
    within(screen.getByRole('button', { name: /Camille/ })).getByText(/Restaurant · il y a 3 j/),
  ).toBeInTheDocument();
});

test('le Type choisi est signalé autrement que par la couleur', async () => {
  const fiche = await ouvrirFicheDe('Karim');

  await userEvent.click(within(fiche).getByRole('radio', { name: 'Bar' }));

  expect(within(fiche).getByText('✓')).toBeInTheDocument();
  expect(within(fiche).getByText('✓').closest('label')).toHaveTextContent('Bar');
});

test('appuyer deux fois sur Noter l’échange ne l’enregistre qu’une fois', async () => {
  const fiche = await ouvrirFicheDe('Karim');
  await userEvent.click(within(fiche).getByRole('radio', { name: 'Bar' }));

  // Deux appuis avant que la base n'ait répondu au premier.
  const noter = within(fiche).getByRole('button', { name: 'Noter l’échange' });
  fireEvent.click(noter);
  fireEvent.click(noter);

  expect(await within(fiche).findByText('1 échange')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Échange noté'));
  expect(within(fiche).getByText('1 échange')).toBeInTheDocument();
});

test('revenir dans l’app le lendemain propose la date du nouveau jour', async () => {
  const fiche = await ouvrirFicheDe('Karim');

  revenirAuPremierPlan(new Date(2026, 10, 1));

  await waitFor(() => expect(within(fiche).getByLabelText('Date')).toHaveValue('2026-11-01'));
});
