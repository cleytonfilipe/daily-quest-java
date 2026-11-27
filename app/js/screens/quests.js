// Missões, hábitos e objetivos: listas, formulários e ações.
import { state, save, dayLog } from '../store.js';
import { SECTORS, DIFFICULTY, QUEST_TYPES } from '../data.js';
import { icon } from '../sprites.js';
import { actions, forms, esc, bar, sectorTag, emptyState, openModal, closeModal, modalHead, confirmBox, toast, num } from '../ui.js';
import {
  questIsDone, completeQuest, uncompleteQuest, habitPlus, habitMinus, newQuest, newGoal, completeGoal, reopenGoal,
  isDoneOn,
} from '../game.js';
import { todayKey, fmtDate, diffDays, WEEKDAYS_1, weekKey } from '../dates.js';
import { route, rerender, go } from '../nav.js';

const enabledSectors = () => state.settings.sectors;
const findQuest = (id) => state.quests.find((q) => q.id === id);
const findGoal = (id) => state.goals.find((g) => g.id === id);

// ---------- componentes ----------
export function questRow(q, key = todayKey()) {
  const done = questIsDone(q, key);
  const doneToday = isDoneOn(q, key);
  const lockedDone = done && !doneToday; // semanal feita em outro dia da semana
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.medio;
  const meta = [sectorTag(q.sector), `<span class="diff d-${q.diff}">${diff.name}</span>`];
  if (q.type !== 'daily') meta.push(`<span class="muted">${QUEST_TYPES[q.type]}</span>`);
  if (q.streak > 1) meta.push(`<span class="streak">${icon('fire', 12)}${q.streak}</span>`);
  if (q.type === 'once' && q.due && !done) {
    const left = diffDays(key, q.due);
    meta.push(`<span class="${left < 0 ? 'c-hp' : 'muted'}">${left < 0 ? 'atrasada' : left === 0 ? 'vence hoje' : `vence ${fmtDate(q.due)}`}</span>`);
  }
  if (lockedDone) meta.push('<span class="muted">feita nesta semana</span>');
  return `<div class="quest ${done ? 'done' : ''}">
    <button class="check" ${lockedDone ? 'disabled' : `data-act="q-toggle" data-id="${q.id}"`} aria-label="${done ? 'Desmarcar' : 'Concluir'}">${done ? '✓' : ''}</button>
    <div class="q-main" data-act="q-edit" data-id="${q.id}">
      <div class="q-title">${esc(q.title)}</div><div class="q-meta">${meta.join('')}</div>
    </div>
    <div class="q-reward">${done ? '' : `<b class="c-xp">+${diff.xp}</b><small>XP</small>`}</div>
  </div>`;
}

export function habitRow(q, key = todayKey()) {
  const h = state.log[key]?.habits?.[q.id] || { plus: 0, minus: 0 };
  return `<div class="habit">
    ${q.negative ? `<button class="hb hb-minus" data-act="h-minus" data-id="${q.id}" aria-label="Registrar deslize">−</button>` : '<span class="hb-gap"></span>'}
    <div class="q-main" data-act="q-edit" data-id="${q.id}">
      <div class="q-title">${esc(q.title)}</div>
      <div class="q-meta">${sectorTag(q.sector)}${h.plus ? `<span class="c-green">+${h.plus} hoje</span>` : ''}${h.minus ? `<span class="c-hp">−${h.minus} hoje</span>` : ''}</div>
    </div>
    ${q.positive ? `<button class="hb hb-plus" data-act="h-plus" data-id="${q.id}" aria-label="Registrar">+</button>` : '<span class="hb-gap"></span>'}
  </div>`;
}

function sectorFilter(current, act) {
  return `<div class="chips scroll-x">
    <button class="chip ${!current ? 'sel' : ''}" data-act="${act}" data-id="">Todos</button>
    ${enabledSectors().map((id) => `<button class="chip ${current === id ? 'sel' : ''}" data-act="${act}" data-id="${id}" style="--c:${SECTORS[id].color}">${icon(SECTORS[id].icon, 12)}${SECTORS[id].name}</button>`).join('')}
  </div>`;
}

// ---------- tela ----------
export function renderQuests() {
  const sub = route.params.sub || 'missoes';
  const tabs = [['missoes', 'Missões'], ['habitos', 'Hábitos'], ['objetivos', 'Objetivos']];
  let body = '';
  if (sub === 'missoes') body = renderQuestList();
  if (sub === 'habitos') body = renderHabitList();
  if (sub === 'objetivos') body = renderGoals();
  return `<header class="screen-head"><h1>${icon('scroll', 20)} Diário de Missões</h1></header>
    <div class="seg">${tabs.map(([id, l]) => `<button class="${sub === id ? 'sel' : ''}" data-act="go-sub" data-tab="missoes" data-sub="${id}">${l}</button>`).join('')}</div>
    ${body}`;
}

