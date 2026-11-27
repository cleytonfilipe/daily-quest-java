// Nuvem opcional (Firebase): conta, backup automático e grupo para jogar junto.
// O SDK só é carregado quando existe uma configuração; sem ela o app funciona 100% local.
import { FIREBASE_CONFIG } from './cloud-config.js';
import { state, save, saveHooks, replaceState, dayLog } from './store.js';
import { BOSSES, DIFFICULTY, SECTOR_IDS, HEAL } from './data.js';
import { todayKey, weekKey, weekday } from './dates.js';
import {
  reward, revoke, emit, emitHooks, xpToNext, setBossHook, grantBossReward, heal, checkAchievements,
  isOnTime, processDays, dailyBonus,
} from './game.js';
import { agendaItems } from './agenda.js';

const CFG_KEY = 'dailyquest:cloud-config';
const META_KEY = 'dailyquest:cloud-meta';
const INVITE_KEY = 'dailyquest:invite';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const cloud = { status: 'off', error: null, user: null, group: null, members: [], quests: [], feed: [], cloudSave: null };

let fb = null; // { A, F, auth, db }
let unsubs = [];
let changed = () => {};
export const onCloudChange = (f) => { changed = f; };
const notify = () => changed();
const report = (e) => console.warn('[nuvem]', e?.code || '', e?.message || e);

// ---------- configuração ----------
export function getConfig() {
  try {
    const s = localStorage.getItem(CFG_KEY);
    if (s) return JSON.parse(s);
  } catch { /* configuração inválida */ }
  return FIREBASE_CONFIG || null;
}
export const isConfigured = () => !!getConfig();
export const configIsLocal = () => !!localStorage.getItem(CFG_KEY);
export const saveConfig = (cfg) => localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
export const removeConfig = () => localStorage.removeItem(CFG_KEY);

// Aceita o trecho copiado do console do Firebase (objeto JavaScript) ou um JSON.
export function parseConfig(text) {
  let obj = null;
  try { obj = JSON.parse(text); } catch { obj = null; }
  const out = {};
  for (const k of ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']) {
    if (obj && typeof obj[k] === 'string') out[k] = obj[k];
    else {
      const m = String(text).match(new RegExp(`["']?${k}["']?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`));
      if (m) out[k] = m[1];
    }
  }
  if (obj?.emulator) out.emulator = obj.emulator;
  if (!out.apiKey || !out.projectId) throw new Error('Não encontrei apiKey e projectId. Copie o bloco firebaseConfig inteiro.');
  if (!out.authDomain) out.authDomain = `${out.projectId}.firebaseapp.com`;
  return out;
}

const b64url = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
export const encodeConfig = (cfg) => b64url(JSON.stringify(cfg));
export const decodeConfig = (s) => parseConfig(unb64url(s));

// Aceita um link de convite (…#convite=CODIGO&cfg=…) ou o bloco firebaseConfig.
export function applyPasted(text) {
  const t = String(text || '').trim();
  const hash = t.includes('#') ? t.slice(t.indexOf('#') + 1) : '';
  const h = new URLSearchParams(hash);
  if (h.get('convite') || h.get('cfg')) {
    if (h.get('cfg')) saveConfig(decodeConfig(h.get('cfg')));
    else if (!getConfig()) throw new Error('Este link não traz a configuração da nuvem. Peça para quem convidou enviar a configuração do Firebase.');
    if (h.get('convite')) setPendingInvite(normalizeCode(h.get('convite')));
    return 'invite';
  }
  saveConfig(parseConfig(t));
  return 'config';
}

export const pendingInvite = () => localStorage.getItem(INVITE_KEY);
export const setPendingInvite = (c) => (c ? localStorage.setItem(INVITE_KEY, c) : localStorage.removeItem(INVITE_KEY));
export const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function inviteLink() {
  const g = cloud.group;
  if (!g) return '';
  let hash = `convite=${g.code}`;
  if (configIsLocal()) hash += `&cfg=${encodeConfig(getConfig())}`;
  return `${location.origin}${location.pathname}#${hash}`;
}

