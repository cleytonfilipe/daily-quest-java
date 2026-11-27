// Aba Grupo: jogar junto com a sua dupla (ou amigos) usando a nuvem opcional.
import { state, save } from '../store.js';
import { BOSSES, CHEERS, HEAL, DIFFICULTY, QUEST_TYPES, REMIND_OPTIONS, HABIT_LIBRARY } from '../data.js';
import { heroSVG, bossSVG, icon, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../sprites.js';
import {
  actions, forms, esc, bar, emptyState, openModal, closeModal, modalHead, confirmBox, toast, timeChip, relTime, nextBig, sectorTag,
} from '../ui.js';
import { todayKey, weekKey, diffDays, WEEKDAYS_1 } from '../dates.js';
import {
  cloud, isConfigured, configIsLocal, removeConfig, applyPasted, signUp, signIn, signOutCloud,
  resetPassword, friendly, createGroup, joinGroup, leaveGroup, renameGroup, inGroup, inviteLink, pendingInvite,
  sharedDue, sharedDoneBy, sharedIsDone, saveShared, deleteShared, completeShared, uncompleteShared, sendCheer, sendHeal,
  resolveRestore,
} from '../cloud.js';
import { normRemind, toMin } from '../game.js';
import { route, rerender } from '../nav.js';
import { play } from '../sfx.js';

const meId = () => cloud.user?.uid;
const member = (uid) => cloud.members.find((m) => m.uid === uid);
const findShared = (id) => cloud.quests.find((q) => q.id === id);
const byTime = (a, b) => (a.time ? toMin(a.time) : 9999) - (b.time ? toMin(b.time) : 9999);

// ---------- tela ----------
export function renderGroup() {
  const head = `<header class="screen-head"><h1>${icon('group', 20)} Grupo</h1>${inGroup() ? `<small>${esc(cloud.group.name)}</small>` : ''}</header>`;
  if (!isConfigured()) return head + setupPanel();
  if (cloud.status === 'error') return head + errorPanel();
  if (cloud.status !== 'ready') return `${head}<section class="panel center"><p>Conectando à nuvem...</p></section>`;
  if (!cloud.user) return head + authPanel();
  if (!state.cloud.groupId) return head + noGroupPanel();
  if (!cloud.group) return `${head}<section class="panel center"><p>Carregando o grupo...</p></section>`;
  return head + groupView();
}

function setupPanel() {
  const p = state.player;
  const partnerLook = { skin: SKIN_TONES[2], hair: HAIR_COLORS[4], outfit: OUTFIT_COLORS[7] };
  return `<section class="panel intro">
      <div class="duo">${heroSVG(p.look, p.cls, 64, 'bob')}${icon('heart', 24)}${heroSVG(partnerLook, 'druida', 64, 'bob d1')}</div>
      <h2 class="center">Joguem juntos!</h2>
      <ul class="tips">
        <li>Vejam o nível, o HP e o progresso do dia um do outro, ao vivo.</li>
        <li>Dividam as <b>missões da casa</b>: quem fizer primeiro ganha o XP.</li>
        <li>Enfrentem juntos o mesmo <b>chefe semanal</b>.</li>
        <li>Mandem <b>incentivos</b> e <b>curem</b> o HP da dupla com ouro.</li>
        <li>De brinde: <b>backup automático</b> do seu progresso na nuvem.</li>
      </ul>
      <p class="small muted">Isso usa o Firebase (gratuito, do Google). Quem cria o grupo configura uma vez: cria um projeto, ativa o login por e-mail e o Firestore, e cola aqui a configuração. Passo a passo em <b>docs/NUVEM.md</b>.</p>
      <button class="btn btn-green btn-wide" data-act="cloud-config">Configurar a nuvem</button>
      <p class="small muted center">Recebeu um convite? Toque acima e cole o link do convite.</p>
    </section>`;
}

function errorPanel() {
  return `<section class="panel">
      <p class="c-hp">Não foi possível conectar à nuvem.</p>
      <p class="small">${esc(cloud.error || '')}</p>
      <div class="row-btns">
        ${configIsLocal() ? '<button class="btn btn-sm btn-red" data-act="cloud-config-remove">Remover configuração</button>' : ''}
        <button class="btn btn-sm" data-act="cloud-config">Trocar configuração</button>
        <button class="btn btn-sm btn-green" data-act="cloud-retry">Tentar de novo</button>
      </div>
    </section>`;
}

function authPanel() {
  const mode = route.params.auth || 'signup';
  const invite = pendingInvite();
  return `${invite ? `<div class="invite-banner panel">${icon('group', 20)}<span>Convite para o grupo <b>${esc(invite)}</b>. ${mode === 'signup' ? 'Crie sua conta' : 'Entre'} para participar.</span></div>` : ''}
    <section class="panel">
      <div class="seg">
        <button class="${mode === 'signup' ? 'sel' : ''}" data-act="auth-mode" data-mode="signup">Criar conta</button>
        <button class="${mode === 'login' ? 'sel' : ''}" data-act="auth-mode" data-mode="login">Entrar</button>
      </div>
      <form data-form="auth" data-mode="${mode}">
        <label class="field"><span>E-mail</span><input type="email" name="email" required autocomplete="email" inputmode="email" value="${esc(state.cloud.email || '')}"></label>
        <label class="field"><span>Senha ${mode === 'signup' ? '(mínimo 6 caracteres)' : ''}</span><input type="password" name="password" required minlength="6" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"></label>
        <button class="btn btn-green btn-wide" type="submit">${mode === 'signup' ? 'Criar conta' : 'Entrar'}</button>
      </form>
      ${mode === 'login' ? '<p class="center"><button class="btn-link" data-act="auth-reset">Esqueci minha senha</button></p>' : ''}
      <p class="small muted">Com a conta, seu progresso também fica salvo na nuvem e você pode recuperá-lo em outro aparelho.</p>
    </section>`;
}

function noGroupPanel() {
  const invite = pendingInvite() || '';
  return `<section class="panel"><p class="small">Conectado como <b>${esc(cloud.user.email)}</b></p></section>
    <section class="panel">
      <h3 class="sec-title">Criar um grupo</h3>
      <p class="small muted">Para você e sua dupla (ou amigos, até 8 pessoas).</p>
      <form data-form="group-create">
        <label class="field"><span>Nome do grupo</span><input name="name" required maxlength="40" value="Casa de ${esc(state.player.name)}"></label>
        <button class="btn btn-green btn-wide" type="submit">Criar grupo</button>
      </form>
    </section>
    <section class="panel">
      <h3 class="sec-title">Entrar com código</h3>
      <form data-form="group-join">
        <label class="field"><span>Código do convite</span><input name="code" required maxlength="10" autocapitalize="characters" autocomplete="off" value="${esc(invite)}" placeholder="Ex.: K7Q2MX"></label>
        <button class="btn btn-wide" type="submit">Entrar no grupo</button>
      </form>
    </section>
    <p class="center"><button class="btn btn-sm" data-act="cloud-signout">Sair da conta</button></p>`;
}

function groupView() {
  const g = cloud.group;
  const me = meId();
  const members = [...cloud.members].sort((a, b) => (a.uid === me ? -1 : b.uid === me ? 1 : (a.name || '').localeCompare(b.name || '')));
  const key = todayKey();
  const due = cloud.quests.filter((q) => sharedDue(q, key)).sort(byTime);
  const other = cloud.quests.filter((q) => !sharedDue(q, key));
  return `<section class="panel group-head">
      <div class="grow"><b class="g-name">${esc(g.name)}</b>
        <small class="muted">${g.memberIds.length} ${g.memberIds.length === 1 ? 'membro' : 'membros'} · código <b class="code">${esc(g.code)}</b></small></div>
      <button class="btn btn-green btn-sm" data-act="group-invite">Convidar</button>
    </section>
    <div class="members">${members.map((m) => memberCard(m, m.uid === me)).join('')}</div>
    ${g.memberIds.length < 2 ? '<p class="small muted center">Toque em <b>Convidar</b> e mande o código para a sua dupla.</p>' : ''}
    ${groupBossCard()}
    <h3 class="sec-title">Missões da casa <small>${due.filter((q) => sharedIsDone(q, key)).length}/${due.length} hoje</small></h3>
    <p class="small muted">Quem concluir primeiro ganha o XP. Missões da casa não tiram HP.</p>
    ${due.length ? `<div class="list">${due.map((q) => sharedRow(q, key)).join('')}</div>` : emptyState('Nenhuma missão da casa para hoje.', 'house')}
    ${other.length ? `<details class="fold"><summary>Outros dias (${other.length})</summary><div class="list">${other.map((q) => sharedRow(q, key)).join('')}</div></details>` : ''}
    <div class="two-btns"><button class="btn btn-green" data-act="shared-new">+ Nova tarefa</button><button class="btn" data-act="shared-lib">${icon('book', 14)} Sugestões</button></div>
    <h3 class="sec-title">Mural</h3>
    ${cloud.feed.length ? `<ul class="feed">${cloud.feed.slice(0, 25).map(feedItem).join('')}</ul>` : '<p class="small muted">As conquistas do grupo aparecem aqui.</p>'}
    <details class="fold"><summary>Configurações do grupo</summary>
      <section class="panel">
        <label class="switch"><span><b>Mostrar nomes das minhas missões</b><small>Sua dupla vê o nome da última missão que você concluiu</small></span>
          <input type="checkbox" data-change="share-titles" ${state.cloud.shareTitles ? 'checked' : ''}><i></i></label>
        <form data-form="group-rename" class="inline-form"><input name="name" maxlength="40" value="${esc(g.name)}" aria-label="Nome do grupo"><button class="btn btn-sm" type="submit">Renomear</button></form>
        <button class="btn btn-red btn-wide" data-act="group-leave">Sair do grupo</button>
      </section>
    </details>`;
}

function memberCard(m, isMe) {
  const online = m.updatedAt && Date.now() - m.updatedAt < 5 * 60000;
  const t = m.today?.date === todayKey() ? m.today : { done: 0, total: 0 };
  return `<section class="member panel ${isMe ? 'me' : ''}">
      <div class="m-sprite">${heroSVG(m.look, m.cls, 56, online ? 'bob' : '')}<span class="lvl">Nv ${m.level}</span></div>
      <div class="grow">
        <div class="m-name"><b>${esc(m.name)}${isMe ? ' <small>(você)</small>' : ''}</b><span class="presence ${online ? 'on' : ''}">${online ? 'online' : esc(relTime(m.updatedAt))}</span></div>
        <div class="stat-line">${icon('heart', 10)}${bar(m.hp, m.maxHp, 'hp')}</div>
        <div class="stat-line">${icon('star', 10)}${bar(m.xp, m.xpNext, 'xp')}</div>
        <div class="m-meta"><span>${icon('scroll', 10)} ${t.done}/${t.total} hoje</span><span class="streak">${icon('fire', 10)} ${m.dayStreak || 0}</span>${m.resting ? '<span class="resting">descansando</span>' : ''}</div>
        ${m.last ? `<small class="muted">Última: ${esc(m.last)}</small>` : ''}
        ${isMe ? '' : `<div class="row-btns">
          <button class="btn btn-sm" data-act="cheer-open" data-uid="${m.uid}">💬 Incentivar</button>
          <button class="btn btn-sm" data-act="heal-send" data-uid="${m.uid}" ${m.hp >= m.maxHp || state.player.gold < HEAL.cost ? 'disabled' : ''}>❤ Curar (${HEAL.cost})</button></div>`}
      </div>
    </section>`;
}

export function groupBossCard() {
  const b = cloud.group?.boss;
  if (!b || b.week !== weekKey(todayKey())) return '<section class="boss-card panel"><p class="small muted">Invocando o chefe da semana...</p></section>';
  const def = BOSSES[b.idx] || BOSSES[0];
  const defeated = b.damage >= b.maxHp;
  const daysLeft = 7 - diffDays(weekKey(todayKey()), todayKey());
  const contrib = cloud.members.filter((m) => m.week?.week === b.week && m.week.dmg > 0).sort((x, y) => y.week.dmg - x.week.dmg);
  return `<section class="boss-card panel group-boss ${defeated ? 'defeated' : ''}">
      <div class="boss-sprite">${bossSVG(def.color, 64, defeated ? 'defeated' : 'float')}</div>
      <div class="grow">
        <div class="boss-title"><small>CHEFE DO GRUPO</small><b>${esc(def.name)}</b></div>
        ${defeated ? '<p class="c-green small">Derrotado pelo grupo! Um novo chefe surge na segunda-feira.</p>' : `
          ${bar(Math.max(0, b.maxHp - b.damage), b.maxHp, 'boss')}
          <p class="small muted">"${esc(def.taunt)}" · ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes</p>`}
        ${contrib.length ? `<p class="small">${contrib.map((m) => `${esc(m.name)} <b class="c-xp">${m.week.dmg}</b>`).join(' · ')}</p>` : ''}
      </div>
    </section>`;
}

export function sharedRow(q, key = todayKey()) {
  const by = sharedDoneBy(q, key);
  const done = !!by;
  const due = sharedDue(q, key);
  const diff = DIFFICULTY[q.diff] || DIFFICULTY.facil;
  const me = meId();
  const meta = [sectorTag(q.sector || 'casa')];
  if (q.assignee) meta.push(`<span class="muted">${q.assignee === me ? 'com você' : `com ${esc(member(q.assignee)?.name || '?')}`}</span>`);
  else meta.push('<span class="muted">qualquer um</span>');
  if (q.type !== 'daily') meta.push(`<span class="muted">${QUEST_TYPES[q.type]}</span>`);
  else if (!due && q.days?.length) meta.push(`<span class="muted">${q.days.map((d) => WEEKDAYS_1[d]).join(' ')}</span>`);
  if (done) meta.push(`<span class="c-green">feita por ${by.uid === me ? 'você' : esc(by.name)}</span>`);
  const canToggle = due && (!done || by.uid === me);
  return `<div class="quest shared ${done ? 'done' : ''}">
    <button class="check" ${canToggle ? `data-act="shared-toggle" data-id="${q.id}"` : 'disabled'} aria-label="${done ? 'Desmarcar' : 'Concluir'}">${done ? '✓' : ''}</button>
    <div class="q-main" data-act="shared-edit" data-id="${q.id}">
      <div class="q-title">${timeChip(q.time, done, key)}${esc(q.title)}</div>
      <div class="q-meta">${meta.join('')}</div>
    </div>
    <div class="q-reward">${done ? '' : `<b class="c-xp">+${diff.xp}</b><small>XP</small>`}</div>
  </div>`;
}

// Faixa com a dupla na tela Hoje.
export function partyStrip() {
  if (!inGroup()) return '';
  const others = cloud.members.filter((m) => m.uid !== meId());
  if (!others.length) return '';
  return `<button class="party-strip panel" data-act="go" data-tab="grupo">${others.map((m) => {
    const t = m.today?.date === todayKey() ? m.today : { done: 0, total: 0 };
    return `<span class="ps-member">${heroSVG(m.look, m.cls, 32)}<span class="grow"><b>${esc(m.name)}</b><small>Nv ${m.level} · ${t.done}/${t.total} hoje</small>${bar(m.hp, m.maxHp, 'hp mini', false)}</span></span>`;
  }).join('')}<span class="chev">›</span></button>`;
}

// Módulo do setor Casa.
export function houseModule() {
  if (!inGroup()) {
    return `<section class="panel module"><div class="mod-head">${icon('group', 16)}<b>Dividam as tarefas</b></div>
      <p class="small">Crie um grupo na aba Grupo para dividir as tarefas da casa com sua dupla: quem fizer primeiro ganha o XP.</p>
      <button class="btn btn-wide" data-act="go" data-tab="grupo">Ir para o Grupo</button></section>`;
  }
  const key = todayKey();
  const due = cloud.quests.filter((q) => sharedDue(q, key)).sort(byTime);
  return `<section class="panel module"><div class="mod-head">${icon('house', 16)}<b>Missões da casa (grupo)</b><small>${due.filter((q) => sharedIsDone(q, key)).length}/${due.length}</small></div>
      ${due.length ? `<div class="list">${due.map((q) => sharedRow(q, key)).join('')}</div>` : '<p class="small muted">Nenhuma para hoje.</p>'}
      <div class="row-btns"><button class="btn btn-sm" data-act="shared-lib">Sugestões</button><button class="btn btn-sm btn-green" data-act="shared-new">+ Nova tarefa</button></div></section>`;
}

const FEED_TEXT = {
  join: () => 'entrou no grupo! 🎉',
  levelup: (e) => `subiu para o nível <b>${e.level}</b>!`,
  achievement: (e) => `desbloqueou a conquista <b>${esc(e.text)}</b>`,
  goal: (e) => (e.text ? `concluiu o objetivo <b>${esc(e.text)}</b>!` : 'concluiu um objetivo!'),
  perfect: () => 'teve um <b>dia perfeito</b>! ⭐',
  shared: (e) => `fez <b>${esc(e.text)}</b> ${icon('house', 10)}`,
  cheer: (e) => `mandou para ${esc(e.toName)}: ${esc(e.emoji)} ${esc(e.text)}`,
  heal: (e) => `curou ${esc(e.toName)} (+${e.amount} HP) ❤`,
};
function feedItem(e) {
  const text = FEED_TEXT[e.type]?.(e) || '';
  return `<li>${heroSVG(e.look, e.cls, 24)}<span class="grow"><b>${esc(e.name)}</b> ${text}</span><small class="muted">${esc(relTime(e.at))}</small></li>`;
}

// ---------- configuração e conta ----------
actions['cloud-config'] = () => {
  openModal(`${modalHead('Configurar a nuvem', 'gear')}
    <form data-form="cloud-config">
      <p class="small"><b>Recebeu um convite?</b> Cole aqui o link que te mandaram.</p>
      <p class="small"><b>Vai criar o grupo?</b> No console do Firebase: <b>Configurações do projeto › Seus apps › App da Web</b>. Copie o bloco <b>firebaseConfig</b> inteiro e cole abaixo.</p>
      <textarea name="cfg" rows="7" required placeholder="Link do convite ou&#10;const firebaseConfig = {&#10;  apiKey: &quot;...&quot;,&#10;  projectId: &quot;...&quot;,&#10;  ...&#10;};"></textarea>
      <p class="small muted">Esses dados não são senhas: a proteção vem das regras do Firestore.</p>
      <div class="row-btns"><button class="btn btn-green" type="submit">Salvar e conectar</button></div>
    </form>`);
};
forms['cloud-config'] = (fd) => {
  try {
    applyPasted(String(fd.get('cfg') || ''));
    location.hash = 'aba=grupo';
    location.reload();
  } catch (e) {
    toast(esc(e.message), 'bad', 4500);
  }
};
actions['cloud-config-remove'] = () => {
  confirmBox('Remover a configuração da nuvem deste aparelho? Seu progresso local continua aqui.', () => {
    removeConfig();
    location.reload();
  }, 'Remover');
};
actions['cloud-retry'] = () => { location.hash = 'aba=grupo'; location.reload(); };
actions['auth-mode'] = (el) => { route.params.auth = el.dataset.mode; rerender(); };

async function busy(btn, fn) {
  const label = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Aguarde...'; }
  try { return await fn(); } finally { if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = label; } }
}

