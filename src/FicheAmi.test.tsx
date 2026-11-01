import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp } from './test/afficherApp';

const AUJOURDHUI = new Date(2026, 9, 31);

async function afficherAvecExemples() {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await screen.findByText('Inès');
}

test('toucher une ligne ouvre la fiche de l’Ami à sa propre adresse', async () => {
  await afficherAvecExemples();

  await userEvent.click(screen.getByRole('button', { name: /Inès/ }));

  const fiche = await screen.findByRole('dialog', { name: 'Inès' });
  expect(within(fiche).getByText('Brûlant')).toBeInTheDocument();
  expect(within(fiche).getByText('Spontané · hier — Café improvisé')).toBeInTheDocument();
  expect(within(fiche).getByText('Chaque mois')).toBeInTheDocument();
  expect(within(fiche).getByText(/2 déc\..*dans 32 j.*30 ans/)).toBeInTheDocument();
  expect(within(fiche).getByText('2 échanges')).toBeInTheDocument();
  expect(location.hash).toMatch(/^#\/ami\/[\w-]+$/);
});

test('recharger la page sur l’adresse d’une fiche la rouvre', async () => {
  await afficherAvecExemples();
  await userEvent.click(screen.getByRole('button', { name: /Camille/ }));
  await screen.findByRole('dialog', { name: 'Camille' });
  const adresse = location.hash;

  cleanup();
  history.replaceState(null, '', adresse);
  afficherApp(AUJOURDHUI);

  expect(await screen.findByRole('dialog', { name: 'Camille' })).toBeInTheDocument();
});

const fermetures: [string, (fiche: HTMLElement) => Promise<void> | void][] = [
  ['le retour de l’historique', () => history.back()],
  ['le bouton Fermer', (fiche) => userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }))],
  ['Échap', (fiche) => void fireEvent(fiche, new Event('cancel', { cancelable: true }))],
  ['un toucher en dehors', (fiche) => userEvent.click(fiche)],
];

test.each(fermetures)('%s referme la fiche et revient au Registre', async (_, fermer) => {
  await afficherAvecExemples();
  await userEvent.click(screen.getByRole('button', { name: /Hugo/ }));
  const fiche = await screen.findByRole('dialog', { name: 'Hugo' });

  await fermer(fiche);

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(location.hash).not.toMatch(/ami/);
  expect(screen.getByRole('button', { name: /Hugo/ })).toBeInTheDocument();
});

test('fermer une fiche ouverte par lien direct ne quitte pas l’app', async () => {
  await afficherAvecExemples();
  await userEvent.click(screen.getByRole('button', { name: /Hugo/ }));
  const adresse = location.hash;
  cleanup();
  history.replaceState(null, '', adresse);
  afficherApp(AUJOURDHUI);

  await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Fermer' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(location.hash).toBe('#/');
});

test('une adresse d’Ami inconnue affiche le Registre et remplace l’adresse', async () => {
  history.replaceState(null, '', '#/ami/inconnu');
  await afficherAvecExemples();

  await waitFor(() => expect(location.hash).toBe('#/'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('une adresse de fiche mal encodée affiche le Registre au lieu de planter', async () => {
  history.replaceState(null, '', '#/ami/%E0%A4%A');
  await afficherAvecExemples();

  await waitFor(() => expect(location.hash).toBe('#/'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('si le navigateur ferme la fiche de lui-même, l’adresse revient au Registre', async () => {
  await afficherAvecExemples();
  await userEvent.click(screen.getByRole('button', { name: /Hugo/ }));
  const fiche = await screen.findByRole<HTMLDialogElement>('dialog', { name: 'Hugo' });

  act(() => fiche.close());

  await waitFor(() => expect(location.hash).not.toMatch(/ami/));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('le focus entre dans la fiche puis revient à la ligne de l’Ami à la fermeture', async () => {
  await afficherAvecExemples();
  const ligne = screen.getByRole('button', { name: /Hugo/ });
  await userEvent.click(ligne);
  const fiche = await screen.findByRole('dialog', { name: 'Hugo' });
  expect(fiche).toContainElement(document.activeElement as HTMLElement);

  await userEvent.click(within(fiche).getByRole('button', { name: 'Fermer' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: /Hugo/ })).toHaveFocus();
});
