import { useRef, useState } from 'react';
import { chargerExemples, useRegistre } from '../data/db';
import {
  amisVisibles,
  chaleur,
  joursDepuis,
  joursRelatifs,
  libelleAge,
  libelleRythme,
  prochainAnniversaire,
  TYPES_ECHANGE,
  type AmiSuivi,
  type Tri,
  type TypeEchange,
} from '../domain/model';
import { BadgeChaleur } from './BadgeChaleur';
import { CHAMP } from './formulaire';
import { LegendeChaleur } from './LegendeChaleur';
import { ouvrirCreation, ouvrirFiche } from './navigation';
import { lireTri, retenirTri } from './preferences';
import { RappelSauvegarde } from './RappelSauvegarde';

const LIBELLES_TRI: Record<Tri, string> = {
  aRelancer: 'À relancer',
  nom: 'Par nom',
  anniversaire: 'Par anniversaire',
};

export function Registre({ aujourdhui }: { aujourdhui: Date }) {
  const suivis = useRegistre();
  const boutonAjouter = useRef<HTMLButtonElement>(null);
  const champFiltre = useRef<HTMLSelectElement>(null);
  const champRecherche = useRef<HTMLInputElement>(null);
  const [tri, setTri] = useState(lireTri);
  const [type, setType] = useState<TypeEchange | ''>('');
  const [recherche, setRecherche] = useState('');
  if (!suivis) return null;
  if (suivis.length === 0) return <Vide aujourdhui={aujourdhui} />;

  const visibles = amisVisibles(suivis, { tri, type: type || undefined, recherche }, aujourdhui);
  const choisirTri = (t: Tri) => {
    setTri(t);
    retenirTri(t);
  };
  // Les boutons qui retirent filtre et recherche disparaissent avec eux : le focus va au champ concerné.
  const retirerFiltre = () => {
    setType('');
    champFiltre.current?.focus();
  };
  const toutAfficher = () => {
    setRecherche('');
    setType('');
    champRecherche.current?.focus();
  };

  return (
    <section className="grid gap-3">
      <RappelSauvegarde nombreAmis={suivis.length} aujourdhui={aujourdhui} focusEnPartant={boutonAjouter} />
      <div className="flex justify-end">
        <button
          ref={boutonAjouter}
          type="button"
          onClick={ouvrirCreation}
          className="rounded-lg bg-encre px-4 py-2 font-semibold text-fond"
        >
          Ajouter un ami
        </button>
      </div>
      <div className="grid gap-2">
        <input
          ref={champRecherche}
          type="search"
          aria-label="Rechercher un ami"
          placeholder="Rechercher un ami"
          className={CHAMP}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs text-discret">
            Trier
            <select
              className={`${CHAMP} text-base text-encre`}
              value={tri}
              onChange={(e) => choisirTri(e.target.value as Tri)}
            >
              {(Object.entries(LIBELLES_TRI) as [Tri, string][]).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-discret">
            Dernier échange
            <select
              ref={champFiltre}
              className={`${CHAMP} text-base text-encre`}
              value={type}
              onChange={(e) => setType(e.target.value as TypeEchange | '')}
            >
              <option value="">Tous les types</option>
              {(Object.entries(TYPES_ECHANGE) as [TypeEchange, string][]).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
          </label>
        </div>
        {type && (
          <button
            type="button"
            aria-label={`Retirer le filtre ${TYPES_ECHANGE[type]}`}
            onClick={retirerFiltre}
            className="justify-self-start rounded-full border border-encre px-3 py-1 text-sm font-semibold"
          >
            {TYPES_ECHANGE[type]} <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>
      {/* Toujours présente, cette zone annonce aux lecteurs d'écran le résultat d'une recherche ou d'un filtre. */}
      <p aria-live="polite" className="sr-only">
        {recherche.trim() || type ? annonceResultat(visibles.length) : ''}
      </p>
      {visibles.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-ligne p-6 text-center">
          <p className="text-discret">Aucun ami ne correspond.</p>
          <button
            type="button"
            onClick={toutAfficher}
            className="rounded-lg border border-ligne px-4 py-2 font-semibold"
          >
            Tout afficher
          </button>
        </div>
      ) : (
        <ul aria-label="Amis" className="grid gap-2">
          {visibles.map((s) => (
            <Ligne key={s.ami.id} suivi={s} aujourdhui={aujourdhui} />
          ))}
        </ul>
      )}
      <LegendeChaleur />
    </section>
  );
}

function annonceResultat(n: number): string {
  if (n === 0) return 'Aucun résultat';
  return n === 1 ? '1 ami affiché' : `${n} amis affichés`;
}

function Ligne({ suivi, aujourdhui }: { suivi: AmiSuivi; aujourdhui: Date }) {
  const niveau = chaleur(suivi, aujourdhui);
  const jours = joursDepuis(suivi, aujourdhui);
  const anniv = prochainAnniversaire(suivi.ami, aujourdhui);
  const fete = anniv?.jours === 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => ouvrirFiche(suivi.ami.id)}
        className={`flex w-full items-center gap-3 rounded-xl border border-ligne bg-surface p-3 text-left ${fete ? 'ring-2 ring-accent' : ''}`}
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
          {/* L'anniversaire du jour est écrit en toutes lettres : la bordure ne fait que le souligner. */}
          {fete && (
            <p className="text-sm font-semibold">
              {anniv.age === null
                ? '🎂 Anniversaire aujourd’hui'
                : `🎂 Anniversaire aujourd’hui · ${libelleAge(anniv.age)}`}
            </p>
          )}
        </div>
        {anniv && !fete && anniv.jours <= 30 && (
          <span className="text-sm text-discret tabular-nums">{`🎂 J-${anniv.jours}`}</span>
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
