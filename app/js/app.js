// Ponto de entrada: renderização, navegação por abas e eventos globais.
import { state, save } from './store.js';
import { icon } from './sprites.js';
import { setSound, play } from './sfx.js';
import { actions, forms, flushEvents, isModalOpen, openModal, modalHead } from './ui.js';
import { processDays, checkAchievements } from './game.js';
import { route, setRenderer, go } from './nav.js';
import { checkReminders } from './agenda.js';
import {
  initCloud, onCloudChange, isConfigured, setPendingInvite, saveConfig, decodeConfig, normalizeCode, heartbeat, flushCloud,
} from './cloud.js';
import { renderOnboarding } from './screens/onboarding.js';
import { renderToday } from './screens/today.js';
import { renderQuests } from './screens/quests.js';
import { renderSectors, tickPomodoro } from './screens/sectors.js';
import { renderGroup } from './screens/group.js';
import { renderHero } from './screens/hero.js';
import './screens/shop.js';
import './screens/library.js';
import './screens/content.js';

const TABS = [
  { id: 'hoje', label: 'Hoje', icon: 'sun', render: renderToday },
  { id: 'missoes', label: 'Missões', icon: 'scroll', render: renderQuests },
  { id: 'setores', label: 'Setores', icon: 'map', render: renderSectors },
  { id: 'grupo', label: 'Grupo', icon: 'group', render: renderGroup },
  { id: 'heroi', label: 'Herói', icon: 'hero', render: renderHero },
];

const app = document.getElementById('app');
let lastRouteKey = '';

function render(resetScroll = false) {
  pendingSoft = false;
  setSound(state.settings.sound);
  if (!state.player) {
    app.className = 'onboarding-mode';
    app.innerHTML = renderOnboarding();
    window.scrollTo(0, 0);
    flushEvents();
    return;
  }
  const tab = TABS.find((t) => t.id === route.tab) || TABS[0];
  const routeKey = `${tab.id}|${route.params.sector || ''}|${route.params.sub || ''}`;
  const view = document.getElementById('view');
  const keepScroll = !resetScroll && routeKey === lastRouteKey && view ? view.scrollTop : 0;
  app.className = '';
  app.innerHTML = `<main id="view" class="view">${tab.render()}<div class="view-pad"></div></main>
    <nav class="tabbar">${TABS.map((t) => `<button class="${t.id === tab.id ? 'sel' : ''}" data-act="tab" data-tab="${t.id}">${icon(t.icon, 20)}<span>${t.label}</span></button>`).join('')}</nav>`;
  document.getElementById('view').scrollTop = keepScroll;
  lastRouteKey = routeKey;
  flushEvents();
}
setRenderer(render);

// Atualizações vindas da nuvem não podem apagar o que a pessoa está digitando.
let pendingSoft = false;
const typing = () => {
  const a = document.activeElement;
  return !!(a && a.closest('#app') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
};
function softRender() {
  if (typing()) { pendingSoft = true; return; }
  render();
}
document.addEventListener('focusout', () => {
  setTimeout(() => { if (pendingSoft && !typing()) render(); }, 60);
});
onCloudChange(softRender);

actions.tab = (el) => {
  play('click');
  go(el.dataset.tab, {});
};

// ---------- delegação de eventos ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'A') e.preventDefault();
  fn(el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  actions[el.dataset.change]?.(el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  forms[form.dataset.form]?.(new FormData(form), form);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen()) actions['modal-close']();
});

// ---------- links: convite, configuração e aba inicial ----------
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (!h.toString()) return;
  const cfg = h.get('cfg');
  if (cfg) {
    try { saveConfig(decodeConfig(cfg)); } catch (e) { console.warn('Configuração inválida no link', e); }
  }
  const code = normalizeCode(h.get('convite'));
  if (code) {
    setPendingInvite(code);
    route.tab = 'grupo';
  }
  const tab = h.get('aba');
  if (tab && TABS.some((t) => t.id === tab)) route.tab = tab;
  history.replaceState(null, '', location.pathname + location.search);
}

// ---------- ciclo do dia ----------
function onWake() {
  if (!state.player) return;
  const before = state.lastProcessed;
  processDays();
  checkAchievements();
  checkReminders();
  heartbeat();
  if (before !== state.lastProcessed) render(true);
  else if (!typing()) flushEvents();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushCloud().catch(() => {});
  else onWake();
});
window.addEventListener('focus', onWake);

setInterval(() => {
  if (tickPomodoro()) {
    if (!isModalOpen()) softRender();
    else flushEvents();
  }
}, 1000);
// Lembretes, virada da meia-noite e sinal de vida para o grupo.
setInterval(() => {
  if (!state.player) return;
  checkReminders();
  flushEvents();
}, 20000);
setInterval(onWake, 60000);
// Mantém a linha do "agora" e as etiquetas de atraso atualizadas.
setInterval(() => { if (state.player && route.tab === 'hoje' && !isModalOpen()) softRender(); }, 5 * 60000);

// ---------- novidades da versão 2 ----------
function whatsNew() {
  if (!state.player || (state.seenVersion || 1) >= 2) return;
  state.seenVersion = 2;
  save();
  openModal(`${modalHead('Novidades!', 'star')}
    <ul class="tips">
      <li><b>Agenda com horários</b>: missões podem ter hora marcada e lembrete. Feitas no horário dão +20% de XP.</li>
      <li><b>Setor Conteúdo</b>: calendário de posts com cliente, plataforma, formato e status, para quem trabalha com social media.</li>
      <li><b>Biblioteca de hábitos</b>: sugestões prontas por setor para montar sua rotina.</li>
      <li><b>Grupo</b>: jogue com sua dupla, dividam as tarefas da casa e enfrentem o mesmo chefe.</li>
      <li><b>Dia perfeito</b>: conclua tudo do dia e ganhe bônus.</li>
    </ul>
    <div class="row-btns">
      ${state.settings.sectors.includes('conteudo') ? '' : '<button class="btn" data-act="wn-content">Ativar Conteúdo</button>'}
      <button class="btn btn-green" data-act="modal-close">Bora!</button>
    </div>`);
}
actions['wn-content'] = () => {
  if (!state.settings.sectors.includes('conteudo')) state.settings.sectors.push('conteudo');
  save();
  actions['modal-close']();
  go('setores', { sector: 'conteudo' });
};

// ---------- inicialização ----------
readHash();
if (state.player) {
  processDays();
  checkAchievements();
  save();
}
render(true);
whatsNew();
if (isConfigured()) initCloud();
setTimeout(() => { if (state.player) { checkReminders(); flushEvents(); } }, 1500);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW não registrado', err));
}
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
