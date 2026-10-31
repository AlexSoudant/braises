import {
  TYPES, LEVELS, CADENCES, toIso, parseIso, startOfDay, sortedExchanges, lastExchange, daysSince,
  heatLevel, nextBirthday, cadenceLabel, relativeDays, visibleFriends, newId,
} from './model.js';
import { load, save, requestPersistence, exportJson, importJson, sampleFriends } from './store.js';

const ICONS = {
  tel: 'M5 3h3l1.5 4-2 1.2a10 10 0 0 0 4.3 4.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A13 13 0 0 1 3 5a2 2 0 0 1 2-2z',
  msg: 'M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-4 3v-3.4A2 2 0 0 1 3 12z',
  bar: 'M4 3h12l-6 7zM10 10v7M6.5 17h7',
  resto: 'M5 2v5a2 2 0 0 0 4 0V2M7 9v9M14 18V2c-2 1.5-3 4-3 7h3',
  anniv: 'M3 9h14v8H3zM2 6h16v3H2zM10 6v11M10 6C8 2 5 3 7 6M10 6c2-4 5-3 3 0',
  spont: 'M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8z',
};

let friends = load();
const ui = { sort: 'urgence', filter: null, query: '', open: null, confirmDelete: false, menu: false };
const $ = id => document.getElementById(id);
const today = () => startOfDay(new Date());

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = t => `<svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="${ICONS[t]}"/></svg>`;
const initials = n => n.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = s => {
  const d = parseIso(s);
  const opts = d.getFullYear() === today().getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('fr-FR', opts);
};

function persist() {
  if (!save(friends)) toast('Impossible d’enregistrer sur cet appareil. Exporte une sauvegarde.');
}

// ---------- liste

function birthdayCell(f, t) {
  const b = nextBirthday(f, t);
  if (!b) return '<span class="muted">—</span>';
  const d = b.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (b.days === 0) return `<span class="soon">Aujourd’hui · ${b.age} ans</span>`;
  if (b.days <= 14) return `<span class="soon">${d} · dans ${b.days} j</span>`;
  return `${d} · ${b.age} ans`;
}

function summary(t) {
  const cold = friends.filter(f => heatLevel(f, t) >= 3).length;
  const bdays = friends.filter(f => (nextBirthday(f, t)?.days ?? 99) <= 7).length;
  const parts = [`${friends.length} ami${friends.length > 1 ? 's' : ''}`];
  if (cold) parts.push(`${cold} à relancer`);
  if (bdays) parts.push(`${bdays} anniversaire${bdays > 1 ? 's' : ''} cette semaine`);
  return parts.join(' · ');
}

