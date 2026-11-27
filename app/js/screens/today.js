// Tela "Hoje": painel do herói, chefe da semana, agenda do dia e atalhos.
import { state, save } from '../store.js';
import { BOSSES, SECTORS, TIPS, CLASSES } from '../data.js';
import { heroSVG, bossSVG, icon } from '../sprites.js';
import { actions, esc, bar, emptyState, openModal, modalHead, num, closeModal } from '../ui.js';
import { xpToNext, toMin, nowMin } from '../game.js';
import { todayKey, fmtLong, weekKey, diffDays, pad } from '../dates.js';
import { agendaItems } from '../agenda.js';
import { questRow, habitRow } from './quests.js';
import { postRow } from './content.js';
import { sharedRow, partyStrip, groupBossCard } from './group.js';
import { pomodoroWidget } from './sectors.js';
import { inGroup } from '../cloud.js';
import { go, rerender } from '../nav.js';

export function heroCard() {
  const p = state.player;
  return `<section class="hero-card panel">
    <div class="hero-sprite" data-act="go" data-tab="heroi">${heroSVG(p.look, p.cls, 80, 'bob')}<span class="lvl">Nv ${p.level}</span></div>
    <div class="hero-stats">
      <div class="hero-name"><b>${esc(p.name)}</b><small>${CLASSES[p.cls]?.name || ''}</small></div>
      <div class="stat-line">${icon('heart', 12)}${bar(p.hp, p.maxHp, 'hp')}</div>
      <div class="stat-line">${icon('star', 12)}${bar(p.xp, xpToNext(p.level), 'xp')}</div>
      <div class="hero-money"><button class="gold-link" data-act="go" data-tab="heroi" data-sub="loja">${icon('coin', 12)} ${num(p.gold)}</button>
        <span class="streak">${icon('fire', 12)} ${state.stats.dayStreak} ${state.stats.dayStreak === 1 ? 'dia' : 'dias'}</span>
        ${state.settings.resting ? '<span class="resting">Descansando</span>' : ''}</div>
    </div>
  </section>`;
}

function bossCard() {
  if (inGroup()) return groupBossCard();
  const b = state.boss;
  if (!b) return '';
  const def = BOSSES[b.idx];
  const daysLeft = 7 - diffDays(weekKey(todayKey()), todayKey());
  return `<section class="boss-card panel ${b.defeated ? 'defeated' : ''}">
    <div class="boss-sprite">${bossSVG(def.color, 64, b.defeated ? 'defeated' : 'float')}</div>
    <div class="grow">
      <div class="boss-title"><small>CHEFE DA SEMANA</small><b>${esc(def.name)}</b></div>
      ${b.defeated ? '<p class="c-green small">Derrotado! Um novo chefe surge na segunda-feira.</p>' : `
        ${bar(b.hp, b.maxHp, 'boss')}
        <p class="small muted">"${esc(def.taunt)}" · ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes</p>`}
    </div>
  </section>`;
}

function reportBanner() {
  const r = state.pendingReport;
  if (!r) return '';
  return `<button class="report panel" data-act="report-open">${icon('skull', 20)}
    <span><b>Relatório da noite</b><small>${r.missed.length} missões não feitas · <span class="c-hp">-${r.dmg} HP</span></small></span><span class="chev">›</span></button>`;
}

function itemRow(it, key) {
  if (it.kind === 'post') return postRow(it.ref);
  if (it.kind === 'shared') return sharedRow(it.ref, key);
  return questRow(it.ref, key);
}

// Agenda: itens com horário em ordem, com a linha do "agora" no meio.
function agendaList(items, key) {
  const now = nowMin();
  let out = '';
  let placed = false;
  for (const it of items) {
    if (!placed && toMin(it.time) > now) {
      out += nowLine();
      placed = true;
    }
    out += itemRow(it, key);
  }
  if (!placed) out += nowLine();
  return out;
}
function nowLine() {
  const d = new Date();
  return `<div class="now-line"><span>agora · ${pad(d.getHours())}:${pad(d.getMinutes())}</span></div>`;
}

