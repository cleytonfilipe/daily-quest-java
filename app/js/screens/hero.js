// Herói: perfil, atributos, conquistas, histórico e configurações.
import { state, save, exportBackup, parseBackup, replaceState, resetState } from '../store.js';
import { ATTRS, SECTORS, CLASSES, ACHIEVEMENTS, BOSSES } from '../data.js';
import { heroSVG, icon } from '../sprites.js';
import { actions, forms, esc, bar, openModal, closeModal, modalHead, confirmBox, toast, num, relTime } from '../ui.js';
import { renderShop } from './shop.js';
import { notifyPermission, requestNotify } from '../agenda.js';
import { cloud, isConfigured, configIsLocal, lastBackupAt, backupNow, restoreNow, friendly } from '../cloud.js';
import { attrInfo, xpToNext, processDays } from '../game.js';
import { todayKey, addDays, fmtDate, weekday, WEEKDAYS_1, diffDays } from '../dates.js';
import { lookPicker } from './onboarding.js';
import { route, rerender, go } from '../nav.js';
import { setSound, play } from '../sfx.js';

export function renderHero() {
  const sub = route.params.sub || 'perfil';
  const tabs = [['perfil', 'Perfil'], ['loja', 'Loja'], ['conquistas', 'Troféus'], ['historico', 'Histórico'], ['config', 'Config']];
  const body = ({ perfil: profile, loja: renderShop, conquistas: achievements, historico: history, config: settings }[sub] || profile)();
  return `<header class="screen-head"><h1>${icon('hero', 20)} Herói</h1></header>
    <div class="seg seg-5">${tabs.map(([id, l]) => `<button class="${sub === id ? 'sel' : ''}" data-act="go-sub" data-tab="heroi" data-sub="${id}">${l}</button>`).join('')}</div>
    ${body}`;
}

function profile() {
  const p = state.player;
  const st = state.stats;
  const cls = CLASSES[p.cls];
  const unlocked = Object.keys(state.achievements).length;
  const attrsShown = Object.entries(SECTORS).filter(([id]) => state.settings.sectors.includes(id));
  return `<section class="panel profile">
      <div class="profile-top">
        <div class="pedestal">${heroSVG(p.look, p.cls, 112, 'bob')}</div>
        <div class="grow"><h2>${esc(p.name)}</h2><p>${cls.name} · Nível ${p.level}</p><small class="muted">${cls.desc}</small>
        <button class="btn btn-sm" data-act="hero-edit">✎ Editar herói</button></div>
      </div>
      <div class="stat-line">${icon('heart', 12)}${bar(p.hp, p.maxHp, 'hp')}</div>
      <div class="stat-line">${icon('star', 12)}${bar(p.xp, xpToNext(p.level), 'xp')}</div>
    </section>
    <section class="panel"><h3 class="sec-title">Atributos</h3>
      ${attrsShown.map(([id, s]) => {
        const a = attrInfo(p.attrs[s.attr]);
        return `<div class="attr-row" data-act="go" data-tab="setores" data-sector="${id}" style="--c:${ATTRS[s.attr].color}">
          <span class="attr-name">${icon(s.icon, 14)} ${ATTRS[s.attr].short}</span><b class="attr-lvl">${a.level}</b>${bar(a.cur, a.need, 'attr', false)}<small>${ATTRS[s.attr].name}</small></div>`;
      }).join('')}
    </section>
    <section class="panel"><h3 class="sec-title">Estatísticas</h3>
      <div class="stats-grid">
        ${statBox('Missões feitas', num(st.questsDone), 'scroll')}
        ${statBox('Maior sequência', `${st.bestStreak} dias`, 'fire')}
        ${statBox('Dias seguidos', `${st.dayStreak} (rec. ${st.bestDayStreak})`, 'sun')}
        ${statBox('Chefes derrotados', st.bossesDefeated, 'sword')}
        ${statBox('Objetivos', st.goalsDone, 'trophy')}
        ${statBox('Conquistas', `${unlocked}/${ACHIEVEMENTS.length}`, 'star')}
        ${statBox('XP total', num(st.totalXp), 'star')}
        ${statBox('Ouro ganho', num(st.totalGold), 'coin')}
        ${statBox('Treinos', st.workouts, 'dumbbell')}
        ${statBox('Pomodoros', st.pomodoros, 'briefcase')}
        ${statBox('Desmaios', st.deaths, 'skull')}
        ${statBox('Jogando desde', fmtDate(state.createdAt), 'map')}
      </div>
    </section>`;
}
const statBox = (l, v, ic) => `<div class="stat-box">${icon(ic, 16)}<b>${v}</b><small>${l}</small></div>`;

