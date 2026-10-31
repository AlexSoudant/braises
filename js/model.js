// Logique pure de Braises : dates, chaleur, anniversaires, tri. Aucun accès au DOM ni au stockage.

export const TYPES = {
  tel: 'Téléphone',
  msg: 'Message',
  bar: 'Bar',
  resto: 'Restaurant',
  anniv: 'Anniversaire',
  spont: 'Spontané',
};

export const LEVELS = ['Brûlant', 'Chaud', 'Tiède', 'Refroidi', 'Glacé'];

export const CADENCES = [
  [7, 'Chaque semaine'],
  [14, 'Toutes les 2 sem.'],
  [30, 'Chaque mois'],
  [60, 'Tous les 2 mois'],
  [90, 'Chaque trimestre'],
  [180, 'Deux fois par an'],
];

const DAY = 86400000;

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(later, earlier) {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / DAY);
}

export function sortedExchanges(friend) {
  return [...friend.exchanges].sort((a, b) => b.date.localeCompare(a.date));
}

export function lastExchange(friend) {
  return sortedExchanges(friend)[0] ?? null;
}

export function daysSince(friend, today) {
  const last = lastExchange(friend);
  return last ? daysBetween(today, parseIso(last.date)) : null;
}

// Rapport entre le temps écoulé et le rythme souhaité : 1 = pile à l'heure.
export function overdueRatio(friend, today) {
  const d = daysSince(friend, today);
  return d === null ? Infinity : d / friend.cadence;
}

export function levelFor(days, cadence) {
  if (days === null) return 4;
  const r = days / cadence;
  if (r < 0.5) return 0;
  if (r < 1) return 1;
  if (r < 1.5) return 2;
  if (r < 2.5) return 3;
  return 4;
}

export function heatLevel(friend, today) {
  return levelFor(daysSince(friend, today), friend.cadence);
}

export function nextBirthday(friend, today) {
  if (!friend.birthday) return null;
  const b = parseIso(friend.birthday);
  const t = startOfDay(today);
  let next = birthdayInYear(b, t.getFullYear());
  if (next < t) next = birthdayInYear(b, t.getFullYear() + 1);
  return { date: next, days: daysBetween(next, t), age: next.getFullYear() - b.getFullYear() };
}

// Un 29 février est fêté le 28 les années non bissextiles.
function birthdayInYear(b, year) {
  const d = new Date(year, b.getMonth(), b.getDate());
  return d.getMonth() === b.getMonth() ? d : new Date(year, b.getMonth() + 1, 0);
}

export function cadenceLabel(days) {
  const found = CADENCES.find(([d]) => d === days);
  return found ? found[1] : `Tous les ${days} j`;
}

export function relativeDays(n) {
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'hier';
  if (n < 60) return `il y a ${n} j`;
  return `il y a ${Math.round(n / 30)} mois`;
}

export const SORTS = {
  urgence: today => (a, b) => overdueRatio(b, today) - overdueRatio(a, today) || a.name.localeCompare(b.name, 'fr'),
  nom: () => (a, b) => a.name.localeCompare(b.name, 'fr'),
  anniv: today => (a, b) => (nextBirthday(a, today)?.days ?? Infinity) - (nextBirthday(b, today)?.days ?? Infinity) || a.name.localeCompare(b.name, 'fr'),
};

export function visibleFriends(friends, { sort, filter, query }, today) {
  const q = (query ?? '').trim().toLocaleLowerCase('fr');
  return friends
    .filter(f => !filter || lastExchange(f)?.type === filter)
    .filter(f => !q || f.name.toLocaleLowerCase('fr').includes(q))
    .sort(SORTS[sort](today));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
