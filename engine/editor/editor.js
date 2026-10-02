// Lair editor: draw the plan, place devices, set entrances, objectives and waves, then release
// the agents and read what happened. The editor only edits the scenario document; every rule
// lives in engine/core and every number in the content pack.
import * as THREE from 'three';
import { Assets } from '../render/assets.js';
import { LairView } from '../render/lairview.js';
import { ENTRANCE_COLOURS } from '../render/level.js';
import { calculateBudget, emptyScenario, goldCost, grid, Layout, nextCell, normaliseScenario, STEP, validateGoldBudget, World } from '../core/index.js';
import { decodeMSADPCM } from '../../vendor/msadpcm.js';

const $ = selector => document.querySelector(selector);
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };
const STORE = 'lair:scenarios/1', DRAFT = 'lair:draft/1';
const MOUNT = { floor: 'No piso', wall: 'Na parede', opposing_walls: 'Entre duas paredes', gate: 'Portal no corredor' };
const PHASES = [['windup', 'Montar'], ['active', 'Agir'], ['winddown', 'Desmontar'], ['recharge', 'Recarga'], ['sabotaged', 'Sabotada']];
const seconds = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' s';
const gold = value => value.toLocaleString('pt-BR');
const priceLabel = def => def.category !== 'trap' ? 'Fora do orçamento' : goldCost(def) === null ? 'Preço desconhecido' : `${gold(def.cost)} de ouro`;

const assets = await new Assets(null).init();
const { content } = assets;
const view = new LairView($('#viewport'), assets);
await view.prepare();

const state = {
  scenario: null, world: null, file: null, tool: 'select', trapType: null, rot: 0,
  selected: null, hover: null, drag: null, moving: null, speed: 1, running: false,
  undo: [], redo: [], logged: 0, sound: true, flashUntil: 0,
};

// ---- scenario lifecycle ---------------------------------------------------------------------

function rebuild({ frame = false } = {}) {
  state.world = new World(content, state.scenario, { seed: 3 });
  state.running = false; state.logged = 0;
  view.setWorld(state.world, { frame });
  $('#log').replaceChildren(); $('#pause').textContent = 'Pausar';
  $('#scenario-name').textContent = state.scenario.name;
  keepDraft();
  refreshOverlay(); renderPanels(); updateStats();
}

function keepDraft() {
  try { localStorage.setItem(DRAFT, JSON.stringify(state.scenario)); } catch { /* storage full or blocked: the draft is a convenience */ }
}

function open(scenario, { file = null, frame = true } = {}) {
  state.scenario = normaliseScenario(scenario); state.file = file;
  state.undo = []; state.redo = []; state.selected = null;
  state.world = null; // the old world must not be read against the new document
  setTool('select');
  rebuild({ frame });
}

/** Every edit goes through here: snapshot for undo, mutate, rebuild. */
function commit(mutate) {
  const next = structuredClone(state.scenario);
  mutate(next);
  const scenario = normaliseScenario(next);
  state.undo.push(JSON.stringify(state.scenario)); if (state.undo.length > 80) state.undo.shift();
  state.redo = [];
  state.scenario = scenario;
  rebuild();
}

function undo(from, to) {
  if (!from.length) return;
  to.push(JSON.stringify(state.scenario));
  state.scenario = normaliseScenario(JSON.parse(from.pop())); state.selected = null;
  rebuild();
}

const saved = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };

function fillScenarioSelect() {
  const select = $('#scenario-select'); select.replaceChildren();
  const refs = el('optgroup', { label: 'Referências' });
  for (const s of assets.scenarios) refs.append(el('option', { value: 'ref:' + s.file, textContent: s.name }));
  const mine = el('optgroup', { label: 'Meus covis' });
  for (const name of Object.keys(saved()).sort()) mine.append(el('option', { value: 'mine:' + name, textContent: name }));
  select.append(refs); if (mine.children.length) select.append(mine);
  select.value = state.file || '';
}

async function load(key) {
  if (key.startsWith('ref:')) open(await assets.scenario(key.slice(4)), { file: key });
  else open(saved()[key.slice(5)], { file: key });
  fillScenarioSelect();
}

// ---- tools ----------------------------------------------------------------------------------

function setTool(tool, trapType = null) {
  state.tool = tool; state.trapType = trapType; state.drag = null;
  if (tool !== 'trap') state.moving = null;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  document.querySelectorAll('.trap').forEach(b => b.classList.toggle('active', tool === 'trap' && b.dataset.type === trapType));
  $('#viewport').className = 'tool-' + tool;
  hint();
  refreshOverlay();
}

function hint(text = null, bad = false) {
  const defaults = {
    select: 'Clique num dispositivo, entrada ou objetivo. R gira, M move, Delete remove. Botão direito orbita, roda aproxima.',
    floor: 'Arraste para abrir um retângulo de piso.', rock: 'Arraste para fechar um retângulo com rocha.',
    trap: 'Clique para posicionar. R gira. Esc termina.', entrance: 'Clique num piso livre para criar uma entrada de agentes.',
    objective: 'Clique num piso livre para criar um objetivo.',
  };
  $('#hint').textContent = text ?? defaults[state.tool]; $('#hint').classList.toggle('bad', bad);
}

/** Top-left cell of a footprint centred on the cursor cell. */
function anchor(type, cell, rot) {
  const { w, d } = content.traps[type].footprint, [W, D] = grid.rotatedSize(w, d, rot);
  return [cell[0] - Math.floor(W / 2), cell[1] - Math.floor(D / 2)];
}

function trial(type, x, z, rot) {
  const scenario = { ...state.scenario, traps: [...state.scenario.traps.filter(t => t.id !== state.moving?.id), { id: '__ghost', type, x, z, rot, enabled: true }] };
  const layout = new Layout(scenario, content), device = layout.devices.find(d => d.id === '__ghost');
  // Moving replaces an existing item; it never spends again, even when the author
  // has lowered the limit below the current construction cost.
  const budgetProblems = !state.moving && content.traps[type].category === 'trap'
    ? layout.budget.problems.filter(p => p.level === 'error') : [];
  const placementProblems = layout.problems.filter(p => p.id === '__ghost' && !p.code?.startsWith('budget_'));
  return { device, valid: Boolean(device?.valid) && !budgetProblems.length,
    reasons: [...budgetProblems, ...placementProblems].map(p => p.text) };
}