export function renderToday() {
  const key = todayKey();
  const items = agendaItems(key);
  const timed = items.filter((i) => i.time);
  const untimed = items.filter((i) => !i.time);
  const doneCount = items.filter((i) => i.done).length;
  const habits = state.quests.filter((q) => q.type === 'habit' && !q.archived);
  const d = state.log[key] || {};
  const tip = TIPS[(new Date().getDate()) % TIPS.length];
  const s = state.settings;
  const next = timed.find((i) => !i.done && toMin(i.time) >= nowMin());
  const widgets = [];
  if (s.sectors.includes('alimentacao')) {
    widgets.push(`<div class="mini panel-inner">
      <div class="mini-head">${icon('water', 14)}<b>Água</b><small>${d.water || 0}/${s.waterGoal}</small></div>
      ${bar(d.water || 0, s.waterGoal, 'water', false)}
      <div class="row-btns"><button class="btn btn-sm" data-act="water" data-n="-1">−</button><button class="btn btn-sm btn-blue" data-act="water" data-n="1">+1 copo</button></div></div>`);
  }
  if (s.sectors.includes('trabalho') || s.sectors.includes('estudos')) {
    widgets.push(`<div class="mini panel-inner">${pomodoroWidget(true)}</div>`);
  }

  return `<header class="screen-head"><h1>${icon('sun', 20)} Hoje</h1><small>${fmtLong(key)}</small></header>
    ${heroCard()}
    ${partyStrip()}
    ${reportBanner()}
    ${bossCard()}
    ${next ? `<div class="next-up">${icon('bell', 14)} Próximo: <b>${esc(next.time)}</b> ${esc(next.title)} <small>${toMin(next.time) - nowMin() <= 0 ? 'agora' : `em ${fmtIn(toMin(next.time) - nowMin())}`}</small></div>` : ''}
    <h3 class="sec-title">Agenda do dia <small>${doneCount}/${items.length}</small></h3>
    ${items.length ? bar(doneCount, items.length, 'progress', false) : ''}
    ${timed.length ? `<div class="list agenda">${agendaList(timed, key)}</div>` : ''}
    ${untimed.length ? `${timed.length ? '<h4 class="sub-title">Sem horário</h4>' : ''}<div class="list">${untimed.map((it) => itemRow(it, key)).join('')}</div>` : ''}
    ${!items.length ? emptyState('Nada agendado para hoje. Que tal criar uma missão ou escolher na Biblioteca?') : ''}
    <div class="two-btns"><button class="btn" data-act="q-new">+ Nova missão</button><button class="btn" data-act="lib-open">${icon('book', 14)} Biblioteca</button></div>
    ${habits.length ? `<h3 class="sec-title">Hábitos</h3><div class="list">${habits.map((q) => habitRow(q, key)).join('')}</div>` : ''}
    ${widgets.length ? `<h3 class="sec-title">Atalhos</h3><div class="minis">${widgets.join('')}</div>` : ''}
    <p class="tip">${icon('scroll', 12)} ${esc(tip)}</p>`;
}

const fmtIn = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ''}`);

actions['report-open'] = () => {
  const r = state.pendingReport;
  openModal(`${modalHead('Relatório da noite', 'skull')}
    <p>Enquanto você dormia, estas missões ficaram para trás:</p>
    <ul class="report-list">${r.missed.map((m) => `<li>${icon(SECTORS[m.sector]?.icon || 'scroll', 14)} ${esc(m.title)}</li>`).join('')}</ul>
    <p class="center">Dano total: <b class="c-hp">-${r.dmg} HP</b></p>
    <p class="muted small center">As sequências dessas missões foram zeradas. Hoje é um novo dia!</p>
    <div class="row-btns"><button class="btn btn-green" data-act="report-ok">Entendido</button></div>`);
};
actions['report-ok'] = () => {
  state.pendingReport = null;
  save();
  closeModal();
  rerender();
};
actions.go = (el) => {
  const params = {};
  if (el.dataset.sector) params.sector = el.dataset.sector;
  if (el.dataset.sub) params.sub = el.dataset.sub;
  go(el.dataset.tab, params);
};
