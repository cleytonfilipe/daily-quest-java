// Estado do jogo persistido no localStorage do aparelho.
import { todayKey } from './dates.js';
import { DEFAULT_REWARDS } from './data.js';

const KEY = 'dailyquest:save:v1';
export const SAVE_VERSION = 1;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const DEFAULT_SETTINGS = {
  sound: true,
  resting: false,
  sectors: ['alimentacao', 'academia', 'trabalho', 'financeiro'],
  waterGoal: 8,
  sleepGoal: 8,
  budget: 0,
  pomodoroMin: 25,
  breakMin: 5,
};

const DEFAULT_STATS = {
  questsDone: 0, bestStreak: 0, bossesDefeated: 0, bossesSeen: 0, rewardsBought: 0, goalsDone: 0,
  waterDays: 0, pomodoros: 0, workouts: 0, financeEntries: 0, deaths: 0,
  dayStreak: 0, bestDayStreak: 0, lastActiveDay: null, totalXp: 0, totalGold: 0,
};

export function newState() {
  const t = todayKey();
  return {
    version: SAVE_VERSION,
    createdAt: t,
    player: null,
    settings: { ...DEFAULT_SETTINGS },
    quests: [],
    goals: [],
    rewards: DEFAULT_REWARDS.map((r) => ({ id: uid(), ...r })),
    purchases: [],
    log: {},
    finance: [],
    workouts: [],
    weights: [],
    achievements: {},
    stats: { ...DEFAULT_STATS },
    boss: null,
    pomodoro: null,
    lastProcessed: t,
    pendingReport: null,
  };
}

function normalize(s) {
  const base = newState();
  const out = { ...base, ...s };
  out.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) };
  out.stats = { ...DEFAULT_STATS, ...(s.stats || {}) };
  for (const k of ['quests', 'goals', 'rewards', 'purchases', 'finance', 'workouts', 'weights']) {
    if (!Array.isArray(out[k])) out[k] = base[k];
  }
  if (!out.log || typeof out.log !== 'object') out.log = {};
  if (!out.achievements || typeof out.achievements !== 'object') out.achievements = {};
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.error('Falha ao carregar o save', e);
  }
  return newState();
}

export let state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Falha ao salvar', e);
  }
}

export function replaceState(s) {
  state = normalize(s);
  save();
}

export function resetState() {
  state = newState();
  localStorage.removeItem(KEY);
}

// Valida o conteúdo de um backup importado.
export function parseBackup(text) {
  const data = JSON.parse(text);
  const s = data && data.app === 'daily-quest' ? data.state : data;
  if (!s || typeof s !== 'object' || !s.player || !Array.isArray(s.quests)) {
    throw new Error('Arquivo de backup inválido');
  }
  return s;
}

export function exportBackup() {
  return JSON.stringify({ app: 'daily-quest', exportedAt: new Date().toISOString(), state }, null, 2);
}

export function dayLog(key) {
  if (!state.log[key]) {
    state.log[key] = { done: {}, habits: {}, xp: 0, gold: 0, water: 0, meals: {}, mood: null, journal: '', priorities: null, pomodoros: 0, sleep: null, bonuses: {} };
  }
  return state.log[key];
}
