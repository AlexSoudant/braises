import { describe, expect, test } from 'vitest';
import {
  amisVisibles,
  chaleur,
  chaleurPour,
  joursDepuis,
  joursRelatifs,
  prochainAnniversaire,
  suivre,
  type Ami,
  type Echange,
  type Vue,
} from './model';

const aujourdhui = new Date(2026, 9, 31); // 31 oct. 2026
const ami = (champs: Partial<Ami> = {}): Ami => ({ id: 'x', nom: 'Léa', rythme: 30, ...champs });
const echange = (amiId: string, date: string, type: Echange['type'] = 'tel'): Echange => ({
  id: `${amiId}-${date}`,
  amiId,
  date,
  type,
});

describe('Chaleur', () => {
  test('dépend du temps écoulé rapporté au Rythme', () => {
    expect(chaleurPour(0, 30)).toBe(0);
    expect(chaleurPour(14, 30)).toBe(0);
    expect(chaleurPour(15, 30)).toBe(1);
    expect(chaleurPour(30, 30)).toBe(2);
    expect(chaleurPour(45, 30)).toBe(3);
    expect(chaleurPour(75, 30)).toBe(4);
    expect(chaleurPour(40, 90)).toBe(0);
    expect(chaleurPour(null, 30)).toBe(4);
  });

  test('part de l’Échange le plus récent, pas du dernier saisi', () => {
    const [suivi] = suivre([ami()], [echange('x', '2026-10-21'), echange('x', '2026-09-01', 'bar')]);
    expect(joursDepuis(suivi, aujourdhui)).toBe(10);
    expect(chaleur(suivi, aujourdhui)).toBe(0);
    expect(chaleur({ ...suivi, ami: ami({ rythme: 14 }) }, aujourdhui)).toBe(1);
  });

  test('un Ami sans Échange est Glacé', () => {
    const [suivi] = suivre([ami()], [echange('autre', '2026-10-30')]);
    expect(suivi.dernier).toBeNull();
    expect(chaleur(suivi, aujourdhui)).toBe(4);
  });
});

describe('prochain anniversaire', () => {
  const resume = (anniversaire?: string) => {
    const p = prochainAnniversaire(ami({ anniversaire }), aujourdhui);
    return p && { jours: p.jours, age: p.age };
  };

  test('cette année, aujourd’hui ou l’an prochain', () => {
    expect(resume('1993-11-04')).toEqual({ jours: 4, age: 33 });
    expect(resume('1990-10-31')).toEqual({ jours: 0, age: 36 });
    expect(resume('1990-02-17')).toEqual({ jours: 109, age: 37 });
    expect(resume()).toBeNull();
  });

  test('un 29 février est fêté le 28 les années non bissextiles', () => {
    const p = prochainAnniversaire(ami({ anniversaire: '2000-02-29' }), aujourdhui)!;
    expect([p.date.getMonth(), p.date.getDate()]).toEqual([1, 28]);
  });
});

test('tri « à relancer » : les plus en retard d’abord, jamais vus en tête', () => {
  const suivis = suivre(
    [
      ami({ id: '1', nom: 'A', rythme: 7 }),
      ami({ id: '2', nom: 'B', rythme: 7 }),
      ami({ id: '3', nom: 'C' }),
    ],
    [echange('1', '2026-10-28', 'msg'), echange('2', '2026-10-01', 'tel')],
  );
  const ids = (vue: Vue) => amisVisibles(suivis, vue, aujourdhui).map((s) => s.ami.id);
  expect(ids({ tri: 'aRelancer' })).toEqual(['3', '2', '1']);
  expect(ids({ tri: 'aRelancer', type: 'tel' })).toEqual(['2']);
  expect(ids({ tri: 'nom', recherche: 'b' })).toEqual(['2']);
});

test('libellés relatifs', () => {
  expect(joursRelatifs(0)).toBe('aujourd’hui');
  expect(joursRelatifs(1)).toBe('hier');
  expect(joursRelatifs(12)).toBe('il y a 12 j');
  expect(joursRelatifs(95)).toBe('il y a 3 mois');
});
