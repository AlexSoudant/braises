import { useEffect, useRef } from 'react';
import { MessageEchec } from './formulaire';
import { useEnvoi } from './saisie';

/** Demande de confirmer une action définitive ; le focus part sur « Annuler », le choix sans risque. */
export function Confirmation({
  question,
  libelleConfirmer,
  onConfirmer,
  onAnnuler,
}: {
  question: string;
  libelleConfirmer: string;
  onConfirmer: () => Promise<void>;
  onAnnuler: () => void;
}) {
  const annuler = useRef<HTMLButtonElement>(null);
  const { envoyer, echec } = useEnvoi();
  useEffect(() => annuler.current?.focus(), []);

  return (
    <div className="grid gap-4">
      <p>{question}</p>
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
          {libelleConfirmer}
        </button>
      </div>
    </div>
  );
}
