import { chargerExemples, useRegistre } from '../data/db';
import {
  amisVisibles,
  chaleur,
  joursDepuis,
  joursRelatifs,
  libelleRythme,
  prochainAnniversaire,
  TYPES_ECHANGE,
  type AmiSuivi,
} from '../domain/model';
import { BadgeChaleur } from './BadgeChaleur';
import { ouvrirCreation, ouvrirFiche } from './navigation';

export function Registre({ aujourdhui }: { aujourdhui: Date }) {
  const suivis = useRegistre();
  if (!suivis) return null;
  if (suivis.length === 0) return <Vide aujourdhui={aujourdhui} />;
  return (
    <section className="grid gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={ouvrirCreation}
          className="rounded-lg bg-encre px-4 py-2 font-semibold text-fond"
        >
          Ajouter un ami
        </button>
      </div>
      <ul className="grid gap-2">
        {amisVisibles(suivis, { tri: 'aRelancer' }, aujourdhui).map((s) => (
          <Ligne key={s.ami.id} suivi={s} aujourdhui={aujourdhui} />
        ))}
      </ul>
    </section>
  );
}

function Ligne({ suivi, aujourdhui }: { suivi: AmiSuivi; aujourdhui: Date }) {
  const niveau = chaleur(suivi, aujourdhui);
  const jours = joursDepuis(suivi, aujourdhui);
  const anniv = prochainAnniversaire(suivi.ami, aujourdhui);
  return (
    <li>
      <button
        type="button"
        onClick={() => ouvrirFiche(suivi.ami.id)}
        className="flex w-full items-center gap-3 rounded-xl border border-ligne bg-surface p-3 text-left"
      >
        <BadgeChaleur niveau={niveau} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{suivi.ami.nom}</p>
          <p className="text-sm text-discret">
            {suivi.dernier
              ? `${TYPES_ECHANGE[suivi.dernier.type]} · ${joursRelatifs(jours!)}`
              : 'Aucun échange'}
            {' · '}
            {libelleRythme(suivi.ami.rythme)}
          </p>
        </div>
        {anniv && anniv.jours <= 30 && (
          <span className="text-sm text-discret tabular-nums">
            🎂 {anniv.jours === 0 ? 'aujourd’hui' : `J-${anniv.jours}`}
          </span>
        )}
      </button>
    </li>
  );
}

function Vide({ aujourdhui }: { aujourdhui: Date }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-ligne p-8 text-center">
      <p className="text-discret">Aucun ami pour l’instant.</p>
      <button
        type="button"
        className="rounded-lg bg-encre px-4 py-2 font-semibold text-fond"
        onClick={ouvrirCreation}
      >
        Ajouter mon premier ami
      </button>
      <button
        type="button"
        className="rounded-lg border border-ligne px-4 py-2 font-semibold"
        onClick={() => void chargerExemples(aujourdhui)}
      >
        Essayer avec des exemples
      </button>
    </div>
  );
}
