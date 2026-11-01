import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ContexteAffichage, ContexteNotifier, type Notification } from './notifier';

const DUREE_MS = 5000;

/**
 * Fournit les notifications à toute l'app. Un panneau modal rend le reste de la page inerte (même la
 * couche supérieure) : la notification s'affiche donc dans le panneau ouvert, sinon en bas de la page.
 */
export function Notifications({ children }: { children: ReactNode }) {
  // Chaque appel crée un nouvel objet : le minuteur repart même si le message est identique.
  const [courante, setCourante] = useState<Notification | null>(null);
  const [panneauxOuverts, setPanneauxOuverts] = useState(0);
  const notifier = useCallback((n: Notification) => setCourante({ ...n }), []);
  const fermer = useCallback(() => setCourante(null), []);
  const inscrirePanneau = useCallback(() => {
    setPanneauxOuverts((n) => n + 1);
    return () => setPanneauxOuverts((n) => n - 1);
  }, []);

  useEffect(() => {
    if (!courante) return;
    const minuteur = setTimeout(() => setCourante(null), DUREE_MS);
    return () => clearTimeout(minuteur);
  }, [courante]);

  const affichage = useMemo(
    () => ({ courante, fermer, panneauxOuverts, inscrirePanneau }),
    [courante, fermer, panneauxOuverts, inscrirePanneau],
  );

  return (
    <ContexteNotifier.Provider value={notifier}>
      <ContexteAffichage.Provider value={affichage}>
        {children}
        {panneauxOuverts === 0 && <Toast />}
      </ContexteAffichage.Provider>
    </ContexteNotifier.Provider>
  );
}

/** Zone de notification d'un panneau ouvert. */
export function NotificationsDuPanneau() {
  const { inscrirePanneau } = useContext(ContexteAffichage);
  useEffect(() => inscrirePanneau(), [inscrirePanneau]);
  return <Toast />;
}

function Toast() {
  const { courante, fermer } = useContext(ContexteAffichage);
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center"
    >
      {courante && (
        <div className="pointer-events-auto flex items-center gap-4 rounded-xl bg-encre px-4 py-3 text-fond shadow-lg">
          <span>{courante.message}</span>
          {courante.action && (
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                courante.action!.faire();
                fermer();
              }}
            >
              {courante.action.libelle}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