function renderQuestList() {
  const f = route.params.sector || '';
  const list = state.quests.filter((q) => q.type !== 'habit' && (!f || q.sector === f));
  const active = list.filter((q) => !q.archived && !(q.type === 'once' && q.completedAt));
  const groups = [
    ['Diárias', active.filter((q) => q.type === 'daily')],
    ['Semanais', active.filter((q) => q.type === 'weekly')],
    ['Únicas', active.filter((q) => q.type === 'once')],
  ];
  const finished = list.filter((q) => q.type === 'once' && q.completedAt && !q.archived);
  const archived = list.filter((q) => q.archived);
  return `${sectorFilter(f, 'q-filter')}
    <button class="btn btn-green btn-wide" data-act="q-new" data-sector="${f}">+ Nova missão</button>
    ${groups.map(([label, qs]) => qs.length ? `<h3 class="sec-title">${label} <small>${qs.length}</small></h3>
      <div class="list">${qs.map((q) => questListRow(q)).join('')}</div>` : '').join('')}
    ${!active.length ? emptyState('Nenhuma missão por aqui. Crie a primeira!') : ''}
    ${finished.length ? `<details class="fold"><summary>Concluídas (${finished.length})</summary><div class="list">${finished.map((q) => questListRow(q)).join('')}</div></details>` : ''}
    ${archived.length ? `<details class="fold"><summary>Arquivadas (${archived.length})</summary><div class="list">${archived.map((q) => questListRow(q)).join('')}</div></details>` : ''}`;
}

function questListRow(q) {
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.medio;
  let when = '';
  if (q.type === 'daily') when = q.days?.length && q.days.length < 7 ? q.days.map((d) => WEEKDAYS_1[d]).join(' ') : 'Todo dia';
  if (q.type === 'weekly') when = '1x por semana';
  if (q.type === 'once') when = q.completedAt ? `Concluída em ${fmtDate(q.completedAt)}` : q.due ? `Prazo ${fmtDate(q.due)}` : 'Sem prazo';
  return `<div class="row-item" data-act="q-edit" data-id="${q.id}">
    ${icon(SECTORS[q.sector]?.icon || 'scroll', 20)}
    <div class="grow"><b>${esc(q.title)}</b><small>${when} · ${diff.name}${q.best ? ` · recorde ${q.best}` : ''}${q.count ? ` · ${q.count}x` : ''}</small></div>
    <span class="chev">›</span></div>`;
}

function renderHabitList() {
  const f = route.params.sector || '';
  const list = state.quests.filter((q) => q.type === 'habit' && !q.archived && (!f || q.sector === f));
  return `${sectorFilter(f, 'q-filter')}
    <p class="muted small">Hábitos podem ser registrados várias vezes por dia. <b class="c-green">+</b> dá XP e ouro; <b class="c-hp">−</b> tira HP.</p>
    <button class="btn btn-green btn-wide" data-act="q-new" data-type="habit" data-sector="${f}">+ Novo hábito</button>
    <div class="list">${list.map((q) => habitRow(q)).join('')}</div>
    ${!list.length ? emptyState('Nenhum hábito ainda. Ex.: "Beber um copo d\'água" (+) ou "Fumar" (−).') : ''}`;
}

function renderGoals() {
  const f = route.params.sector || '';
  const list = state.goals.filter((g) => !f || g.sector === f);
  const open = list.filter((g) => !g.done);
  const done = list.filter((g) => g.done);
  return `${sectorFilter(f, 'q-filter')}
    <button class="btn btn-green btn-wide" data-act="g-new" data-sector="${f}">+ Novo objetivo</button>
    <div class="goal-list">${open.map(goalCard).join('')}</div>
    ${!open.length ? emptyState('Nenhum objetivo ativo. Objetivos são suas grandes conquistas de longo prazo.', 'target') : ''}
    ${done.length ? `<details class="fold"><summary>Concluídos (${done.length})</summary><div class="goal-list">${done.map(goalCard).join('')}</div></details>` : ''}`;
}