// ---------- mensagens de erro ----------
const ERRORS = {
  'auth/email-already-in-use': 'Este e-mail já tem conta. Use "Entrar".',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Não existe conta com este e-mail.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-password': 'Digite a senha.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
  'auth/operation-not-allowed': 'Ative o login por e-mail/senha no Firebase (Authentication › Método de login).',
  'auth/configuration-not-found': 'Ative o Authentication no console do Firebase (veja o guia).',
  'auth/invalid-api-key': 'A apiKey da configuração do Firebase é inválida.',
  'permission-denied': 'Sem permissão. Confira se as regras do Firestore foram publicadas (veja o guia).',
  unavailable: 'Sem conexão com a nuvem no momento.',
};
export function friendly(e) {
  const code = e?.code || '';
  if (ERRORS[code]) return ERRORS[code];
  if (code.startsWith('auth/api-key')) return ERRORS['auth/invalid-api-key'];
  return e?.message || String(e);
}

// ---------- inicialização ----------
export async function initCloud() {
  if (fb || cloud.status === 'loading') return;
  const cfg = getConfig();
  if (!cfg) { cloud.status = 'off'; return; }
  cloud.status = 'loading';
  cloud.error = null;
  notify();
  try {
    const [appM, A, F] = await Promise.all([
      import('../vendor/firebase/firebase-app.js'),
      import('../vendor/firebase/firebase-auth.js'),
      import('../vendor/firebase/firebase-firestore.js'),
    ]);
    const { emulator, ...options } = cfg;
    const app = appM.initializeApp(options);
    // Só e-mail/senha: sem o componente de login por pop-up (mais leve e sem iframes externos).
    let auth;
    try { auth = A.initializeAuth(app, { persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence] }); } catch { auth = A.getAuth(app); }
    let db;
    try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache() }); } catch { db = F.getFirestore(app); }
    if (emulator) {
      A.connectAuthEmulator(auth, emulator.auth, { disableWarnings: true });
      F.connectFirestoreEmulator(db, emulator.host, emulator.port);
    }
    fb = { A, F, auth, db };
    A.onAuthStateChanged(auth, (u) => { onUser(u).catch(fail); }, fail);
  } catch (e) {
    fail(e);
  }
}

function fail(e) {
  report(e);
  cloud.status = 'error';
  cloud.error = friendly(e);
  notify();
}

async function onUser(u) {
  stopWatching();
  Object.assign(cloud, { group: null, members: [], quests: [], feed: [], cloudSave: null });
  cloud.user = u ? { uid: u.uid, email: u.email } : null;
  cloud.status = 'ready';
  if (!u) { notify(); return; }
  const c = state.cloud;
  if (c.uid && c.uid !== u.uid) c.groupId = null; // este aparelho estava ligado a outra conta
  c.uid = u.uid;
  c.email = u.email;
  try {
    const us = await fb.F.getDoc(fb.F.doc(fb.db, 'users', u.uid));
    const saved = us.exists() ? us.data() : {};
    if (!c.groupId && saved.groupId) c.groupId = saved.groupId;
  } catch (e) { report(e); }
  await checkCloudSave().catch(report);
  if (state.cloud.groupId) watchGroup(state.cloud.groupId);
  const inv = pendingInvite();
  if (inv && !state.cloud.groupId && state.player) {
    try { await joinGroup(inv); } catch (e) { emit('info', { text: friendly(e), bad: true }); }
  }
  if (state.player) save();
  notify();
}

// ---------- conta ----------
export async function signUp(email, password) {
  await fb.A.createUserWithEmailAndPassword(fb.auth, email.trim(), password);
}
export async function signIn(email, password) {
  await fb.A.signInWithEmailAndPassword(fb.auth, email.trim(), password);
}
export async function resetPassword(email) {
  await fb.A.sendPasswordResetEmail(fb.auth, email.trim());
}
export async function signOutCloud() {
  await flushCloud().catch(report);
  state.cloud.groupId = null;
  state.cloud.uid = null;
  state.cloud.email = null;
  save();
  await fb.A.signOut(fb.auth);
}

// ---------- backup automático ----------
const meta = () => { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch { return {}; } };
const setMeta = (m) => localStorage.setItem(META_KEY, JSON.stringify({ ...meta(), ...m }));
export const lastBackupAt = () => meta().lastBackup || null;

