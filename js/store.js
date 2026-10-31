// Persistance locale (localStorage) et sauvegarde JSON. Les données ne quittent jamais l'appareil.
import { TYPES, newId, toIso } from './model.js';

const KEY = 'braises.v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return validate(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function save(friends) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, friends }));
    return true;
  } catch {
    return false;
  }
}

export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}

export function exportJson(friends) {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), friends }, null, 2);
}

// Lève une erreur lisible si le fichier n'est pas une sauvegarde Braises.
export function importJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Ce fichier n’est pas un JSON valide.');
  }
  if (!Array.isArray(data?.friends)) throw new Error('Ce fichier n’est pas une sauvegarde Braises.');
  return validate(data);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function validate(data) {
  if (!data || !Array.isArray(data.friends)) return [];
  return data.friends
    .filter(f => f && typeof f.name === 'string' && f.name.trim())
    .map(f => ({
      id: String(f.id || newId()),
      name: f.name.trim(),
      birthday: ISO.test(f.birthday ?? '') ? f.birthday : '',
      cadence: Number.isFinite(+f.cadence) && +f.cadence > 0 ? +f.cadence : 30,
      notes: typeof f.notes === 'string' ? f.notes : '',
      exchanges: (Array.isArray(f.exchanges) ? f.exchanges : [])
        .filter(x => x && ISO.test(x.date ?? '') && x.type in TYPES)
        .map(x => ({ id: String(x.id || newId()), date: x.date, type: x.type, note: typeof x.note === 'string' ? x.note : '' })),
    }));
}

export function sampleFriends(today) {
  const ago = n => toIso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));
  return [
    ['Camille', '1993-11-04', 14, 'Aime le jazz. Vient de changer de boulot.', [[3, 'resto', 'Pizza chez Gino'], [21, 'tel'], [40, 'bar']]],
    ['Hugo', '1990-02-17', 30, 'Papa depuis juin.', [[9, 'msg'], [33, 'bar', 'Afterwork']]],
    ['Léa', '1995-11-12', 7, 'Coloc de fac.', [[18, 'tel'], [30, 'spont', 'Croisée au marché']]],
    ['Thomas', '1988-06-30', 90, 'Vit à Lyon.', [[130, 'anniv'], [200, 'bar']]],
    ['Inès', '1996-12-02', 30, '', [[1, 'spont', 'Café improvisé'], [12, 'msg']]],
    ['Karim', '1987-09-21', 60, 'Rencontré au club d’escalade.', []],
  ].map(([name, birthday, cadence, notes, ex]) => ({
    id: newId(), name, birthday, cadence, notes,
    exchanges: ex.map(([n, type, note]) => ({ id: newId(), date: ago(n), type, note: note ?? '' })),
  }));
}