function nextId(list, prefix, letters = false) {
  if (letters) { for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!list.some(e => e.id === ch)) return ch; }
  let n = list.length + 1; while (list.some(e => e.id === prefix + n)) n++;
  return prefix + n;
}

function pickAt(cell) {
  const [x, z] = cell, s = state.scenario;
  const entrance = s.entrances.find(e => e.x === x && e.z === z); if (entrance) return { kind: 'entrance', id: entrance.id };
  const objective = s.objectives.find(o => o.x === x && o.z === z); if (objective) return { kind: 'objective', id: objective.id };
  const { layout } = state.world;
  for (const device of [...layout.devices].reverse()) if (device.cells.some(c => c.x === x && c.z === z)) return { kind: 'trap', id: device.id };
  return null;
}

function select(selection) {
  state.selected = selection;
  view.select(selection?.kind === 'trap' ? selection.id : null);
  showTab('selection'); renderSelection(); refreshOverlay();
}

function removeSelected() {
  const sel = state.selected; if (!sel) return;
  commit(s => {
    if (sel.kind === 'trap') s.traps = s.traps.filter(t => t.id !== sel.id);
    else if (sel.kind === 'entrance') { s.entrances = s.entrances.filter(e => e.id !== sel.id); s.waves.forEach(w => { w.groups = w.groups.filter(g => g.entrance !== sel.id); }); }
    else { s.objectives = s.objectives.filter(o => o.id !== sel.id); s.waves.forEach(w => w.groups.forEach(g => { if (g.objective === sel.id) g.objective = 'nearest'; })); }
  });
  select(null);
}

function rotateSelected() {
  if (state.tool === 'trap') { state.rot = (state.rot + 1) & 3; refreshOverlay(); return; }
  const sel = state.selected; if (sel?.kind !== 'trap') return;
  const placed = state.scenario.traps.find(t => t.id === sel.id), def = content.traps[placed.type];
  // Keep the footprint centred on the same spot while it turns.
  const [W, D] = grid.rotatedSize(def.footprint.w, def.footprint.d, placed.rot), rot = (placed.rot + 1) & 3;
  const [W2, D2] = grid.rotatedSize(def.footprint.w, def.footprint.d, rot);
  const x = Math.round(placed.x + W / 2 - W2 / 2), z = Math.round(placed.z + D / 2 - D2 / 2);
  commit(s => Object.assign(s.traps.find(t => t.id === sel.id), { rot, x, z }));
  select(sel);
}

function startMove() {
  const sel = state.selected; if (sel?.kind !== 'trap') return;
  const placed = state.scenario.traps.find(t => t.id === sel.id);
  state.moving = placed; state.rot = placed.rot; setTool('trap', placed.type); state.moving = placed;
  hint('Clique no novo lugar. R gira. Esc cancela.');
}

// ---- pointer --------------------------------------------------------------------------------

const canvas = view.stage.renderer.domElement;
const cellAt = event => { const hit = view.stage.pick(event); return hit ? [Math.floor(hit.x), Math.floor(hit.z)] : null; };
const inMap = cell => cell && cell[0] >= 0 && cell[1] >= 0 && cell[0] < state.scenario.w && cell[1] < state.scenario.h;

canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('pointermove', event => {
  const cell = cellAt(event);
  if (cell && state.hover && cell[0] === state.hover[0] && cell[1] === state.hover[1]) return;
  state.hover = cell; refreshOverlay();
});
canvas.addEventListener('pointerleave', () => { state.hover = null; refreshOverlay(); });
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const cell = cellAt(event); if (!inMap(cell)) return;
  if (state.tool === 'floor' || state.tool === 'rock') { state.drag = { from: cell, to: cell }; canvas.setPointerCapture(event.pointerId); refreshOverlay(); return; }
  if (state.tool === 'select') { select(pickAt(cell)); return; }
  if (state.tool === 'trap') {
    const [x, z] = anchor(state.trapType, cell, state.rot), attempt = trial(state.trapType, x, z, state.rot);
    if (!attempt.valid) { hint(attempt.reasons[0] || 'Não cabe aqui.', true); return; }
    const moving = state.moving, id = moving ? moving.id : nextId(state.scenario.traps, 't');
    commit(s => {
      if (moving) Object.assign(s.traps.find(t => t.id === moving.id), { x, z, rot: state.rot });
      else s.traps.push({ id, type: state.trapType, x, z, rot: state.rot, enabled: true });
    });
    if (moving) { setTool('select'); select({ kind: 'trap', id }); } else { state.selected = { kind: 'trap', id }; view.select(id); renderSelection(); hint(); }
    return;
  }
  if (!state.world.layout.walkable(cell[0], cell[1])) { hint('Escolha um piso livre.', true); return; }
  if (state.tool === 'entrance') {
    const id = nextId(state.scenario.entrances, 'E', true);
    commit(s => {
      s.entrances.push({ id, x: cell[0], z: cell[1], label: 'Entrada ' + id });
      // A new entrance is useful at once: give the first wave a small group from it.
      if (!s.waves.length) s.waves.push({ name: 'Onda 1', groups: [] });
      s.waves[0].groups.push({ entrance: id, objective: 'nearest', agent: 'investigator', level: 1, count: 3, interval: 2.5, delay: 0 });
    });
    setTool('select'); select({ kind: 'entrance', id });
  } else if (state.tool === 'objective') {
    const id = nextId(state.scenario.objectives, 'o');
    commit(s => s.objectives.push({ id, x: cell[0], z: cell[1], label: 'Objetivo ' + (s.objectives.length + 1) }));
    setTool('select'); select({ kind: 'objective', id });
  }
});
canvas.addEventListener('pointerup', event => {
  if (!state.drag) return;
  const cell = cellAt(event); if (inMap(cell)) state.drag.to = cell;
  const { from, to } = state.drag; state.drag = null;
  const x0 = Math.min(from[0], to[0]), x1 = Math.max(from[0], to[0]), z0 = Math.min(from[1], to[1]), z1 = Math.max(from[1], to[1]);
  const tile = state.tool === 'floor' ? 'c' : '.';
  commit(s => { s.floor = s.floor.map((row, z) => z < z0 || z > z1 ? row : row.slice(0, x0) + tile.repeat(x1 - x0 + 1) + row.slice(x1 + 1)); });
});