forms.auth = async (fd, form) => {
  const email = String(fd.get('email') || '');
  const pass = String(fd.get('password') || '');
  try {
    await busy(form.querySelector('[type="submit"]'), () => (form.dataset.mode === 'signup' ? signUp(email, pass) : signIn(email, pass)));
    toast(form.dataset.mode === 'signup' ? 'Conta criada! Bem-vindo(a).' : 'Conectado!');
  } catch (e) {
    toast(esc(friendly(e)), 'bad', 4500);
  }
};
actions['auth-reset'] = async () => {
  const email = document.querySelector('[data-form="auth"] [name="email"]')?.value || '';
  if (!email.includes('@')) { toast('Digite seu e-mail no campo acima.', 'bad'); return; }
  try { await resetPassword(email); toast('Enviamos um e-mail para você redefinir a senha.', '', 4000); } catch (e) { toast(esc(friendly(e)), 'bad', 4000); }
};
actions['cloud-signout'] = () => {
  confirmBox('Sair da conta neste aparelho? Seu progresso local continua aqui.', async () => {
    try { await signOutCloud(); toast('Você saiu da conta.'); } catch (e) { toast(esc(friendly(e)), 'bad'); }
  }, 'Sair');
};

actions['restore-cloud'] = async () => {
  nextBig();
  try { await resolveRestore(true); toast('Progresso da nuvem restaurado!'); } catch (e) { toast(esc(friendly(e)), 'bad', 4000); }
  rerender();
};
actions['restore-keep'] = async () => {
  nextBig();
  try { await resolveRestore(false); toast('Mantivemos o progresso deste aparelho.'); } catch (e) { toast(esc(friendly(e)), 'bad', 4000); }
  rerender();
};