export function goalCard(g) {
  const linked = state.quests.filter((q) => q.goalId === g.id);
  const total = linked.reduce((a, q) => a + (q.count || 0), 0);
  let deadline = '';
  if (g.deadline && !g.done) {
    const left = diffDays(todayKey(), g.deadline);
    deadline = `<span class="${left < 0 ? 'c-hp' : left <= 7 ? 'c-gold' : 'muted'}">${left < 0 ? `${-left} dias atrasado` : left === 0 ? 'prazo hoje' : `${left} dias restantes`}</span>`;
  }
  const isMoney = g.unit === 'R$';
  const fmt = (v) => (isMoney ? `R$ ${num(v)}` : `${num(v)} ${esc(g.unit)}`);
  return `<div class="goal panel-inner ${g.done ? 'done' : ''}" style="--c:${SECTORS[g.sector]?.color || '#fff'}">
    <div class="goal-head">${icon(g.done ? 'trophy' : 'target', 20)}<b class="grow">${esc(g.title)}</b>
      <button class="btn-icon" data-act="g-edit" data-id="${g.id}" aria-label="Editar">✎</button></div>
    <div class="q-meta">${sectorTag(g.sector)}${deadline}${g.done ? `<span class="c-green">Concluído em ${fmtDate(g.doneAt)}</span>` : ''}</div>
    ${g.kind === 'numeric' ? `${bar(g.current, g.target, 'goal-bar', false)}<p class="small">${fmt(g.current)} de ${fmt(g.target)}</p>` : ''}
    ${linked.length ? `<p class="small muted">${linked.length} missões ligadas · ${total} conclusões</p>` : ''}
    ${g.notes ? `<p class="small">${esc(g.notes)}</p>` : ''}
    <div class="row-btns">
      ${g.done ? `<button class="btn btn-sm" data-act="g-reopen" data-id="${g.id}">Reabrir</button>` : `
        ${g.kind === 'numeric' ? `<button class="btn btn-sm" data-act="g-progress" data-id="${g.id}">Atualizar progresso</button>` : ''}
        <button class="btn btn-sm btn-green" data-act="g-complete" data-id="${g.id}">Concluir</button>`}
      <button class="btn btn-sm" data-act="q-new" data-goal="${g.id}" data-sector="${g.sector}">+ Missão</button>
    </div>
  </div>`;
}

// ---------- ações de missão ----------
actions['q-toggle'] = (el) => {
  const q = findQuest(el.dataset.id);
  if (!q) return;
  if (isDoneOn(q, todayKey())) uncompleteQuest(q);
  else completeQuest(q);
  rerender();
};
actions['h-plus'] = (el) => { const q = findQuest(el.dataset.id); if (q) { habitPlus(q); rerender(); } };
actions['h-minus'] = (el) => { const q = findQuest(el.dataset.id); if (q) { habitMinus(q); rerender(); } };
actions['q-filter'] = (el) => { route.params.sector = el.dataset.id; rerender(); };
actions['go-sub'] = (el) => go(el.dataset.tab, { ...route.params, sub: el.dataset.sub });

