// Componentes e utilitários de interface compartilhados.
import { icon, heroSVG, bossSVG } from './sprites.js';
import { play } from './sfx.js';
import { events } from './game.js';
import { ATTRS, SECTORS, BOSSES } from './data.js';
import { state } from './store.js';

export const actions = {};
export const forms = {};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const money = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const num = (n) => (Number(n) || 0).toLocaleString('pt-BR');

export function bar(cur, max, cls = '', label = true) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  return `<div class="bar ${cls}"><i style="width:${pct}%"></i>${label ? `<span>${num(Math.round(cur))}/${num(Math.round(max))}</span>` : ''}</div>`;
}

export function sectorTag(id) {
  const s = SECTORS[id];
  if (!s) return '';
  return `<span class="tag" style="--c:${s.color}">${icon(s.icon, 12)}${esc(s.name)}</span>`;
}

export function emptyState(text, ic = 'scroll') {
  return `<div class="empty">${icon(ic, 32)}<p>${text}</p></div>`;
}

// ---------- modais ----------
const modalRoot = () => document.getElementById('modal-root');

export function openModal(html, { wide = false, onOpen } = {}) {
  modalRoot().innerHTML = `<div class="modal-back" data-act="modal-back"><div class="modal panel ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.classList.add('modal-open');
  onOpen?.(modalRoot().querySelector('.modal'));
  const first = modalRoot().querySelector('[autofocus]');
  if (first && !matchMedia('(hover: none)').matches) first.focus();
}

export function closeModal() {
  modalRoot().innerHTML = '';
  document.body.classList.remove('modal-open');
}

export const isModalOpen = () => !!modalRoot().firstChild;

export function modalHead(title, ic) {
  return `<div class="modal-head">${ic ? icon(ic, 20) : ''}<h2>${esc(title)}</h2><button type="button" class="btn-x" data-act="modal-close" aria-label="Fechar">×</button></div>`;
}

let confirmCb = null;
export function confirmBox(text, onYes, yesLabel = 'Confirmar', danger = true) {
  confirmCb = onYes;
  openModal(`${modalHead('Tem certeza?')}<p class="center">${text}</p>
    <div class="row-btns"><button class="btn" data-act="modal-close">Cancelar</button>
    <button class="btn ${danger ? 'btn-red' : 'btn-green'}" data-act="confirm-yes">${esc(yesLabel)}</button></div>`);
}
actions['confirm-yes'] = () => { const cb = confirmCb; confirmCb = null; closeModal(); cb?.(); };
actions['modal-close'] = () => closeModal();
actions['modal-back'] = (el, e) => { if (e.target === el) closeModal(); };

// ---------- toasts ----------
export function toast(html, cls = '') {
  const root = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${cls}`;
  t.innerHTML = html;
  root.appendChild(t);
  while (root.children.length > 3) root.firstChild.remove();
  setTimeout(() => t.classList.add('out'), 2000);
  setTimeout(() => t.remove(), 2400);
}

// Exibe os eventos gerados pelas regras do jogo.
export function flushEvents() {
  const big = [];
  let sound = null;
  while (events.length) {
    const ev = events.shift();
    switch (ev.type) {
      case 'gain': {
        const parts = [`<b class="c-xp">+${ev.xp} XP</b>`];
        if (ev.gold) parts.push(`<b class="c-gold">+${ev.gold} ouro</b>`);
        if (ev.attr && ev.pts) parts.push(`<b style="color:${ATTRS[ev.attr].color}">+${ev.pts} ${ATTRS[ev.attr].short}</b>`);
        toast(`${icon('star', 14)} ${parts.join(' ')}${ev.boss ? `<small>${ev.boss} de dano no chefe!</small>` : ''}`);
        sound ||= 'complete';
        break;
      }
      case 'damage': toast(`${icon('heart', 14)} <b class="c-hp">-${ev.n} HP</b>`, 'bad'); sound ||= 'damage'; break;
      case 'undo': toast('Missão desmarcada'); sound ||= 'undo'; break;
      case 'buy': toast(`${icon('chest', 14)} Resgatado: <b>${esc(ev.title)}</b> <b class="c-gold">-${ev.cost}</b>`); sound = 'coin'; break;
      case 'achievement': big.push(ev); break;
      case 'levelup': big.push(ev); break;
      case 'boss': big.push(ev); break;
      case 'faint': big.push(ev); break;
      case 'goal': big.push(ev); break;
      case 'bossEscaped': toast(`O chefe <b>${esc(ev.name)}</b> fugiu! Um novo desafio surgiu.`); break;
      default: break;
    }
  }
  if (sound && !big.length) play(sound);
  if (big.length) showBig(big);
}

function showBig(list) {
  const p = state.player;
  const order = ['faint', 'boss', 'levelup', 'goal', 'achievement'];
  list.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  const ev = list[0];
  const rest = list.slice(1);
  let html = '';
  if (ev.type === 'levelup') {
    play('levelup');
    html = `<div class="big-event"><div class="burst">${heroSVG(p.look, p.cls, 112, 'bounce')}</div>
      <h1 class="glow">LEVEL UP!</h1><p>Você alcançou o <b>nível ${ev.level}</b>!</p><p class="muted">HP máximo +5 e vida restaurada.</p></div>`;
  } else if (ev.type === 'boss') {
    play('boss');
    html = `<div class="big-event"><div class="burst">${bossSVG(BOSSES[state.boss?.idx ?? 0].color, 96, 'defeated')}</div>
      <h1 class="glow">CHEFE DERROTADO!</h1><p><b>${esc(ev.name)}</b> caiu!</p><p><b class="c-xp">+${ev.xp} XP</b> <b class="c-gold">+${ev.gold} ouro</b></p></div>`;
  } else if (ev.type === 'faint') {
    play('faint');
    html = `<div class="big-event">${icon('skull', 64)}<h1 class="c-hp">VOCÊ DESMAIOU</h1>
      <p>Seu HP chegou a zero. Você perdeu <b class="c-gold">${ev.lost} de ouro</b> e o XP do nível atual.</p>
      <p class="muted">Levante-se, herói. Toda jornada tem tropeços!</p></div>`;
  } else if (ev.type === 'goal') {
    play('achievement');
    html = `<div class="big-event"><div class="burst">${icon('trophy', 64)}</div><h1 class="glow">OBJETIVO CONCLUÍDO!</h1>
      <p>${esc(ev.title)}</p><p><b class="c-xp">+150 XP</b> <b class="c-gold">+75 ouro</b></p></div>`;
  } else if (ev.type === 'achievement') {
    play('achievement');
    const extra = rest.filter((r) => r.type === 'achievement');
    const all = [ev, ...extra];
    rest.splice(0, rest.length, ...rest.filter((r) => r.type !== 'achievement'));
    html = `<div class="big-event"><div class="burst">${icon('trophy', 56)}</div><h1 class="glow">CONQUISTA!</h1>
      ${all.map((a) => `<p><b>${esc(a.name)}</b>${a.gold ? ` <b class="c-gold">+${a.gold} ouro</b>` : ''}</p>`).join('')}</div>`;
  }
  pendingBig = rest;
  openModal(`${html}<div class="row-btns"><button class="btn btn-green" data-act="big-next" autofocus>Continuar</button></div>`);
}
let pendingBig = [];
actions['big-next'] = () => {
  closeModal();
  if (pendingBig.length) { const r = pendingBig; pendingBig = []; showBig(r); }
};