// ---------- grupo ----------
forms['group-create'] = async (fd, form) => {
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  try {
    const code = await busy(form.querySelector('[type="submit"]'), () => createGroup(name));
    play('levelup');
    toast(`Grupo criado! Código: <b>${esc(code)}</b>`, '', 4000);
    actions['group-invite']();
  } catch (e) {
    toast(esc(friendly(e)), 'bad', 4500);
  }
};
forms['group-join'] = async (fd, form) => {
  try {
    await busy(form.querySelector('[type="submit"]'), () => joinGroup(fd.get('code')));
    play('levelup');
    toast('Você entrou no grupo!', '', 3000);
  } catch (e) {
    toast(esc(friendly(e)), 'bad', 4500);
  }
};
forms['group-rename'] = async (fd) => {
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  try { await renameGroup(name); toast('Grupo renomeado'); } catch (e) { toast(esc(friendly(e)), 'bad'); }
};
actions['group-leave'] = () => {
  confirmBox('Sair do grupo? Você pode voltar depois com o código.', async () => {
    try { await leaveGroup(); toast('Você saiu do grupo.'); } catch (e) { toast(esc(friendly(e)), 'bad'); }
  }, 'Sair do grupo');
};
actions['share-titles'] = (el) => { state.cloud.shareTitles = el.checked; save(); };

