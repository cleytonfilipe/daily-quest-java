// Setor Conteúdo: calendário de posts para quem trabalha com social media.
import { state, save, uid } from '../store.js';
import { PLATFORMS, FORMATS, POST_STATUS, STATUS_ORDER, CLIENT_COLORS, REMIND_OPTIONS } from '../data.js';
import { icon } from '../sprites.js';
import { actions, forms, esc, bar, emptyState, openModal, closeModal, modalHead, confirmBox, toast, timeChip } from '../ui.js';
import { publishPost, unpublishPost, normRemind, toMin } from '../game.js';
import { todayKey, addDays, fmtDate, weekKey, WEEKDAYS, WEEKDAYS_1, weekday } from '../dates.js';
import { route, rerender } from '../nav.js';

const posts = () => state.content.posts;
const clients = () => state.content.clients;
const findPost = (id) => posts().find((p) => p.id === id);
const findClient = (id) => clients().find((c) => c.id === id);
const byTime = (a, b) => (a.time ? toMin(a.time) : 9999) - (b.time ? toMin(b.time) : 9999);
const byDateTime = (a, b) => (a.date === b.date ? byTime(a, b) : a.date < b.date ? -1 : 1);

export function platformBadge(id) {
  const p = PLATFORMS[id] || PLATFORMS.outro;
  return `<span class="plat" style="--c:${p.color}" title="${esc(p.name)}">${esc(p.short)}</span>`;
}

export function clientTag(id) {
  const c = findClient(id);
  return c ? `<span class="tag" style="--c:${c.color}">${esc(c.name)}</span>` : '';
}

export function postRow(p, { showDate = false } = {}) {
  const done = p.status === 'postado';
  const st = POST_STATUS[p.status] || POST_STATUS.ideia;
  const f = FORMATS[p.format] || FORMATS.post;
  const meta = [platformBadge(p.platform), `<span class="muted">${esc(f.name)}</span>`, clientTag(p.clientId)];
  if (showDate && p.date) meta.push(`<span class="muted">${p.date === todayKey() ? 'hoje' : fmtDate(p.date)}</span>`);
  if (!done) meta.push(`<button class="status-chip" style="--c:${st.color}" data-act="post-advance" data-id="${p.id}">${st.name} ›</button>`);
  else if (p.postedAt) meta.push(`<span class="c-green">publicado ${p.postedAt === todayKey() ? 'hoje' : fmtDate(p.postedAt)}</span>`);
  return `<div class="quest post ${done ? 'done' : ''}">
    <button class="check" data-act="post-toggle" data-id="${p.id}" aria-label="${done ? 'Desmarcar publicação' : 'Marcar como publicado'}">${done ? '✓' : ''}</button>
    <div class="q-main" data-act="post-edit" data-id="${p.id}">
      <div class="q-title">${timeChip(p.time, done, p.date)}${esc(p.title)}</div>
      <div class="q-meta">${meta.join('')}</div>
    </div>
    <div class="q-reward">${done ? '' : `<b class="c-xp">+${f.xp}</b><small>XP</small>`}</div>
  </div>`;
}

function dayLabel(k) {
  const t = todayKey();
  if (k === t) return 'Hoje';
  if (k === addDays(t, 1)) return 'Amanhã';
  return `${WEEKDAYS[weekday(k)]} ${fmtDate(k)}`;
}

