import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useResumeAmi } from '../data/db';
import {
  chaleur,
  joursDepuis,
  joursRelatifs,
  libelleRythme,
  prochainAnniversaire,
  type Ami,
} from '../domain/model';
import { BadgeChaleur } from './BadgeChaleur';
import { allerAuRegistre, fermerFiche } from './navigation';

export function FicheAmi({ id, aujourdhui }: { id: string; aujourdhui: Date }) {
  const resume = useResumeAmi(id);

  // Adresse d'un Ami qui n'existe pas (supprimé, lien périmé) : retour au Registre.
  useEffect(() => {
    if (resume === null) allerAuRegistre();
  }, [resume]);

  if (!resume) return null;
  const { suivi, nombreEchanges } = resume;
  const niveau = chaleur(suivi, aujourdhui);
  const jours = joursDepuis(suivi, aujourdhui);

  return (
    <Panneau titre={suivi.ami.nom}>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
        <dt className="text-discret">Chaleur</dt>
        <dd>
          <BadgeChaleur niveau={niveau} />
        </dd>
        <dt className="text-discret">Dernier échange</dt>
        <dd>{jours === null ? 'Jamais' : joursRelatifs(jours)}</dd>
        <dt className="text-discret">Rythme</dt>
        <dd>{libelleRythme(suivi.ami.rythme)}</dd>
        <dt className="text-discret">Anniversaire</dt>
        <dd>{texteAnniversaire(suivi.ami, aujourdhui)}</dd>
        <dt className="text-discret">Échanges</dt>
        <dd>{texteNombreEchanges(nombreEchanges)}</dd>
      </dl>
    </Panneau>
  );
}

function texteAnniversaire(ami: Ami, aujourdhui: Date): string {
  const anniv = prochainAnniversaire(ami, aujourdhui);
  if (!anniv) return 'Non renseigné';
  const date = anniv.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const quand = anniv.jours === 0 ? 'aujourd’hui' : `dans ${anniv.jours} j`;
  return `${date} · ${quand} · ${anniv.age} ans`;
}

function texteNombreEchanges(n: number): string {
  if (n === 0) return 'Aucun échange';
  return n === 1 ? '1 échange' : `${n} échanges`;
}

/** Dialogue modal natif : panneau par le bas sur téléphone, centré sur grand écran. */
function Panneau({ titre, children }: { titre: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  // Effet de mise en page : la fermeture a lieu avant le retrait du DOM, ce qui laisse le navigateur
  // rendre le focus à l'élément qui avait ouvert la fiche.
  useLayoutEffect(() => {
    const dialogue = ref.current!;
    dialogue.showModal();
    return () => dialogue.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="titre-fiche"
      // Échap déclenche « cancel » : on laisse la navigation fermer la fiche.
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
          <h2 id="titre-fiche" className="font-titre text-2xl font-extrabold">
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
