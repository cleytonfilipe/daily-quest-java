// Setores da rotina: cada um tem um módulo próprio além das missões.
import { state, save, dayLog, uid } from '../store.js';
import { SECTORS, ATTRS, WORKOUT_TYPES, INTENSITY, FIN_CATEGORIES, MEALS, MOODS } from '../data.js';
import { icon } from '../sprites.js';
import { actions, forms, esc, bar, emptyState, openModal, closeModal, modalHead, confirmBox, toast, money, num } from '../ui.js';
import { attrInfo, dailyBonus, reward, revoke, questIsDone, checkAchievements } from '../game.js';
import { todayKey, fmtDate, weekKey, addDays, monthKey, monthLabel, shiftMonth, WEEKDAYS_1, weekday, pad } from '../dates.js';
import { questRow, habitRow } from './quests.js';
import { route, rerender, go } from '../nav.js';
import { play } from '../sfx.js';

export function renderSectors() {
  if (route.params.sector) return renderSector(route.params.sector);
  const key = todayKey();
  return `<header class="screen-head"><h1>${icon('map', 20)} Setores</h1><small>Cada setor evolui um atributo</small></header>
    <div class="sector-grid">${state.settings.sectors.map((id) => {
      const s = SECTORS[id];
      const a = attrInfo(state.player.attrs[s.attr]);
      const qs = state.quests.filter((q) => q.sector === id && !q.archived && q.type !== 'habit');
      const done = qs.filter((q) => questIsDone(q, key)).length;
      return `<button class="sector-card panel" data-act="go" data-tab="setores" data-sector="${id}" style="--c:${s.color}">
        <div class="sc-top">${icon(s.icon, 28)}<span class="sc-lvl">${ATTRS[s.attr].short} ${a.level}</span></div>
        <b>${s.name}</b><small>${s.desc}</small>
        ${bar(a.cur, a.need, 'attr', false)}
        <small class="muted">${done}/${qs.length} missões</small></button>`;
    }).join('')}</div>
    <button class="btn btn-wide" data-act="sectors-manage">${icon('gear', 14)} Gerenciar setores</button>`;
}

function renderSector(id) {
  const s = SECTORS[id];
  const a = attrInfo(state.player.attrs[s.attr]);
  const key = todayKey();
  const qs = state.quests.filter((q) => q.sector === id && !q.archived && q.type !== 'habit' && !(q.type === 'once' && q.completedAt && q.completedAt !== key));
  const hs = state.quests.filter((q) => q.sector === id && !q.archived && q.type === 'habit');
  const modules = {
    alimentacao: foodModule, academia: gymModule, trabalho: workModule, financeiro: financeModule,
    sono: sleepModule, estudos: studyModule, mente: mindModule, social: socialModule,
  };
  return `<header class="screen-head sector-head" style="--c:${s.color}">
      <button class="btn-back" data-act="go" data-tab="setores">‹</button>
      <h1>${icon(s.icon, 22)} ${s.name}</h1></header>
    <section class="panel attr-panel" style="--c:${s.color}">
      <div class="attr-top"><b>${ATTRS[s.attr].name}</b><span>Nível ${a.level}</span></div>
      ${bar(a.cur, a.need, 'attr')}
    </section>
    ${modules[id]()}
    <h3 class="sec-title">Missões de ${s.name}</h3>
    ${qs.length ? `<div class="list">${qs.map((q) => questRow(q, key)).join('')}</div>` : emptyState('Nenhuma missão neste setor.')}
    ${hs.length ? `<h3 class="sec-title">Hábitos</h3><div class="list">${hs.map((q) => habitRow(q, key)).join('')}</div>` : ''}
    <div class="row-btns"><button class="btn" data-act="q-new" data-sector="${id}">+ Missão</button><button class="btn" data-act="q-new" data-type="habit" data-sector="${id}">+ Hábito</button><button class="btn" data-act="g-new" data-sector="${id}">+ Objetivo</button></div>`;
}

