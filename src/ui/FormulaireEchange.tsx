import { useId, useRef, useState, type FormEvent } from 'react';
import { noterEchange } from '../data/db';
import {
  TYPES_ECHANGE,
  validerEchange,
  versDateJour,
  type ErreursEchange,
  type SaisieEchange,
  type TypeEchange,
} from '../domain/model';
import { Champ, CHAMP, MessageEchec, MessageErreur } from './formulaire';
import { ariaErreur, useEnvoi, useFocusPremiereErreur } from './saisie';
import { useNotifier } from './notifier';

/** Noter un Échange : choisir le Type suffit, la date vaut aujourd'hui par défaut. */
export function FormulaireEchange({ amiId, aujourdhui }: { amiId: string; aujourdhui: Date }) {
  const jour = versDateJour(aujourdhui);
  const saisieVide = (): SaisieEchange => ({ type: '', date: jour, note: '' });
  const [saisie, setSaisie] = useState(saisieVide);
  const [erreurs, setErreurs] = useState<ErreursEchange>({});
  const formulaire = useRef<HTMLFormElement>(null);
  const { envoyer, echec } = useEnvoi();
  const notifier = useNotifier();
  const id = useId();
  useFocusPremiereErreur(formulaire, erreurs);

  // L'app a pu rester ouverte jusqu'au lendemain : la date proposée suit le nouveau jour.
  // Ajustement pendant le rendu, comme le recommande React, plutôt qu'un effet.
  const [jourAffiche, setJourAffiche] = useState(jour);
  if (jour !== jourAffiche) {
    setJourAffiche(jour);
    setSaisie((s) => ({ ...s, date: jour }));
  }

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    const resultat = validerEchange(saisie, aujourdhui);
    setErreurs(resultat.ok ? {} : resultat.erreurs);
    if (!resultat.ok) return;
    void envoyer(async () => {
      await noterEchange(amiId, resultat.echange);
      setSaisie(saisieVide());
      notifier({ message: 'Échange noté' });
    });
  };

  return (
    <form
      ref={formulaire}
      noValidate
      onSubmit={soumettre}
      className="grid gap-3 rounded-xl border border-ligne p-4"
    >
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-semibold">Noter un échange</legend>
        <div
          role="radiogroup"
          aria-label="Type d’échange"
          className="flex flex-wrap gap-2"
          {...ariaErreur(erreurs.type, `${id}-type-erreur`)}
        >
          {(Object.entries(TYPES_ECHANGE) as [TypeEchange, string][]).map(([type, libelle]) => (
            <label
              key={type}
              className="cursor-pointer rounded-full border border-ligne px-3 py-1.5 text-sm has-checked:border-encre has-checked:bg-encre has-checked:text-fond has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name={`${id}-type`}
                value={type}
                checked={saisie.type === type}
                onChange={() => setSaisie((s) => ({ ...s, type }))}
                className="sr-only"
              />
              {/* La coche double la couleur : le choix reste lisible sans elle. */}
              {saisie.type === type && <span aria-hidden="true">✓ </span>}
              {libelle}
            </label>
          ))}
        </div>
        {erreurs.type && <MessageErreur id={`${id}-type-erreur`}>{erreurs.type}</MessageErreur>}
      </fieldset>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <Champ id={`${id}-date`} libelle="Date" erreur={erreurs.date}>
          <input
            id={`${id}-date`}
            type="date"
            className={CHAMP}
            max={jour}
            value={saisie.date}
            onChange={(e) => setSaisie((s) => ({ ...s, date: e.target.value }))}
            {...ariaErreur(erreurs.date, `${id}-date-erreur`)}
          />
        </Champ>
        <Champ id={`${id}-note`} libelle="Note (facultative)">
          <input
            id={`${id}-note`}
            className={CHAMP}
            value={saisie.note}
            onChange={(e) => setSaisie((s) => ({ ...s, note: e.target.value }))}
          />
        </Champ>
      </div>
      {echec && <MessageEchec />}
      <button
        type="submit"
        className="justify-self-end rounded-lg bg-encre px-4 py-2 font-semibold text-fond"
      >
        Noter l’échange
      </button>
    </form>
  );
}