// ---- overlay --------------------------------------------------------------------------------

function routes() {
  const { world, scenario } = state, { layout } = world, lines = [], seen = new Set();
  for (const wave of scenario.waves) for (const group of wave.groups) {
    const entranceIndex = scenario.entrances.findIndex(e => e.id === group.entrance); if (entranceIndex < 0) continue;
    const from = scenario.entrances[entranceIndex];
    let goal = scenario.objectives.find(o => o.id === group.objective);
    if (!goal && layout.walkable(from.x, from.z)) goal = [...scenario.objectives].sort((a, b) => world.fields.get('o:' + a.id)[layout.index(from.x, from.z)] - world.fields.get('o:' + b.id)[layout.index(from.x, from.z)])[0];
    if (!goal || seen.has(from.id + '>' + goal.id)) continue;
    seen.add(from.id + '>' + goal.id);
    const field = world.fields.get('o:' + goal.id), points = [];
    if (!field) continue;
    let cell = [from.x, from.z];
    for (let guard = 0; guard < 2000 && cell; guard++) { points.push([cell[0] + 0.5, cell[1] + 0.5]); cell = nextCell(layout, field, cell[0], cell[1])?.cell; }
    lines.push({ points, colour: ENTRANCE_COLOURS[entranceIndex % ENTRANCE_COLOURS.length] });
  }
  return lines;
}

function refreshOverlay() {
  if (!state.world) return;
  const { layout } = state.world, cells = [], lines = $('#show-routes').checked ? routes() : [];
  const toCells = indices => indices.map(i => [i % layout.w, Math.floor(i / layout.w)]);
  if ($('#show-zones').checked && state.selected?.kind === 'trap' && state.tool !== 'trap') {
    const device = layout.devices.find(d => d.id === state.selected.id);
    if (device) { cells.push({ list: toCells(device.zone), colour: '#57c7ff', opacity: 0.22 }); cells.push({ list: toCells(device.sensor), colour: '#ffd24a', opacity: 0.3, y: 0.045 }); }
  }
  if (state.drag) {
    const { from, to } = state.drag, list = [];
    for (let z = Math.min(from[1], to[1]); z <= Math.max(from[1], to[1]); z++) for (let x = Math.min(from[0], to[0]); x <= Math.max(from[0], to[0]); x++) list.push([x, z]);
    cells.push({ list, colour: state.tool === 'floor' ? '#9fe08a' : '#ff7a66', opacity: 0.4, y: 1.5 });
  } else if (state.hover && inMap(state.hover)) {
    if (state.tool === 'trap') {
      const [x, z] = anchor(state.trapType, state.hover, state.rot), attempt = trial(state.trapType, x, z, state.rot);
      if (attempt.device) {
        const { device } = attempt;
        if ($('#show-zones').checked) cells.push({ list: toCells(device.zone), colour: '#57c7ff', opacity: 0.2 });
        cells.push({ list: device.cells.map(c => [c.x, c.z]), colour: attempt.valid ? '#8fe07a' : '#ff5f4f', opacity: 0.55, y: 0.2 });
        const [fx, fz] = device.facing, [cx, cz] = device.center;
        lines.push({ points: [[cx, cz], [cx + fx * (Math.max(device.W, device.D) / 2 + 1.2), cz + fz * (Math.max(device.W, device.D) / 2 + 1.2)]], colour: '#ffffff' });
        hint(attempt.valid ? null : attempt.reasons[0], !attempt.valid);
      }
    } else if (state.tool !== 'select') cells.push({ list: [state.hover], colour: '#ffffff', opacity: 0.35, y: state.tool === 'rock' || state.tool === 'floor' ? 1.5 : 0.06 });
  }
  view.level.setOverlay({ cells, lines, grid: $('#show-grid').checked });
}

// ---- panels ---------------------------------------------------------------------------------

function showTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  for (const tab of ['selection', 'waves', 'scenario']) $('#tab-' + tab).hidden = tab !== name;
}

const originTag = text => el('span', { className: 'tag' + (/assumed/.test(text) ? ' assumed' : ''), textContent: /observed/.test(text) ? 'do jogo' : /inferred/.test(text) ? 'inferido' : 'nosso', title: text });

function describeOp(op) {
  const stat = { health: 'vitalidade', resolve: 'determinação', skill: 'perícia' }[op.stat];
  switch (op.op) {
    case 'damage': return `Tira ${op.amount} de ${stat}`;
    case 'dot': return op.perSecond < 0 ? `Devolve ${-op.perSecond} de ${stat} por segundo` : `Tira ${op.perSecond} de ${stat} por segundo`;
    case 'status': return `Deixa ${({ burning: 'queimando', poisoned: 'envenenado', stung: 'picado' })[op.kind] || op.kind}: ${op.perSecond} de ${stat}/s por ${op.duration} s`;
    case 'launch': return `Lança ${op.distance} células ${op.dir === 'diagonal' ? 'na diagonal' : 'à frente'}`;
    case 'push': return `Sopra a ${op.speed} células/s enquanto estiver na zona`;
    case 'pull': return op.to === 'front' ? `Puxa até a frente do dispositivo` : 'Atrai até o dispositivo';
    case 'suspend': return 'Suspende numa bolha (empurrões valem em dobro)';
    case 'slide': return `Faz deslizar a ${op.speed} células/s na direção em que vinha`;
    case 'sink': return 'Tira o agente de cena enquanto age';
    case 'extinguish': return 'Apaga fogo';
    case 'toll': return `Cobra ${op.gold} de ouro`;
    default: return op.op;
  }
}

