import { describe, expect, test } from 'vitest';
import {
  amisVisibles,
  chaleur,
  chaleurPour,
  joursDepuis,
  joursRelatifs,
  prochainAnniversaire,
  saisieDepuis,
  suivre,
  validerAmi,
  type Ami,
  type Echange,
  type SaisieAmi,
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

  test('sans année : les jours restants sont connus, pas l’âge', () => {
    expect(resume('--11-04')).toEqual({ jours: 4, age: null });
    expect(resume('--10-31')).toEqual({ jours: 0, age: null });
    expect(resume('--02-17')).toEqual({ jours: 109, age: null });
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

describe('validation d’un Ami', () => {
  const saisie = (champs: Partial<SaisieAmi> = {}): SaisieAmi => ({
    nom: 'Léa',
    rythme: '30',
    jour: '',
    mois: '',
    annee: '',
    notes: '',
    ...champs,
  });

  test('un nom et un Rythme suffisent ; le nom est nettoyé des espaces', () => {
    expect(validerAmi(saisie({ nom: '  Léa ' }), aujourdhui)).toEqual({
      ok: true,
      ami: { nom: 'Léa', rythme: 30 },
    });
  });

  test('l’anniversaire se saisit avec ou sans année', () => {
    const anniversaire = (jour: string, mois: string, annee = '') => {
      const r = validerAmi(saisie({ jour, mois, annee }), aujourdhui);
      return r.ok ? r.ami.anniversaire : r.erreurs.anniversaire;
    };
    expect(anniversaire('4', '11', '1993')).toBe('1993-11-04');
    expect(anniversaire('4', '11')).toBe('--11-04');
    expect(anniversaire('29', '2')).toBe('--02-29');
    expect(anniversaire('29', '2', '2000')).toBe('2000-02-29');
    expect(anniversaire('', '')).toBeUndefined();
  });

  test.each([
    ['31', '2', '', 'Cette date n’existe pas.'],
    ['29', '2', '2001', 'Cette date n’existe pas.'],
    ['4', '', '', 'Indique le jour et le mois de l’anniversaire.'],
    ['', '', '1993', 'Indique le jour et le mois de l’anniversaire.'],
    ['4', '11', '93', 'L’année s’écrit sur 4 chiffres.'],
    ['4', '11', '0050', 'Cette année n’est pas plausible.'],
    ['4', '11', '2027', 'Cette date est dans le futur.'],
  ])('refuse l’anniversaire %s/%s/%s', (jour, mois, annee, message) => {
    const r = validerAmi(saisie({ jour, mois, annee }), new Date(2026, 9, 31));
    expect(!r.ok && r.erreurs.anniversaire).toBe(message);
  });

  test('les notes sont nettoyées, et omises si vides', () => {
    const notes = (n: string) => {
      const r = validerAmi(saisie({ notes: n }), aujourdhui);
      return r.ok && r.ami.notes;
    };
    expect(notes('  Aime le jazz. ')).toBe('Aime le jazz.');
    expect(notes('   ')).toBeUndefined();
  });

  test('refuse un nom vide', () => {
    expect(validerAmi(saisie({ nom: '   ' }), aujourdhui)).toEqual({
      ok: false,
      erreurs: { nom: 'Le nom est obligatoire.' },
    });
  });

  test.each(['0', '-7', '2.5', 'abc', '', '1e1', '0x10'])('refuse le Rythme « %s »', (rythme) => {
    const resultat = validerAmi(saisie({ rythme }), aujourdhui);
    expect(resultat.ok).toBe(false);
    expect(!resultat.ok && resultat.erreurs.rythme).toMatch(/entier de jours/);
  });
});

test('modifier un Ami sans rien changer redonne le même Ami', () => {
  const amis: Ami[] = [
    { id: 'a', nom: 'Léa', rythme: 21, anniversaire: '1995-11-12', notes: 'Coloc' },
    { id: 'b', nom: 'Sami', rythme: 30, anniversaire: '--02-29' },
    { id: 'c', nom: 'Paul', rythme: 7 },
  ];
  for (const { id, ...ami } of amis) {
    expect(validerAmi(saisieDepuis({ id, ...ami }), aujourdhui)).toEqual({ ok: true, ami });
  }
});
