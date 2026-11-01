import { useEffect, useRef, useState } from 'react';
import { effacerTout, exporter } from '../data/db';
import { joursEntre, joursRelatifs, lireDateJour, versDateJour } from '../domain/model';
import { Confirmation } from './Confirmation';
import { MessageEchec } from './formulaire';
import { fermerPanneau } from './navigation';
import { useNotifier } from './notifier';
import { Panneau } from './Panneau';
import { partagerOuTelecharger } from './partage';
import { lireDernierExport, retenirDernierExport } from './preferences';
import { useEnvoi } from './saisie';

/** Menu ⋯ : sauvegarder ses données, ou tout effacer pour repartir de zéro. */
export function Menu({ aujourdhui }: { aujourdhui: Date }) {
  const [dernierExport, setDernierExport] = useState(lireDernierExport);
  const [confirmerEffacement, setConfirmerEffacement] = useState(false);
  const { envoyer, echec } = useEnvoi();
  const notifier = useNotifier();
  const boutonEffacer = useRef<HTMLButtonElement>(null);
  const confirmationQuittee = useRef(false);

  // Après « Annuler », le focus revient sur « Tout effacer » au lieu de se perdre dans la page.
  useEffect(() => {
    if (!confirmerEffacement && confirmationQuittee.current) boutonEffacer.current?.focus();
  }, [confirmerEffacement]);

  const exporterSauvegarde = () =>
    envoyer(async () => {
      const maintenant = new Date();
      if (!(await partagerOuTelecharger(await exporter(maintenant)))) return;
      const jour = versDateJour(maintenant);
      retenirDernierExport(jour);
      setDernierExport(jour);
      notifier({ message: 'Sauvegarde exportée' });
    });

  if (confirmerEffacement) {
    return (
      <Panneau titre="Menu">
        <Confirmation
          question="Effacer tous tes Amis et leurs Échanges ? C’est définitif : exporte une sauvegarde avant si tu veux les garder."
          libelleConfirmer="Tout effacer définitivement"
          onConfirmer={async () => {
            await effacerTout();
            fermerPanneau();
            notifier({ message: 'Toutes les données sont effacées' });
          }}
          onAnnuler={() => {
            confirmationQuittee.current = true;
            setConfirmerEffacement(false);
          }}
        />
      </Panneau>
    );
  }

  return (
    <Panneau titre="Menu">
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => void exporterSauvegarde()}
          className="rounded-lg bg-encre px-4 py-3 text-left font-semibold text-fond"
        >
          Exporter une sauvegarde
        </button>
        <p className="text-sm text-discret">
          Dernier export : {texteDernierExport(dernierExport, aujourdhui)}
        </p>
        {echec && <MessageEchec>L’export a échoué. Réessaie.</MessageEchec>}
      </div>
      <button
        ref={boutonEffacer}
        type="button"
        onClick={() => setConfirmerEffacement(true)}
        className="rounded-lg border border-ligne px-4 py-3 text-left font-semibold text-danger"
      >
        Tout effacer
      </button>
    </Panneau>
  );
}

function texteDernierExport(jour: string | null, aujourdhui: Date): string {
  if (!jour) return 'jamais';
  return joursRelatifs(Math.max(0, joursEntre(aujourdhui, lireDateJour(jour))));
}
