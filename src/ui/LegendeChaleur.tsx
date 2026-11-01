import type { Chaleur } from '../domain/model';
import { BadgeChaleur } from './BadgeChaleur';

const SENS: [Chaleur, string][] = [
  [0, 'moins de la moitié du Rythme'],
  [1, 'dans le Rythme'],
  [2, 'un peu en retard, jusqu’à 1,5 fois le Rythme'],
  [3, 'en retard, jusqu’à 2,5 fois le Rythme'],
  [4, 'très en retard, ou aucun Échange'],
];

/** Explique les niveaux de Chaleur : le temps écoulé depuis le dernier Échange, rapporté au Rythme. */
export function LegendeChaleur() {
  return (
    <details className="rounded-xl border border-ligne p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Que veulent dire les couleurs ?</summary>
      <p className="mt-2 text-discret">
        Le temps écoulé depuis le dernier Échange, comparé au Rythme choisi :
      </p>
      <ul aria-label="Niveaux de Chaleur" className="mt-2 grid gap-2">
        {SENS.map(([niveau, sens]) => (
          <li key={niveau} className="flex items-center gap-3">
            <BadgeChaleur niveau={niveau} />
            <span className="sr-only"> : </span>
            <span>{sens}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
