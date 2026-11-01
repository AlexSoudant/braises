// Composants communs aux formulaires : champs libellés et messages d'erreur. Comportements : saisie.ts.
import type { ReactNode } from 'react';

export const CHAMP = 'w-full rounded-lg border border-ligne bg-fond px-3 py-2';

/** Un libellé, son contrôle et son message d'erreur, dont l'id est `<id>-erreur`. */
export function Champ({
  id,
  libelle,
  erreur,
  discret = false,
  children,
}: {
  id: string;
  libelle: string;
  erreur?: string;
  discret?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className={discret ? 'text-xs text-discret' : 'text-sm font-semibold'}>
        {libelle}
      </label>
      {children}
      {erreur && <MessageErreur id={`${id}-erreur`}>{erreur}</MessageErreur>}
    </div>
  );
}

export function MessageErreur({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm text-danger">
      {children}
    </p>
  );
}

export function MessageEchec() {
  return (
    <p role="alert" className="text-sm text-danger">
      L’enregistrement a échoué. Réessaie.
    </p>
  );
}
