import { useId, useRef } from 'react';
import { restaurerEchange, supprimerEchange } from '../data/db';
import { lireDateJour, TYPES_ECHANGE, type Echange } from '../domain/model';
import { useNotifier } from './notifier';

/** Les Échanges d'un Ami, du plus récent au plus ancien ; chacun peut être supprimé. */
export function Historique({ echanges }: { echanges: Echange[] }) {
  const titre = useId();
  const refTitre = useRef<HTMLHeadingElement>(null);
  const notifier = useNotifier();

  // Le bouton touché disparaît (sa ligne, ou le toast) : le focus reste dans le panneau, sur le titre.
  const replierFocus = () => refTitre.current?.focus();

  const supprimer = async (echange: Echange) => {
    let supprime: Echange | undefined;
    try {
      supprime = await supprimerEchange(echange.id);
    } catch {
      notifier({ message: 'La suppression a échoué. Réessaie.' });
      return;
    }
    if (!supprime) return;
    replierFocus();
    const aRestaurer = supprime;
    notifier({
      message: 'Échange supprimé',
      action: {
        libelle: 'Annuler',
        faire: async () => {
          try {
            await restaurerEchange(aRestaurer);
          } catch {
            notifier({ message: 'La restauration a échoué.' });
          }
          replierFocus();
        },
      },
    });
  };

  return (
    <section className="grid gap-2">
      <h3 id={titre} ref={refTitre} tabIndex={-1} className="font-semibold">
        Historique
      </h3>
      {echanges.length === 0 ? (
        <p className="text-discret">Aucun échange noté.</p>
      ) : (
        <ul aria-labelledby={titre} className="divide-y divide-ligne rounded-xl border border-ligne">
          {echanges.map((e) => {
            const date = dateLisible(e.date);
            return (
              <li key={e.id} className="flex items-center gap-3 py-1 pr-1 pl-4">
                <span className="min-w-0 flex-1">
                  {TYPES_ECHANGE[e.type]} · <time dateTime={e.date}>{date}</time>
                  {e.note && <span className="text-discret"> — {e.note}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Supprimer l’échange ${TYPES_ECHANGE[e.type]} du ${date}`}
                  title="Supprimer"
                  onClick={() => void supprimer(e)}
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-discret"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function dateLisible(date: string): string {
  return lireDateJour(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
