// Regras do jogo: XP, níveis, atributos, HP, sequências, chefe semanal e conquistas.
import { state, save, dayLog, uid } from './store.js';
import { SECTORS, CLASSES, DIFFICULTY, ACHIEVEMENTS, BOSSES, BUILTIN_ITEMS, OBJECTIVE_PRESETS } from './data.js';
import { todayKey, addDays, weekday, weekKey } from './dates.js';

// ---------- fila de eventos para a interface (toasts, level up, etc.) ----------
export const events = [];
const emit = (type, data = {}) => events.push({ type, ...data });

// ---------- progressão ----------
export const xpToNext = (level) => 100 + (level - 1) * 50;
const attrBase = (lvl) => (5 * lvl * (lvl - 1)) / 2;

export function attrInfo(pts = 0) {
  let lvl = 1;
  while (attrBase(lvl + 1) <= pts) lvl++;
  return { level: lvl, cur: pts - attrBase(lvl), need: attrBase(lvl + 1) - attrBase(lvl) };
}

export function createPlayer({ name, cls, look }) {
  return {
    name, cls, look,
    level: 1, xp: 0, hp: 50, maxHp: 50, gold: 0,
    attrs: { for: 0, vit: 0, foc: 0, riq: 0, ene: 0, sab: 0, esp: 0, car: 0 },
  };
}

function addXp(xp) {
  const p = state.player;
  p.xp += xp;
  while (p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    p.maxHp += 5;
    p.hp = p.maxHp;
    emit('levelup', { level: p.level });
  }
}

function markActive() {
  const t = todayKey();
  const st = state.stats;
  if (st.lastActiveDay === t) return;
  st.dayStreak = st.lastActiveDay === addDays(t, -1) ? st.dayStreak + 1 : 1;
  st.bestDayStreak = Math.max(st.bestDayStreak, st.dayStreak);
  st.lastActiveDay = t;
}

// Concede XP/ouro/pontos de atributo. Retorna um "recibo" que permite desfazer.
export function reward(sector, baseXp, baseGold, pts, opts = {}) {
  const p = state.player;
  const cls = CLASSES[p.cls] || CLASSES.guerreiro;
  let xp = baseXp;
  let gold = baseGold;
  if (cls.bonusSectors.includes(sector)) xp = Math.round(xp * 1.1);
  if (cls.goldBonus) gold = Math.round(gold * (1 + cls.goldBonus));
  if (opts.streak) {
    const mult = 1 + Math.min(opts.streak - 1, 25) * 0.02;
    xp = Math.round(xp * mult);
    gold = Math.round(gold * mult);
  }
  const attr = SECTORS[sector]?.attr || null;
  const date = todayKey();
  addXp(xp);
  p.gold += gold;
  if (attr) p.attrs[attr] = (p.attrs[attr] || 0) + pts;
  const d = dayLog(date);
  d.xp += xp;
  d.gold += gold;
  state.stats.totalXp += xp;
  state.stats.totalGold += gold;
  const boss = opts.noBoss ? 0 : damageBoss(xp);
  markActive();
  if (!opts.silent) emit('gain', { xp, gold, attr, pts, boss, label: opts.label });
  return { xp, gold, pts, attr, boss, date };
}

export function revoke(r) {
  if (!r) return;
  const p = state.player;
  p.xp -= r.xp;
  while (p.xp < 0 && p.level > 1) {
    p.level--;
    p.xp += xpToNext(p.level);
    p.maxHp -= 5;
  }
  p.xp = Math.max(0, p.xp);
  p.hp = Math.min(p.hp, p.maxHp);
  p.gold = Math.max(0, p.gold - r.gold);
  if (r.attr) p.attrs[r.attr] = Math.max(0, (p.attrs[r.attr] || 0) - r.pts);
  const d = dayLog(r.date || todayKey());
  d.xp = Math.max(0, d.xp - r.xp);
  d.gold = Math.max(0, d.gold - r.gold);
  state.stats.totalXp = Math.max(0, state.stats.totalXp - r.xp);
  state.stats.totalGold = Math.max(0, state.stats.totalGold - r.gold);
  if (r.boss && state.boss && !state.boss.defeated) state.boss.hp = Math.min(state.boss.maxHp, state.boss.hp + r.boss);
}

// ---------- HP ----------
export function takeDamage(n) {
  const p = state.player;
  if (n <= 0) return;
  p.hp -= n;
  emit('damage', { n });
  if (p.hp <= 0) {
    const lost = Math.floor(p.gold * 0.25);
    p.gold -= lost;
    p.xp = 0;
    p.hp = p.maxHp;
    state.stats.deaths++;
    emit('faint', { lost });
  }
}

export function heal(n) {
  const p = state.player;
  p.hp = Math.min(p.maxHp, p.hp + n);
}

