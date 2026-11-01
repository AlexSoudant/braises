import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { fermerFiche } from './navigation';

/** Dialogue modal natif : panneau par le bas sur téléphone, centré sur grand écran. */
export function Panneau({ titre, children }: { titre: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitre = useId();

  // Effet de mise en page : la fermeture a lieu avant le retrait du DOM, ce qui laisse le navigateur
  // rendre le focus à l'élément qui avait ouvert le panneau.
  useLayoutEffect(() => {
    const dialogue = ref.current!;
    dialogue.showModal();
    return () => dialogue.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitre}
      // Échap déclenche « cancel » : on laisse la navigation fermer le panneau.
      onCancel={(e) => {
        e.preventDefault();
        fermerFiche();
      }}
      // Fermeture décidée par le navigateur lui-même : on remet l'adresse en accord. L'événement
      // arrive en différé : s'il suit un démontage/remontage (StrictMode), le dialogue est déjà rouvert.
      onClose={(e) => {
        if (!e.currentTarget.open) fermerFiche();
      }}
      // Un clic sur le fond (hors du contenu) vise le dialogue lui-même.
      onClick={(e) => {
        if (e.target === e.currentTarget) fermerFiche();
      }}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-surface p-0 text-encre backdrop:bg-black/45 sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      <div className="grid gap-5 p-5 pr-[max(1.25rem,env(safe-area-inset-right))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))]">
        <header className="flex items-start justify-between gap-3">
          <h2 id={idTitre} className="font-titre text-2xl font-extrabold">
            {titre}
          </h2>
          <button
            type="button"
            onClick={fermerFiche}
            className="rounded-lg border border-ligne px-3 py-1.5 text-sm font-semibold"
          >
            Fermer
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