actions['sectors-manage'] = () => {
  openModal(`${modalHead('Setores ativos', 'map')}
    <form data-form="sectors-save"><div class="sector-pick">${Object.entries(SECTORS).map(([id, s]) => `
      <label class="pick-check" style="--c:${s.color}"><input type="checkbox" name="s" value="${id}" ${state.settings.sectors.includes(id) ? 'checked' : ''}>
      <span>${icon(s.icon, 20)}<b>${s.name}</b><small>${s.desc}</small></span></label>`).join('')}</div>
      <div class="row-btns"><button class="btn btn-green" type="submit">Salvar</button></div></form>`);
};
forms['sectors-save'] = (fd) => {
  const list = fd.getAll('s');
  if (!list.length) { toast('Mantenha pelo menos um setor.', 'bad'); return; }
  state.settings.sectors = Object.keys(SECTORS).filter((id) => list.includes(id));
  save();
  closeModal();
  rerender();
};

// ================= ALIMENTAÇÃO =================
function foodModule() {
  const d = state.log[todayKey()] || {};
  const goal = state.settings.waterGoal;
  const water = d.water || 0;
  const cups = Array.from({ length: Math.max(goal, water) }, (_, i) => `<span class="cup ${i < water ? 'full' : ''}">${icon('water', 18)}</span>`).join('');
  const meals = d.meals || {};
  const w = [...state.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const last = w[w.length - 1];
  const first = w[0];
  return `<section class="panel module">
      <div class="mod-head">${icon('water', 16)}<b>Hidratação</b><small>${water}/${goal} copos</small></div>
      <div class="cups">${cups}</div>
      <div class="row-btns"><button class="btn btn-sm" data-act="water" data-n="-1">−</button><button class="btn btn-blue" data-act="water" data-n="1">+1 copo (250 ml)</button></div>
      <p class="small muted">Bater a meta dá bônus de XP e VIT uma vez por dia.</p>
    </section>
    <section class="panel module">
      <div class="mod-head">${icon('apple', 16)}<b>Refeições de hoje</b></div>
      ${MEALS.map((m) => `<div class="meal"><span class="grow">${m.name}</span>
        <button class="btn btn-sm ${meals[m.id] === 'h' ? 'btn-green' : ''}" data-act="meal" data-id="${m.id}" data-v="h">Saudável</button>
        <button class="btn btn-sm ${meals[m.id] === 'n' ? 'btn-red' : ''}" data-act="meal" data-id="${m.id}" data-v="n">Nem tanto</button></div>`).join('')}
    </section>
    <section class="panel module">
      <div class="mod-head">${icon('target', 16)}<b>Peso</b>${last ? `<small>${num(last.kg)} kg</small>` : ''}</div>
      ${w.length > 1 ? `<p class="small">Desde ${fmtDate(first.date)}: <b class="${last.kg <= first.kg ? 'c-green' : 'c-gold'}">${last.kg - first.kg > 0 ? '+' : ''}${num(Math.round((last.kg - first.kg) * 10) / 10)} kg</b></p>` : ''}
      ${w.length > 1 ? sparkBars(w.slice(-14).map((x) => ({ v: x.kg, l: fmtDate(x.date) })), 'weight') : ''}
      <form class="inline-form" data-form="weight-add"><input name="kg" type="number" step="0.1" min="20" max="400" placeholder="Peso de hoje (kg)" inputmode="decimal" required><button class="btn btn-sm" type="submit">Registrar</button></form>
      ${w.length ? `<details class="fold"><summary>Histórico (${w.length})</summary><ul class="mini-list">${[...w].reverse().slice(0, 30).map((x) => `<li><span>${fmtDate(x.date)}</span><b>${num(x.kg)} kg</b><button class="btn-x" data-act="weight-del" data-date="${x.date}">×</button></li>`).join('')}</ul></details>` : ''}
    </section>`;
}

actions.water = (el) => {
  const d = dayLog(todayKey());
  d.water = Math.max(0, (d.water || 0) + Number(el.dataset.n));
  if (Number(el.dataset.n) > 0) play('click');
  if (d.water >= state.settings.waterGoal && dailyBonus('water', 'alimentacao', 15, 5, 2, 'Meta de água')) {
    state.stats.waterDays++;
    checkAchievements();
  }
  save();
  rerender();
};
actions.meal = (el) => {
  const d = dayLog(todayKey());
  const { id, v } = el.dataset;
  d.meals[id] = d.meals[id] === v ? undefined : v;
  if (d.meals[id] === 'h') dailyBonus(`meal-${id}`, 'alimentacao', 6, 2, 1, 'Refeição saudável');
  save();
  rerender();
};
forms['weight-add'] = (fd) => {
  const kg = Number(fd.get('kg'));
  if (!(kg > 0)) return;
  const t = todayKey();
  state.weights = state.weights.filter((w) => w.date !== t);
  state.weights.push({ date: t, kg });
  dailyBonus('weight', 'alimentacao', 5, 2, 1, 'Pesagem');
  save();
  rerender();
};
actions['weight-del'] = (el) => { state.weights = state.weights.filter((w) => w.date !== el.dataset.date); save(); rerender(); };

// ================= ACADEMIA =================
function gymModule() {
  const wk = weekKey(todayKey());
  const thisWeek = state.workouts.filter((w) => weekKey(w.date) === wk);
  const minutes = thisWeek.reduce((a, w) => a + w.minutes, 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  return `<section class="panel module">
      <div class="mod-head">${icon('dumbbell', 16)}<b>Esta semana</b><small>${thisWeek.length} treinos · ${minutes} min</small></div>
      <div class="week-dots">${days.map((k) => {
        const n = state.workouts.filter((w) => w.date === k).length;
        return `<span class="${n ? 'on' : ''} ${k === todayKey() ? 'today' : ''}"><i>${WEEKDAYS_1[weekday(k)]}</i>${n ? '✓' : ''}</span>`;
      }).join('')}</div>
      <button class="btn btn-green btn-wide" data-act="workout-new">+ Registrar treino</button>
    </section>
    <section class="panel module">
      <div class="mod-head">${icon('scroll', 16)}<b>Treinos recentes</b><small>${state.workouts.length} no total</small></div>
      ${state.workouts.length ? `<ul class="mini-list">${state.workouts.slice(0, 12).map((w) => `
        <li><span>${fmtDate(w.date)}</span><span class="grow">${esc(w.type)} · ${w.minutes} min · ${INTENSITY[w.intensity]?.name || ''}${w.notes ? ` · ${esc(w.notes)}` : ''}</span>
        <button class="btn-x" data-act="workout-del" data-id="${w.id}">×</button></li>`).join('')}</ul>` : '<p class="small muted">Nenhum treino registrado ainda.</p>'}
    </section>`;
}

actions['workout-new'] = () => {
  openModal(`${modalHead('Registrar treino', 'dumbbell')}
    <form data-form="workout-save">
      <label class="field"><span>Tipo</span><select name="type">${WORKOUT_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></label>
      <div class="two"><label class="field"><span>Duração (min)</span><input name="minutes" type="number" min="1" max="600" value="45" inputmode="numeric" required></label>
      <label class="field"><span>Intensidade</span><select name="intensity">${Object.entries(INTENSITY).map(([id, i]) => `<option value="${id}" ${id === 'moderada' ? 'selected' : ''}>${i.name}</option>`).join('')}</select></label></div>
      <label class="field"><span>Notas (exercícios, cargas...)</span><textarea name="notes" rows="2" maxlength="200"></textarea></label>
      <div class="row-btns"><button class="btn btn-green" type="submit">Salvar treino</button></div>
    </form>`);
};
forms['workout-save'] = (fd) => {
  const minutes = Math.max(1, Math.min(600, Number(fd.get('minutes')) || 0));
  const intensity = fd.get('intensity');
  const xp = Math.max(5, Math.min(80, Math.round(minutes * 0.6 * (INTENSITY[intensity]?.mult || 1))));
  const r = reward('academia', xp, Math.round(xp / 3), 1 + Math.floor(minutes / 30), { label: 'Treino' });
  state.workouts.unshift({ id: uid(), date: todayKey(), type: fd.get('type'), minutes, intensity, notes: String(fd.get('notes') || '').trim(), receipt: r });
  state.stats.workouts++;
  checkAchievements();
  save();
  closeModal();
  rerender();
};
actions['workout-del'] = (el) => {
  confirmBox('Excluir este treino? O XP ganho com ele será removido.', () => {
    const w = state.workouts.find((x) => x.id === el.dataset.id);
    if (w?.receipt) revoke(w.receipt);
    state.workouts = state.workouts.filter((x) => x.id !== el.dataset.id);
    state.stats.workouts = Math.max(0, state.stats.workouts - 1);
    save();
    rerender();
  }, 'Excluir');
};

// ================= TRABALHO / ESTUDOS: POMODORO =================
const fmtClock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };

export function pomodoroWidget(mini = false) {
  const p = state.pomodoro;
  const today = state.log[todayKey()]?.pomodoros || 0;
  const focusMs = state.settings.pomodoroMin * 60000;
  let time = fmtClock(focusMs);
  let label = 'Pronto para focar';
  let btns = `<button class="btn btn-sm btn-green" data-act="pomo-start">▶ Focar ${state.settings.pomodoroMin} min</button>`;
  if (p) {
    const left = p.pausedLeft ?? p.endsAt - Date.now();
    time = fmtClock(left);
    label = p.phase === 'focus' ? `Foco · ${SECTORS[p.sector]?.name || ''}` : 'Pausa';
    btns = `${p.pausedLeft != null ? '<button class="btn btn-sm btn-green" data-act="pomo-resume">▶ Continuar</button>' : '<button class="btn btn-sm" data-act="pomo-pause">❚❚ Pausar</button>'}
      <button class="btn btn-sm btn-red" data-act="pomo-stop">■ ${p.phase === 'focus' ? 'Desistir' : 'Pular'}</button>`;
  }
  const inner = `<div class="mini-head">${icon('briefcase', 14)}<b>Pomodoro</b><small>${today} hoje</small></div>
    <div class="pomo ${p?.phase || ''}"><span id="pomo-time">${time}</span><small>${label}</small></div>
    <div class="row-btns">${btns}</div>`;
  return mini ? inner : `<section class="panel module">${inner}<p class="small muted">Cada bloco de foco concluído vale XP e pontos de atributo. Configure os tempos em Herói › Config.</p></section>`;
}

actions['pomo-start'] = () => {
  const sector = route.params.sector === 'estudos' ? 'estudos' : state.settings.sectors.includes('trabalho') ? 'trabalho' : 'estudos';
  state.pomodoro = { phase: 'focus', sector, endsAt: Date.now() + state.settings.pomodoroMin * 60000, pausedLeft: null };
  play('click');
  save();
  rerender();
};
actions['pomo-pause'] = () => { const p = state.pomodoro; if (!p) return; p.pausedLeft = p.endsAt - Date.now(); save(); rerender(); };
actions['pomo-resume'] = () => { const p = state.pomodoro; if (!p) return; p.endsAt = Date.now() + p.pausedLeft; p.pausedLeft = null; save(); rerender(); };
actions['pomo-stop'] = () => { state.pomodoro = null; save(); rerender(); };

// Chamado a cada segundo pelo app: atualiza o relógio e conclui fases.
export function tickPomodoro() {
  const p = state.pomodoro;
  if (!p || p.pausedLeft != null) return false;
  const left = p.endsAt - Date.now();
  const el = document.getElementById('pomo-time');
  if (el) el.textContent = fmtClock(left);
  if (left > 0) return false;
  play('timer');
  if (p.phase === 'focus') {
    const d = dayLog(todayKey());
    d.pomodoros = (d.pomodoros || 0) + 1;
    state.stats.pomodoros++;
    reward(p.sector, 15, 5, 2, { label: 'Pomodoro' });
    checkAchievements();
    state.pomodoro = { phase: 'break', sector: p.sector, endsAt: Date.now() + state.settings.breakMin * 60000, pausedLeft: null };
    toast('Bloco de foco concluído! Hora da pausa.');
  } else {
    state.pomodoro = null;
    toast('Pausa encerrada. Pronto para outro bloco?');
  }
  save();
  return true;
}

function workModule() {
  const d = state.log[todayKey()] || {};
  const pr = d.priorities || [{ t: '', done: false }, { t: '', done: false }, { t: '', done: false }];
  return `<section class="panel module">
      <div class="mod-head">${icon('target', 16)}<b>3 prioridades do dia</b></div>
      <form data-form="prio-save" class="prios">${pr.map((p, i) => `
        <div class="prio"><label class="prio-chk"><input type="checkbox" name="d${i}" ${p.done ? 'checked' : ''} data-change="prio-check"><span>${p.done ? '✓' : i + 1}</span></label>
        <input name="t${i}" value="${esc(p.t)}" maxlength="80" placeholder="Prioridade ${i + 1}" class="${p.done ? 'striked' : ''}"></div>`).join('')}
        <button class="btn btn-sm" type="submit">Salvar prioridades</button></form>
      <p class="small muted">Concluir as 3 dá um bônus de Foco.</p>
    </section>
    ${pomodoroWidget()}`;
}
function savePriorities(form) {
  const fd = new FormData(form);
  const d = dayLog(todayKey());
  d.priorities = [0, 1, 2].map((i) => ({ t: String(fd.get(`t${i}`) || '').trim(), done: fd.has(`d${i}`) }));
  if (d.priorities.every((p) => p.t && p.done)) dailyBonus('priorities', 'trabalho', 20, 8, 2, '3 prioridades');
  save();
}
forms['prio-save'] = (fd, form) => { savePriorities(form); toast('Prioridades salvas'); rerender(); };
actions['prio-check'] = (el) => { savePriorities(el.closest('form')); rerender(); };

// ================= FINANCEIRO =================
function financeModule() {
  const mk = route.params.month || monthKey(todayKey());
  const entries = state.finance.filter((e) => monthKey(e.date) === mk).sort((a, b) => (a.date < b.date ? 1 : -1));
  const inc = entries.filter((e) => e.type === 'in').reduce((a, e) => a + e.amount, 0);
  const out = entries.filter((e) => e.type === 'out').reduce((a, e) => a + e.amount, 0);
  const budget = state.settings.budget;
  const byCat = {};
  entries.filter((e) => e.type === 'out').forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] || 1;
  return `<section class="panel module">
      <div class="month-nav"><button class="btn btn-sm" data-act="fin-month" data-n="-1">‹</button><b>${monthLabel(mk)}</b><button class="btn btn-sm" data-act="fin-month" data-n="1">›</button></div>
      <div class="fin-summary">
        <div><small>Receitas</small><b class="c-green">${money(inc)}</b></div>
        <div><small>Despesas</small><b class="c-hp">${money(out)}</b></div>
        <div><small>Saldo</small><b class="${inc - out >= 0 ? 'c-green' : 'c-hp'}">${money(inc - out)}</b></div>
      </div>
      ${budget > 0 ? `<div class="budget"><small>Orçamento: ${money(out)} de ${money(budget)}</small>${bar(out, budget, out > budget ? 'hp' : 'gold', false)}
        <small class="${out > budget ? 'c-hp' : 'muted'}">${out > budget ? `Estourou em ${money(out - budget)}!` : `Restam ${money(budget - out)}`}</small></div>` : '<button class="btn btn-sm" data-act="budget-edit">Definir orçamento mensal</button>'}
      <div class="row-btns"><button class="btn btn-red" data-act="fin-new" data-type="out">− Gasto</button><button class="btn btn-green" data-act="fin-new" data-type="in">+ Receita</button></div>
    </section>
    ${cats.length ? `<section class="panel module"><div class="mod-head">${icon('coin', 16)}<b>Gastos por categoria</b>${budget > 0 ? '<button class="btn-icon" data-act="budget-edit" aria-label="Editar orçamento">✎</button>' : ''}</div>
      ${cats.map(([c, v]) => `<div class="cat-row"><span>${esc(c)}</span>${bar(v, maxCat, 'cat', false)}<b>${money(v)}</b></div>`).join('')}</section>` : ''}
    <section class="panel module"><div class="mod-head">${icon('scroll', 16)}<b>Lançamentos</b><small>${entries.length}</small></div>
      ${entries.length ? `<ul class="mini-list fin-list">${entries.map((e) => `<li data-act="fin-edit" data-id="${e.id}"><span>${fmtDate(e.date)}</span>
        <span class="grow">${esc(e.desc || e.category)}<small>${esc(e.category)}</small></span><b class="${e.type === 'in' ? 'c-green' : 'c-hp'}">${e.type === 'in' ? '+' : '−'}${money(e.amount)}</b></li>`).join('')}</ul>` : '<p class="small muted">Nenhum lançamento neste mês.</p>'}
    </section>`;
}

