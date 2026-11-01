import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp } from './test/afficherApp';

const AUJOURDHUI = new Date(2026, 9, 31);

test('ajouter son premier ami avec seulement un nom et un Rythme', async () => {
  afficherApp(AUJOURDHUI);

  await userEvent.click(await screen.findByRole('button', { name: 'Ajouter mon premier ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });
  expect(location.hash).toBe('#/ami/nouveau');
  expect(within(formulaire).getByLabelText('Nom')).toHaveFocus();
  await userEvent.type(within(formulaire).getByLabelText('Nom'), 'Margaux');
  await userEvent.selectOptions(within(formulaire).getByLabelText('Rythme'), 'Chaque mois');
  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));

  const fiche = await screen.findByRole('dialog', { name: 'Margaux' });
  expect(within(fiche).getByText('Chaque mois')).toBeInTheDocument();
  await userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  const ligne = screen.getByRole('button', { name: /Margaux/ });
  expect(within(ligne).getByText('Glacé')).toBeInTheDocument();
  expect(within(ligne).getByText(/Aucun échange/)).toBeInTheDocument();
});

test('un nom vide est refusé avec un message, et rien n’est enregistré', async () => {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Ajouter mon premier ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });

  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));

  expect(within(formulaire).getByLabelText('Nom')).toHaveAccessibleDescription('Le nom est obligatoire.');
  expect(within(formulaire).getByLabelText('Nom')).toHaveFocus();
  await userEvent.click(within(formulaire).getByRole('button', { name: 'Annuler' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByText('Aucun ami pour l’instant.')).toBeInTheDocument();
});

test('le Rythme se saisit aussi en jours, et un Rythme invalide est refusé', async () => {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Ajouter mon premier ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });
  await userEvent.type(within(formulaire).getByLabelText('Nom'), 'Paul');
  await userEvent.selectOptions(within(formulaire).getByLabelText('Rythme'), 'Personnalisé…');
  const jours = within(formulaire).getByLabelText('Rythme en jours');

  await userEvent.type(jours, '0');
  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));
  expect(jours).toHaveAccessibleDescription(/nombre entier de jours/);

  await userEvent.clear(jours);
  await userEvent.type(jours, '21');
  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));
  const fiche = await screen.findByRole('dialog', { name: 'Paul' });
  expect(within(fiche).getByText('Tous les 21 j')).toBeInTheDocument();
});

test('un anniversaire sans année donne les jours restants mais pas l’âge ; les notes s’affichent', async () => {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Ajouter mon premier ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });
  await userEvent.type(within(formulaire).getByLabelText('Nom'), 'Sami');
  await userEvent.type(within(formulaire).getByLabelText('Jour'), '4');
  await userEvent.selectOptions(within(formulaire).getByLabelText('Mois'), 'novembre');
  await userEvent.type(within(formulaire).getByLabelText('Notes'), 'Fan de vélo.');
  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));

  const fiche = await screen.findByRole('dialog', { name: 'Sami' });
  expect(within(fiche).getByText('4 nov. · dans 4 j')).toBeInTheDocument();
  expect(within(fiche).getByText('Fan de vélo.')).toBeInTheDocument();
  await userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(within(screen.getByRole('button', { name: /Sami/ })).getByText(/J-4/)).toBeInTheDocument();
});

test('une date d’anniversaire impossible est refusée avec un message', async () => {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Ajouter mon premier ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });
  await userEvent.type(within(formulaire).getByLabelText('Nom'), 'Sami');
  await userEvent.type(within(formulaire).getByLabelText('Jour'), '31');
  await userEvent.selectOptions(within(formulaire).getByLabelText('Mois'), 'février');

  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));

  expect(within(formulaire).getByLabelText('Jour')).toHaveAccessibleDescription('Cette date n’existe pas.');
  expect(within(formulaire).getByLabelText('Jour')).toHaveFocus();
  expect(screen.getByRole('dialog', { name: 'Nouvel ami' })).toBeInTheDocument();
});

test('depuis un Registre rempli, on ajoute un deuxième Ami du même nom', async () => {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await screen.findByText('Hugo');

  await userEvent.click(screen.getByRole('button', { name: 'Ajouter un ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });
  await userEvent.type(within(formulaire).getByLabelText('Nom'), 'Hugo');
  await userEvent.click(within(formulaire).getByRole('button', { name: 'Enregistrer' }));
  await userEvent.click(
    within(await screen.findByRole('dialog', { name: 'Hugo' })).getByRole('button', { name: 'Fermer' }),
  );

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getAllByRole('button', { name: /Hugo/ })).toHaveLength(2);
  expect(within(screen.getByRole('list', { name: 'Amis' })).getAllByRole('listitem')).toHaveLength(7);
});

test('appuyer deux fois sur Enregistrer n’ajoute l’Ami qu’une fois', async () => {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Ajouter mon premier ami' }));
  const formulaire = await screen.findByRole('dialog', { name: 'Nouvel ami' });
  await userEvent.type(within(formulaire).getByLabelText('Nom'), 'Margaux');

  // Deux appuis avant que la base n'ait répondu au premier.
  const enregistrer = within(formulaire).getByRole('button', { name: 'Enregistrer' });
  fireEvent.click(enregistrer);
  fireEvent.click(enregistrer);

  await userEvent.click(
    within(await screen.findByRole('dialog', { name: 'Margaux' })).getByRole('button', { name: 'Fermer' }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getAllByRole('button', { name: /Margaux/ })).toHaveLength(1);
});
