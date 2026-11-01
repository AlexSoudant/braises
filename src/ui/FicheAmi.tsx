import { useEffect, useRef, useState } from 'react';
import { modifierAmi, supprimerAmi, useResumeAmi } from '../data/db';
import {
  chaleur,
  joursDepuis,
  joursRelatifs,
  libelleRythme,
  prochainAnniversaire,
  saisieDepuis,
  TYPES_ECHANGE,
  type Ami,
  type AmiSuivi,
} from '../domain/model';
import { BadgeChaleur } from './BadgeChaleur';
import { ConfirmerSuppression } from './ConfirmerSuppression';
import { FormulaireAmi } from './FormulaireAmi';
import { FormulaireEchange } from './FormulaireEchange';
import { Historique } from './Historique';
import { allerAuRegistre, fermerFiche } from './navigation';
import { useNotifier } from './notifier';
import { Panneau } from './Panneau';

type Mode = 'consultation' | 'modification' | 'suppression';

export function FicheAmi({ id, aujourdhui }: { id: string; aujourdhui: Date }) {
  const resume = useResumeAmi(id);
  const [mode, setMode] = useState<Mode>('consultation');
  const boutonModifier = useRef<HTMLButtonElement>(null);
  const boutonSupprimer = useRef<HTMLButtonElement>(null);
  // Mode quitté : le focus revient sur le bouton qui l'avait ouvert au lieu de se perdre dans la page.
  const modeQuitte = useRef<Mode>('consultation');
  const supprime = useRef(false);
  const notifier = useNotifier();

  useEffect(() => {
    if (mode !== 'consultation') return;
    if (modeQuitte.current === 'modification') boutonModifier.current?.focus();
    if (modeQuitte.current === 'suppression') boutonSupprimer.current?.focus();
  }, [mode]);
  const revenirALaFiche = () => {
    modeQuitte.current = mode;
    setMode('consultation');
  };

  // Adresse d'un Ami qui n'existe pas (lien périmé) : retour au Registre. Après une suppression
  // depuis la fiche, c'est la fermeture normale de la fiche qui ramène au Registre.
  useEffect(() => {
    if (resume === null && !supprime.current) allerAuRegistre();
  }, [resume]);

  if (!resume) return null;
  const { suivi, historique } = resume;
  const niveau = chaleur(suivi, aujourdhui);
  const jours = joursDepuis(suivi, aujourdhui);

  if (mode === 'modification') {
    return (
      <Panneau titre={suivi.ami.nom}>
        <FormulaireAmi
          initial={saisieDepuis(suivi.ami)}
          aujourdhui={aujourdhui}
          onEnregistrer={async (ami) => {
            await modifierAmi(id, ami);
            revenirALaFiche();
          }}
          onAnnuler={revenirALaFiche}
        />
      </Panneau>
    );
  }

  if (mode === 'suppression') {
    return (
      <Panneau titre={suivi.ami.nom}>
        <ConfirmerSuppression
          nom={suivi.ami.nom}
          nombreEchanges={historique.length}
          onConfirmer={async () => {
            supprime.current = true;
            try {
              await supprimerAmi(id);
            } catch (e) {
              supprime.current = false;
              throw e;
            }
            fermerFiche();
            notifier({ message: `Fiche de ${suivi.ami.nom} supprimée` });
          }}
          onAnnuler={revenirALaFiche}
        />
      </Panneau>
    );
  }

  return (
    <Panneau titre={suivi.ami.nom}>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
        <dt className="text-discret">Chaleur</dt>
        <dd>
          <BadgeChaleur niveau={niveau} />
        </dd>
        <dt className="text-discret">Dernier échange</dt>
        <dd>{texteDernierEchange(suivi, jours)}</dd>
        <dt className="text-discret">Rythme</dt>
        <dd>{libelleRythme(suivi.ami.rythme)}</dd>
        <dt className="text-discret">Anniversaire</dt>
        <dd>{texteAnniversaire(suivi.ami, aujourdhui)}</dd>
        <dt className="text-discret">Échanges</dt>
        <dd>{texteNombreEchanges(historique.length)}</dd>
      </dl>
      {suivi.ami.notes && <p className="whitespace-pre-line text-discret">{suivi.ami.notes}</p>}
      <FormulaireEchange amiId={id} aujourdhui={aujourdhui} />
      <Historique echanges={historique} />
      <div className="flex justify-between gap-2">
        <button
          ref={boutonSupprimer}
          type="button"
          onClick={() => setMode('suppression')}
          className="rounded-lg border border-ligne px-4 py-2 font-semibold text-danger"
        >
          Supprimer cet ami
        </button>
        <button
          ref={boutonModifier}
          type="button"
          onClick={() => setMode('modification')}
          className="rounded-lg border border-ligne px-4 py-2 font-semibold"
        >
          Modifier
        </button>
      </div>
    </Panneau>
  );
}

function texteDernierEchange({ dernier }: AmiSuivi, jours: number | null): string {
  if (!dernier || jours === null) return 'Jamais';
  const texte = `${TYPES_ECHANGE[dernier.type]} · ${joursRelatifs(jours)}`;
  return dernier.note ? `${texte} — ${dernier.note}` : texte;
}

function texteAnniversaire(ami: Ami, aujourdhui: Date): string {
  const anniv = prochainAnniversaire(ami, aujourdhui);
  if (!anniv) return 'Non renseigné';
  const date = anniv.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const quand = anniv.jours === 0 ? 'aujourd’hui' : `dans ${anniv.jours} j`;
  return anniv.age === null ? `${date} · ${quand}` : `${date} · ${quand} · ${anniv.age} ans`;
}

function texteNombreEchanges(n: number): string {
  if (n === 0) return 'Aucun échange';
  return n === 1 ? '1 échange' : `${n} échanges`;
}