function renderSelection() {
  const box = $('#tab-selection'); box.replaceChildren();
  const sel = state.selected, s = state.scenario;
  if (!sel) {
    box.append(el('p', { className: 'empty', textContent: 'Nada selecionado. Escolha uma armadilha na lista à esquerda para posicionar, ou clique em algo na planta.' }));
    box.append(el('h2', { textContent: 'Agentes' }));
    for (const [id, type] of Object.entries(content.agents.types)) {
      box.append(el('p', {}, el('span', { className: 'swatch', style: `background:${type.color}` }), el('b', { textContent: type.pt }), ` · ${type.role} Anda a ${type.speed.toFixed(2)} células/s.`));
    }
    const table = el('dl', { className: 'kv' });
    for (const [level, tier] of Object.entries(content.agents.levels)) table.append(el('dt', { textContent: tier.label }), el('dd', { textContent: `vitalidade ${tier.health} · determinação ${tier.resolve} · perícia ${tier.skill}` }));
    box.append(table, el('div', { className: 'origin', textContent: 'Tipos e seis qualidades vêm do pacote do jogo; os atributos são nossos (os do jogo ainda não foram decodificados). Multiplicadores por tipo aparecem ao criar um grupo.' }));
    return;
  }
  if (sel.kind === 'trap') {
    const placed = s.traps.find(t => t.id === sel.id); if (!placed) return;
    const def = content.traps[placed.type], d = def.timing.interaction || def.timing;
    const runtime = state.world.traps.find(t => t.id === sel.id);
    box.append(el('small', { textContent: (MOUNT[def.mount] || '').toUpperCase() }), el('h3', { textContent: def.pt }), el('p', { textContent: def.role }));
    if (def.description && def.category === 'trap') box.append(el('div', { className: 'origin', textContent: `${def.name}: ${def.description}` }));
    const problems = state.world.layout.problems.filter(p => p.id === sel.id);
    if (problems.length) box.append(el('ul', { className: 'problems' }, ...problems.map(p => el('li', { textContent: p.text }))));
    const row = el('div', { className: 'row' });
    row.append(el('button', { textContent: 'Girar (R)', onclick: rotateSelected }), el('button', { textContent: 'Mover (M)', onclick: startMove }), el('button', { textContent: 'Remover', onclick: removeSelected }));
    const power = el('label', { className: 'row' }, el('input', { type: 'checkbox', checked: placed.enabled !== false, onchange: e => { commit(sc => { sc.traps.find(t => t.id === sel.id).enabled = e.target.checked; }); select(sel); } }), ' Ligada');
    box.append(row, power);
    const facts = el('dl', { className: 'kv' });
    facts.append(el('dt', { textContent: 'Base' }), el('dd', {}, `${def.footprint.w} × ${def.footprint.d} células `, originTag(def.footprint.origin)));
    for (const [key, label] of PHASES) facts.append(el('dt', { textContent: label }), el('dd', {}, seconds(key === 'recharge' || key === 'sabotaged' ? def.timing[key] : d[key]) + ' ', originTag(key === 'recharge' || key === 'sabotaged' ? def.timing.origin : (def.timing.interaction?.origin || def.timing.origin))));
    facts.append(el('dt', { textContent: 'Alvos' }), el('dd', { textContent: def.targets === 'single' ? 'um agente' : 'todos na zona' + (def.late ? ', inclusive quem chega depois' : '') }));
    facts.append(el('dt', { textContent: 'Desarmar' }), el('dd', {}, def.skill == null ? 'não pode ser desarmada ' : `perícia ${def.skill} `, originTag('assumed')));
    facts.append(el('dt', { textContent: 'Custo de montagem' }), el('dd', {}, priceLabel(def),
      ...(def.category === 'trap' && goldCost(def) !== null ? [' ', originTag(def.costSource?.origin || 'unknown')] : [])));
    if (runtime) facts.append(el('dt', { textContent: 'Estado' }), el('dd', { id: 'trap-state', textContent: '' }));
    box.append(facts);
    if (def.ops.length) { box.append(el('h2', { textContent: 'O que faz' })); const list = el('ul', { className: 'problems' }); for (const op of def.ops) list.append(el('li', { className: 'warn', textContent: describeOp(op) })); box.append(list); }
    box.append(el('div', { className: 'origin', textContent: 'Tempos de fase lidos do registro do jogo. Distância, velocidade, dano e custo de perícia são números nossos, guardados em behaviours.json.' }));
    return;
  }
  const list = sel.kind === 'entrance' ? s.entrances : s.objectives, point = list.find(p => p.id === sel.id); if (!point) return;
  box.append(el('small', { textContent: sel.kind === 'entrance' ? 'ENTRADA DE AGENTES' : 'OBJETIVO' }), el('h3', { textContent: `${sel.kind === 'entrance' ? 'Entrada ' + point.id : point.label || point.id}` }));
  box.append(el('label', { className: 'field', textContent: 'Nome' }), el('input', { type: 'text', value: point.label || '', onchange: e => { commit(sc => { (sel.kind === 'entrance' ? sc.entrances : sc.objectives).find(p => p.id === sel.id).label = e.target.value.trim(); }); select(sel); } }));
  box.append(el('p', { textContent: sel.kind === 'entrance' ? 'Os grupos que entram por aqui são definidos na aba Ondas.' : 'Cada agente que chega aqui custa um ponto de integridade.' }));
  if (sel.kind === 'entrance') box.append(el('div', { className: 'row' }, el('button', { textContent: 'Ver ondas', onclick: () => showTab('waves') })));
  box.append(el('div', { className: 'row' }, el('button', { textContent: 'Remover', onclick: removeSelected })));
}

