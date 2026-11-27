// Agenda do dia (missões, posts e tarefas da casa) e lembretes por horário.
import { state, save, dayLog } from './store.js';
import { todayQuests, questIsDone, postsOn, emit, toMin, nowMin } from './game.js';
import { sharedForToday, sharedIsDone } from './cloud.js';
import { todayKey } from './dates.js';

// Itens de hoje em ordem: primeiro os com horário (cronológico), depois os sem horário.
export function agendaItems(key = todayKey()) {
  const items = [];
  for (const q of todayQuests(key)) {
    items.push({ kind: 'quest', id: q.id, time: q.time || null, remind: q.remind, title: q.title, done: questIsDone(q, key), ref: q });
  }
  for (const p of postsOn(key)) {
    items.push({ kind: 'post', id: p.id, time: p.time || null, remind: p.remind, title: p.title, done: p.status === 'postado', ref: p });
  }
  for (const s of sharedForToday(key)) {
    items.push({ kind: 'shared', id: s.id, time: s.time || null, remind: s.remind, title: s.title, done: sharedIsDone(s, key), ref: s });
  }
  items.sort((a, b) => {
    if (a.time && b.time) return toMin(a.time) - toMin(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return Number(a.done) - Number(b.done);
  });
  return items;
}

// ---------- notificações do sistema ----------
export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const notifyPermission = () => (notifySupported() ? Notification.permission : 'unsupported');

export async function requestNotify() {
  if (!notifySupported()) return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return Notification.permission; }
}

export async function systemNotify(title, body, tag) {
  if (!state.settings.notify || notifyPermission() !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) await reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
    else new Notification(title, { body, tag });
  } catch { /* sem suporte */ }
}

// Confere os lembretes (chamado periodicamente enquanto o app está aberto).
export function checkReminders() {
  if (!state.player) return;
  const key = todayKey();
  const now = nowMin();
  let d = null;
  for (const it of agendaItems(key)) {
    if (it.done || !it.time || it.remind === null || it.remind === undefined || it.remind === '') continue;
    const t = toMin(it.time);
    const at = t - Number(it.remind);
    if (now < at || now > t + 60) continue;
    d ||= dayLog(key);
    d.notified ||= {};
    const k = `${it.kind}:${it.id}`;
    if (d.notified[k]) continue;
    d.notified[k] = 1;
    const mins = t - now;
    const when = mins > 0 ? `em ${mins} min` : mins === 0 ? 'agora' : `há ${-mins} min`;
    emit('reminder', { title: it.title, time: it.time, when, kind: it.kind });
    if (document.visibilityState !== 'visible') systemNotify(`⏰ ${it.time} · ${it.title}`, `Daily Quest: ${when}`, k);
  }
  if (d) save();
}
