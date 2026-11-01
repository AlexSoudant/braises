import { useEffect, useRef } from 'react';
import { MessageEchec } from './formulaire';
import { useEnvoi } from './saisie';

/** Demande de confirmer la suppression d'un Ami ; le focus part sur « Annuler », le choix sans risque. */
export function ConfirmerSuppression({
  nom,
  nombreEchanges,
  onConfirmer,
  onAnnuler,
}: {
  nom: string;
  nombreEchanges: number;
  onConfirmer: () => Promise<void>;
  onAnnuler: () => void;
}) {
  const annuler = useRef<HTMLButtonElement>(null);
  const { envoyer, echec } = useEnvoi();
  useEffect(() => annuler.current?.focus(), []);

  const etSesEchanges =
    nombreEchanges === 0
      ? ''
      : nombreEchanges === 1
        ? ' et son échange'
        : ` et ses ${nombreEchanges} échanges`;

  return (
    <div className="grid gap-4">
      <p>{`Supprimer ${nom}${etSesEchanges} ? C’est définitif.`}</p>
      {echec && <MessageEchec />}
      <div className="flex justify-end gap-2">
        <button
          ref={annuler}
          type="button"
          onClick={onAnnuler}
          className="rounded-lg border border-ligne px-4 py-2 font-semibold"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => void envoyer(onConfirmer)}
          className="rounded-lg bg-danger px-4 py-2 font-semibold text-fond"
        >
          Supprimer définitivement
        </button>
      </div>
    </div>
  );
}