function renderWaves() {
  const box = $('#tab-waves'); box.replaceChildren();
  const s = state.scenario;
  if (!s.entrances.length) box.append(el('p', { className: 'empty', textContent: 'Crie uma entrada (ferramenta Entrada) para montar ondas.' }));
  const option = (value, text, current) => el('option', { value, textContent: text, selected: String(value) === String(current) });
  s.waves.forEach((wave, wi) => {
    const card = el('div', { className: 'wave' });
    const head = el('div', { className: 'wave-head' });
    head.append(
      el('input', { type: 'text', value: wave.name || '', ariaLabel: 'Nome da onda', onchange: e => commit(sc => { sc.waves[wi].name = e.target.value; }) }),
      el('input', { type: 'number', min: 0, step: 5, value: wave.at || 0, title: 'Início em segundos; 0 = logo depois da onda anterior', ariaLabel: 'Início da onda', onchange: e => commit(sc => { const at = +e.target.value; if (at > 0) sc.waves[wi].at = at; else delete sc.waves[wi].at; }) }),
      el('button', { className: 'icon', textContent: '▶', title: 'Soltar só esta onda', onclick: () => run(wi) }),
      el('button', { className: 'icon', textContent: '✕', title: 'Remover onda', onclick: () => commit(sc => sc.waves.splice(wi, 1)) }));
    card.append(head);
    wave.groups.forEach((group, gi) => {
      const set = (key, value) => commit(sc => { sc.waves[wi].groups[gi][key] = value; });
      const row = el('div', { className: 'group' });
      const entrance = el('select', { ariaLabel: 'Entrada', onchange: e => set('entrance', e.target.value) }, ...s.entrances.map(e => option(e.id, `Entrada ${e.id}${e.label ? ' · ' + e.label : ''}`, group.entrance)));
      const objective = el('select', { ariaLabel: 'Objetivo', onchange: e => set('objective', e.target.value) }, option('nearest', 'Objetivo mais próximo', group.objective), ...s.objectives.map(o => option(o.id, '→ ' + (o.label || o.id), group.objective)));
      const agent = el('select', { ariaLabel: 'Tipo de agente', onchange: e => set('agent', e.target.value) }, ...Object.entries(content.agents.types).map(([id, t]) => option(id, t.pt, group.agent)));
      const level = el('select', { ariaLabel: 'Nível', onchange: e => set('level', /^\d+$/.test(e.target.value) ? +e.target.value : e.target.value) }, ...Object.entries(content.agents.levels).map(([id, t]) => option(id, t.label, group.level)));
      const number = (key, label, step, min) => el('label', {}, label, el('input', { type: 'number', min, step, value: group[key] ?? 0, onchange: e => set(key, Math.max(min, +e.target.value || 0)) }));
      const nums = el('div', { className: 'nums' }, number('count', 'Quantos', 1, 1), number('interval', 'Intervalo s', 0.5, 0.5), number('delay', 'Atraso s', 1, 0),
        el('button', { className: 'icon', textContent: '✕', title: 'Remover grupo', onclick: () => commit(sc => sc.waves[wi].groups.splice(gi, 1)) }));
      row.append(entrance, objective, agent, level, nums);
      const type = content.agents.types[group.agent], tier = content.agents.levels[group.level];
      if (type && tier) row.append(el('div', { className: 'origin', style: 'grid-column:1/-1;margin:2px 0 0', textContent: `vitalidade ${Math.round(tier.health * type.mult.health)} · determinação ${Math.round(tier.resolve * type.mult.resolve)} · perícia ${Math.round(tier.skill * type.mult.skill)}` }));
      card.append(row);
    });
    card.append(el('button', { className: 'add', textContent: '+ Grupo', disabled: !s.entrances.length, onclick: () => commit(sc => sc.waves[wi].groups.push({ entrance: s.entrances[0].id, objective: 'nearest', agent: 'investigator', level: 1, count: 3, interval: 2.5, delay: 0 })) }));
    box.append(card);
  });
  box.append(el('button', { textContent: '+ Onda', onclick: () => commit(sc => sc.waves.push({ name: 'Onda ' + (sc.waves.length + 1), groups: [] })) }));
}

function renderScenario() {
  const box = $('#tab-scenario'); box.replaceChildren();
  const s = state.scenario, { problems } = state.world.layout;
  box.append(el('label', { className: 'field', textContent: 'Nome do covil' }), el('input', { type: 'text', value: s.name, style: 'width:100%', onchange: e => commit(sc => { sc.name = e.target.value.trim() || 'Covil'; }) }));
  if (s.note) box.append(el('div', { className: 'origin', textContent: s.note }));
  const size = el('div', { className: 'row' });
  const w = el('input', { type: 'number', min: 8, max: 160, value: s.w, ariaLabel: 'Largura' }), h = el('input', { type: 'number', min: 8, max: 160, value: s.h, ariaLabel: 'Profundidade' });
  size.append(w, el('span', { textContent: '×' }), h, el('button', { textContent: 'Redimensionar', onclick: () => { commit(sc => { sc.w = +w.value; sc.h = +h.value; }); view.stage.frame(state.scenario.w, state.scenario.h); } }));
  box.append(el('label', { className: 'field', textContent: 'Tamanho em células' }), size);
  box.append(el('label', { className: 'field', textContent: 'Integridade (fugas toleradas)' }), el('input', { type: 'number', min: 1, max: 99, value: s.rules.integrity, onchange: e => commit(sc => { sc.rules.integrity = Math.max(1, +e.target.value || 10); }) }));
  const budget = state.world.layout.budget;
  box.append(el('label', { className: 'row budget-toggle' }, el('input', { id: 'gold-limited', type: 'checkbox', checked: budget.limited,
    onchange: e => commit(sc => { sc.rules.goldBudget = e.target.checked ? Math.ceil(budget.knownSpent) : null; }) }), 'Limitar ouro'));
  box.append(el('label', { className: 'field', htmlFor: 'gold-budget', textContent: 'Orçamento de ouro' }), el('input', {
    id: 'gold-budget', type: 'number', min: 0, step: 1, value: budget.budget ?? Math.ceil(budget.knownSpent), disabled: !budget.limited,
    onchange: e => {
      const value = e.target.value.trim() === '' ? NaN : Number(e.target.value);
      try { validateGoldBudget(value); }
      catch (error) { hint(error.message, true); e.target.value = state.scenario.rules.goldBudget; return; }
      commit(sc => { sc.rules.goldBudget = value; });
    },
  }));
  box.append(el('div', { className: 'origin', textContent: 'O limite vale para montar este covil. Remover uma armadilha libera seu custo; mover, girar e desligar não alteram o gasto. Ouro cobrado no pedágio fica só no placar da simulação.' }));
  const kinds = new Set(s.traps.map(t => t.type));
  const facts = el('dl', { className: 'kv' });
  facts.append(el('dt', { textContent: 'Dispositivos' }), el('dd', { textContent: `${s.traps.length} (${kinds.size} tipos)` }), el('dt', { textContent: 'Entradas' }), el('dd', { textContent: String(s.entrances.length) }),
    el('dt', { textContent: 'Objetivos' }), el('dd', { textContent: String(s.objectives.length) }), el('dt', { textContent: 'Agentes nas ondas' }), el('dd', { textContent: String(s.waves.reduce((n, wv) => n + wv.groups.reduce((m, g) => m + (g.count | 0), 0), 0)) }));
  box.append(facts, el('h2', { textContent: 'Conferência' }));
  if (!problems.length) box.append(el('p', { className: 'ok', textContent: 'Planta válida: tudo no lugar e todas as entradas alcançam os objetivos.' }));
  else box.append(el('ul', { className: 'problems' }, ...problems.map(p => el('li', { className: p.level === 'warn' ? 'warn' : '', textContent: p.text, onclick: () => { if (p.id && s.traps.some(t => t.id === p.id)) select({ kind: 'trap', id: p.id }); } }))));
  box.append(el('div', { className: 'row' }, el('button', { textContent: 'Desfazer', disabled: !state.undo.length, onclick: () => undo(state.undo, state.redo) }), el('button', { textContent: 'Refazer', disabled: !state.redo.length, onclick: () => undo(state.redo, state.undo) })));
}

