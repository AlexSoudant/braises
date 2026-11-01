import { useLayoutEffect, useRef, type RefObject } from 'react';
import { joursRelatifs } from '../domain/model';
import { joursSansExport, rappelerExport } from '../domain/sauvegarde';
import { useExportSauvegarde } from './exportSauvegarde';
import { MessageEchec } from './formulaire';
import { useDernierExport } from './preferences';

/**
 * Invite à exporter quand des données n'existent que sur l'appareil depuis trop longtemps.
 * `focusEnPartant` reçoit le focus si le rappel disparaît pendant qu'on l'utilisait (après l'export).
 */
export function RappelSauvegarde({
  nombreAmis,
  aujourdhui,
  focusEnPartant,
}: {
  nombreAmis: number;
  aujourdhui: Date;
  focusEnPartant: RefObject<HTMLElement | null>;
}) {
  const dernierExport = useDernierExport();
  if (!rappelerExport(nombreAmis, dernierExport, aujourdhui)) return null;
  const jours = joursSansExport(dernierExport, aujourdhui);
  const constat =
    jours === null
      ? 'Tu n’as encore jamais exporté tes données'
      : `Ton dernier export date d’${joursRelatifs(jours)}`;
  return <Rappel constat={constat} focusEnPartant={focusEnPartant} />;
}

function Rappel({
  constat,
  focusEnPartant,
}: {
  constat: string;
  focusEnPartant: RefObject<HTMLElement | null>;
}) {
  const { exporterSauvegarde, echec } = useExportSauvegarde();
  const rappel = useRef<HTMLElement>(null);

  // Effet de mise en page : le rappel est encore dans la page, on sait si le focus y était.
  useLayoutEffect(() => {
    const element = rappel.current;
    return () => {
      if (element?.contains(document.activeElement)) focusEnPartant.current?.focus();
    };
  }, [focusEnPartant]);

  return (
    <section
      ref={rappel}
      aria-label="Rappel de sauvegarde"
      className="grid gap-2 rounded-xl border border-accent bg-surface p-3 text-sm"
    >
      <p>{constat} : elles ne sont que sur cet appareil.</p>
      {echec && <MessageEchec>L’export a échoué. Réessaie.</MessageEchec>}
      <button
        type="button"
        onClick={() => void exporterSauvegarde()}
        className="justify-self-start rounded-lg bg-encre px-3 py-2 font-semibold text-fond"
      >
        Exporter maintenant
      </button>
    </section>
  );
}
