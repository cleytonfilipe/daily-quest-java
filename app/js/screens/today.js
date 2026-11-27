// Tela "Hoje": painel do herói, chefe da semana, missões do dia e atalhos.
import { state, save, dayLog } from '../store.js';
import { BOSSES, SECTORS, TIPS, CLASSES } from '../data.js';
import { heroSVG, bossSVG, icon } from '../sprites.js';
import { actions, esc, bar, emptyState, openModal, modalHead, num } from '../ui.js';
import { todayQuests, questIsDone, xpToNext } from '../game.js';
import { todayKey, fmtLong, weekKey, addDays, diffDays } from '../dates.js';
import { questRow, habitRow } from './quests.js';
import { pomodoroWidget } from './sectors.js';
import { go, rerender } from '../nav.js';

export function heroCard(compact = false) {
  const p = state.player;
  return `<section class="hero-card panel">
    <div class="hero-sprite" data-act="go" data-tab="heroi">${heroSVG(p.look, p.cls, compact ? 64 : 80, 'bob')}<span class="lvl">Nv ${p.level}</span></div>
    <div class="hero-stats">
      <div class="hero-name"><b>${esc(p.name)}</b><small>${CLASSES[p.cls]?.name || ''}</small></div>
      <div class="stat-line">${icon('heart', 12)}${bar(p.hp, p.maxHp, 'hp')}</div>
      <div class="stat-line">${icon('star', 12)}${bar(p.xp, xpToNext(p.level), 'xp')}</div>
      <div class="hero-money"><span class="c-gold">${icon('coin', 12)} ${num(p.gold)}</span>
        <span class="streak">${icon('fire', 12)} ${state.stats.dayStreak} ${state.stats.dayStreak === 1 ? 'dia' : 'dias'}</span>
        ${state.settings.resting ? '<span class="resting">Descansando</span>' : ''}</div>
    </div>
  </section>`;
}

function bossCard() {
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

export function renderToday() {
  const key = todayKey();
  const quests = todayQuests(key);
  quests.sort((a, b) => Number(questIsDone(a, key)) - Number(questIsDone(b, key)));
  const doneCount = quests.filter((q) => questIsDone(q, key)).length;
  const habits = state.quests.filter((q) => q.type === 'habit' && !q.archived);
  const d = state.log[key] || {};
  const tip = TIPS[(new Date().getDate()) % TIPS.length];
  const s = state.settings;
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
    ${reportBanner()}
    ${bossCard()}
    <h3 class="sec-title">Missões do dia <small>${doneCount}/${quests.length}</small></h3>
    ${quests.length ? `${bar(doneCount, quests.length, 'progress', false)}<div class="list">${quests.map((q) => questRow(q, key)).join('')}</div>` : emptyState('Nenhuma missão para hoje. Que tal criar uma?')}
    <button class="btn btn-wide" data-act="q-new">+ Nova missão</button>
    ${habits.length ? `<h3 class="sec-title">Hábitos</h3><div class="list">${habits.map((q) => habitRow(q, key)).join('')}</div>` : ''}
    ${widgets.length ? `<h3 class="sec-title">Atalhos</h3><div class="minis">${widgets.join('')}</div>` : ''}
    <p class="tip">${icon('scroll', 12)} ${esc(tip)}</p>`;
}

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
  document.getElementById('modal-root').innerHTML = '';
  document.body.classList.remove('modal-open');
  rerender();
};
actions.go = (el) => go(el.dataset.tab, el.dataset.sector ? { sector: el.dataset.sector } : {});