function renderBudget() {
  const budget = state.world.layout.budget, box = $('#budget-summary');
  box.classList.toggle('bad', budget.blocked);
  const spent = budget.spent === null ? `${gold(budget.knownSpent)} + ?` : gold(budget.spent);
  const remaining = budget.limited ? budget.remaining === null ? 'Desconhecido' : gold(budget.remaining) : 'Sem limite';
  box.replaceChildren(el('h2', { textContent: 'Ouro do covil' }), el('dl', { className: 'kv' },
    el('dt', { textContent: 'Gasto' }), el('dd', { id: 'gold-spent', textContent: spent }),
    el('dt', { textContent: 'Saldo' }), el('dd', { id: 'gold-remaining', textContent: remaining }),
    el('dt', { textContent: 'Limite' }), el('dd', { id: 'gold-limit', textContent: budget.limited ? gold(budget.budget) : 'Sem limite' })));
  if (budget.blocked) box.append(el('p', { textContent: budget.unknown.length ? 'Preço desconhecido: confira o cenário.' : 'Saldo insuficiente para soltar ondas.' }));
}

function renderPanels() { renderSelection(); renderWaves(); renderScenario(); renderBudget(); }

// ---- palette --------------------------------------------------------------------------------

function buildPalette() {
  const box = $('#trap-list');
  const groups = [['floor', 'No piso'], ['wall', 'Na parede'], ['opposing_walls', 'Entre duas paredes'], ['gate', 'Portais']];
  const defs = Object.values(content.traps);
  $('#trap-count').textContent = `· ${defs.filter(d => d.category === 'trap').length}`;
  for (const [mount, label] of groups) {
    box.append(el('h4', { textContent: label }));
    for (const def of defs.filter(d => d.mount === mount).sort((a, b) => a.pt.localeCompare(b.pt))) {
      const button = el('button', { className: 'trap', title: def.role, onclick: () => { state.rot = 0; setTool('trap', def.id); } },
        el('div', { className: 'thumb' }), el('span', {}, def.pt,
          el('em', { textContent: `${def.footprint.w}×${def.footprint.d} · recarga ${def.timing.recharge} s` }), el('em', { className: 'price', textContent: priceLabel(def) })));
      button.dataset.type = def.id; box.append(button);
    }
  }
  thumbnails();
}

// Thumbnails are rendered with the main renderer into a small target, one device at a time.
async function thumbnails() {
  const size = 96, target = new THREE.WebGLRenderTarget(size, size);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight('#ffffff', '#6a7670', 3));
  const sun = new THREE.DirectionalLight('#fff2d0', 3); sun.position.set(4, 8, 7); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100), renderer = view.stage.renderer, pixels = new Uint8Array(size * size * 4);
  const canvas2 = document.createElement('canvas'); canvas2.width = canvas2.height = size; const ctx = canvas2.getContext('2d');
  for (const def of Object.values(content.traps)) {
    try {
      const name = def.view.models[0]; await assets.load(name);
      const model = assets.clone(name); model.scale.z = -1; scene.add(model);
      const box = new THREE.Box3().setFromObject(model); box.min.y = Math.max(box.min.y, -0.2);
      const centre = box.getCenter(new THREE.Vector3()), extent = Math.max(...box.getSize(new THREE.Vector3()).toArray());
      camera.position.copy(centre).add(new THREE.Vector3(extent * 0.9, extent * 1.15, extent * 1.3)); camera.lookAt(centre);
      renderer.setRenderTarget(target); renderer.setClearColor('#1b2224', 1); renderer.clear(); renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels); renderer.setRenderTarget(null);
      const image = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) for (let c = 0; c < 4; c++) {
        const v = pixels[((size - 1 - y) * size + x) * 4 + c];
        image.data[(y * size + x) * 4 + c] = c === 3 ? 255 : Math.round(255 * Math.pow(v / 255, 1 / 2.2));
      }
      ctx.putImageData(image, 0, 0); scene.remove(model);
      const button = document.querySelector(`.trap[data-type="${def.id}"]`);
      button?.querySelector('.thumb')?.replaceWith(el('img', { alt: '', src: canvas2.toDataURL() }));
    } catch (error) { console.warn('Miniatura', def.id, error); }
    await new Promise(requestAnimationFrame);
  }
  target.dispose();
}