function questForm(q) {
  const isNew = !q.id;
  const sectors = enabledSectors().includes(q.sector) ? enabledSectors() : [...enabledSectors(), q.sector];
  const openGoals = state.goals.filter((g) => !g.done || g.id === q.goalId);
  return `${modalHead(isNew ? (q.type === 'habit' ? 'Novo hábito' : 'Nova missão') : 'Editar', 'scroll')}
  <form class="qform" data-form="q-save" data-type="${q.type}">
    <input type="hidden" name="id" value="${q.id || ''}">
    <label class="field"><span>Título</span><input name="title" required maxlength="80" value="${esc(q.title || '')}" placeholder="Ex.: Treinar perna" autofocus></label>
    <div class="field"><span>Tipo</span><div class="seg seg-sm">${Object.entries(QUEST_TYPES).map(([id, l]) => `
      <label><input type="radio" name="type" value="${id}" ${q.type === id ? 'checked' : ''} data-change="q-type"><span>${l}</span></label>`).join('')}</div></div>
    <div class="two">
      <label class="field"><span>Setor</span><select name="sector">${sectors.map((id) => `<option value="${id}" ${q.sector === id ? 'selected' : ''}>${SECTORS[id].name}</option>`).join('')}</select></label>
      <label class="field"><span>Dificuldade</span><select name="diff">${Object.entries(DIFFICULTY).map(([id, d]) => `<option value="${id}" ${q.diff === id ? 'selected' : ''}>${d.name} (+${d.xp} XP)</option>`).join('')}</select></label>
    </div>
    <div class="field f-days"><span>Dias da semana</span><div class="days">${WEEKDAYS_1.map((l, i) => `
      <label><input type="checkbox" name="days" value="${i}" ${!q.days?.length || q.days.includes(i) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <small class="muted">Se não fizer em um dia marcado, perde HP à meia-noite.</small></div>
    <label class="field f-due"><span>Prazo (opcional)</span><input type="date" name="due" value="${q.due || ''}"></label>
    <div class="field f-habit"><span>Este hábito é</span><div class="days wide">
      <label><input type="checkbox" name="positive" ${q.positive ? 'checked' : ''}><span>+ Bom</span></label>
      <label><input type="checkbox" name="negative" ${q.negative ? 'checked' : ''}><span>− Ruim</span></label></div></div>
    ${openGoals.length ? `<label class="field"><span>Ligada ao objetivo</span><select name="goalId"><option value="">Nenhum</option>${openGoals.map((g) => `<option value="${g.id}" ${q.goalId === g.id ? 'selected' : ''}>${esc(g.title)}</option>`).join('')}</select></label>` : ''}
    <label class="field"><span>Notas</span><textarea name="notes" rows="2" maxlength="300">${esc(q.notes || '')}</textarea></label>
    <div class="row-btns">
      ${isNew ? '' : `<button type="button" class="btn btn-red btn-sm" data-act="q-delete" data-id="${q.id}">Excluir</button>
      <button type="button" class="btn btn-sm" data-act="q-archive" data-id="${q.id}">${q.archived ? 'Desarquivar' : 'Arquivar'}</button>`}
      <button type="submit" class="btn btn-green">Salvar</button>
    </div>
  </form>`;
}

actions['q-new'] = (el) => {
  const sector = el.dataset.sector || enabledSectors()[0];
  openModal(questForm({ type: el.dataset.type || 'daily', sector, diff: 'medio', days: [], positive: true, negative: false, goalId: el.dataset.goal || null }));
};
actions['q-edit'] = (el) => { const q = findQuest(el.dataset.id); if (q) openModal(questForm(q)); };
actions['q-type'] = (el) => { el.closest('form').dataset.type = el.value; };
actions['q-delete'] = (el) => {
  const q = findQuest(el.dataset.id);
  confirmBox(`Excluir <b>${esc(q.title)}</b>? O XP já ganho é mantido.`, () => {
    state.quests = state.quests.filter((x) => x.id !== q.id);
    save();
    rerender();
  }, 'Excluir');
};
actions['q-archive'] = (el) => {
  const q = findQuest(el.dataset.id);
  q.archived = !q.archived;
  save();
  closeModal();
  toast(q.archived ? 'Missão arquivada' : 'Missão restaurada');
  rerender();
};

forms['q-save'] = (fd) => {
  const id = fd.get('id');
  const data = {
    title: String(fd.get('title')).trim(),
    type: fd.get('type'),
    sector: fd.get('sector'),
    diff: fd.get('diff'),
    days: fd.getAll('days').map(Number),
    due: fd.get('due') || null,
    positive: fd.has('positive'),
    negative: fd.has('negative'),
    goalId: fd.get('goalId') || null,
    notes: String(fd.get('notes') || '').trim(),
  };
  if (!data.title) return;
  if (data.type === 'daily' && !data.days.length) { toast('Escolha pelo menos um dia.', 'bad'); return; }
  if (data.type === 'daily' && data.days.length === 7) data.days = [];
  if (data.type === 'habit' && !data.positive && !data.negative) data.positive = true;
  if (id) {
    const q = findQuest(id);
    if (q.type !== data.type) { q.streak = 0; }
    Object.assign(q, data);
  } else {
    state.quests.push(newQuest(data));
    toast(data.type === 'habit' ? 'Hábito criado!' : 'Nova missão no diário!');
  }
  save();
  closeModal();
  rerender();
};

// ---------- ações de objetivo ----------
function goalForm(g) {
  const isNew = !g.id;
  return `${modalHead(isNew ? 'Novo objetivo' : 'Editar objetivo', 'target')}
  <form class="qform" data-form="g-save" data-type="${g.kind}">
    <input type="hidden" name="id" value="${g.id || ''}">
    <label class="field"><span>Objetivo</span><input name="title" required maxlength="80" value="${esc(g.title || '')}" placeholder="Ex.: Correr 5 km" autofocus></label>
    <label class="field"><span>Setor</span><select name="sector">${enabledSectors().map((id) => `<option value="${id}" ${g.sector === id ? 'selected' : ''}>${SECTORS[id].name}</option>`).join('')}</select></label>
    <div class="field"><span>Como medir</span><div class="seg seg-sm">
      <label><input type="radio" name="kind" value="milestone" ${g.kind !== 'numeric' ? 'checked' : ''} data-change="g-kind"><span>Marco (sim/não)</span></label>
      <label><input type="radio" name="kind" value="numeric" ${g.kind === 'numeric' ? 'checked' : ''} data-change="g-kind"><span>Numérico</span></label></div></div>
    <div class="three f-numeric">
      <label class="field"><span>Atual</span><input name="current" type="number" step="any" value="${g.current ?? 0}" inputmode="decimal"></label>
      <label class="field"><span>Meta</span><input name="target" type="number" step="any" value="${g.target || ''}" inputmode="decimal"></label>
      <label class="field"><span>Unidade</span><input name="unit" maxlength="10" value="${esc(g.unit || '')}" placeholder="kg, R$, km"></label>
    </div>
    <label class="field"><span>Prazo (opcional)</span><input type="date" name="deadline" value="${g.deadline || ''}"></label>
    <label class="field"><span>Por que isso importa?</span><textarea name="notes" rows="2" maxlength="300">${esc(g.notes || '')}</textarea></label>
    <p class="small muted">Concluir um objetivo dá <b class="c-xp">150 XP</b> e <b class="c-gold">75 ouro</b>.</p>
    <div class="row-btns">
      ${isNew ? '' : `<button type="button" class="btn btn-red btn-sm" data-act="g-delete" data-id="${g.id}">Excluir</button>`}
      <button type="submit" class="btn btn-green">Salvar</button>
    </div>
  </form>`;
}

actions['g-new'] = (el) => openModal(goalForm({ kind: 'milestone', sector: el.dataset.sector || enabledSectors()[0] }));
actions['g-edit'] = (el) => openModal(goalForm(findGoal(el.dataset.id)));
actions['g-kind'] = (el) => { el.closest('form').dataset.type = el.value; };
actions['g-complete'] = (el) => {
  const g = findGoal(el.dataset.id);
  confirmBox(`Marcar <b>${esc(g.title)}</b> como concluído?`, () => { completeGoal(g); rerender(); }, 'Concluir!', false);
};
actions['g-reopen'] = (el) => { reopenGoal(findGoal(el.dataset.id)); rerender(); };
actions['g-delete'] = (el) => {
  const g = findGoal(el.dataset.id);
  confirmBox(`Excluir o objetivo <b>${esc(g.title)}</b>? As missões ligadas continuam existindo.`, () => {
    state.goals = state.goals.filter((x) => x.id !== g.id);
    state.quests.forEach((q) => { if (q.goalId === g.id) q.goalId = null; });
    save();
    rerender();
  }, 'Excluir');
};
actions['g-progress'] = (el) => {
  const g = findGoal(el.dataset.id);
  openModal(`${modalHead('Atualizar progresso', 'target')}
    <form data-form="g-progress-save"><input type="hidden" name="id" value="${g.id}">
      <p class="center"><b>${esc(g.title)}</b></p>
      <label class="field"><span>Valor atual (${esc(g.unit)})</span><input name="current" type="number" step="any" value="${g.current}" inputmode="decimal" autofocus></label>
      <label class="field"><span>…ou somar ao atual</span><input name="add" type="number" step="any" placeholder="Ex.: 100" inputmode="decimal"></label>
      <div class="row-btns"><button type="submit" class="btn btn-green">Salvar</button></div>
    </form>`);
};
forms['g-progress-save'] = (fd) => {
  const g = findGoal(fd.get('id'));
  const add = Number(fd.get('add'));
  g.current = add ? Number(g.current) + add : Number(fd.get('current')) || 0;
  save();
  closeModal();
  if (g.target > 0 && g.current >= g.target) completeGoal(g);
  else toast(`Progresso: ${Math.round((g.current / (g.target || 1)) * 100)}%`);
  rerender();
};
forms['g-save'] = (fd) => {
  const id = fd.get('id');
  const data = {
    title: String(fd.get('title')).trim(), sector: fd.get('sector'), kind: fd.get('kind'),
    current: Number(fd.get('current')) || 0, target: Number(fd.get('target')) || 0, unit: String(fd.get('unit') || '').trim(),
    deadline: fd.get('deadline') || null, notes: String(fd.get('notes') || '').trim(),
  };
  if (!data.title) return;
  if (data.kind === 'numeric' && !(data.target > 0)) { toast('Defina uma meta numérica maior que zero.', 'bad'); return; }
  if (id) Object.assign(findGoal(id), data);
  else { state.goals.push(newGoal(data)); toast('Objetivo criado!'); }
  save();
  closeModal();
  rerender();
};

