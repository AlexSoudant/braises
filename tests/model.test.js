import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelFor, heatLevel, nextBirthday, daysSince, visibleFriends, relativeDays } from '../js/model.js';

const today = new Date(2026, 9, 31); // 31 oct. 2026
const friend = (over = {}) => ({ id: 'x', name: 'Léa', birthday: '', cadence: 30, notes: '', exchanges: [], ...over });

test('la chaleur dépend du temps écoulé rapporté au rythme', () => {
  assert.equal(levelFor(0, 30), 0);
  assert.equal(levelFor(14, 30), 0);
  assert.equal(levelFor(15, 30), 1);
  assert.equal(levelFor(30, 30), 2);
  assert.equal(levelFor(45, 30), 3);
  assert.equal(levelFor(75, 30), 4);
  assert.equal(levelFor(40, 90), 0);
  assert.equal(levelFor(null, 30), 4);
});

test('daysSince prend l’échange le plus récent, pas le dernier saisi', () => {
  const f = friend({ exchanges: [
    { id: 'a', date: '2026-10-21', type: 'tel', note: '' },
    { id: 'b', date: '2026-09-01', type: 'bar', note: '' },
  ] });
  assert.equal(daysSince(f, today), 10);
  assert.equal(heatLevel(f, today), 0);
  assert.equal(heatLevel({ ...f, cadence: 14 }, today), 1);
  assert.equal(daysSince(friend(), today), null);
});

test('prochain anniversaire : cette année, aujourd’hui ou l’an prochain', () => {
  assert.deepEqual(pick(nextBirthday(friend({ birthday: '1993-11-04' }), today)), { days: 4, age: 33 });
  assert.deepEqual(pick(nextBirthday(friend({ birthday: '1990-10-31' }), today)), { days: 0, age: 36 });
  assert.deepEqual(pick(nextBirthday(friend({ birthday: '1990-02-17' }), today)), { days: 109, age: 37 });
  assert.equal(nextBirthday(friend(), today), null);
});

test('un 29 février est fêté le 28 les années non bissextiles', () => {
  const b = nextBirthday(friend({ birthday: '2000-02-29' }), today);
  assert.equal(b.date.getMonth(), 1);
  assert.equal(b.date.getDate(), 28);
});

test('tri « à relancer » : les plus en retard d’abord, jamais vus en tête', () => {
  const list = [
    friend({ id: '1', name: 'A', cadence: 7, exchanges: [{ id: 'e', date: '2026-10-28', type: 'msg', note: '' }] }),
    friend({ id: '2', name: 'B', cadence: 7, exchanges: [{ id: 'e', date: '2026-10-01', type: 'tel', note: '' }] }),
    friend({ id: '3', name: 'C' }),
  ];
  assert.deepEqual(visibleFriends(list, { sort: 'urgence' }, today).map(f => f.id), ['3', '2', '1']);
  assert.deepEqual(visibleFriends(list, { sort: 'urgence', filter: 'tel' }, today).map(f => f.id), ['2']);
  assert.deepEqual(visibleFriends(list, { sort: 'nom', query: 'b' }, today).map(f => f.id), ['2']);
});

test('libellés relatifs', () => {
  assert.equal(relativeDays(0), 'aujourd’hui');
  assert.equal(relativeDays(1), 'hier');
  assert.equal(relativeDays(12), 'il y a 12 j');
  assert.equal(relativeDays(95), 'il y a 3 mois');
});

function pick(b) {
  return { days: b.days, age: b.age };
}