async function pack(json) {
  if (typeof CompressionStream === 'function') {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { enc: 'gzip64', data: btoa(bin) };
  }
  return { enc: 'json', data: json };
}
async function unpack(doc) {
  if (doc.enc !== 'gzip64') return doc.data;
  const bytes = Uint8Array.from(atob(doc.data), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

let lastBackupJson = null;
let backupTimer = null;
function scheduleBackup(delay = 20000) {
  if (!fb || !cloud.user || !state.player || cloud.cloudSave) return;
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => { backupTimer = null; backupNow().catch(report); }, delay);
}

export async function backupNow() {
  if (!fb || !cloud.user || !state.player) return false;
  const json = JSON.stringify(state);
  if (json === lastBackupJson) return true;
  const packed = await pack(json);
  if (packed.data.length > 950000) throw new Error('O backup ficou grande demais para a nuvem.');
  const savedAt = Date.now();
  await fb.F.setDoc(fb.F.doc(fb.db, 'users', cloud.user.uid, 'saves', 'main'), {
    ...packed, savedAt, name: state.player.name, level: state.player.level, version: state.version,
  });
  lastBackupJson = json;
  setMeta({ lastBackup: savedAt });
  return true;
}

async function checkCloudSave() {
  const snap = await fb.F.getDoc(fb.F.doc(fb.db, 'users', cloud.user.uid, 'saves', 'main'));
  if (!snap.exists()) {
    if (!state.player) emit('info', { text: 'Conta conectada! Agora crie seu herói.' });
    scheduleBackup(1000);
    return;
  }
  const doc = snap.data();
  if (!state.player) {
    await restoreFrom(doc);
    emit('info', { text: `Progresso de ${doc.name} restaurado da nuvem!` });
    return;
  }
  const last = meta().lastBackup;
  if (last && doc.savedAt <= last + 2000) { scheduleBackup(); return; }
  cloud.cloudSave = { savedAt: doc.savedAt, name: doc.name, level: doc.level, doc };
  emit('restoreAsk', { name: doc.name, level: doc.level, savedAt: doc.savedAt });
}

async function restoreFrom(doc) {
  const s = JSON.parse(await unpack(doc));
  const { uid, email } = state.cloud;
  replaceState(s);
  state.cloud.uid = uid;
  state.cloud.email = email;
  setMeta({ lastBackup: doc.savedAt });
  lastBackupJson = null;
  processDays();
}

// Usuário escolhe entre o progresso da nuvem e o deste aparelho.
export async function resolveRestore(useCloud) {
  const cs = cloud.cloudSave;
  cloud.cloudSave = null;
  if (!cs) return;
  if (useCloud) {
    await restoreFrom(cs.doc);
    if (state.cloud.groupId) watchGroup(state.cloud.groupId);
  } else {
    lastBackupJson = null;
    await backupNow().catch(report);
  }
  notify();
}

export async function restoreNow() {
  const snap = await fb.F.getDoc(fb.F.doc(fb.db, 'users', cloud.user.uid, 'saves', 'main'));
  if (!snap.exists()) throw new Error('Ainda não há backup na nuvem.');
  await restoreFrom(snap.data());
  if (state.cloud.groupId) watchGroup(state.cloud.groupId);
  notify();
}

// Envia o que estiver pendente (chamado quando o app vai para o fundo).
export async function flushCloud() {
  if (backupTimer) { clearTimeout(backupTimer); backupTimer = null; await backupNow(); }
  if (profTimer) { clearTimeout(profTimer); profTimer = null; await publishProfile(); }
}

// ---------- grupo ----------
export const inGroup = () => !!(fb && cloud.user && state.cloud.groupId && cloud.group);
const gid = () => state.cloud.groupId;
const gref = () => fb.F.doc(fb.db, 'groups', gid());
const qref = (id) => fb.F.doc(fb.db, 'groups', gid(), 'quests', id);
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHA[b % ALPHA.length]).join('');

export async function createGroup(name) {
  const { F, db } = fb;
  const ref = F.doc(F.collection(db, 'groups'));
  const code = randomCode();
  await F.setDoc(ref, { name, code, memberIds: [cloud.user.uid], createdBy: cloud.user.uid, createdAt: Date.now(), boss: null, bossCount: 0 });
  await F.setDoc(F.doc(db, 'invites', code), { groupId: ref.id, createdBy: cloud.user.uid, createdAt: Date.now() });
  await enterGroup(ref.id);
  return code;
}

export async function joinGroup(rawCode) {
  const code = normalizeCode(rawCode);
  if (code.length < 4) throw new Error('Digite o código do convite.');
  const { F, db } = fb;
  const inv = await F.getDoc(F.doc(db, 'invites', code));
  if (!inv.exists()) throw new Error('Código de convite não encontrado.');
  const id = inv.data().groupId;
  await F.updateDoc(F.doc(db, 'groups', id), { memberIds: F.arrayUnion(cloud.user.uid) });
  await growBoss(id).catch(report);
  await enterGroup(id);
  postFeed('join');
}