export function contentModule() {
  const key = todayKey();
  const f = route.params.client || '';
  const list = posts().filter((p) => !f || p.clientId === f);
  const wk = weekKey(key);
  const weekPosts = list.filter((p) => p.date && weekKey(p.date) === wk);
  const published = weekPosts.filter((p) => p.status === 'postado').length;
  const late = list.filter((p) => p.date && p.date < key && p.status !== 'postado').sort(byDateTime);
  const today = list.filter((p) => p.date === key).sort(byTime);
  const next = list.filter((p) => p.date && p.date > key && p.date <= addDays(key, 14)).sort(byDateTime);
  const ideas = list.filter((p) => !p.date && p.status !== 'postado');
  const recent = list.filter((p) => p.status === 'postado').sort((a, b) => ((b.postedAt || '') > (a.postedAt || '') ? 1 : -1)).slice(0, 15);
  const days = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  const nextByDay = {};
  for (const p of next) (nextByDay[p.date] ||= []).push(p);

  return `<section class="panel module">
      <div class="mod-head">${icon('phone', 16)}<b>Esta semana</b><small>${published}/${weekPosts.length} publicados</small></div>
      ${bar(published, Math.max(1, weekPosts.length), 'cri', false)}
      <div class="week-dots">${days.map((k) => {
        const n = list.filter((p) => p.date === k).length;
        const ok = list.filter((p) => p.date === k && p.status === 'postado').length;
        return `<span class="${n && ok === n ? 'on' : ''} ${k === key ? 'today' : ''}"><i>${WEEKDAYS_1[weekday(k)]}</i>${n ? `${ok}/${n}` : ''}</span>`;
      }).join('')}</div>
      <div class="row-btns">
        <button class="btn btn-sm" data-act="clients-manage">Clientes</button>
        <button class="btn btn-sm" data-act="post-new" data-idea="1">+ Ideia</button>
        <button class="btn btn-green" data-act="post-new">+ Post</button>
      </div>
    </section>
    ${clients().length ? `<div class="chips scroll-x">
      <button class="chip ${!f ? 'sel' : ''}" data-act="post-filter" data-id="">Todos</button>
      ${clients().map((c) => `<button class="chip ${f === c.id ? 'sel' : ''}" data-act="post-filter" data-id="${c.id}" style="--c:${c.color}">${esc(c.name)}</button>`).join('')}
    </div>` : ''}
    ${late.length ? `<h3 class="sec-title c-hp">Atrasados <small>${late.length}</small></h3><div class="list">${late.map((p) => postRow(p, { showDate: true })).join('')}</div>` : ''}
    <h3 class="sec-title">Hoje <small>${today.length}</small></h3>
    ${today.length ? `<div class="list">${today.map((p) => postRow(p)).join('')}</div>` : emptyState('Nenhum post para hoje.', 'phone')}
    ${Object.keys(nextByDay).length ? `<h3 class="sec-title">Próximos dias</h3>
      ${Object.entries(nextByDay).map(([k, ps]) => `<h4 class="sub-title">${dayLabel(k)}</h4><div class="list">${ps.map((p) => postRow(p)).join('')}</div>`).join('')}` : ''}
    <h3 class="sec-title">Banco de ideias <small>${ideas.length}</small></h3>
    ${ideas.length ? `<div class="list">${ideas.map((p) => postRow(p)).join('')}</div>` : '<p class="small muted">Anote ideias soltas aqui e agende quando quiser.</p>'}
    ${recent.length ? `<details class="fold"><summary>Publicados recentes (${recent.length})</summary><div class="list">${recent.map((p) => postRow(p, { showDate: true })).join('')}</div></details>` : ''}`;
}

actions['post-filter'] = (el) => { route.params.client = el.dataset.id; rerender(); };

