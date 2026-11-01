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

test('modifier un Ami depuis sa fiche se reflète aussitôt dans la fiche et le Registre', async () => {
  const fiche = await ouvrirFicheDe('Camille');

  await userEvent.click(within(fiche).getByRole('button', { name: 'Modifier' }));
  const nom = within(fiche).getByLabelText('Nom');
  expect(nom).toHaveValue('Camille');
  expect(within(fiche).getByLabelText('Année (facultative)')).toHaveValue(1993);
  await userEvent.clear(nom);
  await userEvent.type(nom, 'Camille B.');
  await userEvent.selectOptions(within(fiche).getByLabelText('Rythme'), 'Chaque semaine');
  await userEvent.clear(within(fiche).getByLabelText('Notes'));
  await userEvent.type(within(fiche).getByLabelText('Notes'), 'Partie à Lyon.');
  await userEvent.click(within(fiche).getByRole('button', { name: 'Enregistrer' }));

  const ficheModifiee = await screen.findByRole('dialog', { name: 'Camille B.' });
  expect(within(ficheModifiee).getByText('Chaque semaine')).toBeInTheDocument();
  expect(within(ficheModifiee).getByText('Partie à Lyon.')).toBeInTheDocument();
  expect(within(ficheModifiee).getByText(/4 nov\..*33 ans/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Camille B\..*Chaque semaine/ })).toBeInTheDocument();
});

test('annuler une modification ne change rien', async () => {
  const fiche = await ouvrirFicheDe('Hugo');

  await userEvent.click(within(fiche).getByRole('button', { name: 'Modifier' }));
  expect(within(fiche).getByLabelText('Nom')).toHaveFocus();
  await userEvent.type(within(fiche).getByLabelText('Nom'), ' le grand');
  await userEvent.click(within(fiche).getByRole('button', { name: 'Annuler' }));

  expect(within(fiche).getByRole('button', { name: 'Modifier' })).toHaveFocus();

  expect(within(fiche).getByRole('heading', { name: 'Hugo' })).toBeInTheDocument();
  expect(within(fiche).queryByLabelText('Nom')).not.toBeInTheDocument();
  await userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.queryByText('Hugo le grand')).not.toBeInTheDocument();
});