// Quem entra no meio da semana deixa o chefe mais forte, para continuar desafiador.
async function growBoss(id) {
  const { F, db } = fb;
  const ref = F.doc(db, 'groups', id);
  const wk = weekKey(todayKey());
  const extra = 250 + 40 * (state.player?.level || 1);
  await F.runTransaction(db, async (tx) => {
    const g = (await tx.get(ref)).data();
    if (g?.boss && g.boss.week === wk && g.boss.damage < g.boss.maxHp) tx.update(ref, { 'boss.maxHp': g.boss.maxHp + extra });
  });
}

async function enterGroup(id) {
  setPendingInvite(null);
  state.cloud.groupId = id;
  if (!state.settings.sectors.includes('casa')) {
    state.settings.sectors = SECTOR_IDS.filter((s) => s === 'casa' || state.settings.sectors.includes(s));
  }
  await fb.F.setDoc(fb.F.doc(fb.db, 'users', cloud.user.uid), { groupId: id }, { merge: true });
  lastProfileJson = null;
  watchGroup(id);
  await publishProfile(true).catch(report);
  checkAchievements();
  save();
  notify();
}

export async function leaveGroup() {
  const { F, db } = fb;
  const id = gid();
  await F.deleteDoc(F.doc(db, 'groups', id, 'members', cloud.user.uid)).catch(report);
  await F.updateDoc(F.doc(db, 'groups', id), { memberIds: F.arrayRemove(cloud.user.uid) });
  await F.setDoc(F.doc(db, 'users', cloud.user.uid), { groupId: null }, { merge: true });
  leftGroup();
}

export async function renameGroup(name) {
  await fb.F.updateDoc(gref(), { name });
}

function leftGroup() {
  stopWatching();
  state.cloud.groupId = null;
  Object.assign(cloud, { group: null, members: [], quests: [], feed: [] });
  save();
  notify();
}

function stopWatching() {
  unsubs.forEach((u) => u());
  unsubs = [];
}

function onListenError(e) {
  report(e);
  if (e?.code === 'permission-denied') leftGroup();
}

function watchGroup(id) {
  stopWatching();
  const { F, db } = fb;
  const ref = F.doc(db, 'groups', id);
  unsubs.push(F.onSnapshot(ref, (s) => {
    const data = s.data();
    if (!s.exists() || !(data.memberIds || []).includes(cloud.user?.uid)) { leftGroup(); return; }
    cloud.group = { id, ...data };
    bossCheck();
    notify();
  }, onListenError));
  unsubs.push(F.onSnapshot(F.collection(ref, 'members'), (qs) => {
    cloud.members = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    notify();
  }, onListenError));
  unsubs.push(F.onSnapshot(F.collection(ref, 'quests'), (qs) => {
    cloud.quests = qs.docs.map((d) => ({ id: d.id, ...d.data() })).filter((q) => !q.archived);
    notify();
  }, onListenError));
  unsubs.push(F.onSnapshot(F.query(F.collection(ref, 'feed'), F.orderBy('at', 'desc'), F.limit(40)), (qs) => {
    cloud.feed = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    processIncoming();
    notify();
  }, onListenError));
}

// ---------- perfil público no grupo ----------
let profTimer = null;
let lastProfileJson = null;
let lastProfileAt = 0;

function profileSummary() {
  const p = state.player;
  const key = todayKey();
  const mine = agendaItems(key).filter((i) => i.kind !== 'shared');
  let last = null;
  if (state.cloud.shareTitles) {
    const d = state.log[key] || {};
    const receipts = [
      ...Object.values(d.done || {}),
      ...state.content.posts.filter((x) => x.postedAt === key && x.receipt).map((x) => x.receipt),
    ].sort((a, b) => (b.at || 0) - (a.at || 0));
    last = receipts[0]?.label || null;
  }
  const wd = state.stats.weekDamage;
  return {
    uid: cloud.user.uid, name: p.name, cls: p.cls, look: p.look, level: p.level, xp: p.xp, xpNext: xpToNext(p.level),
    hp: p.hp, maxHp: p.maxHp, gold: p.gold, dayStreak: state.stats.dayStreak, resting: !!state.settings.resting,
    today: { date: key, done: mine.filter((i) => i.done).length, total: mine.length }, last,
    week: wd && wd.week === weekKey(key) ? wd : { week: weekKey(key), dmg: 0 },
  };
}