function achievements() {
  return `<div class="ach-grid">${ACHIEVEMENTS.map((a) => {
    const at = state.achievements[a.id];
    return `<div class="ach panel-inner ${at ? 'on' : ''}">${icon(at ? a.icon : 'skull', 28, at ? '' : 'locked')}
      <b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${at ? `<em>${fmtDate(at)}</em>` : a.gold ? `<em class="c-gold">+${a.gold} ouro</em>` : ''}</div>`;
  }).join('')}</div>`;
}

function history() {
  const t = todayKey();
  const days30 = Array.from({ length: 30 }, (_, i) => addDays(t, i - 29));
  const xps = days30.map((k) => state.log[k]?.xp || 0);
  const maxXp = Math.max(1, ...xps);
  const total30 = xps.reduce((a, b) => a + b, 0);
  // Mapa de calor: 12 semanas, colunas = semanas
  const start = addDays(t, -(7 * 11) - ((weekday(t) + 6) % 7));
  const weeks = Array.from({ length: 12 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  const count = (k) => Object.keys(state.log[k]?.done || {}).length;
  const lvl = (n) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 7 ? 3 : 4);
  // Conclusões por setor (via recibos registrados)
  const bySector = {};
  const qmap = Object.fromEntries(state.quests.map((q) => [q.id, q.sector]));
  Object.values(state.log).forEach((d) => Object.keys(d.done || {}).forEach((id) => { const s = qmap[id]; if (s) bySector[s] = (bySector[s] || 0) + 1; }));
  const maxS = Math.max(1, ...Object.values(bySector));
  const bossesWeek = state.boss ? BOSSES[state.boss.idx].name : '-';
  return `<section class="panel"><h3 class="sec-title">XP nos últimos 30 dias <small>${num(total30)} XP</small></h3>
      <div class="xp-chart">${days30.map((k, i) => `<i style="height:${(xps[i] / maxXp) * 100}%" title="${fmtDate(k)}: ${xps[i]} XP" class="${k === t ? 'today' : ''}"></i>`).join('')}</div>
      <div class="chart-legend"><small>${fmtDate(days30[0])}</small><small>hoje</small></div>
    </section>
    <section class="panel"><h3 class="sec-title">Missões por dia (12 semanas)</h3>
      <div class="heat"><div class="heat-days">${[1, 3, 5].map((d) => `<small style="grid-row:${d + 1}">${WEEKDAYS_1[(d + 1) % 7]}</small>`).join('')}</div>
      ${weeks.map((w) => `<div class="heat-col">${w.map((k) => `<i class="h${k > t ? 'x' : lvl(count(k))} ${k === t ? 'today' : ''}" title="${fmtDate(k)}: ${count(k)}"></i>`).join('')}</div>`).join('')}</div>
      <div class="chart-legend"><small>menos</small><span class="heat-scale"><i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i></span><small>mais</small></div>
    </section>
    <section class="panel"><h3 class="sec-title">Conclusões por setor</h3>
      ${Object.keys(SECTORS).filter((s) => bySector[s]).map((s) => `<div class="cat-row"><span>${icon(SECTORS[s].icon, 12)} ${SECTORS[s].name}</span>${bar(bySector[s], maxS, 'cat', false)}<b>${bySector[s]}</b></div>`).join('') || '<p class="small muted">Complete missões para ver suas estatísticas.</p>'}
      <p class="small muted">Chefe atual: ${esc(bossesWeek)} · ${state.stats.bossesDefeated} derrotados de ${state.stats.bossesSeen} enfrentados.</p>
    </section>`;
}

function settings() {
  const s = state.settings;
  const sw = (key, label, desc) => `<label class="switch"><span><b>${label}</b><small>${desc}</small></span>
    <input type="checkbox" data-change="setting-toggle" data-key="${key}" ${s[key] ? 'checked' : ''}><i></i></label>`;
  const daysUsing = diffDays(state.createdAt, todayKey()) + 1;
  return `<section class="panel">
      ${sw('sound', 'Efeitos sonoros', 'Sons 8-bit ao completar missões')}
      ${sw('resting', 'Modo descanso', 'Pausa o dano por missões não feitas (férias, doença)')}
    </section>
    <section class="panel"><h3 class="sec-title">Lembretes</h3>
      ${sw('notify', 'Notificações do sistema', notifyText())}
      <p class="small muted">Os lembretes das tarefas com horário aparecem com o app aberto ou recém-minimizado. Com o app totalmente fechado, o iPhone não deixa sites agendarem alertas sozinhos: para compromissos críticos, use também o app Lembretes.</p>
    </section>
    ${cloudSection()}
    <section class="panel"><h3 class="sec-title">Metas</h3>
      <form data-form="settings-save">
        <div class="two">
          <label class="field"><span>Água (copos/dia)</span><input name="waterGoal" type="number" min="1" max="30" value="${s.waterGoal}" inputmode="numeric"></label>
          <label class="field"><span>Sono (horas)</span><input name="sleepGoal" type="number" min="4" max="12" step="0.5" value="${s.sleepGoal}" inputmode="decimal"></label>
          <label class="field"><span>Orçamento mensal (R$)</span><input name="budget" type="number" min="0" value="${s.budget || ''}" inputmode="decimal"></label>
          <label class="field"><span>Pomodoro (min)</span><input name="pomodoroMin" type="number" min="5" max="90" value="${s.pomodoroMin}" inputmode="numeric"></label>
          <label class="field"><span>Pausa (min)</span><input name="breakMin" type="number" min="1" max="30" value="${s.breakMin}" inputmode="numeric"></label>
        </div>
        <button class="btn btn-green btn-wide" type="submit">Salvar metas</button>
      </form>
      <button class="btn btn-wide" data-act="sectors-manage">${icon('map', 14)} Setores ativos</button>
    </section>
    <section class="panel"><h3 class="sec-title">Backup</h3>
      <p class="small muted">Seus dados ficam só neste aparelho. Faça backup com frequência para não perder o progresso (${daysUsing} ${daysUsing === 1 ? 'dia' : 'dias'} de jornada).</p>
      <div class="row-btns">
        <button class="btn" data-act="backup-export">Exportar</button>
        <button class="btn" data-act="backup-copy">Copiar</button>
        <label class="btn">Importar<input type="file" accept="application/json,.json" data-change="backup-import" hidden></label>
      </div>
    </section>
    <section class="panel"><h3 class="sec-title">Instalar no iPhone</h3>
      <ol class="small install">
        <li>Abra este site no <b>Safari</b>.</li>
        <li>Toque no botão <b>Compartilhar</b> (quadrado com seta).</li>
        <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
        <li>Abra pelo ícone: o app roda em tela cheia e funciona offline.</li>
      </ol>
    </section>
    <section class="panel danger"><h3 class="sec-title">Zona de perigo</h3>
      <button class="btn btn-red btn-wide" data-act="reset-all">Apagar todo o progresso</button>
    </section>
    <p class="center small muted">Daily Quest · feito com pixels e disciplina</p>`;
}

function notifyText() {
  const perm = notifyPermission();
  if (perm === 'unsupported') return 'No iPhone, instale o app na Tela de Início (iOS 16.4+) para permitir notificações';
  if (perm === 'denied') return 'Bloqueadas: libere em Ajustes › Notificações › Daily Quest';
  if (perm === 'granted') return 'Permitidas neste aparelho';
  return 'Toque para permitir alertas no horário das tarefas';
}

function cloudSection() {
  const head = '<h3 class="sec-title">Conta e nuvem</h3>';
  if (!isConfigured()) {
    return `<section class="panel">${head}<p class="small muted">Desativada. Configure na aba Grupo para ter backup automático e jogar com sua dupla.</p>
      <button class="btn btn-wide" data-act="go" data-tab="grupo">Ir para o Grupo</button></section>`;
  }
  if (!cloud.user) {
    return `<section class="panel">${head}<p class="small muted">${cloud.status === 'error' ? esc(cloud.error || 'Erro de conexão') : 'Você ainda não entrou na sua conta.'}</p>
      <button class="btn btn-wide" data-act="go" data-tab="grupo">Entrar ou criar conta</button></section>`;
  }
  const last = lastBackupAt();
  return `<section class="panel">${head}
      <p class="small">Conectado como <b>${esc(cloud.user.email)}</b></p>
      <p class="small muted">Backup automático ligado${last ? ` · último ${esc(relTime(last))}` : ''}</p>
      <div class="row-btns">
        <button class="btn btn-sm" data-act="cloud-backup">Backup agora</button>
        <button class="btn btn-sm" data-act="cloud-restore">Restaurar</button>
        <button class="btn btn-sm" data-act="cloud-signout">Sair da conta</button>
      </div>
      ${configIsLocal() ? '<button class="btn btn-sm" data-act="cloud-config-remove">Remover configuração do Firebase</button>' : ''}
    </section>`;
}

actions['cloud-backup'] = async (el) => {
  el.disabled = true;
  try { await backupNow(); toast('Backup salvo na nuvem!'); } catch (e) { toast(esc(friendly(e)), 'bad', 4000); }
  rerender();
};
actions['cloud-restore'] = () => {
  confirmBox('Substituir o progresso deste aparelho pelo último backup da nuvem?', async () => {
    try { await restoreNow(); toast('Progresso restaurado!'); go('hoje'); } catch (e) { toast(esc(friendly(e)), 'bad', 4000); }
  }, 'Restaurar');
};

// ---------- ações ----------
let editLook = null;
function heroEditForm() {
  const p = state.player;
  return `${modalHead('Editar herói', 'hero')}
    <form data-form="hero-save">
      <div class="center">${heroSVG(editLook.look, editLook.cls, 96, 'bob')}</div>
      <label class="field"><span>Nome</span><input name="name" required maxlength="20" value="${esc(editLook.name ?? p.name)}" data-change="hero-name"></label>
      <div class="field"><span>Classe</span><div class="class-grid small">${Object.entries(CLASSES).map(([id, c]) => `
        <button type="button" class="class-card ${editLook.cls === id ? 'sel' : ''}" data-act="hero-class" data-id="${id}">${heroSVG(editLook.look, id, 40)}<b>${c.name}</b></button>`).join('')}</div></div>
      ${lookPicker(editLook.look, 'hero-look')}
      <div class="row-btns"><button class="btn btn-green" type="submit">Salvar</button></div>
    </form>`;
}
function syncName() {
  const input = document.querySelector('[data-form="hero-save"] [name="name"]');
  if (input) editLook.name = input.value;
}
actions['hero-edit'] = () => {
  const p = state.player;
  editLook = { name: p.name, cls: p.cls, look: { ...p.look } };
  openModal(heroEditForm());
};
actions['hero-class'] = (el) => { syncName(); editLook.cls = el.dataset.id; openModal(heroEditForm()); };
actions['hero-look'] = (el) => { syncName(); editLook.look[el.dataset.key] = el.dataset.color; openModal(heroEditForm()); };
actions['hero-name'] = () => syncName();
forms['hero-save'] = (fd) => {
  const p = state.player;
  p.name = String(fd.get('name')).trim() || p.name;
  p.cls = editLook.cls;
  p.look = { ...editLook.look };
  save();
  closeModal();
  toast('Herói atualizado!');
  rerender();
};

actions['setting-toggle'] = async (el) => {
  if (el.dataset.key === 'notify' && el.checked) {
    const perm = await requestNotify();
    if (perm !== 'granted') {
      el.checked = false;
      toast(perm === 'unsupported' ? 'Instale o app na Tela de Início para ativar notificações.' : 'Permissão de notificação negada.', 'bad', 4000);
      return;
    }
  }
  state.settings[el.dataset.key] = el.checked;
  if (el.dataset.key === 'sound') { setSound(el.checked); if (el.checked) play('coin'); }
  if (el.dataset.key === 'resting') toast(el.checked ? 'Modo descanso ativado. Recupere-se, herói!' : 'De volta à aventura!');
  save();
  rerender();
};
forms['settings-save'] = (fd) => {
  const s = state.settings;
  const clamp = (v, a, b, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(b, Math.max(a, n)) : d; };
  s.waterGoal = clamp(fd.get('waterGoal'), 1, 30, 8);
  s.sleepGoal = clamp(fd.get('sleepGoal'), 4, 12, 8);
  s.budget = Math.max(0, Number(fd.get('budget')) || 0);
  s.pomodoroMin = clamp(fd.get('pomodoroMin'), 5, 90, 25);
  s.breakMin = clamp(fd.get('breakMin'), 1, 30, 5);
  save();
  toast('Metas salvas');
  rerender();
};

actions['backup-export'] = async () => {
  const text = exportBackup();
  const name = `daily-quest-backup-${todayKey()}.json`;
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Backup Daily Quest' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
actions['backup-copy'] = async () => {
  try {
    await navigator.clipboard.writeText(exportBackup());
    toast('Backup copiado! Cole em uma nota segura.');
  } catch {
    toast('Não foi possível copiar.', 'bad');
  }
};
actions['backup-import'] = async (el) => {
  const file = el.files?.[0];
  if (!file) return;
  try {
    const s = parseBackup(await file.text());
    confirmBox('Substituir o progresso atual por este backup?', () => {
      replaceState(s);
      processDays();
      toast('Backup restaurado!');
      go('hoje');
    }, 'Restaurar');
  } catch (e) {
    toast(`Backup inválido: ${esc(e.message)}`, 'bad');
  }
  el.value = '';
};
actions['reset-all'] = () => {
  confirmBox('Isso apaga <b>todo</b> o seu progresso neste aparelho. Exporte um backup antes!', () => {
    resetState();
    go('hoje');
  }, 'Apagar tudo');
};
