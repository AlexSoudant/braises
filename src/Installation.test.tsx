import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { afficherApp } from './test/afficherApp';
import { imiter } from './test/imitations';

const AUJOURDHUI = new Date(2026, 9, 31);

const bandeau = () => screen.queryByRole('region', { name: 'Installer Braises' });

/** `installee` : l'app tourne en mode installé (ouverte depuis l'écran d'accueil). */
function imiterAffichage({ installee = false } = {}) {
  imiter(window, 'matchMedia', (requete: string) => ({
    matches: installee && requete === '(display-mode: standalone)',
    media: requete,
  }));
}

/** Safari sur iPhone expose `navigator.standalone`, vrai quand l'app est ouverte depuis l'écran d'accueil. */
function imiterIPhone({ installee = false } = {}) {
  imiter(navigator, 'standalone', installee);
}

test('le stockage persistant est demandé au démarrage quand le navigateur le permet', async () => {
  const persist = vi.fn(async () => true);
  imiter(navigator, 'storage', { persist });

  afficherApp(AUJOURDHUI);

  await waitFor(() => expect(persist).toHaveBeenCalled());
});

test('sans stockage persistant, l’app démarre normalement', async () => {
  afficherApp(AUJOURDHUI);

  expect(await screen.findByRole('button', { name: 'Essayer avec des exemples' })).toBeInTheDocument();
});

test('sur iPhone, hors mode installé, le bandeau explique comment ajouter l’app à l’écran d’accueil', async () => {
  imiterAffichage();
  imiterIPhone();

  afficherApp(AUJOURDHUI);

  expect(await screen.findByRole('region', { name: 'Installer Braises' })).toHaveTextContent(
    'Safari peut effacer tes données après 7 jours sans visite',
  );
  expect(bandeau()).toHaveTextContent('Partager, puis « Sur l’écran d’accueil »');
});

test('sur un autre appareil, le bandeau renvoie au menu du navigateur', async () => {
  imiterAffichage();

  afficherApp(AUJOURDHUI);

  expect(await screen.findByRole('region', { name: 'Installer Braises' })).toHaveTextContent(
    'menu du navigateur, puis « Installer l’application »',
  );
  expect(bandeau()).not.toHaveTextContent('Partager');
});

test('masquer le bandeau le fait disparaître, y compris après rechargement', async () => {
  imiterAffichage();
  afficherApp(AUJOURDHUI);
  const region = await screen.findByRole('region', { name: 'Installer Braises' });

  await userEvent.click(within(region).getByRole('button', { name: 'Masquer le conseil d’installation' }));

  expect(bandeau()).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
  cleanup();
  afficherApp(AUJOURDHUI);
  await screen.findByRole('button', { name: 'Essayer avec des exemples' });
  expect(bandeau()).not.toBeInTheDocument();
});

test.each([
  ['ouverte depuis l’écran d’accueil', () => imiterAffichage({ installee: true })],
  [
    'ouverte depuis l’écran d’accueil d’un iPhone',
    () => {
      imiterAffichage();
      imiterIPhone({ installee: true });
    },
  ],
])('installée (%s), l’app n’affiche jamais le bandeau', async (_, imiterInstallation) => {
  imiterInstallation();

  afficherApp(AUJOURDHUI);

  await screen.findByRole('button', { name: 'Essayer avec des exemples' });
  expect(bandeau()).not.toBeInTheDocument();
});