export async function publishProfile(force = false) {
  if (!fb || !cloud.user || !state.cloud.groupId || !state.player) return;
  const s = profileSummary();
  const json = JSON.stringify(s);
  if (!force && json === lastProfileJson && Date.now() - lastProfileAt < 5 * 60000) return;
  lastProfileJson = json;
  lastProfileAt = Date.now();
  await fb.F.setDoc(fb.F.doc(fb.db, 'groups', gid(), 'members', cloud.user.uid), { ...s, updatedAt: Date.now() });
}

function scheduleProfile(delay = 1500) {
  if (!fb || !cloud.user || !state.cloud.groupId) return;
  clearTimeout(profTimer);
  profTimer = setTimeout(() => { profTimer = null; publishProfile().catch(report); }, delay);
}

// Sinal de vida enquanto o app está aberto.
export function heartbeat() {
  if (inGroup() && Date.now() - lastProfileAt > 4 * 60000) publishProfile(true).catch(report);
}

saveHooks.push(() => { scheduleProfile(); scheduleBackup(); });

// ---------- chefe do grupo ----------
setBossHook((amount) => {
  if (!inGroup()) return null;
  const b = cloud.group.boss;
  if (!b || b.week !== weekKey(todayKey()) || b.damage >= b.maxHp) return 0;
  const dmg = amount > 0 ? Math.min(amount, b.maxHp - b.damage) : Math.max(amount, -b.damage);
  if (!dmg) return 0;
  b.damage += dmg;
  fb.F.updateDoc(gref(), { 'boss.damage': fb.F.increment(dmg) }).catch(report);
  return dmg;
});

let spawning = false;
async function spawnGroupBoss(wk) {
  if (spawning) return;
  spawning = true;
  try {
    await fb.F.runTransaction(fb.db, async (tx) => {
      const s = await tx.get(gref());
      const g = s.data();
      if (g.boss && g.boss.week === wk) return;
      const levels = cloud.members.length ? cloud.members.map((m) => m.level || 1) : [state.player?.level || 1];
      const maxHp = levels.reduce((a, l) => a + 250 + 40 * l, 0);
      const count = g.bossCount || 0;
      tx.update(gref(), { boss: { week: wk, idx: count % BOSSES.length, maxHp, damage: 0 }, bossCount: count + 1 });
    });
  } catch (e) {
    report(e);
  } finally {
    spawning = false;
  }
}

function bossCheck() {
  const g = cloud.group;
  const wk = weekKey(todayKey());
  if (!g.boss || g.boss.week !== wk) { spawnGroupBoss(wk); return; }
  if (g.boss.damage >= g.boss.maxHp && state.player) {
    const done = state.cloud.rewardedBoss || [];
    if (!done.includes(g.boss.week)) {
      state.cloud.rewardedBoss = [...done, g.boss.week].slice(-10);
      grantBossReward(BOSSES[g.boss.idx].name);
      save();
    }
  }
}

// ---------- missões da casa (compartilhadas) ----------
export const periodKey = (q, key = todayKey()) => (q.type === 'weekly' ? `w${weekKey(key)}` : q.type === 'once' ? 'once' : key);
export const sharedDoneBy = (q, key = todayKey()) => q.done?.[periodKey(q, key)] || null;
export const sharedIsDone = (q, key = todayKey()) => !!sharedDoneBy(q, key);

export function sharedDue(q, key = todayKey()) {
  if (q.type === 'daily') return !q.days?.length || q.days.includes(weekday(key));
  if (q.type === 'weekly') return true;
  if (q.type === 'once') return !q.done?.once || q.done.once.date === key;
  return false;
}

export function sharedForToday(key = todayKey()) {
  if (!inGroup()) return [];
  const me = cloud.user.uid;
  return cloud.quests.filter((q) => sharedDue(q, key) && (!q.assignee || q.assignee === me));
}

export async function saveShared(id, data) {
  const { F, db } = fb;
  if (id) await F.updateDoc(qref(id), data);
  else await F.addDoc(F.collection(db, 'groups', gid(), 'quests'), { ...data, createdBy: cloud.user.uid, createdAt: Date.now(), archived: false, done: {} });
}

