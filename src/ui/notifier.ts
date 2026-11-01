import { createContext, useContext } from 'react';

export interface Notification {
  message: string;
  /** Action proposée dans la notification, par exemple « Annuler ». */
  action?: { libelle: string; faire: () => void | Promise<void> };
}

export const ContexteNotifier = createContext<(n: Notification) => void>(() => {});

/** Affiche une notification discrète (toast) qui disparaît d'elle-même. */
export const useNotifier = () => useContext(ContexteNotifier);

export interface AffichageNotification {
  courante: Notification | null;
  fermer: () => void;
  /** Nombre de panneaux ouverts : la notification s'affiche dans le panneau, seule partie active de la page. */
  panneauxOuverts: number;
  /** Signale un panneau ouvert ; renvoie la fonction qui le retire. */
  inscrirePanneau: () => () => void;
}

export const ContexteAffichage = createContext<AffichageNotification>({
  courante: null,
  fermer: () => {},
  panneauxOuverts: 0,
  inscrirePanneau: () => () => {},
});
