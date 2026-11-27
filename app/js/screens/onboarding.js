// Tela inicial e cadastro do herói em etapas.
import { state, save, replaceState, parseBackup } from '../store.js';
import { SECTORS, SECTOR_IDS, CLASSES, OBJECTIVE_PRESETS, TIPS } from '../data.js';
import { heroSVG, icon, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../sprites.js';
import { actions, forms, esc, openModal, modalHead, toast } from '../ui.js';
import { createPlayer, applyPresets, newGoal, processDays } from '../game.js';
import { todayKey } from '../dates.js';
import { go, rerender } from '../nav.js';
import { play } from '../sfx.js';

const STEPS = ['Herói', 'Classe', 'Visual', 'Setores', 'Objetivos', 'Metas'];

const draft = {
  step: 0, name: '', cls: 'guerreiro',
  look: { skin: SKIN_TONES[1], hair: HAIR_COLORS[0], outfit: OUTFIT_COLORS[0] },
  sectors: ['alimentacao', 'academia', 'trabalho', 'financeiro'],
  presets: [], custom: [],
  waterGoal: 8, sleepGoal: 8, budget: '', weight: '',
};

function stepper() {
  return `<div class="stepper">${STEPS.map((s, i) => `<span class="${i + 1 < draft.step ? 'ok' : ''} ${i + 1 === draft.step ? 'on' : ''}">${i + 1}</span>`).join('')}</div>
    <p class="step-label">Etapa ${draft.step} de ${STEPS.length} · ${STEPS[draft.step - 1]}</p>`;
}

function nav(nextLabel = 'Próximo') {
  return `<div class="ob-nav">
    <button type="button" class="btn" data-act="ob-back">Voltar</button>
    <button type="submit" class="btn btn-green">${nextLabel}</button></div>`;
}

export function renderOnboarding() {
  const d = draft;
  if (d.step === 0) {
    return `<div class="title-screen">
      <div class="logo"><span>DAILY</span><span>QUEST</span></div>
      <p class="subtitle">Sua rotina é a sua aventura</p>
      <div class="title-heroes">${heroSVG(d.look, 'guerreiro', 72, 'bob')}${heroSVG({ skin: SKIN_TONES[2], hair: HAIR_COLORS[4], outfit: OUTFIT_COLORS[3] }, 'mago', 72, 'bob d1')}${heroSVG({ skin: SKIN_TONES[0], hair: HAIR_COLORS[3], outfit: OUTFIT_COLORS[2] }, 'druida', 72, 'bob d2')}</div>
      <div class="title-menu">
        <button class="btn btn-green btn-big" data-act="ob-start">▶ Novo jogo</button>
        <label class="btn btn-big">Carregar backup<input type="file" accept="application/json,.json" data-change="ob-import" hidden></label>
      </div>
      <p class="muted small">Seus dados ficam salvos apenas neste aparelho.</p>
    </div>`;
  }
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
    body = `<h2>Setores da rotina</h2><p>Quais áreas da sua vida você quer evoluir? Cada setor treina um atributo.</p>
      <div class="sector-pick">${SECTOR_IDS.map((id) => {
        const s = SECTORS[id];
        const on = d.sectors.includes(id);
        return `<button type="button" class="pick ${on ? 'sel' : ''}" data-act="ob-sector" data-id="${id}" style="--c:${s.color}">
          ${icon(s.icon, 24)}<b>${s.name}</b><small>${s.desc}</small>${s.core ? '' : '<em>extra</em>'}</button>`;
      }).join('')}</div>`;
  } else if (d.step === 5) {
    const presets = OBJECTIVE_PRESETS.filter((p) => d.sectors.includes(p.sector));
    body = `<h2>Seus objetivos</h2><p>Escolha objetivos para focar. Cada um já cria missões sugeridas, que você pode editar depois.</p>
      <div class="preset-list">${presets.map((p) => {
        const on = d.presets.includes(p.id);
        return `<button type="button" class="preset ${on ? 'sel' : ''}" data-act="ob-preset" data-id="${p.id}">
          <span class="chk">${on ? '✓' : ''}</span>${icon(SECTORS[p.sector].icon, 16)}
          <span><b>${esc(p.title)}</b><small>${(p.quests || []).map((q) => esc(q.title)).join(' · ')}</small></span></button>`;
      }).join('')}</div>
      <div class="custom-goal"><input id="ob-custom" maxlength="60" placeholder="Objetivo personalizado..."><select id="ob-custom-sector">${d.sectors.map((id) => `<option value="${id}">${SECTORS[id].name}</option>`).join('')}</select>
      <button type="button" class="btn" data-act="ob-custom-add">+</button></div>
      ${d.custom.length ? `<ul class="custom-list">${d.custom.map((c, i) => `<li>${icon(SECTORS[c.sector].icon, 14)} ${esc(c.title)} <button type="button" class="btn-x" data-act="ob-custom-del" data-i="${i}">×</button></li>`).join('')}</ul>` : ''}`;
  } else if (d.step === 6) {
    body = `<h2>Metas iniciais</h2><p>Opcional: ajuda a personalizar os setores.</p>
      ${d.sectors.includes('alimentacao') ? `<label class="field"><span>Meta de água (copos de 250 ml por dia)</span><input name="waterGoal" type="number" min="1" max="30" value="${d.waterGoal}" inputmode="numeric"></label>
      <label class="field"><span>Peso atual (kg)</span><input name="weight" type="number" step="0.1" min="20" max="400" value="${esc(d.weight)}" inputmode="decimal" placeholder="Ex.: 78.5"></label>` : ''}
      ${d.sectors.includes('financeiro') ? `<label class="field"><span>Orçamento mensal de gastos (R$)</span><input name="budget" type="number" min="0" step="1" value="${esc(d.budget)}" inputmode="decimal" placeholder="Ex.: 3000"></label>` : ''}
      ${d.sectors.includes('sono') ? `<label class="field"><span>Meta de sono (horas por noite)</span><input name="sleepGoal" type="number" min="4" max="12" step="0.5" value="${d.sleepGoal}" inputmode="decimal"></label>` : ''}
      <div class="summary panel-inner">
        <p><b>${esc(d.name)}</b>, o ${CLASSES[d.cls].name}</p>
        <p>${d.sectors.length} setores · ${d.presets.length + d.custom.length} objetivos</p>
      </div>`;
  }
  return `<form class="onboarding panel" data-form="ob-step">${stepper()}${body}${nav(d.step === 6 ? 'Começar aventura!' : 'Próximo')}</form>`;
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
actions['ob-sector'] = (el) => {
  const id = el.dataset.id;
  draft.sectors = draft.sectors.includes(id) ? draft.sectors.filter((x) => x !== id) : [...draft.sectors, id];
  draft.sectors.sort((a, b) => SECTOR_IDS.indexOf(a) - SECTOR_IDS.indexOf(b));
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

forms['ob-step'] = (fd) => {
  const d = draft;
  if (d.step === 1) {
    d.name = String(fd.get('name') || '').trim();
    if (!d.name) return;
  }
  if (d.step === 4 && !d.sectors.length) { toast('Escolha pelo menos um setor.', 'bad'); return; }
  if (d.step === 4) d.presets = d.presets.filter((id) => d.sectors.includes(OBJECTIVE_PRESETS.find((p) => p.id === id).sector));
  if (d.step === 5 && !d.presets.length && !d.custom.length) {
    toast('Escolha pelo menos um objetivo para continuar sua jornada.', 'bad');
    return;
  }
  if (d.step === 6) {
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
  state.settings.sectors = [...d.sectors];
  state.settings.waterGoal = Number(d.waterGoal) || 8;
  state.settings.sleepGoal = Number(d.sleepGoal) || 8;
  state.settings.budget = Number(d.budget) || 0;
  state.lastProcessed = todayKey();
  state.createdAt = todayKey();
  applyPresets(d.presets);
  for (const c of d.custom) state.goals.push(newGoal({ title: c.title, sector: c.sector }));
  if (Number(d.weight) > 0) state.weights.push({ date: todayKey(), kg: Number(d.weight) });
  processDays();
  save();
  play('levelup');
  go('hoje');
  openModal(`${modalHead('Perfil criado!', 'trophy')}
    <div class="center">${heroSVG(state.player.look, state.player.cls, 96, 'bob')}</div>
    <p class="center">Sua jornada começa agora, <b>${esc(d.name)}</b>!</p>
    <ul class="tips">${TIPS.slice(0, 4).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <p class="muted small">Dica: no iPhone, toque em Compartilhar › "Adicionar à Tela de Início" para usar como app.</p>
    <div class="row-btns"><button class="btn btn-green" data-act="modal-close">Vamos lá!</button></div>`);
}