function inviteText() {
  return `Vem jogar comigo no Daily Quest! 🎮\nCódigo do grupo: ${cloud.group.code}\n${inviteLink()}`;
}
actions['group-invite'] = () => {
  openModal(`${modalHead('Convidar para o grupo', 'group')}
    <p class="center">Código do grupo</p>
    <p class="big-code">${esc(cloud.group.code)}</p>
    <ol class="small install">
      <li>Mande o link ou o código para a sua dupla.</li>
      <li>No iPhone dela: abrir o link no <b>Safari</b> › <b>Compartilhar</b> › <b>Adicionar à Tela de Início</b>.</li>
      <li>Abrir o app pelo ícone, criar o herói e, na aba <b>Grupo</b>, criar a conta e entrar com o código.</li>
    </ol>
    ${configIsLocal() ? '<p class="small muted">Se ela já tiver o app instalado, é só abrir a aba Grupo › Configurar a nuvem e colar o link do convite.</p>' : ''}
    <div class="row-btns"><button class="btn" data-act="invite-copy">Copiar</button><button class="btn btn-green" data-act="invite-share">Compartilhar</button></div>`);
};
actions['invite-share'] = async () => {
  if (navigator.share) {
    try { await navigator.share({ title: 'Daily Quest', text: inviteText() }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  actions['invite-copy']();
};
actions['invite-copy'] = async () => {
  try { await navigator.clipboard.writeText(inviteText()); toast('Convite copiado! Cole no WhatsApp.'); } catch { toast('Não foi possível copiar. Use o código acima.', 'bad'); }
};

// ---------- incentivos e cura ----------
actions['cheer-open'] = (el) => {
  const m = member(el.dataset.uid);
  if (!m) return;
  openModal(`${modalHead(`Incentivar ${m.name}`, 'heart')}
    <div class="cheers">${CHEERS.map((c, i) => `<button class="cheer" data-act="cheer-send" data-uid="${m.uid}" data-i="${i}"><span class="emoji">${c.emoji}</span>${esc(c.text)}</button>`).join('')}</div>`);
};
actions['cheer-send'] = (el) => {
  const m = member(el.dataset.uid);
  if (!m) return;
  sendCheer(m, CHEERS[Number(el.dataset.i)]);
  closeModal();
  toast(`Incentivo enviado para ${esc(m.name)}! ❤`);
  rerender();
};
actions['heal-send'] = (el) => {
  const m = member(el.dataset.uid);
  if (!m) return;
  confirmBox(`Gastar <b class="c-gold">${HEAL.cost} de ouro</b> para curar <b>${esc(m.name)}</b> em <b class="c-hp">${HEAL.amount} HP</b>?`, () => {
    if (sendHeal(m)) { play('coin'); toast(`Você curou ${esc(m.name)}! ❤`); } else toast('Ouro insuficiente.', 'bad');
    rerender();
  }, 'Curar', false);
};

// ---------- missões da casa ----------
function sharedForm(q = {}) {
  const isNew = !q.id;
  const type = q.type || 'daily';
  const remindVal = q.remind === null || q.remind === undefined ? (isNew && q.time ? '0' : '') : String(q.remind);
  return `${modalHead(isNew ? 'Nova missão da casa' : 'Missão da casa', 'house')}
  <form class="qform" data-form="shared-save" data-type="${type}">
    <input type="hidden" name="id" value="${q.id || ''}">
    <label class="field"><span>Tarefa</span><input name="title" required maxlength="80" value="${esc(q.title || '')}" placeholder="Ex.: Lavar a louça" autofocus></label>
    <div class="field"><span>Repetição</span><div class="seg seg-sm">${['daily', 'weekly', 'once'].map((t) => `
      <label><input type="radio" name="type" value="${t}" ${type === t ? 'checked' : ''} data-change="q-type"><span>${QUEST_TYPES[t]}</span></label>`).join('')}</div></div>
    <div class="field f-days"><span>Dias da semana</span><div class="days">${WEEKDAYS_1.map((l, i) => `
      <label><input type="checkbox" name="days" value="${i}" ${!q.days?.length || q.days.includes(i) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="two">
      <label class="field"><span>Horário (opcional)</span><input type="time" name="time" value="${q.time || ''}"></label>
      <label class="field"><span>Lembrete</span><select name="remind">${REMIND_OPTIONS.map((o) => `<option value="${o.v}" ${remindVal === o.v ? 'selected' : ''}>${o.label}</option>`).join('')}</select></label>
    </div>
    <div class="two">
      <label class="field"><span>Quem faz</span><select name="assignee"><option value="">Qualquer um</option>
        ${cloud.members.map((m) => `<option value="${m.uid}" ${q.assignee === m.uid ? 'selected' : ''}>${esc(m.name)}${m.uid === meId() ? ' (você)' : ''}</option>`).join('')}</select></label>
      <label class="field"><span>Dificuldade</span><select name="diff">${Object.entries(DIFFICULTY).map(([id, d]) => `<option value="${id}" ${(q.diff || 'facil') === id ? 'selected' : ''}>${d.name} (+${d.xp} XP)</option>`).join('')}</select></label>
    </div>
    <div class="row-btns">
      ${isNew ? '' : `<button type="button" class="btn btn-red btn-sm" data-act="shared-del" data-id="${q.id}">Excluir</button>`}
      <button type="submit" class="btn btn-green">Salvar</button>
    </div>
  </form>`;
}

actions['shared-new'] = () => openModal(sharedForm({ type: 'daily', diff: 'facil' }));
actions['shared-edit'] = (el) => { const q = findShared(el.dataset.id); if (q) openModal(sharedForm(q)); };
actions['shared-toggle'] = (el) => {
  const q = findShared(el.dataset.id);
  if (!q) return;
  if (sharedDoneBy(q)) uncompleteShared(q);
  else completeShared(q);
  rerender();
};
actions['shared-del'] = (el) => {
  const q = findShared(el.dataset.id);
  confirmBox(`Excluir <b>${esc(q.title)}</b> para todo o grupo?`, async () => {
    try { await deleteShared(q.id); toast('Missão excluída'); } catch (e) { toast(esc(friendly(e)), 'bad'); }
  }, 'Excluir');
};
forms['shared-save'] = async (fd) => {
  const time = fd.get('time') || null;
  const type = fd.get('type');
  const days = fd.getAll('days').map(Number);
  const data = {
    title: String(fd.get('title') || '').trim(), type, diff: fd.get('diff'), sector: 'casa',
    days: type === 'daily' && days.length < 7 ? days : [], time, remind: time ? normRemind(fd.get('remind'), time) : null,
    assignee: fd.get('assignee') || null,
  };
  if (!data.title) return;
  if (type === 'daily' && !days.length) { toast('Escolha pelo menos um dia.', 'bad'); return; }
  closeModal();
  try {
    await saveShared(fd.get('id') || null, data);
    toast(fd.get('id') ? 'Missão atualizada' : 'Missão da casa criada!');
  } catch (e) {
    toast(esc(friendly(e)), 'bad', 4000);
  }
};
actions['shared-lib'] = () => {
  const items = HABIT_LIBRARY.casa.filter((it) => it.type !== 'habit');
  openModal(`${modalHead('Sugestões para a casa', 'house')}
    <div class="lib-list">${items.map((it, i) => {
      const exists = cloud.quests.some((q) => q.title.toLowerCase() === it.title.toLowerCase());
      return `<button class="lib-item ${exists ? 'added' : ''}" data-act="shared-lib-pick" data-i="${i}">${icon(it.time ? 'clock' : 'house', 18)}
        <span class="grow"><b>${esc(it.title)}</b><small>${QUEST_TYPES[it.type]}${it.time ? ` · às ${it.time}` : ''} · ${DIFFICULTY[it.diff].name}</small></span><span class="lib-add">${exists ? '✓' : '+'}</span></button>`;
    }).join('')}</div>`, { wide: true });
};
actions['shared-lib-pick'] = (el) => {
  const it = HABIT_LIBRARY.casa.filter((x) => x.type !== 'habit')[Number(el.dataset.i)];
  openModal(sharedForm({ title: it.title, type: it.type, diff: it.diff, days: it.days || [], time: it.time || null }));
};
