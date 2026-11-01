import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp } from './test/afficherApp';

const AUJOURDHUI = new Date(2026, 9, 31);

async function ouvrirFicheDe(nom: string) {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(nom) }));
  return screen.findByRole('dialog', { name: nom });
}

test('supprimer demande une confirmation ; annuler ne supprime rien', async () => {
  const fiche = await ouvrirFicheDe('Camille');

  await userEvent.click(await within(fiche).findByRole('button', { name: 'Supprimer cet ami' }));

  expect(
    within(fiche).getByText('Supprimer Camille et ses 3 échanges ? C’est définitif.'),
  ).toBeInTheDocument();
  expect(within(fiche).getByRole('button', { name: 'Annuler' })).toHaveFocus();

  await userEvent.click(within(fiche).getByRole('button', { name: 'Annuler' }));

  expect(within(fiche).getByText('Brûlant')).toBeInTheDocument();
  expect(within(fiche).getByRole('button', { name: 'Supprimer cet ami' })).toHaveFocus();
  expect(location.hash).toMatch(/^#\/ami\//);
});

test('après confirmation, l’Ami disparaît du Registre et la fiche se ferme', async () => {
  const fiche = await ouvrirFicheDe('Camille');
  await userEvent.click(await within(fiche).findByRole('button', { name: 'Supprimer cet ami' }));

  await userEvent.click(within(fiche).getByRole('button', { name: 'Supprimer définitivement' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(location.hash).not.toMatch(/ami/);
  expect(screen.queryByRole('button', { name: /Camille/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Hugo/ })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Fiche de Camille supprimée'));
});