// ---- simulation, log, sound -----------------------------------------------------------------

function run(waveIndex = null) {
  const { world } = state;
  const budget = calculateBudget(state.scenario, content);
  if (budget.blocked) { hint(budget.problems.find(p => p.level === 'error').text, true); return false; }
  if (waveIndex === null) { world.reset(); view.clearAgents(); $('#log').replaceChildren(); state.logged = 0; if (!world.startRun()) return false; }
  else if (world.startWave(waveIndex) === false) return false;
  world.paused = false; state.running = true; $('#pause').textContent = 'Pausar';
  if (state.sound) audio.unlock();
  return true;
}

function reset() { state.world.reset(); view.clearAgents(); state.running = false; state.logged = 0; $('#log').replaceChildren(); updateStats(); }

function flash(text) { $('#flash').textContent = text; $('#flash').style.opacity = '1'; state.flashUntil = performance.now() + 1700; }

const audio = {
  context: null, buffers: new Map(), playing: 0, decoded: 0,
  unlock() { this.context ??= new AudioContext(); this.context.resume(); },
  async play(path) {
    if (!state.sound || !this.context || this.playing > 5) return;
    if (!this.buffers.has(path)) {
      this.buffers.set(path, fetch('/library/' + path).then(r => r.arrayBuffer()).then(async bytes => {
        try { return await this.context.decodeAudioData(bytes.slice(0)); } catch {
          const pcm = decodeMSADPCM(bytes), buffer = this.context.createBuffer(pcm.channels.length, pcm.frames, pcm.sampleRate);
          pcm.channels.forEach((channel, i) => buffer.copyToChannel(channel, i)); return buffer;
        }
      }).catch(() => null));
    }
    const fresh = !this.buffers.get(path).counted;
    const buffer = await this.buffers.get(path); if (!buffer) return;
    if (fresh && !this.buffers.get(path).counted) { this.buffers.get(path).counted = true; this.decoded++; }
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    gain.gain.value = 0.26; source.buffer = buffer; source.connect(gain).connect(this.context.destination);
    this.playing++; source.onended = () => this.playing--; source.start(); source.stop(this.context.currentTime + Math.min(3.5, buffer.duration));
  },
};

function logEvents() {
  const { world } = state, name = kind => content.traps[kind]?.pt || kind;
  const agentName = id => { const a = world.agents[id - 1]; return a ? `${content.agents.types[a.type].pt} ${a.level === 'super' ? 'Super' : 'N' + a.level} #${id}` : '#' + id; };
  while (state.logged < world.events.length) {
    const e = world.events[state.logged++];
    let text = null, cls = '';
    switch (e.type) {
      case 'wave': text = `${e.name || 'Onda'}: ${e.agents} agentes${e.at > e.t + 0.5 ? ` a partir de ${Math.round(e.at)} s` : ' a caminho'}`; break;
      case 'fire': text = `${name(e.kind)} disparou em ${agentName(e.by)}`; { const sound = content.traps[e.kind]?.view.audio.fire; if (sound) audio.play(sound.path); } break;
      case 'combo': text = `COMBO ×${e.count} em ${agentName(e.agent)}: ${e.traps.map(name).join(' → ')}`; cls = 'combo'; flash(`COMBO ×${e.count}`); break;
      case 'kill': text = `${agentName(e.agent)} neutralizado${e.by ? ' por ' + name(e.by) : ''}`; cls = 'kill'; break;
      case 'desert': text = `${agentName(e.agent)} perdeu a determinação e desistiu`; cls = 'kill'; break;
      case 'escape': text = `${agentName(e.agent)} chegou a ${state.scenario.objectives.find(o => o.id === e.goal)?.label || 'o objetivo'} · integridade ${e.integrity}`; cls = 'escape'; break;
      case 'disarm': text = `${agentName(e.agent)} desarmou ${name(e.kind)} (perícia restante ${Math.round(e.skillLeft)})`; cls = 'escape'; break;
      case 'toll': text = `${agentName(e.agent)} pagou ${e.gold} de ouro no pedágio`; break;
      case 'runEnd': text = `Fim: ${e.killed + e.deserted} neutralizados, ${e.escaped} fugas, melhor combo ${e.bestCombo || '—'}`; cls = 'combo'; flash(e.escaped ? `${e.escaped} FUGAS` : 'COVIL INTACTO'); break;
    }
    if (text) $('#log').prepend(el('li', { className: cls, textContent: `${e.t.toFixed(1).replace('.', ',')} s · ${text}` }));
  }
  while ($('#log').children.length > 120) $('#log').lastChild.remove();
}

const TRAP_STATE = { idle: 'pronta', off: 'desligada', windup: 'montando', active: 'agindo', winddown: 'desmontando', recharge: 'recarregando', sabotaged: 'sabotada' };
function updateStats() {
  const { world } = state, st = world.stats;
  $('#stat-integrity').textContent = `${st.integrity} / ${state.scenario.rules.integrity}`;
  $('#stat-out').textContent = String(st.killed + st.deserted); $('#stat-escaped').textContent = String(st.escaped);
  $('#stat-combo').textContent = st.bestCombo ? '×' + st.bestCombo : '—';
  $('#clock').textContent = world.time.toFixed(1).replace('.', ',') + ' s';
  const node = $('#trap-state');
  if (node && state.selected?.kind === 'trap') {
    const trap = world.traps.find(t => t.id === state.selected.id);
    if (trap) node.textContent = TRAP_STATE[trap.state] + (trap.state === 'recharge' || trap.state === 'sabotaged' ? ` (${Math.ceil(trap.until - world.time)} s)` : '') + (trap.fired ? ` · ${trap.fired} disparo${trap.fired > 1 ? 's' : ''}` : '');
  }
}

let previous = performance.now(), accumulator = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const { world } = state;
  accumulator += Math.min((now - previous) / 1000, 0.1) * state.speed; previous = now;
  let stepped = false;
  while (accumulator >= STEP) { if (state.running) { world.step(); stepped = true; } accumulator -= STEP; }
  if (stepped) { logEvents(); updateStats(); if (world.ended) state.running = false; }
  if (now > state.flashUntil) $('#flash').style.opacity = '0';
  view.sync();
}