function renderList() {
  const t = today();
  $('summary').textContent = friends.length ? summary(t) : 'Garde tes amitiés au chaud.';
  $('tools').hidden = !friends.length;
  document.querySelectorAll('[data-sort]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sort === ui.sort));
  $('filters').innerHTML = `<button class="chip" data-filter="" aria-pressed="${!ui.filter}">Tous</button>` +
    Object.entries(TYPES).map(([k, l]) => `<button class="chip" data-filter="${k}" aria-pressed="${ui.filter === k}">${icon(k)}${l}</button>`).join('');

  if (!friends.length) {
    $('list').innerHTML = `<div class="empty-state">
      <h2>Aucun ami pour l’instant</h2>
      <p>Ajoute une personne, choisis à quel rythme tu veux la voir, puis note vos échanges. La couleur te dira quand la relancer.</p>
      <div class="row-btns"><button class="btn primary" data-act="new">Ajouter mon premier ami</button>
      <button class="btn" data-act="samples">Essayer avec des exemples</button></div></div>`;
    return;
  }

  const list = visibleFriends(friends, ui, t);
  const rows = list.map(f => {
    const last = lastExchange(f), d = daysSince(f, t), lv = heatLevel(f, t);
    return `<button class="row" data-open="${f.id}">
      <span class="heat h${lv} num" title="${LEVELS[lv]}">${d === null ? '<b>—</b>' : `<b>${d}</b><small>jour${d > 1 ? 's' : ''}</small>`}</span>
      <span class="cell"><span class="name">${esc(f.name)}</span><span class="sub">${esc(f.notes) || '&nbsp;'}</span></span>
      <span class="cell">${last ? `<span class="typ">${icon(last.type)}${TYPES[last.type]}</span><span class="sub num">${fmtDate(last.date)} · ${relativeDays(d)}</span>` : '<span class="muted">Aucun échange noté</span>'}</span>
      <span class="cell num">${birthdayCell(f, t)}</span>
      <span class="cell muted">${cadenceLabel(f.cadence)}</span>
    </button>`;
  }).join('');
  $('list').innerHTML = `<div class="table">
    <div class="row head" aria-hidden="true"><span></span><span>Ami</span><span>Dernier échange</span><span>Anniversaire</span><span>Rythme</span></div>
    ${rows || '<p class="none">Personne ne correspond à ce filtre.</p>'}</div>`;
}

// ---------- fiche ami

function renderSheet() {
  const t = today();
  const f = friends.find(x => x.id === ui.open) ?? null;
  const lv = f ? heatLevel(f, t) : 0;
  const d = f ? daysSince(f, t) : null;
  const cadence = f ? f.cadence : 30;
  const counts = f ? Object.keys(TYPES).map(k => [k, f.exchanges.filter(x => x.type === k).length]).filter(([, n]) => n) : [];

  $('sheet').innerHTML = `
    <div class="bar">${f ? `<span class="pip h${lv}">${esc(initials(f.name))}</span>` : ''}
      <h2 id="sheet-title">${f ? esc(f.name) : 'Nouvel ami'}</h2>
      <button class="x" data-act="close" aria-label="Fermer">×</button></div>

    ${f ? `<div class="stats">
      <span class="stat h${lv}"><b class="num">${d === null ? '—' : `${d} j`}</b>${LEVELS[lv]}</span>
      <span class="stat"><b class="num">${f.exchanges.length}</b>échange${f.exchanges.length > 1 ? 's' : ''}</span>
      ${counts.map(([k, n]) => `<span class="stat"><b class="num typ">${icon(k)}${n}</b>${TYPES[k]}</span>`).join('')}</div>

    <form class="f" id="log-form"><h3>Noter un échange</h3>
      <div class="types" role="radiogroup" aria-label="Type d’échange">${Object.entries(TYPES).map(([k, l], i) =>
        `<label><input type="radio" name="x-type" value="${k}" ${i === 0 ? 'checked' : ''}>${icon(k)}${l}</label>`).join('')}</div>
      <div class="two"><label>Date<input type="date" id="x-date" value="${toIso(t)}" max="${toIso(t)}" required></label>
        <label>Note<input id="x-note" maxlength="200" placeholder="Ex. brunch, bonne nouvelle…"></label></div>
      <button class="btn primary">Ajouter l’échange</button></form>` : ''}

    <form class="f" id="friend-form"><h3>Informations</h3>
      <label>Prénom ou surnom<input id="f-name" required maxlength="60" value="${f ? esc(f.name) : ''}"></label>
      <div class="two"><label>Anniversaire<input type="date" id="f-bday" value="${f ? f.birthday : ''}" max="${toIso(t)}"></label>
        <label>Rythme souhaité<select id="f-cadence">${CADENCES.map(([v, l]) => `<option value="${v}" ${v === cadence ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <label>Notes<textarea id="f-notes" rows="3" maxlength="500" placeholder="Ce qui compte pour cette personne en ce moment">${f ? esc(f.notes) : ''}</textarea></label>
      <button class="btn">${f ? 'Enregistrer' : 'Créer la fiche'}</button></form>

    ${f && f.exchanges.length ? `<section><h3>Historique</h3><div class="hist">${sortedExchanges(f).map(x => `<div>${icon(x.type)}
      <span class="grow"><b>${TYPES[x.type]}</b> <span class="muted num">· ${fmtDate(x.date)}</span>${x.note ? `<br><span class="sub">${esc(x.note)}</span>` : ''}</span>
      <button data-act="del-ex" data-id="${x.id}" aria-label="Supprimer l’échange du ${fmtDate(x.date)}">×</button></div>`).join('')}</div></section>` : ''}

    ${f ? `<section class="danger">${ui.confirmDelete
      ? `<p>Supprimer ${esc(f.name)} et ses ${f.exchanges.length} échanges ? C’est définitif.</p>
         <div class="row-btns"><button class="btn danger-btn" data-act="del-friend">Supprimer</button><button class="btn" data-act="cancel-del">Annuler</button></div>`
      : `<button class="link" data-act="ask-del">Supprimer cet ami</button>`}</section>` : ''}`;

  $('sheet').hidden = false;
  $('scrim').hidden = false;
  document.body.classList.add('locked');

  $('friend-form').onsubmit = e => {
    e.preventDefault();
    const data = {
      name: $('f-name').value.trim(),
      birthday: $('f-bday').value,
      cadence: +$('f-cadence').value,
      notes: $('f-notes').value.trim(),
    };
    if (!data.name) return;
    if (f) {
      Object.assign(f, data);
      toast('Fiche enregistrée');
    } else {
      const nf = { id: newId(), exchanges: [], ...data };
      friends.push(nf);
      ui.open = nf.id;
      toast(`${data.name} ajouté·e. Note votre dernier échange.`);
    }
    persist();
    refresh();
  };

  const logForm = $('log-form');
  if (logForm) logForm.onsubmit = e => {
    e.preventDefault();
    const type = logForm.querySelector('input[name="x-type"]:checked').value;
    f.exchanges.push({ id: newId(), date: $('x-date').value || toIso(t), type, note: $('x-note').value.trim() });
    persist();
    toast(`Échange noté : ${TYPES[type]} avec ${f.name}`);
    refresh();
  };
}

function openSheet(id) {
  ui.open = id;
  ui.confirmDelete = false;
  renderSheet();
  $('sheet').scrollTop = 0;
  (id ? $('sheet').querySelector('.x') : $('f-name')).focus();
}

function closeSheet() {
  ui.open = null;
  $('sheet').hidden = true;
  $('scrim').hidden = true;
  document.body.classList.remove('locked');
}

function refresh() {
  renderList();
  if (ui.open !== null) renderSheet();
}

// ---------- sauvegarde

async function exportBackup() {
  const name = `braises-${toIso(today())}.json`;
  const file = new File([exportJson(friends)], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Sauvegarde Braises' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importBackup(file) {
  try {
    const imported = importJson(await file.text());
    friends = imported;
    persist();
    toast(`${imported.length} ami${imported.length > 1 ? 's' : ''} restauré${imported.length > 1 ? 's' : ''}`);
    refresh();
  } catch (e) {
    toast(e.message);
  }
}

// ---------- divers

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function setMenu(open) {
  ui.menu = open;
  $('menu').hidden = !open;
  $('menu-btn').setAttribute('aria-expanded', open);
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-open],[data-act],[data-sort],[data-filter]');
  if (ui.menu && !e.target.closest('#menu,#menu-btn')) setMenu(false);
  if (!t) return;
  if (t.dataset.open) return openSheet(t.dataset.open);
  if (t.dataset.sort) { ui.sort = t.dataset.sort; return renderList(); }
  if (t.dataset.filter !== undefined) { ui.filter = t.dataset.filter || null; return renderList(); }
  const f = friends.find(x => x.id === ui.open);
  switch (t.dataset.act) {
    case 'new': return openSheet('');
    case 'close': return closeSheet();
    case 'menu': return setMenu(!ui.menu);
    case 'samples': friends = sampleFriends(today()); persist(); return refresh();
    case 'export': setMenu(false); return exportBackup();
    case 'import': setMenu(false); return $('import-file').click();
    case 'del-ex':
      f.exchanges = f.exchanges.filter(x => x.id !== t.dataset.id);
      persist();
      return refresh();
    case 'ask-del': ui.confirmDelete = true; return renderSheet();
    case 'cancel-del': ui.confirmDelete = false; return renderSheet();
    case 'del-friend':
      friends = friends.filter(x => x.id !== ui.open);
      persist();
      toast(`${f.name} supprimé·e`);
      closeSheet();
      return renderList();
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (ui.menu) setMenu(false);
  else if (ui.open !== null) closeSheet();
});

$('search').addEventListener('input', e => { ui.query = e.target.value; renderList(); });
$('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file) importBackup(file);
});

// Le jour change quand l'appli revient au premier plan le lendemain.
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

requestPersistence();
renderList();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