// ---------- chefe semanal ----------
export function ensureBoss() {
  if (!state.player) return;
  const wk = weekKey(todayKey());
  if (state.boss && state.boss.week === wk) return;
  const prev = state.boss;
  const idx = state.stats.bossesSeen % BOSSES.length;
  const maxHp = 200 + state.player.level * 30;
  state.boss = { week: wk, idx, maxHp, hp: maxHp, defeated: false };
  state.stats.bossesSeen++;
  if (prev && !prev.defeated) emit('bossEscaped', { name: BOSSES[prev.idx].name });
}

function damageBoss(amount) {
  const b = state.boss;
  if (!b || b.defeated) return 0;
  const dmg = Math.min(amount, b.hp);
  b.hp -= dmg;
  if (b.hp <= 0) {
    b.defeated = true;
    b.defeatedAt = todayKey();
    state.stats.bossesDefeated++;
    const gold = 60 + state.player.level * 10;
    const xp = 100;
    reward(null, xp, gold, 0, { noBoss: true, silent: true });
    emit('boss', { name: BOSSES[b.idx].name, gold, xp });
  }
  return dmg;
}

// ---------- missões ----------
export function isScheduled(q, key) {
  if (q.type !== 'daily') return false;
  return !q.days || q.days.length === 0 || q.days.includes(weekday(key));
}
export const isDoneOn = (q, key) => !!state.log[key]?.done?.[q.id];
export const isDoneThisWeek = (q, key) => !!q.lastDone && weekKey(q.lastDone) === weekKey(key);

export function questIsDone(q, key = todayKey()) {
  if (q.type === 'daily') return isDoneOn(q, key);
  if (q.type === 'weekly') return isDoneThisWeek(q, key);
  if (q.type === 'once') return !!q.completedAt;
  return false;
}

// Missões que aparecem em "Hoje".
export function todayQuests(key = todayKey()) {
  return state.quests.filter((q) => {
    if (q.archived || q.type === 'habit') return false;
    if (q.type === 'daily') return isScheduled(q, key);
    if (q.type === 'weekly') return true;
    if (q.type === 'once') return !q.completedAt || q.completedAt === key;
    return false;
  });
}

export function newQuest(data) {
  return {
    id: uid(), title: data.title, sector: data.sector, type: data.type || 'daily', diff: data.diff || 'medio',
    days: data.days || [], due: data.due || null, notes: data.notes || '', positive: data.positive ?? true,
    negative: data.negative ?? false, goalId: data.goalId || null, createdAt: todayKey(),
    streak: 0, best: 0, count: 0, lastDone: null, completedAt: null, archived: false,
  };
}

export function completeQuest(q) {
  const key = todayKey();
  const d = dayLog(key);
  if (d.done[q.id] || questIsDone(q, key)) return;
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.medio;
  let streak = 0;
  const prev = { streak: q.streak, lastDone: q.lastDone };
  if (q.type === 'daily' || q.type === 'weekly') {
    q.streak = (q.streak || 0) + 1;
    q.best = Math.max(q.best || 0, q.streak);
    state.stats.bestStreak = Math.max(state.stats.bestStreak, q.streak);
    streak = q.streak;
  }
  const r = reward(q.sector, diff.xp, diff.gold, diff.pts, { streak, label: q.title });
  d.done[q.id] = { ...r, prev };
  q.lastDone = key;
  q.count = (q.count || 0) + 1;
  if (q.type === 'once') q.completedAt = key;
  state.stats.questsDone++;
  checkAchievements();
  save();
}

export function uncompleteQuest(q) {
  const key = todayKey();
  const d = dayLog(key);
  const r = d.done[q.id];
  if (!r) return;
  revoke(r);
  delete d.done[q.id];
  q.streak = r.prev?.streak ?? Math.max(0, (q.streak || 1) - 1);
  q.lastDone = r.prev?.lastDone ?? null;
  q.count = Math.max(0, (q.count || 1) - 1);
  if (q.type === 'once') q.completedAt = null;
  state.stats.questsDone = Math.max(0, state.stats.questsDone - 1);
  emit('undo');
  save();
}

export function habitPlus(q) {
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.facil;
  const d = dayLog(todayKey());
  const h = (d.habits[q.id] ||= { plus: 0, minus: 0 });
  h.plus++;
  q.count = (q.count || 0) + 1;
  reward(q.sector, Math.ceil(diff.xp / 2), Math.ceil(diff.gold / 2), 1, { label: q.title });
  checkAchievements();
  save();
}

export function habitMinus(q) {
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.facil;
  const d = dayLog(todayKey());
  const h = (d.habits[q.id] ||= { plus: 0, minus: 0 });
  h.minus++;
  takeDamage(diff.dmg);
  save();
}

