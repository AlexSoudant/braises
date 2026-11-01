import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { afficherApp } from './test/afficherApp';
import { intercepterTelechargements, imiterPartage } from './test/imitations';

const AUJOURDHUI = new Date(2026, 9, 31, 18, 45);

async function ouvrirMenuAvecExemples() {
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await screen.findByText('Inès');
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  return screen.findByRole('dialog', { name: 'Menu' });
}

async function lire(fichier: File) {
  return JSON.parse(await fichier.text());
}

test('avec le partage, l’export partage un fichier daté contenant tous les Amis et Échanges', async () => {
  const partages = imiterPartage();
  const menu = await ouvrirMenuAvecExemples();
  expect(within(menu).getByText('Dernier export : jamais')).toBeInTheDocument();

  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));

  await waitFor(() => expect(partages).toHaveLength(1));
  expect(partages[0].name).toBe('braises-2026-10-31.json');
  expect(partages[0].type).toBe('application/json');
  const sauvegarde = await lire(partages[0]);
  expect(sauvegarde).toMatchObject({ app: 'braises', version: 1, exporteLe: AUJOURDHUI.toISOString() });
  expect(sauvegarde.amis.map((a: { nom: string }) => a.nom).sort()).toEqual([
    'Camille',
    'Hugo',
    'Inès',
    'Karim',
    'Léa',
    'Thomas',
  ]);
  expect(sauvegarde.echanges).toHaveLength(11);
  expect(await within(menu).findByText('Dernier export : aujourd’hui')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Sauvegarde exportée');
});

test('refermer la feuille de partage n’affiche pas d’erreur et ne retient pas de date d’export', async () => {
  const proposes = imiterPartage(new DOMException('Partage annulé', 'AbortError'));
  const menu = await ouvrirMenuAvecExemples();

  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));

  await waitFor(() => expect(proposes).toHaveLength(1));
  // Laisse l'app réagir au refus avant de constater qu'elle n'a rien signalé.
  await new Promise((r) => setTimeout(r, 20));
  expect(within(menu).queryByRole('alert')).not.toBeInTheDocument();
  expect(within(menu).getByText('Dernier export : jamais')).toBeInTheDocument();
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

test('sans partage, l’export télécharge le même fichier', async () => {
  const telechargements = intercepterTelechargements();
  const menu = await ouvrirMenuAvecExemples();

  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));

  await waitFor(() => expect(telechargements).toHaveLength(1));
  expect(telechargements[0].nom).toBe('braises-2026-10-31.json');
  const sauvegarde = JSON.parse(await telechargements[0].fichier!.text());
  expect(sauvegarde).toMatchObject({ app: 'braises', version: 1 });
  expect(sauvegarde.amis).toHaveLength(6);
  expect(sauvegarde.echanges).toHaveLength(11);
  expect(await within(menu).findByText('Dernier export : aujourd’hui')).toBeInTheDocument();
});

test('si le navigateur refuse le partage, l’export se rabat sur le téléchargement', async () => {
  imiterPartage(new DOMException('Geste expiré', 'NotAllowedError'));
  const telechargements = intercepterTelechargements();
  const menu = await ouvrirMenuAvecExemples();

  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));

  await waitFor(() => expect(telechargements).toHaveLength(1));
  expect(telechargements[0].nom).toBe('braises-2026-10-31.json');
  expect(within(menu).queryByRole('alert')).not.toBeInTheDocument();
  expect(await within(menu).findByText('Dernier export : aujourd’hui')).toBeInTheDocument();
});