actions['fin-month'] = (el) => { route.params.month = shiftMonth(route.params.month || monthKey(todayKey()), Number(el.dataset.n)); rerender(); };

function finForm(e) {
  const cats = FIN_CATEGORIES[e.type];
  return `${modalHead(e.id ? 'Editar lançamento' : e.type === 'in' ? 'Nova receita' : 'Novo gasto', 'coin')}
    <form data-form="fin-save"><input type="hidden" name="id" value="${e.id || ''}"><input type="hidden" name="type" value="${e.type}">
      <label class="field"><span>Valor (R$)</span><input name="amount" type="number" step="0.01" min="0.01" value="${e.amount || ''}" inputmode="decimal" required autofocus></label>
      <label class="field"><span>Categoria</span><select name="category">${cats.map((c) => `<option ${e.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span>Descrição</span><input name="desc" maxlength="60" value="${esc(e.desc || '')}" placeholder="Ex.: Mercado da semana"></label>
      <label class="field"><span>Data</span><input name="date" type="date" value="${e.date || todayKey()}" required></label>
      <div class="row-btns">${e.id ? `<button type="button" class="btn btn-red btn-sm" data-act="fin-del" data-id="${e.id}">Excluir</button>` : ''}<button class="btn btn-green" type="submit">Salvar</button></div>
    </form>`;
}
actions['fin-new'] = (el) => openModal(finForm({ type: el.dataset.type }));
actions['fin-edit'] = (el) => openModal(finForm(state.finance.find((e) => e.id === el.dataset.id)));
actions['fin-del'] = (el) => {
  confirmBox('Excluir este lançamento?', () => { state.finance = state.finance.filter((e) => e.id !== el.dataset.id); save(); rerender(); }, 'Excluir');
};
forms['fin-save'] = (fd) => {
  const data = { type: fd.get('type'), amount: Math.round(Number(fd.get('amount')) * 100) / 100, category: fd.get('category'), desc: String(fd.get('desc') || '').trim(), date: fd.get('date') || todayKey() };
  if (!(data.amount > 0)) return;
  const id = fd.get('id');
  if (id) Object.assign(state.finance.find((e) => e.id === id), data);
  else {
    state.finance.push({ id: uid(), ...data });
    state.stats.financeEntries++;
    dailyBonus('finance', 'financeiro', 8, 3, 1, 'Registro financeiro');
    checkAchievements();
  }
  save();
  closeModal();
  rerender();
};
actions['budget-edit'] = () => {
  openModal(`${modalHead('Orçamento mensal', 'coin')}<form data-form="budget-save">
    <label class="field"><span>Limite de gastos por mês (R$)</span><input name="budget" type="number" min="0" step="1" value="${state.settings.budget || ''}" inputmode="decimal" autofocus></label>
    <div class="row-btns"><button class="btn btn-green" type="submit">Salvar</button></div></form>`);
};
forms['budget-save'] = (fd) => { state.settings.budget = Number(fd.get('budget')) || 0; save(); closeModal(); rerender(); };

// ================= SONO =================
function sleepHours(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins <= 0) mins += 1440;
  return Math.round((mins / 60) * 10) / 10;
}
function sleepModule() {
  const t = todayKey();
  const s = state.log[t]?.sleep;
  const goal = state.settings.sleepGoal;
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const vals = days.map((k) => ({ v: state.log[k]?.sleep?.hours || 0, l: WEEKDAYS_1[weekday(k)] }));
  const logged = vals.filter((v) => v.v);
  const avg = logged.length ? logged.reduce((a, v) => a + v.v, 0) / logged.length : 0;
  return `<section class="panel module">
      <div class="mod-head">${icon('moon', 16)}<b>Noite passada</b>${s ? `<small>${num(s.hours)} h</small>` : ''}</div>
      <form data-form="sleep-save" class="two">
        <label class="field"><span>Dormi às</span><input type="time" name="bed" value="${s?.bed || '23:00'}" required></label>
        <label class="field"><span>Acordei às</span><input type="time" name="wake" value="${s?.wake || '07:00'}" required></label>
        <button class="btn btn-blue btn-wide" type="submit">${s ? 'Atualizar' : 'Registrar sono'}</button>
      </form>
      <p class="small muted">Meta: ${goal} h. Bater a meta dá bônus de Energia.</p>
    </section>
    <section class="panel module"><div class="mod-head">${icon('star', 16)}<b>Últimos 7 dias</b>${avg ? `<small>média ${num(Math.round(avg * 10) / 10)} h</small>` : ''}</div>
      ${sparkBars(vals, 'sleep', goal)}</section>`;
}
forms['sleep-save'] = (fd) => {
  const bed = fd.get('bed');
  const wake = fd.get('wake');
  const hours = sleepHours(bed, wake);
  dayLog(todayKey()).sleep = { bed, wake, hours };
  dailyBonus('sleep-log', 'sono', 5, 2, 1, 'Registro de sono');
  if (hours >= state.settings.sleepGoal) dailyBonus('sleep-goal', 'sono', 15, 5, 2, 'Meta de sono');
  save();
  rerender();
};

// ================= ESTUDOS / MENTE / SOCIAL =================
function studyModule() { return pomodoroWidget(); }

function mindModule() {
  const d = state.log[todayKey()] || {};
  return `<section class="panel module">
      <div class="mod-head">${icon('spark', 16)}<b>Como você está hoje?</b></div>
      <div class="moods">${MOODS.map((m) => `<button class="mood ${d.mood === m.v ? 'sel' : ''}" data-act="mood" data-v="${m.v}"><b>${esc(m.face)}</b><small>${m.label}</small></button>`).join('')}</div>
    </section>
    <section class="panel module">
      <div class="mod-head">${icon('book', 16)}<b>Diário de bordo</b></div>
      <form data-form="journal-save"><textarea name="j" rows="5" maxlength="2000" placeholder="Pelo que você é grato hoje? O que aprendeu?">${esc(d.journal || '')}</textarea>
      <button class="btn btn-sm" type="submit">Salvar diário</button></form>
      ${journalHistory()}
    </section>`;
}
function journalHistory() {
  const t = todayKey();
  const entries = Object.entries(state.log).filter(([k, v]) => k !== t && (v.journal || v.mood)).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  if (!entries.length) return '';
  return `<details class="fold"><summary>Dias anteriores</summary><ul class="journal-list">${entries.map(([k, v]) => `
    <li><b>${fmtDate(k)}</b> ${v.mood ? `<span class="muted">${esc(MOODS[v.mood - 1].face)}</span>` : ''}<p>${esc(v.journal || '')}</p></li>`).join('')}</ul></details>`;
}
actions.mood = (el) => {
  dayLog(todayKey()).mood = Number(el.dataset.v);
  dailyBonus('mood', 'mente', 5, 2, 1, 'Check-in de humor');
  save();
  rerender();
};
forms['journal-save'] = (fd) => {
  const j = String(fd.get('j') || '').trim();
  dayLog(todayKey()).journal = j;
  if (j.length >= 20) dailyBonus('journal', 'mente', 10, 4, 1, 'Diário');
  save();
  toast('Diário salvo');
  rerender();
};

function socialModule() {
  return `<section class="panel module"><div class="mod-head">${icon('chat', 16)}<b>Ideias de missões sociais</b></div>
    <ul class="tips"><li>Ligar para alguém da família</li><li>Marcar um café com um amigo</li><li>Elogiar um colega de trabalho</li><li>Participar de um grupo ou evento</li></ul></section>`;
}

// Barrinhas simples para gráficos pequenos.
export function sparkBars(vals, cls = '', goal = null) {
  const max = Math.max(goal || 0, ...vals.map((v) => v.v)) || 1;
  const min = cls === 'weight' ? Math.min(...vals.map((v) => v.v)) * 0.98 : 0;
  return `<div class="spark ${cls}">${vals.map((v) => {
    const h = v.v ? Math.max(6, ((v.v - min) / (max - min || 1)) * 100) : 0;
    const ok = goal ? v.v >= goal : true;
    return `<div class="sb"><i style="height:${h}%" class="${ok ? 'ok' : ''}"></i><small>${v.l}</small></div>`;
  }).join('')}</div>`;
}

