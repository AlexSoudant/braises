import { NIVEAUX_CHALEUR, type Chaleur } from '../domain/model';

// Classes complètes écrites en clair pour que Tailwind les détecte.
const COULEURS: Record<Chaleur, string> = {
  0: 'bg-chaleur-0 text-chaleur-0-texte',
  1: 'bg-chaleur-1 text-chaleur-1-texte',
  2: 'bg-chaleur-2 text-chaleur-2-texte',
  3: 'bg-chaleur-3 text-chaleur-3-texte',
  4: 'bg-chaleur-4 text-chaleur-4-texte',
};

/** Le niveau est toujours écrit en toutes lettres : la couleur ne porte jamais seule l'information. */
export function BadgeChaleur({ niveau }: { niveau: Chaleur }) {
  return (
    <span
      className={`inline-block w-20 shrink-0 rounded-lg px-2 py-1 text-center text-sm font-semibold ${COULEURS[niveau]}`}
    >
      {NIVEAUX_CHALEUR[niveau]}
    </span>
  );
}