test('« Tout effacer » demande une confirmation puis ramène à l’écran du premier lancement', async () => {
  const menu = await ouvrirMenuAvecExemples();

  await userEvent.click(within(menu).getByRole('button', { name: 'Tout effacer' }));
  expect(within(menu).getByRole('button', { name: 'Annuler' })).toHaveFocus();
  await userEvent.click(within(menu).getByRole('button', { name: 'Annuler' }));
  expect(within(menu).getByRole('button', { name: 'Tout effacer' })).toHaveFocus();
  expect(screen.getByRole('button', { name: /Camille/ })).toBeInTheDocument();

  await userEvent.click(within(menu).getByRole('button', { name: 'Tout effacer' }));
  await userEvent.click(within(menu).getByRole('button', { name: 'Tout effacer définitivement' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(await screen.findByRole('button', { name: 'Essayer avec des exemples' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Camille/ })).not.toBeInTheDocument();
  expect(location.hash).not.toMatch(/menu/);
});

test('supprimer un Ami supprime aussi ses Échanges : l’export n’en garde aucun', async () => {
  const partages = imiterPartage();
  afficherApp(AUJOURDHUI);
  await userEvent.click(await screen.findByRole('button', { name: 'Essayer avec des exemples' }));
  await userEvent.click(await screen.findByRole('button', { name: /Camille/ }));
  const fiche = await screen.findByRole('dialog', { name: 'Camille' });
  await userEvent.click(await within(fiche).findByRole('button', { name: 'Supprimer cet ami' }));
  await userEvent.click(within(fiche).getByRole('button', { name: 'Supprimer définitivement' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));

  await waitFor(() => expect(partages).toHaveLength(1));
  const sauvegarde = await lire(partages[0]);
  const ids = new Set(sauvegarde.amis.map((a: { id: string }) => a.id));
  expect(sauvegarde.amis).toHaveLength(5);
  expect(sauvegarde.echanges).toHaveLength(8);
  expect(sauvegarde.echanges.every((e: { amiId: string }) => ids.has(e.amiId))).toBe(true);
});

const lignesDuRegistre = () =>
  within(screen.getByRole('list', { name: 'Amis' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

async function choisirFichier(menu: HTMLElement, fichier: File) {
  await userEvent.upload(within(menu).getByLabelText('Importer une sauvegarde'), fichier);
}

const fichierJson = (contenu: object) =>
  new File([JSON.stringify(contenu)], 'sauvegarde.json', { type: 'application/json' });

test('un fichier exporté puis réimporté redonne exactement le même Registre', async () => {
  const partages = imiterPartage();
  let menu = await ouvrirMenuAvecExemples();
  const registre = lignesDuRegistre();
  await userEvent.click(within(menu).getByRole('button', { name: 'Exporter une sauvegarde' }));
  await waitFor(() => expect(partages).toHaveLength(1));
  await userEvent.click(within(menu).getByRole('button', { name: 'Tout effacer' }));
  await userEvent.click(within(menu).getByRole('button', { name: 'Tout effacer définitivement' }));
  await screen.findByRole('button', { name: 'Essayer avec des exemples' });

  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  menu = await screen.findByRole('dialog', { name: 'Menu' });
  await choisirFichier(menu, partages[0]);
  expect(
    await within(menu).findByText(
      'Importer cette sauvegarde : 6 amis et 11 échanges ? Elle remplacera toutes tes données actuelles.',
    ),
  ).toBeInTheDocument();
  await userEvent.click(within(menu).getByRole('button', { name: 'Remplacer mes données' }));

  expect(await within(menu).findByText('Import terminé : 6 amis et 11 échanges.')).toHaveFocus();
  await userEvent.click(within(menu).getByRole('button', { name: 'Terminé' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(lignesDuRegistre()).toEqual(registre);
});

test('annuler l’import ne change rien', async () => {
  const menu = await ouvrirMenuAvecExemples();
  const registre = lignesDuRegistre();
  const zoe = { id: 'a1', nom: 'Zoé', rythme: 30 };

  await choisirFichier(
    menu,
    fichierJson({ app: 'braises', version: 1, exporteLe: '', amis: [zoe], echanges: [] }),
  );
  await within(menu).findByText(/Importer cette sauvegarde : 1 ami et aucun échange/);
  await userEvent.click(within(menu).getByRole('button', { name: 'Annuler' }));

  expect(within(menu).getByLabelText('Importer une sauvegarde')).toHaveFocus();
  expect(lignesDuRegistre()).toEqual(registre);
  expect(screen.queryByText('Zoé')).not.toBeInTheDocument();
});

test('un fichier refusé affiche le motif et laisse les données intactes', async () => {
  const menu = await ouvrirMenuAvecExemples();
  const registre = lignesDuRegistre();

  await choisirFichier(menu, fichierJson({ friends: [{ name: 'Zoé' }] }));

  expect(await within(menu).findByRole('alert')).toHaveTextContent(
    'Ce fichier n’est pas une sauvegarde Braises.',
  );
  expect(within(menu).queryByRole('button', { name: 'Remplacer mes données' })).not.toBeInTheDocument();
  expect(lignesDuRegistre()).toEqual(registre);
});
