// Loja: itens do jogo e recompensas reais criadas pelo jogador.
import { state, save, uid } from '../store.js';
import { BUILTIN_ITEMS, REWARD_EMOJIS } from '../data.js';
import { icon } from '../sprites.js';
import { actions, forms, esc, openModal, closeModal, modalHead, confirmBox, toast, emptyState, num } from '../ui.js';
import { buy, builtinItem } from '../game.js';
import { fmtDate } from '../dates.js';
import { rerender } from '../nav.js';

export function renderShop() {
  const p = state.player;
  return `<header class="screen-head"><h1>${icon('chest', 20)} Loja</h1><span class="gold-pill">${icon('coin', 14)} ${num(p.gold)}</span></header>
    <p class="muted small">Gaste o ouro conquistado nas missões com recompensas reais. Você merece!</p>
    <h3 class="sec-title">Itens do herói</h3>
    <div class="shop-grid">${BUILTIN_ITEMS.map((it) => `
      <div class="shop-item panel-inner">${icon(it.icon, 32)}<b>${esc(it.title)}</b><small>${esc(it.desc)}</small>
        <button class="btn btn-sm ${p.gold >= it.cost ? 'btn-gold' : ''}" data-act="buy-item" data-id="${it.id}" ${p.gold < it.cost || p.hp >= p.maxHp ? 'disabled' : ''}>${icon('coin', 10)} ${it.cost}</button></div>`).join('')}</div>
    <h3 class="sec-title">Suas recompensas</h3>
    <div class="shop-grid">${state.rewards.map((r) => `
      <div class="shop-item panel-inner"><button class="btn-icon edit" data-act="reward-edit" data-id="${r.id}" aria-label="Editar">✎</button>
        <span class="emoji">${esc(r.emoji || '🎁')}</span><b>${esc(r.title)}</b>
        <button class="btn btn-sm ${p.gold >= r.cost ? 'btn-gold' : ''}" data-act="buy-reward" data-id="${r.id}" ${p.gold < r.cost ? 'disabled' : ''}>${icon('coin', 10)} ${r.cost}</button></div>`).join('')}
      <button class="shop-item add panel-inner" data-act="reward-new">${icon('plus', 28)}<b>Nova recompensa</b></button>
    </div>
    <h3 class="sec-title">Histórico de resgates</h3>
    ${state.purchases.length ? `<ul class="mini-list">${state.purchases.slice(0, 30).map((x) => `<li><span>${fmtDate(x.date)}</span><span class="grow">${x.emoji ? esc(x.emoji) : icon(x.icon || 'gift', 12)} ${esc(x.title)}</span><b class="c-gold">−${x.cost}</b></li>`).join('')}</ul>` : emptyState('Nada resgatado ainda.', 'chest')}`;
}

actions['buy-item'] = (el) => {
  const it = builtinItem(el.dataset.id);
  if (buy(it)) rerender();
};
actions['buy-reward'] = (el) => {
  const r = state.rewards.find((x) => x.id === el.dataset.id);
  confirmBox(`Resgatar <b>${esc(r.emoji || '')} ${esc(r.title)}</b> por <b class="c-gold">${r.cost} ouro</b>?`, () => {
    if (buy(r)) rerender();
    else toast('Ouro insuficiente!', 'bad');
  }, 'Resgatar', false);
};

function rewardForm(r) {
  return `${modalHead(r.id ? 'Editar recompensa' : 'Nova recompensa', 'gift')}
    <form data-form="reward-save"><input type="hidden" name="id" value="${r.id || ''}">
      <label class="field"><span>Recompensa</span><input name="title" required maxlength="60" value="${esc(r.title || '')}" placeholder="Ex.: Ir ao cinema" autofocus></label>
      <label class="field"><span>Custo em ouro</span><input name="cost" type="number" min="1" max="99999" value="${r.cost || 50}" inputmode="numeric" required></label>
      <div class="field"><span>Ícone</span><div class="emoji-pick">${REWARD_EMOJIS.map((e) => `
        <label><input type="radio" name="emoji" value="${e}" ${(r.emoji || '🎁') === e ? 'checked' : ''}><span>${e}</span></label>`).join('')}</div></div>
      <p class="small muted">Dica: uma missão média dá ~8 de ouro. Defina custos que exijam esforço!</p>
      <div class="row-btns">${r.id ? `<button type="button" class="btn btn-red btn-sm" data-act="reward-del" data-id="${r.id}">Excluir</button>` : ''}<button class="btn btn-green" type="submit">Salvar</button></div>
    </form>`;
}
actions['reward-new'] = () => openModal(rewardForm({}));
actions['reward-edit'] = (el) => openModal(rewardForm(state.rewards.find((x) => x.id === el.dataset.id)));
actions['reward-del'] = (el) => {
  confirmBox('Excluir esta recompensa?', () => { state.rewards = state.rewards.filter((x) => x.id !== el.dataset.id); save(); rerender(); }, 'Excluir');
};
forms['reward-save'] = (fd) => {
  const data = { title: String(fd.get('title')).trim(), cost: Math.max(1, Math.round(Number(fd.get('cost')) || 1)), emoji: fd.get('emoji') || '🎁' };
  if (!data.title) return;
  const id = fd.get('id');
  if (id) Object.assign(state.rewards.find((x) => x.id === id), data);
  else state.rewards.push({ id: uid(), ...data });
  save();
  closeModal();
  rerender();
};
