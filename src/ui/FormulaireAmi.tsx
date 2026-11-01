import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { RYTHMES, validerAmi, type Ami, type ErreursAmi, type SaisieAmi } from '../domain/model';

const CHAMP = 'w-full rounded-lg border border-ligne bg-fond px-3 py-2';
const PERSONNALISE = 'personnalise';
const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const estCourant = (rythme: string) => RYTHMES.some(([jours]) => String(jours) === rythme);

/** Formulaire de création ou de modification d'un Ami. Rien n'est enregistré tant que la saisie est invalide. */
export function FormulaireAmi({
  initial,
  aujourdhui,
  onEnregistrer,
  onAnnuler,
}: {
  initial: SaisieAmi;
  aujourdhui: Date;
  onEnregistrer: (ami: Omit<Ami, 'id'>) => Promise<void>;
  onAnnuler: () => void;
}) {
  const [saisie, setSaisie] = useState(initial);
  const [erreurs, setErreurs] = useState<ErreursAmi>({});
  const [echec, setEchec] = useState(false);
  const [rythmePersonnalise, setRythmePersonnalise] = useState(!estCourant(initial.rythme));
  const id = useId();
  const champNom = useRef<HTMLInputElement>(null);
  // Une référence plutôt qu'un état : deux appuis rapprochés arrivent avant le prochain rendu.
  const enregistrementEnCours = useRef(false);

  // Effet passif : il passe après l'ouverture du panneau, qui a placé le focus sur son premier bouton.
  useEffect(() => champNom.current?.focus(), []);
  const liaison = (champ: keyof SaisieAmi) => ({
    value: saisie[champ],
    onChange: (e: { target: { value: string } }) => setSaisie((s) => ({ ...s, [champ]: e.target.value })),
  });
  // Lie un champ à son message d'erreur, pour les lecteurs d'écran.
  const ariaErreur = (cle: keyof ErreursAmi, idChamp: string) => ({
    'aria-invalid': !!erreurs[cle],
    'aria-describedby': erreurs[cle] ? `${idChamp}-erreur` : undefined,
  });

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    if (enregistrementEnCours.current) return;
    const resultat = validerAmi(saisie, aujourdhui);
    setErreurs(resultat.ok ? {} : resultat.erreurs);
    if (!resultat.ok) return;
    enregistrementEnCours.current = true;
    setEchec(false);
    try {
      await onEnregistrer(resultat.ami);
    } catch {
      setEchec(true);
    } finally {
      enregistrementEnCours.current = false;
    }
  };

  return (
    <form noValidate onSubmit={soumettre} className="grid gap-4">
      <Champ id={`${id}-nom`} libelle="Nom" erreur={erreurs.nom}>
        <input
          id={`${id}-nom`}
          className={CHAMP}
          ref={champNom}
          autoComplete="off"
          {...liaison('nom')}
          {...ariaErreur('nom', `${id}-nom`)}
        />
      </Champ>

      <Champ id={`${id}-rythme`} libelle="Rythme" erreur={rythmePersonnalise ? undefined : erreurs.rythme}>
        <select
          id={`${id}-rythme`}
          className={CHAMP}
          value={rythmePersonnalise ? PERSONNALISE : saisie.rythme}
          onChange={(e) => {
            const personnalise = e.target.value === PERSONNALISE;
            setRythmePersonnalise(personnalise);
            setSaisie((s) => ({ ...s, rythme: personnalise ? '' : e.target.value }));
          }}
        >
          {RYTHMES.map(([jours, libelle]) => (
            <option key={jours} value={String(jours)}>
              {libelle}
            </option>
          ))}
          <option value={PERSONNALISE}>Personnalisé…</option>
        </select>
      </Champ>
      {rythmePersonnalise && (
        <Champ id={`${id}-jours`} libelle="Rythme en jours" erreur={erreurs.rythme}>
          <input
            id={`${id}-jours`}
            className={CHAMP}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            {...liaison('rythme')}
            {...ariaErreur('rythme', `${id}-jours`)}
          />
        </Champ>
      )}

      <fieldset className="grid gap-1">
        <legend className="text-sm font-semibold">Anniversaire</legend>
        <div className="grid grid-cols-[4.5rem_1fr_6rem] items-end gap-2">
          <Champ id={`${id}-jour`} libelle="Jour" discret>
            <input
              id={`${id}-jour`}
              className={CHAMP}
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              {...liaison('jour')}
              {...ariaErreur('anniversaire', `${id}-anniversaire`)}
            />
          </Champ>
          <Champ id={`${id}-mois`} libelle="Mois" discret>
            <select
              id={`${id}-mois`}
              className={CHAMP}
              {...liaison('mois')}
              {...ariaErreur('anniversaire', `${id}-anniversaire`)}
            >
              <option value="">—</option>
              {MOIS.map((nom, i) => (
                <option key={nom} value={String(i + 1)}>
                  {nom}
                </option>
              ))}
            </select>
          </Champ>
          <Champ id={`${id}-annee`} libelle="Année (facultative)" discret>
            <input
              id={`${id}-annee`}
              className={CHAMP}
              type="number"
              inputMode="numeric"
              {...liaison('annee')}
              {...ariaErreur('anniversaire', `${id}-anniversaire`)}
            />
          </Champ>
        </div>
        {erreurs.anniversaire && (
          <p id={`${id}-anniversaire-erreur`} className="text-sm text-danger">
            {erreurs.anniversaire}
          </p>
        )}
      </fieldset>

      <Champ id={`${id}-notes`} libelle="Notes">
        <textarea id={`${id}-notes`} className={CHAMP} rows={3} {...liaison('notes')} />
      </Champ>

      {echec && (
        <p role="alert" className="text-sm text-danger">
          L’enregistrement a échoué. Réessaie.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="rounded-lg border border-ligne px-4 py-2 font-semibold"
        >
          Annuler
        </button>
        <button type="submit" className="rounded-lg bg-encre px-4 py-2 font-semibold text-fond">
          Enregistrer
        </button>
      </div>
    </form>
  );
}

function Champ({
  id,
  libelle,
  erreur,
  discret = false,
  children,
}: {
  id: string;
  libelle: string;
  erreur?: string;
  discret?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className={discret ? 'text-xs text-discret' : 'text-sm font-semibold'}>
        {libelle}
      </label>
      {children}
      {erreur && (
        <p id={`${id}-erreur`} className="text-sm text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}
