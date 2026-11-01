import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { effacerTout, importer } from '../data/db';
import { joursRelatifs } from '../domain/model';
import { joursSansExport, lireSauvegarde, type Sauvegarde } from '../domain/sauvegarde';
import { Confirmation } from './Confirmation';
import { MessageEchec } from './formulaire';
import { fermerPanneau } from './navigation';
import { useNotifier } from './notifier';
import { Panneau } from './Panneau';
import { useExportSauvegarde } from './exportSauvegarde';
import { useDernierExport } from './preferences';

type Etape =
  | { nom: 'menu' }
  | { nom: 'effacement' }
  | { nom: 'import'; sauvegarde: Sauvegarde }
  | { nom: 'importTermine'; sauvegarde: Sauvegarde };

/** Menu ⋯ : sauvegarder ou restaurer ses données, ou tout effacer pour repartir de zéro. */
export function Menu({ aujourdhui }: { aujourdhui: Date }) {
  const [etape, setEtape] = useState<Etape>({ nom: 'menu' });
  const dernierExport = useDernierExport();
  const [refusImport, setRefusImport] = useState<string | null>(null);
  const { exporterSauvegarde, echec } = useExportSauvegarde();
  const notifier = useNotifier();
  const boutonEffacer = useRef<HTMLButtonElement>(null);
  const champImport = useRef<HTMLInputElement>(null);
  // Étape quittée par « Annuler » : le focus revient sur le contrôle qui l'avait ouverte.
  const etapeAnnulee = useRef<Etape['nom'] | null>(null);

  useEffect(() => {
    if (etape.nom !== 'menu') return;
    if (etapeAnnulee.current === 'effacement') boutonEffacer.current?.focus();
    if (etapeAnnulee.current === 'import') champImport.current?.focus();
  }, [etape]);
  const annuler = () => {
    etapeAnnulee.current = etape.nom;
    setRefusImport(null);
    setEtape({ nom: 'menu' });
  };

  const lireFichier = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    // Vidé tout de suite : choisir de nouveau le même fichier doit relancer la lecture.
    e.target.value = '';
    if (!fichier) return;
    let texte: string;
    try {
      texte = await fichier.text();
    } catch {
      setRefusImport('Impossible de lire ce fichier.');
      return;
    }
    const lecture = lireSauvegarde(texte);
    setRefusImport(lecture.ok ? null : lecture.erreur);
    if (lecture.ok) setEtape({ nom: 'import', sauvegarde: lecture.sauvegarde });
  };

  if (etape.nom === 'effacement') {
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
          onAnnuler={annuler}
        />
      </Panneau>
    );
  }

  if (etape.nom === 'import') {
    const { sauvegarde } = etape;
    return (
      <Panneau titre="Menu">
        <Confirmation
          question={`Importer cette sauvegarde : ${contenu(sauvegarde)} ? Elle remplacera toutes tes données actuelles.`}
          libelleConfirmer="Remplacer mes données"
          onConfirmer={async () => {
            await importer(sauvegarde);
            setEtape({ nom: 'importTermine', sauvegarde });
          }}
          onAnnuler={annuler}
        />
      </Panneau>
    );
  }

  if (etape.nom === 'importTermine') {
    return (
      <Panneau titre="Menu">
        <CompteRendu texte={`Import terminé : ${contenu(etape.sauvegarde)}.`} />
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
      <div className="grid gap-2">
        {/* Un vrai champ fichier, masqué derrière son libellé : il reste atteignable au clavier. */}
        <label className="cursor-pointer rounded-lg border border-ligne px-4 py-3 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-accent">
          Importer une sauvegarde
          <input
            ref={champImport}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void lireFichier(e)}
          />
        </label>
        {refusImport && <MessageEchec>{refusImport} Tes données n’ont pas été modifiées.</MessageEchec>}
      </div>
      <button
        ref={boutonEffacer}
        type="button"
        onClick={() => {
          setRefusImport(null);
          setEtape({ nom: 'effacement' });
        }}
        className="rounded-lg border border-ligne px-4 py-3 text-left font-semibold text-danger"
      >
        Tout effacer
      </button>
    </Panneau>
  );
}

/** Le compte rendu reçoit le focus, pour qu'un lecteur d'écran le lise sans dépendre du toast. */
function CompteRendu({ texte }: { texte: string }) {
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => message.current?.focus(), []);
  return (
    <div className="grid gap-4">
      <p ref={message} tabIndex={-1}>
        {texte}
      </p>
      <button
        type="button"
        onClick={fermerPanneau}
        className="justify-self-end rounded-lg bg-encre px-4 py-2 font-semibold text-fond"
      >
        Terminé
      </button>
    </div>
  );
}

function contenu({ amis, echanges }: Sauvegarde): string {
  return `${compter(amis.length, 'ami')} et ${compter(echanges.length, 'échange')}`;
}

function compter(n: number, mot: string): string {
  if (n === 0) return `aucun ${mot}`;
  return n === 1 ? `1 ${mot}` : `${n} ${mot}s`;
}

function texteDernierExport(jour: string | null, aujourdhui: Date): string {
  const jours = joursSansExport(jour, aujourdhui);
  return jours === null ? 'jamais' : joursRelatifs(jours);
}