// ---- chrome ---------------------------------------------------------------------------------

document.querySelectorAll('.tool').forEach(b => { b.onclick = () => setTool(b.dataset.tool); });
document.querySelectorAll('.tabs button').forEach(b => { b.onclick = () => showTab(b.dataset.tab); });
document.querySelectorAll('.speed button').forEach(b => { b.onclick = () => { state.speed = +b.dataset.speed; document.querySelectorAll('.speed button').forEach(o => o.classList.toggle('active', o === b)); }; });
$('#run').onclick = () => run(); $('#reset').onclick = reset;
$('#pause').onclick = () => { state.world.paused = !state.world.paused; $('#pause').textContent = state.world.paused ? 'Continuar' : 'Pausar'; };
$('#sound').onclick = () => { state.sound = !state.sound; $('#sound').textContent = state.sound ? 'Som ligado' : 'Som desligado'; if (state.sound) audio.unlock(); };
const setView = mode => { view.stage.setMode(mode); view.level.setLabelMode(mode === 'plan'); $('#view-plan').classList.toggle('active', mode === 'plan'); $('#view-persp').classList.toggle('active', mode !== 'plan'); };
$('#view-plan').onclick = () => setView('plan'); $('#view-persp').onclick = () => setView('perspective');
for (const id of ['#show-routes', '#show-zones', '#show-grid']) $(id).onchange = refreshOverlay;
$('#tall-walls').onchange = e => { view.level.wallHeight = e.target.checked ? 3 : 1.4; view.setWorld(state.world); refreshOverlay(); };
$('#scenario-select').onchange = e => load(e.target.value);
$('#new').onclick = () => {
  const s = emptyScenario(48, 32, 'Novo covil');
  s.floor = s.floor.map((row, z) => z >= 12 && z < 16 ? row.slice(0, 4) + 'c'.repeat(40) + row.slice(44) : row);
  s.entrances.push({ id: 'A', x: 4, z: 13, label: 'Entrada A' }); s.objectives.push({ id: 'o1', x: 43, z: 14, label: 'Cofre' });
  s.waves = [{ name: 'Onda 1', groups: [{ entrance: 'A', objective: 'o1', agent: 'investigator', level: 1, count: 3, interval: 2.5, delay: 0 }] }];
  open(s); fillScenarioSelect();
};
$('#save').onclick = () => {
  const name = prompt('Nome para guardar este covil:', state.scenario.name); if (!name) return;
  state.scenario.name = name.trim();
  const all = saved(); all[state.scenario.name] = state.scenario;
  keepDraft();
  try { localStorage.setItem(STORE, JSON.stringify(all)); state.file = 'mine:' + state.scenario.name; fillScenarioSelect(); $('#scenario-name').textContent = state.scenario.name; flash('COVIL SALVO'); } catch { hint('Não foi possível salvar neste navegador. Use Exportar.', true); }
};
$('#export').onclick = () => {
  const blob = new Blob([JSON.stringify(state.scenario, null, 1)], { type: 'application/json' });
  const link = el('a', { href: URL.createObjectURL(blob), download: state.scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json' }); link.click(); URL.revokeObjectURL(link.href);
};
$('#import').onclick = () => $('#import-file').click();
$('#import-file').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try { open(JSON.parse(await file.text())); fillScenarioSelect(); } catch (error) { hint('Arquivo não reconhecido: ' + error.message, true); }
  e.target.value = '';
};

window.addEventListener('keydown', event => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  const key = event.key.toLowerCase(), mod = event.metaKey || event.ctrlKey;
  if (mod && key === 'z') { event.preventDefault(); if (event.shiftKey) undo(state.redo, state.undo); else undo(state.undo, state.redo); return; }
  if (mod && key === 's') { event.preventDefault(); $('#save').click(); return; }
  if (mod) return;
  const tools = { v: 'select', b: 'floor', e: 'rock', n: 'entrance', o: 'objective' };
  if (tools[key]) setTool(tools[key]);
  else if (key === 'r') rotateSelected();
  else if (key === 'm') startMove();
  else if (key === 'delete' || key === 'backspace') { event.preventDefault(); removeSelected(); }
  else if (key === 'escape') { if (state.tool !== 'select') setTool('select'); else select(null); }
  else if (key === ' ') { event.preventDefault(); $('#pause').click(); }
  else if (key === 'enter') { event.preventDefault(); run(); }
  else if (key === 'p') setView(view.stage.mode === 'plan' ? 'perspective' : 'plan');
});

// ---- start ----------------------------------------------------------------------------------

buildPalette();
let draft = null;
try { draft = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch { draft = null; }
const wanted = new URLSearchParams(location.search).get('cenario');
if (wanted) await load('ref:' + wanted + '.json');
else if (draft) { try { open(draft); } catch { await load('ref:espinha.json'); } } else await load('ref:espinha.json');
fillScenarioSelect(); setView('perspective');
$('#loading').remove();
requestAnimationFrame(frame);

// Development surface for scripted verification. The editor itself is driven by ordinary input.
window.Lair = {
  ready: true, content, view,
  get world() { return state.world; }, get scenario() { return state.scenario; }, get state() { return state; },
  gpu: view.stage.gpu, load, run, reset, setTool, select,
  snapshot: () => state.world.snapshot(),
  /** Page coordinates of the centre of a cell, for real pointer input from a test. */
  screenOf(x, z) {
    const point = new THREE.Vector3(x + 0.5, 0, z + 0.5).project(view.stage.camera), box = canvas.getBoundingClientRect();
    return [box.left + (point.x + 1) / 2 * box.width, box.top + (1 - point.y) / 2 * box.height];
  },
  advance(secondsToRun) { state.world.advance(secondsToRun); logEvents(); updateStats(); view.sync(); return state.world.snapshot(); },
  get loading() { return view.loading; },
  get audio() { return { enabled: state.sound, context: audio.context?.state || null, requested: audio.buffers.size, decoded: audio.decoded }; },
};