// ---------- formulário de post ----------
function postForm(p, opts = {}) {
  const isNew = !p.id;
  const remindVal = p.remind === null || p.remind === undefined ? (isNew ? '15' : '') : String(p.remind);
  const statusOpts = STATUS_ORDER.filter((s) => s !== 'postado');
  return `${modalHead(isNew ? (p.status === 'ideia' ? 'Nova ideia' : 'Novo post') : 'Editar post', 'phone')}
  <form data-form="post-save">
    <input type="hidden" name="id" value="${p.id || ''}"><input type="hidden" name="back" value="${opts.back || ''}">
    <label class="field"><span>O que vai postar?</span><input name="title" required maxlength="100" value="${esc(p.title || '')}" placeholder="Ex.: Reels com 3 dicas de verão" autofocus></label>
    <div class="two">
      <label class="field"><span>Plataforma</span><select name="platform">${Object.entries(PLATFORMS).map(([id, x]) => `<option value="${id}" ${p.platform === id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <label class="field"><span>Formato</span><select name="format">${Object.entries(FORMATS).map(([id, x]) => `<option value="${id}" ${p.format === id ? 'selected' : ''}>${x.name} (+${x.xp})</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Cliente / perfil</span><select name="clientId"><option value="">Pessoal / sem cliente</option>
      ${clients().map((c) => `<option value="${c.id}" ${p.clientId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
    <div class="two">
      <label class="field"><span>Data</span><input type="date" name="date" value="${p.date || ''}"></label>
      <label class="field"><span>Horário</span><input type="time" name="time" value="${p.time || ''}"></label>
    </div>
    <div class="two">
      <label class="field"><span>Lembrete</span><select name="remind">${REMIND_OPTIONS.map((o) => `<option value="${o.v}" ${remindVal === o.v ? 'selected' : ''}>${o.label}</option>`).join('')}</select></label>
      ${p.status === 'postado' ? `<div class="field"><span>Status</span><p class="c-green">Publicado em ${fmtDate(p.postedAt || todayKey())}</p></div>` : `
      <label class="field"><span>Status</span><select name="status">${statusOpts.map((s) => `<option value="${s}" ${(p.status || 'pronto') === s ? 'selected' : ''}>${POST_STATUS[s].name}</option>`).join('')}</select></label>`}
    </div>
    <label class="field"><span>Legenda / roteiro</span><textarea name="caption" rows="4" maxlength="2200" placeholder="Escreva a legenda, hashtags ou o roteiro...">${esc(p.caption || '')}</textarea></label>
    <label class="field"><span>Link (opcional)</span><input name="link" type="url" inputmode="url" maxlength="300" value="${esc(p.link || '')}" placeholder="https://"></label>
    <div class="row-btns">
      ${isNew ? '' : `<button type="button" class="btn btn-red btn-sm" data-act="post-del" data-id="${p.id}">Excluir</button>
      <button type="button" class="btn btn-sm" data-act="post-dup" data-id="${p.id}">Duplicar</button>`}
      <button type="button" class="btn btn-sm" data-act="post-copy">Copiar legenda</button>
      <button type="submit" class="btn btn-green">Salvar</button>
    </div>
  </form>`;
}

export function openPostForm(prefill = {}, opts = {}) {
  const last = posts()[posts().length - 1];
  openModal(postForm({ platform: last?.platform || 'instagram', format: 'reels', status: 'pronto', date: todayKey(), ...prefill }, opts));
}

actions['post-new'] = (el) => {
  if (el.dataset.idea) openPostForm({ status: 'ideia', date: '' });
  else openPostForm({ date: el.dataset.date || todayKey() });
};
actions['post-edit'] = (el) => { const p = findPost(el.dataset.id); if (p) openModal(postForm(p)); };
actions['post-dup'] = (el) => {
  const p = findPost(el.dataset.id);
  const { id, receipt, postedAt, prevStatus, ...rest } = p;
  openModal(postForm({ ...rest, status: 'pronto', date: addDays(p.date || todayKey(), 7) }));
  toast('Cópia criada para a semana seguinte. Ajuste e salve.');
};
actions['post-copy'] = async (el) => {
  const text = el.closest('form').querySelector('[name="caption"]').value;
  if (!text.trim()) { toast('A legenda está vazia.', 'bad'); return; }
  try { await navigator.clipboard.writeText(text); toast('Legenda copiada!'); } catch { toast('Não foi possível copiar.', 'bad'); }
};
actions['post-del'] = (el) => {
  const p = findPost(el.dataset.id);
  confirmBox(`Excluir <b>${esc(p.title)}</b>?${p.status === 'postado' ? ' O XP ganho será removido.' : ''}`, () => {
    if (p.status === 'postado') unpublishPost(p);
    state.content.posts = posts().filter((x) => x.id !== p.id);
    save();
    rerender();
  }, 'Excluir');
};
actions['post-toggle'] = (el) => {
  const p = findPost(el.dataset.id);
  if (!p) return;
  if (p.status === 'postado') unpublishPost(p);
  else { if (!p.date) p.date = todayKey(); publishPost(p); }
  rerender();
};
actions['post-advance'] = (el) => {
  const p = findPost(el.dataset.id);
  if (!p) return;
  const i = STATUS_ORDER.indexOf(p.status);
  const nextStatus = STATUS_ORDER[Math.min(STATUS_ORDER.length - 1, i + 1)];
  if (nextStatus === 'postado') { if (!p.date) p.date = todayKey(); publishPost(p); }
  else { p.status = nextStatus; save(); toast(`Status: ${POST_STATUS[nextStatus].name}`); }
  rerender();
};

forms['post-save'] = (fd) => {
  const id = fd.get('id');
  const time = fd.get('time') || null;
  const data = {
    title: String(fd.get('title')).trim(),
    platform: fd.get('platform'),
    format: fd.get('format'),
    clientId: fd.get('clientId') || null,
    date: fd.get('date') || null,
    time,
    remind: time ? normRemind(fd.get('remind'), time) : null,
    caption: String(fd.get('caption') || ''),
    link: String(fd.get('link') || '').trim(),
  };
  if (fd.has('status')) data.status = fd.get('status');
  if (!data.title) return;
  if (id) Object.assign(findPost(id), data);
  else {
    posts().push({ id: uid(), status: 'pronto', createdAt: todayKey(), postedAt: null, receipt: null, ...data });
    toast(data.date ? `Post agendado para ${data.date === todayKey() ? 'hoje' : fmtDate(data.date)}${time ? ` às ${time}` : ''}!` : 'Ideia guardada!');
  }
  if (!state.settings.sectors.includes('conteudo')) state.settings.sectors.push('conteudo');
  save();
  if (fd.get('back') === 'library' && actions['lib-reopen']) actions['lib-reopen']();
  else closeModal();
  rerender();
};

// ---------- clientes ----------
function clientsHtml() {
  return `${modalHead('Clientes e perfis', 'phone')}
    <p class="small muted">Cadastre as marcas ou perfis que você gerencia para filtrar o calendário.</p>
    ${clients().length ? `<ul class="mini-list">${clients().map((c) => `<li><span class="dot" style="background:${c.color}"></span><span class="grow">${esc(c.name)}</span>
      <small class="muted">${posts().filter((p) => p.clientId === c.id).length} posts</small><button class="btn-x" data-act="client-del" data-id="${c.id}" aria-label="Excluir">×</button></li>`).join('')}</ul>` : ''}
    <form data-form="client-save" class="client-form">
      <label class="field"><span>Novo cliente</span><input name="name" required maxlength="40" placeholder="Ex.: @padariadoze" autofocus></label>
      <div class="emoji-pick">${CLIENT_COLORS.map((c, i) => `<label><input type="radio" name="color" value="${c}" ${i === clients().length % CLIENT_COLORS.length ? 'checked' : ''}><span style="background:${c}"></span></label>`).join('')}</div>
      <div class="row-btns"><button class="btn btn-green" type="submit">Adicionar</button></div>
    </form>`;
}
actions['clients-manage'] = () => openModal(clientsHtml());
forms['client-save'] = (fd) => {
  const name = String(fd.get('name')).trim();
  if (!name) return;
  clients().push({ id: uid(), name, color: fd.get('color') || CLIENT_COLORS[0] });
  save();
  openModal(clientsHtml());
  rerender();
};
actions['client-del'] = (el) => {
  state.content.clients = clients().filter((c) => c.id !== el.dataset.id);
  save();
  openModal(clientsHtml());
  rerender();
};
