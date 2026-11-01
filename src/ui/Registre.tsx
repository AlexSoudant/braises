import { chargerExemples, useRegistre } from '../data/db';
import {
  amisVisibles,
  chaleur,
  joursDepuis,
  joursRelatifs,
  libelleRythme,
  NIVEAUX_CHALEUR,
  prochainAnniversaire,
  TYPES_ECHANGE,
  type AmiSuivi,
  type Chaleur,
} from '../domain/model';

// Classes complètes écrites en clair pour que Tailwind les détecte.
const BADGE: Record<Chaleur, string> = {
  0: 'bg-chaleur-0 text-chaleur-0-texte',
  1: 'bg-chaleur-1 text-chaleur-1-texte',
  2: 'bg-chaleur-2 text-chaleur-2-texte',
  3: 'bg-chaleur-3 text-chaleur-3-texte',
  4: 'bg-chaleur-4 text-chaleur-4-texte',
};

export function Registre({ aujourdhui }: { aujourdhui: Date }) {
  const suivis = useRegistre();
  if (!suivis) return null;
  if (suivis.length === 0) return <Vide aujourdhui={aujourdhui} />;
  return (
    <ul className="grid gap-2">
      {amisVisibles(suivis, { tri: 'aRelancer' }, aujourdhui).map((s) => (
        <Ligne key={s.ami.id} suivi={s} aujourdhui={aujourdhui} />
      ))}
    </ul>
  );
}

function Ligne({ suivi, aujourdhui }: { suivi: AmiSuivi; aujourdhui: Date }) {
  const niveau = chaleur(suivi, aujourdhui);
  const jours = joursDepuis(suivi, aujourdhui);
  const anniv = prochainAnniversaire(suivi.ami, aujourdhui);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-ligne bg-surface p-3">
      <span
        className={`w-20 shrink-0 rounded-lg px-2 py-1 text-center text-sm font-semibold ${BADGE[niveau]}`}
      >
        {NIVEAUX_CHALEUR[niveau]}
      </span>
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
        onClick={() => void chargerExemples(aujourdhui)}
      >
        Essayer avec des exemples
      </button>
    </div>
  );
}
