// Tela inicial e cadastro do herói em etapas.
import { state, save, replaceState, parseBackup } from '../store.js';
import { SECTORS, SECTOR_IDS, CLASSES, OBJECTIVE_PRESETS, TIPS, PROFESSIONS } from '../data.js';
import { heroSVG, icon, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../sprites.js';
import { actions, forms, esc, openModal, closeModal, modalHead, toast } from '../ui.js';
import { createPlayer, applyPresets, newGoal, processDays, addQuestsFromTemplates, toMin } from '../game.js';
import { todayKey } from '../dates.js';
import { go, rerender } from '../nav.js';
import { play } from '../sfx.js';
import { isConfigured, pendingInvite, cloud, signIn, friendly, initCloud } from '../cloud.js';

const STEPS = ['Herói', 'Classe', 'Visual', 'Rotina', 'Setores', 'Objetivos', 'Metas'];

const draft = {
  step: 0, name: '', cls: 'guerreiro',
  look: { skin: SKIN_TONES[1], hair: HAIR_COLORS[0], outfit: OUTFIT_COLORS[0] },
  profession: null, wake: '07:00', sleep: '23:00', wakeQuest: true, sleepQuest: true,
  sectors: ['alimentacao', 'academia', 'trabalho', 'financeiro'],
  presets: [], custom: [],
  waterGoal: 8, sleepGoal: 8, budget: '', weight: '',
};

const orderSectors = (list) => SECTOR_IDS.filter((id) => list.includes(id));

function stepper() {
  return `<div class="stepper">${STEPS.map((s, i) => `<span class="${i + 1 < draft.step ? 'ok' : ''} ${i + 1 === draft.step ? 'on' : ''}">${i + 1}</span>`).join('')}</div>
    <p class="step-label">Etapa ${draft.step} de ${STEPS.length} · ${STEPS[draft.step - 1]}</p>`;
}

function nav(nextLabel = 'Próximo') {
  return `<div class="ob-nav">
    <button type="button" class="btn" data-act="ob-back">Voltar</button>
    <button type="submit" class="btn btn-green">${nextLabel}</button></div>`;
}

function titleScreen() {
  const d = draft;
  const invite = pendingInvite();
  return `<div class="title-screen">
      <div class="logo"><span>DAILY</span><span>QUEST</span></div>
      <p class="subtitle">Sua rotina é a sua aventura</p>
      <div class="title-heroes">${heroSVG(d.look, 'guerreiro', 72, 'bob')}${heroSVG({ skin: SKIN_TONES[2], hair: HAIR_COLORS[4], outfit: OUTFIT_COLORS[3] }, 'mago', 72, 'bob d1')}${heroSVG({ skin: SKIN_TONES[0], hair: HAIR_COLORS[3], outfit: OUTFIT_COLORS[2] }, 'druida', 72, 'bob d2')}</div>
      ${invite ? `<div class="invite-banner panel">${icon('group', 20)}<span>Você foi convidado(a) para um grupo! Código <b>${esc(invite)}</b>. Crie seu herói para participar.</span></div>` : ''}
      <div class="title-menu">
        <button class="btn btn-green btn-big" data-act="ob-start">▶ Novo jogo</button>
        ${isConfigured() ? '<button class="btn btn-big" data-act="ob-login">Já tenho conta</button>' : ''}
        <label class="btn btn-big">Carregar backup<input type="file" accept="application/json,.json" data-change="ob-import" hidden></label>
      </div>
      <p class="muted small">Seus dados ficam salvos neste aparelho${isConfigured() ? ' e, com uma conta, também na nuvem' : ''}.</p>
    </div>`;
}

export function renderOnboarding() {
  const d = draft;
  if (d.step === 0) return titleScreen();
  let body = '';
  if (d.step === 1) {
    body = `<h2>Bem-vindo, jogador!</h2><p>Antes de começar, vamos criar seu perfil.</p>
      <div class="center">${heroSVG(d.look, d.cls, 96, 'bob')}</div>
      <label class="field"><span>Qual o seu nome de jogador?</span>
      <input name="name" maxlength="20" required value="${esc(d.name)}" placeholder="Ex.: Cleyton" autocomplete="nickname" autofocus></label>`;
  } else if (d.step === 2) {
    body = `<h2>Escolha sua classe</h2><p>Cada classe tem um bônus. Você pode trocar depois.</p>
      <div class="class-grid">${Object.entries(CLASSES).map(([id, c]) => `
        <button type="button" class="class-card ${d.cls === id ? 'sel' : ''}" data-act="ob-class" data-id="${id}">
          ${heroSVG(d.look, id, 64)}<b>${c.name}</b><small>${c.desc}</small></button>`).join('')}</div>`;
  } else if (d.step === 3) {
    body = `<h2>Visual do herói</h2>
      <div class="center">${heroSVG(d.look, d.cls, 112, 'bob')}</div>
      ${lookPicker(d.look, 'ob-look')}`;
  } else if (d.step === 4) {
    body = `<h2>Sua rotina</h2><p>Isso ajuda a sugerir missões com horário para você.</p>
      <div class="field"><span>Com o que você trabalha?</span><div class="prof-grid">${Object.entries(PROFESSIONS).map(([id, p]) => `
        <button type="button" class="pick ${d.profession === id ? 'sel' : ''}" data-act="ob-prof" data-id="${id}"><b>${esc(p.name)}</b></button>`).join('')}</div></div>
      ${d.profession === 'socialmedia' ? `<p class="small c-green">${icon('phone', 12)} Vamos ativar o setor Conteúdo, com calendário de posts e missões de social media (DMs, métricas, planejamento).</p>` : ''}
      <div class="two">
        <label class="field"><span>Costumo acordar às</span><input type="time" name="wake" value="${d.wake}" data-change="ob-field"></label>
        <label class="field"><span>Quero dormir às</span><input type="time" name="sleep" value="${d.sleep}" data-change="ob-field"></label>
      </div>
      <label class="check-line"><input type="checkbox" name="wakeQuest" ${d.wakeQuest ? 'checked' : ''} data-change="ob-field"><span>Criar a missão "Acordar no horário"</span></label>
      <label class="check-line"><input type="checkbox" name="sleepQuest" ${d.sleepQuest ? 'checked' : ''} data-change="ob-field"><span>Criar a missão "Ir para a cama no horário" (com lembrete)</span></label>`;
  } else if (d.step === 5) {
    body = `<h2>Setores da rotina</h2><p>Quais áreas da sua vida você quer evoluir? Cada setor treina um atributo.</p>
      <div class="sector-pick">${SECTOR_IDS.map((id) => {
        const s = SECTORS[id];
        const on = d.sectors.includes(id);
        return `<button type="button" class="pick ${on ? 'sel' : ''}" data-act="ob-sector" data-id="${id}" style="--c:${s.color}">
          ${icon(s.icon, 24)}<b>${s.name}</b><small>${s.desc}</small>${s.core ? '' : '<em>extra</em>'}</button>`;
      }).join('')}</div>`;
  } else if (d.step === 6) {
    const presets = OBJECTIVE_PRESETS.filter((p) => d.sectors.includes(p.sector));
    body = `<h2>Seus objetivos</h2><p>Escolha objetivos para focar. Cada um já cria missões sugeridas, que você pode editar depois.</p>
      <div class="preset-list">${presets.map((p) => {
        const on = d.presets.includes(p.id);
        return `<button type="button" class="preset ${on ? 'sel' : ''}" data-act="ob-preset" data-id="${p.id}">
          <span class="chk">${on ? '✓' : ''}</span>${icon(SECTORS[p.sector].icon, 16)}
          <span><b>${esc(p.title)}</b><small>${(p.quests || []).map((q) => esc(q.title) + (q.time ? ` (${q.time})` : '')).join(' · ')}</small></span></button>`;
      }).join('')}</div>
      <div class="custom-goal"><input id="ob-custom" maxlength="60" placeholder="Objetivo personalizado..."><select id="ob-custom-sector">${d.sectors.map((id) => `<option value="${id}">${SECTORS[id].name}</option>`).join('')}</select>
      <button type="button" class="btn" data-act="ob-custom-add">+</button></div>
      ${d.custom.length ? `<ul class="custom-list">${d.custom.map((c, i) => `<li>${icon(SECTORS[c.sector].icon, 14)} ${esc(c.title)} <button type="button" class="btn-x" data-act="ob-custom-del" data-i="${i}">×</button></li>`).join('')}</ul>` : ''}`;
  } else if (d.step === 7) {
    body = `<h2>Metas iniciais</h2><p>Opcional: ajuda a personalizar os setores.</p>
      ${d.sectors.includes('alimentacao') ? `<label class="field"><span>Meta de água (copos de 250 ml por dia)</span><input name="waterGoal" type="number" min="1" max="30" value="${d.waterGoal}" inputmode="numeric"></label>
      <label class="field"><span>Peso atual (kg)</span><input name="weight" type="number" step="0.1" min="20" max="400" value="${esc(d.weight)}" inputmode="decimal" placeholder="Ex.: 78.5"></label>` : ''}
      ${d.sectors.includes('financeiro') ? `<label class="field"><span>Orçamento mensal de gastos (R$)</span><input name="budget" type="number" min="0" step="1" value="${esc(d.budget)}" inputmode="decimal" placeholder="Ex.: 3000"></label>` : ''}
      ${d.sectors.includes('sono') || d.wakeQuest || d.sleepQuest ? `<label class="field"><span>Meta de sono (horas por noite)</span><input name="sleepGoal" type="number" min="4" max="12" step="0.5" value="${d.sleepGoal}" inputmode="decimal"></label>` : ''}
      <div class="summary panel-inner">
        <p><b>${esc(d.name)}</b>, o ${CLASSES[d.cls].name}${d.profession ? ` · ${esc(PROFESSIONS[d.profession].name)}` : ''}</p>
        <p>${d.sectors.length} setores · ${d.presets.length + d.custom.length} objetivos</p>
      </div>`;
  }
  return `<form class="onboarding panel" data-form="ob-step">${stepper()}${body}${nav(d.step === 7 ? 'Começar aventura!' : 'Próximo')}</form>`;
}

export function lookPicker(look, act) {
  const row = (label, key, colors) => `<div class="swatch-row"><span>${label}</span><div>${colors.map((c) => `
    <button type="button" class="swatch ${look[key] === c ? 'sel' : ''}" style="background:${c}" data-act="${act}" data-key="${key}" data-color="${c}" aria-label="${label} ${c}"></button>`).join('')}</div></div>`;
  return row('Pele', 'skin', SKIN_TONES) + row('Cabelo', 'hair', HAIR_COLORS) + row('Roupa', 'outfit', OUTFIT_COLORS);
}

actions['ob-start'] = () => { draft.step = 1; play('click'); rerender(); };
actions['ob-back'] = () => { draft.step = Math.max(0, draft.step - 1); rerender(); };
actions['ob-class'] = (el) => { draft.cls = el.dataset.id; play('click'); rerender(); };
actions['ob-look'] = (el) => { draft.look[el.dataset.key] = el.dataset.color; play('click'); rerender(); };
actions['ob-field'] = (el) => { draft[el.name] = el.type === 'checkbox' ? el.checked : el.value; };
actions['ob-prof'] = (el) => {
  draft.profession = el.dataset.id;
  draft.sectors = orderSectors([...new Set([...draft.sectors, ...PROFESSIONS[draft.profession].sectors])]);
  play('click');
  rerender();
};
actions['ob-sector'] = (el) => {
  const id = el.dataset.id;
  draft.sectors = orderSectors(draft.sectors.includes(id) ? draft.sectors.filter((x) => x !== id) : [...draft.sectors, id]);
  play('click');
  rerender();
};
actions['ob-preset'] = (el) => {
  const id = el.dataset.id;
  draft.presets = draft.presets.includes(id) ? draft.presets.filter((x) => x !== id) : [...draft.presets, id];
  play('click');
  rerender();
};
actions['ob-custom-add'] = () => {
  const input = document.getElementById('ob-custom');
  const title = input.value.trim();
  if (!title) return;
  draft.custom.push({ title, sector: document.getElementById('ob-custom-sector').value });
  rerender();
};
actions['ob-custom-del'] = (el) => { draft.custom.splice(Number(el.dataset.i), 1); rerender(); };

actions['ob-import'] = async (el) => {
  const file = el.files?.[0];
  if (!file) return;
  try {
    replaceState(parseBackup(await file.text()));
    processDays();
    toast('Backup carregado! Bem-vindo de volta.');
    go('hoje');
  } catch (e) {
    toast(`Não foi possível carregar: ${esc(e.message)}`, 'bad');
  }
};

// Entrar numa conta existente: o progresso salvo na nuvem é restaurado automaticamente.
actions['ob-login'] = () => {
  initCloud();
  openModal(`${modalHead('Entrar na minha conta', 'group')}
    <form data-form="ob-login">
      <label class="field"><span>E-mail</span><input type="email" name="email" required autocomplete="email" inputmode="email" autofocus></label>
      <label class="field"><span>Senha</span><input type="password" name="password" required autocomplete="current-password"></label>
      <p class="small muted">Se houver um progresso salvo na nuvem, ele volta para este aparelho.</p>
      <div class="row-btns"><button class="btn btn-green" type="submit">Entrar</button></div>
    </form>`);
};
forms['ob-login'] = async (fd, form) => {
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    if (cloud.status !== 'ready') await initCloud();
    for (let i = 0; i < 50 && cloud.status === 'loading'; i++) await new Promise((r) => setTimeout(r, 100));
    await signIn(String(fd.get('email')), String(fd.get('password')));
    closeModal();
    toast('Conectado! Procurando seu progresso na nuvem...');
  } catch (e) {
    toast(esc(friendly(e)), 'bad', 4000);
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
};

const sleepHoursBetween = (sleep, wake) => {
  let m = toMin(wake) - toMin(sleep);
  if (m <= 0) m += 1440;
  return Math.round((m / 60) * 2) / 2;
};

forms['ob-step'] = (fd) => {
  const d = draft;
  if (d.step === 1) {
    d.name = String(fd.get('name') || '').trim();
    if (!d.name) return;
  }
  if (d.step === 4) {
    d.wake = fd.get('wake') || d.wake;
    d.sleep = fd.get('sleep') || d.sleep;
    d.wakeQuest = fd.has('wakeQuest');
    d.sleepQuest = fd.has('sleepQuest');
    if (d.wakeQuest || d.sleepQuest) d.sleepGoal = Math.min(12, Math.max(4, sleepHoursBetween(d.sleep, d.wake)));
  }
  if (d.step === 5 && !d.sectors.length) { toast('Escolha pelo menos um setor.', 'bad'); return; }
  if (d.step === 5) d.presets = d.presets.filter((id) => d.sectors.includes(OBJECTIVE_PRESETS.find((p) => p.id === id).sector));
  if (d.step === 6 && !d.presets.length && !d.custom.length) {
    toast('Escolha pelo menos um objetivo para continuar sua jornada.', 'bad');
    return;
  }
  if (d.step === 7) {
    for (const k of ['waterGoal', 'sleepGoal', 'budget', 'weight']) if (fd.has(k)) d[k] = fd.get(k);
    finish();
    return;
  }
  d.step++;
  play('click');
  rerender();
};

function finish() {
  const d = draft;
  state.player = createPlayer({ name: d.name, cls: d.cls, look: { ...d.look } });
  let sectors = [...d.sectors];
  if ((d.wakeQuest || d.sleepQuest) && !sectors.includes('sono')) sectors.push('sono');
  state.settings.sectors = orderSectors(sectors);
  state.settings.profession = d.profession;
  state.settings.waterGoal = Number(d.waterGoal) || 8;
  state.settings.sleepGoal = Number(d.sleepGoal) || 8;
  state.settings.budget = Number(d.budget) || 0;
  state.lastProcessed = todayKey();
  state.createdAt = todayKey();
  applyPresets(d.presets);
  if (d.profession) addQuestsFromTemplates(PROFESSIONS[d.profession].quests);
  if (d.wakeQuest) addQuestsFromTemplates([{ title: 'Acordar no horário', sector: 'sono', diff: 'facil', time: d.wake, remind: 0 }]);
  if (d.sleepQuest) addQuestsFromTemplates([{ title: 'Ir para a cama no horário', sector: 'sono', diff: 'medio', time: d.sleep, remind: 15 }]);
  for (const c of d.custom) state.goals.push(newGoal({ title: c.title, sector: c.sector }));
  if (Number(d.weight) > 0) state.weights.push({ date: todayKey(), kg: Number(d.weight) });
  processDays();
  save();
  play('levelup');
  const invite = pendingInvite();
  go(invite && isConfigured() ? 'grupo' : 'hoje');
  openModal(`${modalHead('Perfil criado!', 'trophy')}
    <div class="center">${heroSVG(state.player.look, state.player.cls, 96, 'bob')}</div>
    <p class="center">Sua jornada começa agora, <b>${esc(d.name)}</b>!</p>
    ${invite && isConfigured() ? `<p class="center c-green">Agora crie sua conta aqui na aba Grupo para entrar no grupo <b>${esc(invite)}</b>.</p>` : ''}
    <ul class="tips">${TIPS.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}<li>${esc(TIPS[6])}</li></ul>
    <p class="muted small">Dica: no iPhone, toque em Compartilhar › "Adicionar à Tela de Início" para usar como app.</p>
    <div class="row-btns"><button class="btn btn-green" data-act="modal-close">Vamos lá!</button></div>`);
}