// Bônus que só pode ser recebido uma vez por dia (água, sono, humor...).
export function dailyBonus(id, sector, xp, gold, pts, label) {
  const d = dayLog(todayKey());
  if (d.bonuses[id]) return false;
  d.bonuses[id] = reward(sector, xp, gold, pts, { label });
  checkAchievements();
  return true;
}

// ---------- objetivos ----------
export function newGoal(data) {
  return {
    id: uid(), title: data.title, sector: data.sector, kind: data.kind || 'milestone', unit: data.unit || '',
    target: Number(data.target) || 0, current: Number(data.current) || 0, deadline: data.deadline || null,
    notes: data.notes || '', presetId: data.presetId || null, createdAt: todayKey(), done: false, doneAt: null, receipt: null,
  };
}

export function completeGoal(g) {
  if (g.done) return;
  g.done = true;
  g.doneAt = todayKey();
  g.receipt = reward(g.sector, 150, 75, 10, { label: `Objetivo: ${g.title}` });
  state.stats.goalsDone++;
  emit('goal', { title: g.title });
  checkAchievements();
  save();
}

export function reopenGoal(g) {
  if (!g.done) return;
  revoke(g.receipt);
  g.done = false;
  g.doneAt = null;
  g.receipt = null;
  state.stats.goalsDone = Math.max(0, state.stats.goalsDone - 1);
  save();
}

// Cria objetivos e missões a partir dos objetivos sugeridos escolhidos no cadastro.
export function applyPresets(ids) {
  for (const id of ids) {
    const p = OBJECTIVE_PRESETS.find((x) => x.id === id);
    if (!p) continue;
    const goal = newGoal({
      title: p.goal?.title || p.title, sector: p.sector, kind: p.goal?.kind || 'milestone',
      unit: p.goal?.unit, target: p.goal?.target, presetId: p.id,
    });
    state.goals.push(goal);
    for (const q of p.quests || []) {
      state.quests.push(newQuest({ ...q, sector: q.sector || p.sector, type: q.type || 'daily', goalId: goal.id }));
    }
    for (const h of p.habits || []) {
      state.quests.push(newQuest({ ...h, sector: h.sector || p.sector, type: 'habit', positive: !h.negative, negative: !!h.negative, goalId: goal.id }));
    }
  }
}

// ---------- loja ----------
export function buy(item) {
  const p = state.player;
  if (p.gold < item.cost) return false;
  p.gold -= item.cost;
  if (item.heal) heal(item.heal);
  state.purchases.unshift({ id: uid(), title: item.title, cost: item.cost, emoji: item.emoji || null, icon: item.icon || null, date: todayKey() });
  if (!item.heal) state.stats.rewardsBought++;
  emit('buy', { title: item.title, cost: item.cost });
  checkAchievements();
  save();
  return true;
}

export const builtinItem = (id) => BUILTIN_ITEMS.find((i) => i.id === id);

// ---------- conquistas ----------
export function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.test(state); } catch { ok = false; }
    if (ok) {
      state.achievements[a.id] = todayKey();
      state.player.gold += a.gold;
      emit('achievement', { name: a.name, gold: a.gold });
    }
  }
}

// ---------- virada do dia ----------
// Julga os dias que passaram desde a última abertura: missões diárias não feitas custam HP
// e zeram a sequência. Só os 3 últimos dias causam dano, limitado a metade do HP máximo.
export function processDays() {
  if (!state.player) return;
  const today = todayKey();
  const last = state.lastProcessed || today;
  if (last < today) {
    const damageFrom = addDays(today, -3);
    let dmg = 0;
    const missed = [];
    let day = last;
    let guard = 0;
    while (day < today && guard++ < 400) {
      for (const q of state.quests) {
        if (q.archived || q.type !== 'daily' || q.createdAt > day) continue;
        if (isScheduled(q, day) && !isDoneOn(q, day)) {
          q.streak = 0;
          if (!state.settings.resting && day >= damageFrom) {
            dmg += (DIFFICULTY[q.diff] || DIFFICULTY.medio).dmg;
            missed.push({ title: q.title, day, sector: q.sector });
          }
        }
      }
      day = addDays(day, 1);
    }
    const prevWeek = addDays(weekKey(today), -7);
    for (const q of state.quests) {
      if (q.type === 'weekly' && q.lastDone && weekKey(q.lastDone) < prevWeek) q.streak = 0;
    }
    state.lastProcessed = today;
    if (missed.length) {
      dmg = Math.min(dmg, Math.ceil(state.player.maxHp * 0.5));
      state.pendingReport = { missed, dmg, hpBefore: state.player.hp, date: today };
      takeDamage(dmg);
    }
  }
  ensureBoss();
  save();
}
