// Biblioteca de hábitos: sugestões prontas por setor para montar a rotina.
import { state } from '../store.js';
import { HABIT_LIBRARY, SECTORS, SECTOR_IDS, DIFFICULTY, QUEST_TYPES } from '../data.js';
import { icon } from '../sprites.js';
import { actions, esc, openModal, modalHead } from '../ui.js';
import { WEEKDAYS_1 } from '../dates.js';
import { openQuestForm } from './quests.js';
import { openPostForm } from './content.js';

let libSector = null;

const added = (title) => state.quests.some((q) => !q.archived && q.title.toLowerCase() === title.toLowerCase());

function describe(it) {
  if (it.kind === 'post') return 'Abre o calendário de posts com data e horário';
  const parts = [QUEST_TYPES[it.type]];
  if (it.type === 'daily') parts.push(it.days?.length && it.days.length < 7 ? it.days.map((d) => WEEKDAYS_1[d]).join(' ') : 'todo dia');
  if (it.time) parts.push(`às ${it.time}`);
  parts.push(DIFFICULTY[it.diff]?.name);
  if (it.type === 'habit') parts.push(it.negative ? 'ruim: tira HP' : 'bom: dá XP');
  return parts.filter(Boolean).join(' · ');
}

function itemIcon(it) {
  if (it.kind === 'post') return 'phone';
  if (it.type === 'habit') return it.negative ? 'skull' : 'plus';
  return it.time ? 'clock' : 'scroll';
}

export function openLibrary(sector) {
  libSector = (sector && HABIT_LIBRARY[sector] && sector) || (HABIT_LIBRARY[libSector] && libSector) || state.settings.sectors.find((s) => HABIT_LIBRARY[s]) || 'alimentacao';
  const enabled = state.settings.sectors;
  const order = [...enabled, ...SECTOR_IDS.filter((id) => !enabled.includes(id))].filter((id) => HABIT_LIBRARY[id]);
  const items = HABIT_LIBRARY[libSector];
  openModal(`${modalHead('Biblioteca de hábitos', 'book')}
    <p class="small muted">Toque numa sugestão para ajustar horário, dias e dificuldade antes de adicionar.${enabled.includes(libSector) ? '' : ' Este setor será ativado.'}</p>
    <div class="chips scroll-x">${order.map((id) => `<button class="chip ${id === libSector ? 'sel' : ''}" data-act="lib-sector" data-id="${id}" style="--c:${SECTORS[id].color}">${icon(SECTORS[id].icon, 12)}${SECTORS[id].name}</button>`).join('')}</div>
    <div class="lib-list">${items.map((it, i) => {
      const ok = it.kind !== 'post' && added(it.title);
      return `<button class="lib-item ${ok ? 'added' : ''}" data-act="lib-pick" data-i="${i}">
        ${icon(itemIcon(it), 18)}<span class="grow"><b>${esc(it.title)}</b><small>${esc(describe(it))}</small></span>
        <span class="lib-add">${ok ? '✓' : '+'}</span></button>`;
    }).join('')}</div>`, { wide: true, onOpen: (m) => m.querySelector('.chip.sel')?.scrollIntoView({ inline: 'center', block: 'nearest' }) });
}

actions['lib-open'] = (el) => openLibrary(el.dataset.sector);
actions['lib-sector'] = (el) => openLibrary(el.dataset.id);
actions['lib-reopen'] = () => openLibrary(libSector);
actions['lib-pick'] = (el) => {
  const it = HABIT_LIBRARY[libSector][Number(el.dataset.i)];
  if (it.kind === 'post') {
    openPostForm({ title: '' }, { back: 'library' });
    return;
  }
  openQuestForm({
    title: it.title, sector: libSector, type: it.type, diff: it.diff, days: it.days || [], time: it.time || null,
    remind: it.remind ?? (it.time ? 0 : null), positive: it.type === 'habit' ? !it.negative : true, negative: !!it.negative,
  }, { back: 'library' });
};
