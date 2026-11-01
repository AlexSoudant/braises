import { ajouterAmi } from '../data/db';
import { SAISIE_VIDE } from '../domain/model';
import { FormulaireAmi } from './FormulaireAmi';
import { fermerFiche, remplacerParFiche } from './navigation';
import { Panneau } from './Panneau';

/** Création d'un Ami ; une fois enregistré, sa fiche remplace le formulaire. */
export function NouvelAmi({ aujourdhui }: { aujourdhui: Date }) {
  return (
    <Panneau titre="Nouvel ami">
      <FormulaireAmi
        initial={SAISIE_VIDE}
        aujourdhui={aujourdhui}
        onEnregistrer={async (ami) => remplacerParFiche(await ajouterAmi(ami))}
        onAnnuler={fermerFiche}
      />
    </Panneau>
  );
}