export async function deleteShared(id) {
  await fb.F.deleteDoc(qref(id));
}

export function completeShared(q) {
  const key = todayKey();
  const pk = periodKey(q, key);
  const already = q.done?.[pk];
  if (already) { emit('info', { text: `${already.name} já fez essa!` }); return false; }
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.facil;
  const onTime = q.type !== 'weekly' && isOnTime(q.time);
  const r = reward(q.sector || 'casa', diff.xp, diff.gold, diff.pts, { label: q.title, onTime });
  const d = dayLog(key);
  (d.shared ||= {})[q.id] = r;
  state.stats.sharedDone++;
  if (onTime) state.stats.onTime++;
  const mark = { uid: cloud.user.uid, name: state.player.name, at: Date.now(), date: key };
  q.done = { ...(q.done || {}), [pk]: mark };
  fb.F.updateDoc(qref(q.id), new fb.F.FieldPath('done', pk), mark).catch(report);
  postFeed('shared', { text: q.title });
  checkAchievements();
  save();
  return true;
}

export function uncompleteShared(q) {
  const pk = periodKey(q);
  const mark = q.done?.[pk];
  if (!mark) return false;
  if (mark.uid !== cloud.user.uid) { emit('info', { text: `Só ${mark.name} pode desmarcar essa.` }); return false; }
  const d = dayLog(mark.date || todayKey());
  const r = d.shared?.[q.id];
  if (r) {
    revoke(r);
    delete d.shared[q.id];
    if (r.onTime) state.stats.onTime = Math.max(0, state.stats.onTime - 1);
    state.stats.sharedDone = Math.max(0, state.stats.sharedDone - 1);
  }
  const done = { ...(q.done || {}) };
  delete done[pk];
  q.done = done;
  fb.F.updateDoc(qref(q.id), new fb.F.FieldPath('done', pk), fb.F.deleteField()).catch(report);
  emit('undo');
  save();
  return true;
}

// ---------- mural, incentivos e cura ----------
function postFeed(type, data = {}) {
  if (!inGroup() || !state.player) return;
  const p = state.player;
  fb.F.addDoc(fb.F.collection(fb.db, 'groups', gid(), 'feed'), {
    type, uid: cloud.user.uid, name: p.name, cls: p.cls, look: p.look, at: Date.now(), ...data,
  }).catch(report);
}

emitHooks.push((ev) => {
  if (!inGroup()) return;
  if (ev.type === 'levelup') postFeed('levelup', { level: ev.level });
  if (ev.type === 'achievement') postFeed('achievement', { text: ev.name });
  if (ev.type === 'goal') postFeed('goal', { text: state.cloud.shareTitles ? ev.title : null });
  if (ev.type === 'perfect') postFeed('perfect');
});

export function sendCheer(member, cheer) {
  postFeed('cheer', { to: member.uid, toName: member.name, emoji: cheer.emoji, text: cheer.text });
  state.stats.cheersSent++;
  dailyBonus('cheer', 'social', 5, 2, 1, 'Incentivo enviado');
  checkAchievements();
  save();
}

export function sendHeal(member) {
  if (state.player.gold < HEAL.cost) return false;
  state.player.gold -= HEAL.cost;
  postFeed('heal', { to: member.uid, toName: member.name, amount: HEAL.amount });
  save();
  return true;
}

// Aplica incentivos e curas recebidos (uma vez só por evento).
function processIncoming() {
  if (!state.player) return;
  const seen = (state.cloud.seen ||= {});
  let dirty = false;
  for (const ev of [...cloud.feed].reverse()) {
    if (ev.to !== cloud.user.uid || seen[ev.id]) continue;
    seen[ev.id] = Date.now();
    dirty = true;
    if (Date.now() - (ev.at || 0) > 7 * 86400000) continue;
    if (ev.type === 'cheer') emit('cheer', { from: ev.name, look: ev.look, cls: ev.cls, emoji: ev.emoji, text: ev.text });
    if (ev.type === 'heal') {
      const amount = Math.min(Number(ev.amount) || HEAL.amount, HEAL.amount);
      heal(amount);
      emit('healed', { from: ev.name, amount });
    }
  }
  if (dirty) {
    const ids = Object.keys(seen);
    if (ids.length > 200) ids.sort((a, b) => seen[a] - seen[b]).slice(0, ids.length - 200).forEach((k) => delete seen[k]);
    save();
  }
}
