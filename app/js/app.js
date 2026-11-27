// Ponto de entrada: renderização, navegação por abas e eventos globais.
import { state, save } from './store.js';
import { icon } from './sprites.js';
import { setSound, play } from './sfx.js';
import { actions, forms, flushEvents, isModalOpen } from './ui.js';
import { processDays, checkAchievements } from './game.js';
import { route, setRenderer, go } from './nav.js';
import { renderOnboarding } from './screens/onboarding.js';
import { renderToday } from './screens/today.js';
import { renderQuests } from './screens/quests.js';
import { renderSectors, tickPomodoro } from './screens/sectors.js';
import { renderShop } from './screens/shop.js';
import { renderHero } from './screens/hero.js';

const TABS = [
  { id: 'hoje', label: 'Hoje', icon: 'sun', render: renderToday },
  { id: 'missoes', label: 'Missões', icon: 'scroll', render: renderQuests },
  { id: 'setores', label: 'Setores', icon: 'map', render: renderSectors },
  { id: 'loja', label: 'Loja', icon: 'chest', render: renderShop },
  { id: 'heroi', label: 'Herói', icon: 'hero', render: renderHero },
];

const app = document.getElementById('app');
let lastRouteKey = '';

function render(resetScroll = false) {
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

actions.tab = (el) => {
  play('click');
  const same = route.tab === el.dataset.tab;
  go(el.dataset.tab, same ? {} : {});
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

// ---------- ciclo do dia ----------
function onWake() {
  if (!state.player) return;
  const before = state.lastProcessed;
  processDays();
  checkAchievements();
  if (before !== state.lastProcessed) render(true);
  else flushEvents();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) onWake(); });
window.addEventListener('focus', onWake);

setInterval(() => {
  if (tickPomodoro()) {
    if (!isModalOpen()) render();
    else flushEvents();
  }
}, 1000);
// Confere a virada da meia-noite com o app aberto.
setInterval(onWake, 60000);

// ---------- inicialização ----------
if (state.player) {
  processDays();
  checkAchievements();
  save();
}
render(true);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW não registrado', err));
}
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
