// Core gate: `node engine/tests/run.mjs`. Exercises whole trajectories, not single calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { grid, Layout, normaliseScenario, STEP, World } from '../core/index.js';
import { content, corridor, plan, ROOT, world } from './helpers.mjs';
import { wallPieces, WALL_MODELS } from '../render/shell.js';
import { registerEconomyTests } from './economy.mjs';

const results = [];
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const equal = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const near = (a, b, tolerance, message) => { checks++; assert.ok(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`); };
function test(name, body) {
  const before = checks;
  try { body(); results.push({ name, pass: true, checks: checks - before }); } catch (error) {
    results.push({ name, pass: false, checks: checks - before, error: String(error.message).slice(0, 400) });
  }
}
const group = (agent, extra = {}) => ({ entrance: 'A', objective: 'o1', agent, level: 1, count: 1, interval: 2, delay: 0, ...extra });
const until = (w, predicate, limit = 240) => { while (w.time < limit && !predicate()) w.step(); return predicate(); };
const types = events => events.map(e => e.type);

registerEconomyTests({ test, ok, equal, content, plan, corridor, World, Layout, normaliseScenario });

test('kit de paredes: cantos internos, externos e trechos de uma célula nas quatro orientações', () => {
  const pieces = rows => wallPieces(new Layout(plan(rows), content));
  const room = pieces(['.......', '.#####.', '.#####.', '.#####.', '.#####.', '.......']);
  equal(room.length, 18, 'um painel por aresta do perímetro');
  equal(room.filter(p => p.model.includes('corner_in')).length, 8, 'duas faces por canto da sala');
  equal(room.filter(p => p.model.includes('straight')).length, 10, 'restante reto');
  const island = pieces(['........', '.######.', '.######.', '.##..##.', '.##..##.', '.######.', '.######.', '........']);
  equal(island.filter(p => p.model.includes('corner_out')).length, 8, 'duas faces por canto da ilha de rocha');
  equal(pieces(['...', '.#.', '...']).map(p => p.model), Array(4).fill('corridor_wall_corner_in_both'), 'célula isolada: uma peça de dois cantos por face');
  // Enumerate tiny authors' plans, then rotate each complete plan. The selected
  // native variant must rotate with the edge rather than flip left and right.
  const used = new Set();
  for (let mask = 1; mask < 512; mask++) {
    const rows = Array.from({ length: 3 }, (_, z) => Array.from({ length: 3 }, (_, x) => mask & (1 << (z * 3 + x)) ? '#' : '.').join(''));
    const rotated = Array.from({ length: 3 }, (_, z) => Array.from({ length: 3 }, (_, x) => rows[x][2 - z]).join(''));
    const before = pieces(rows), after = pieces(rotated);
    before.forEach(p => used.add(p.model));
    equal(before.map(p => [p.z, 2 - p.x, (p.rot + 1) % 4, p.model].join(':')).sort(),
      after.map(p => [p.x, p.z, p.rot, p.model].join(':')).sort(), 'topologia gira junto com a planta ' + mask);
  }
  equal([...used].sort(), [...WALL_MODELS].sort(), 'todas as nove variantes exercitadas');
});

test('custos: 22 valores conferidos nos bytes FNTR e ventilador recuperado com origem', () => {
  for (const def of Object.values(content.traps).filter(d => d.category === 'trap')) {
    const source = def.costSource;
    const raw = fs.readFileSync(path.resolve(ROOT, '../../../libraries/evil-genius-2', def.source.file));
    equal(raw.readUInt32LE(source.offset), def.cost, def.id + ': custo é o campo nativo');
    equal(raw.subarray(source.offset, source.offset + 4).toString('hex'), source.bytes, def.id + ': bytes registrados');
  }
  equal(content.traps.FanTrap.cost, 4000, 'ventilador');
  ok(content.traps.FanTrap.costSource.origin.startsWith('inferred:'), 'inferência explicitada');
  equal([content.traps.Hopscotch_trap.cost, content.traps.HunterSnare_Trap.cost], [0, 0], 'zero não é ausência');
});

test('vão de porta: quatro rotações, passagem livre, sem captura ou arrombamento', () => {
  for (let rot = 0; rot < 4; rot++) {
    let rows = corridor(24, 4);
    if (!(rot & 1)) rows = Array.from({ length: rows[0].length }, (_, z) => rows.map(row => row[z]).join(''));
    const s = plan(rows, { traps: [{ type: 'Doorway', x: rot & 1 ? 10 : 1, z: rot & 1 ? 1 : 10, rot }], waves: [{ name: 'Teste', groups: [group('investigator')] }] });
    const w = new World(content, s);
    equal(w.layout.problems, [], 'vão entre paredes ' + rot);
    equal(w.layout.devices[0].sensor, [], 'vão não captura agentes');
    w.startRun(); ok(until(w, () => w.ended), 'atravessa e termina');
    equal(w.stats.escaped, 1, 'agente chega ao objetivo');
    equal(w.traps[0].fired, 0, 'sem interação de porta/armadilha');
  }
});

test('grade: rotação de footprint, direção e células à frente', () => {
  equal(grid.rotatedSize(2, 4, 1), [4, 2], 'tamanho girado');
  equal(grid.localToOffset(0, 0, 2, 4, 0), [0, 0], 'rot 0');
  equal(grid.localToOffset(0, 3, 2, 4, 1), [3, 1], 'rot 1 frente em +X');
  equal(grid.localToOffset(1, 3, 2, 4, 2), [0, 0], 'rot 2');
  equal(grid.localToOffset(0, 3, 2, 4, 3), [0, 0], 'rot 3 frente em -X');
  for (let rot = 0; rot < 4; rot++) {
    const [fx, fz] = grid.facing(rot);
    const [a, b] = grid.rotateVector(0, 1, rot);
    equal([a + 0, b + 0], [fx, fz], 'frente local = facing');
    const seen = new Set();
    const [W, D] = grid.rotatedSize(2, 4, rot);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) {
      const [x, z] = grid.localToOffset(i, j, 2, 4, rot);
      ok(x >= 0 && z >= 0 && x < W && z < D, 'célula dentro do retângulo girado');
      seen.add(x + ',' + z);
    }
    equal(seen.size, 8, 'bijeção das células');
  }
  const fan = content.traps.FanTrap;
  equal(grid.expandCells({ front: [4, 8] }, fan).length, 32, 'zona 4x8');
  equal(grid.expandCells(['footprint', { front: [4, 8] }], fan).length, 48, 'união com a base');
  equal(grid.expandCells('clear', content.traps.BoxingGlove).length, 6, 'células livres nativas da luva');
});

test('conteúdo: 22 armadilhas com footprint, células, tempos nativos e programa', () => {
  const traps = Object.values(content.traps).filter(t => t.category === 'trap');
  equal(traps.length, 22, '22 armadilhas');
  for (const t of traps) {
    equal(t.cells.length, t.footprint.w * t.footprint.d, t.id + ': células = footprint');
    for (const k of ['windup', 'active', 'winddown', 'recharge', 'sabotaged']) ok(Number.isFinite(t.timing[k]) && t.timing[k] >= 0, `${t.id}: tempo ${k}`);
    ok(Array.isArray(t.ops) && t.sensor && t.pt && t.role, t.id + ': programa e textos');
    ok(/observed|inferred/.test(t.timing.origin), t.id + ': origem do tempo declarada');
  }
  // Values traced in the executable for the five original traps (handoff table).
  equal([content.traps.FanTrap.timing.windup, content.traps.FanTrap.timing.active, content.traps.FanTrap.timing.winddown, content.traps.FanTrap.timing.recharge], [0.5, 4.5, 0.5, 50], 'ventilador');
  equal([content.traps.LaserWall.timing.windup, content.traps.LaserWall.timing.active, content.traps.LaserWall.timing.winddown, content.traps.LaserWall.timing.recharge], [0, 5, 0.5, 40], 'laser');
  near(content.traps.BoxingGlove.timing.winddown, 1.533, 1e-3, 'luva');
  for (const type of Object.values(content.agents.types)) ok(type.speed > 0.5 && type.speed < 2.5, 'velocidade derivada do clipe');
});

test('layout: parede exigida, sobreposição e base fora do piso viram problemas', () => {
  const rows = corridor(20, 6);
  const problems = traps => new Layout(plan(rows, { traps }), content).problems.filter(p => p.level === 'error').map(p => p.text);
  equal(problems([{ type: 'BoxingGlove', x: 5, z: 1 }]), [], 'luva encostada na parede de cima');
  ok(/parede/.test(problems([{ type: 'BoxingGlove', x: 5, z: 2 }])[0]), 'luva solta no meio');
  equal(problems([{ type: 'BoxingGlove', x: 5, z: 3, rot: 2 }]), [], 'luva girada encostada na parede de baixo');
  ok(/dois lados/.test(problems([{ type: 'LaserWall', x: 5, z: 1 }])[0]), 'laser em corredor de 6 não fecha');
  equal(new Layout(plan(corridor(20, 4), { traps: [{ type: 'LaserWall', x: 5, z: 1 }] }), content).problems.filter(p => p.level === 'error'), [], 'laser em corredor de 4');
  ok(/sobrepõe/.test(problems([{ type: 'SoapTrap', x: 5, z: 2 }, { type: 'FanTrap', x: 4, z: 1 }]).join()), 'sobreposição');
  ok(/fora do piso/.test(problems([{ type: 'SharkTank', x: 18, z: 1 }]).join()), 'fora do piso');
});

test('navegação: labirinto, duas entradas, objetivo inalcançável avisado', () => {
  const rows = [
    '..............',
    '.A####.......1',
    '.....#.####...'.replace(/.$/, '.'),
    '.B####.#..#...',
    '.....###..####',
    '..............',
  ];
  rows[1] = '.A####........';
  rows[4] = '.....###..###1';
  const w = world(rows, { waves: [{ name: 'w', groups: [group('investigator'), group('soldier', { entrance: 'B' })] }] });
  equal(w.layout.problems.filter(p => p.level === 'warn' && /Sem caminho/.test(p.text)).length, 0, 'há caminho das duas entradas');
  w.startRun();
  ok(until(w, () => w.stats.escaped === 2, 90), 'os dois agentes chegam ao objetivo');
  equal(w.stats.integrity, 8, 'integridade cai por fuga');
  const cut = world(['......', '.A#.1.', '......']);
  ok(cut.layout.problems.some(p => /Sem caminho/.test(p.text)), 'objetivo isolado avisado');
});

// One trap per run, a level-1 soldier (too little skill to disarm anything).
const SETUP = {
  FanTrap: { rot: 1, x: 6, z: 1 }, MagnetTrap: { rot: 3, x: 22, z: 1 }, SharkTank: { rot: 1, x: 10, z: 1 },
  SharkTank_SuperDiver: { rot: 1, x: 10, z: 1 }, LaserDIsco: { rot: 1, x: 10, z: 1 }, Paywall: { rot: 1, x: 10, z: 1 },
  HunterSnare_Trap: { rot: 1, x: 10, z: 1 }, SoapTrap: { x: 10, z: 2 }, PinballBumper: { x: 10, z: 2, rot: 2 },
  Robot_Dog_Trap: { x: 10, z: 1, width: 8 }, PoisonDarts: { x: 10, z: 1 }, Venus_Mantrap: { x: 10, z: 1, width: 6 },
};
const observed = {};
for (const def of Object.values(content.traps).filter(t => t.category === 'trap')) {
  test(`armadilha ${def.id}: dispara, cumpre as fases nativas e afeta o agente`, () => {
    const { width = 4, ...placed } = SETUP[def.id] || {};
    const w = world(corridor(40, width), { traps: [{ type: def.id, x: 10, z: 1, ...placed }], waves: [{ name: 'w', groups: [group('soldier')] }] });
    equal(w.layout.problems.filter(p => p.level === 'error'), [], 'posicionamento válido');
    w.startRun();
    const trap = w.traps[0], agent = () => w.agents[0];
    ok(until(w, () => trap.fired === 1, 60), 'dispara');
    const d = def.timing.interaction || def.timing;
    near(trap.tA - trap.t0, d.windup, 1e-9, 'windup nativo');
    near(trap.tW - trap.tA, d.active, 1e-9, 'active nativo');
    near(trap.tE - trap.tW, d.winddown, 1e-9, 'winddown nativo');
    const start = { x: agent().x, z: agent().z, health: agent().health, resolve: agent().resolve, skill: agent().skill };
    ok(w.events.some(e => e.type === 'capture' && e.kind === def.id), 'captura');
    let hidden = false, sunk = false, moved = 0, tags = new Set(), statuses = new Set(), held = 0;
    until(w, () => {
      const a = agent();
      hidden ||= a.hidden; sunk ||= a.sunk; moved = Math.max(moved, Math.hypot(a.x - start.x, a.z - start.z));
      if (a.motion) tags.add(a.motion.tag);
      a.statuses.forEach(s => statuses.add(s.kind));
      if (a.mode === 'captured') held += STEP;
      return trap.state === 'recharge' || trap.state === 'idle';
    }, trap.t0 + 200);
    const a = agent();
    const lost = { health: start.health - a.health, resolve: start.resolve - a.resolve, skill: start.skill - a.skill };
    observed[def.id] = { moved: +moved.toFixed(2), tags: [...tags], statuses: [...statuses], hidden, sunk, held: +held.toFixed(2), lost, mode: a.mode };
    ok(trap.state === 'recharge' || trap.state === 'idle', 'termina o ciclo');
    if (def.timing.recharge > 0) near(trap.until - trap.tE, def.timing.recharge, STEP * 1.01, 'recarga nativa');
    ok(moved > 1 || hidden || sunk || statuses.size || lost.health > 0 || lost.resolve > 0 || lost.skill > 0 || held >= 1 || w.stats.gold > 0,
      'efeito observável no agente: ' + JSON.stringify(observed[def.id]));
    // The run always resolves: the agent dies, deserts or escapes; nobody is left stuck.
    ok(until(w, () => w.ended, w.time + 400), 'a rodada termina sem agente preso: ' + a.mode);
  });
}

test('efeitos distintos: cada família faz o que o nome promete', () => {
  const o = observed;
  ok(o.FanTrap.tags.includes('blown') && o.FanTrap.moved > 6, 'ventilador sopra longe');
  ok(o.BoxingGlove.tags.includes('launched') && o.BoxingGlove.moved > 3 && o.BoxingGlove.lost.health >= 20, 'luva lança e fere');
  ok(o.BubbleBlower.tags.includes('bubble'), 'bolha suspende');
  ok(o.SoapTrap.tags.includes('sliding') && o.SoapTrap.moved > 4, 'piso faz deslizar');
  ok(o.PinballBumper.tags.includes('bounced'), 'rebatedor rebate');
  ok(o.SharkTank.sunk && !o.SharkTank.hidden && o.SharkTank.lost.health > 50, 'tanque afunda (à vista) e fere');
  ok(o.SharkTank_SuperDiver.lost.health > o.SharkTank.lost.health || o.SharkTank_SuperDiver.mode === 'dead', 'tubarão-branco é mais letal');
  ok(o.Venus_Mantrap.hidden && o.Venus_Mantrap.sunk, 'planta engole e esconde');
  ok(o.LaserWall.lost.health > 30 && o.LaserWall.held > 4, 'laser segura e fere por permanência');
  ok(o.Flamer.statuses.includes('burning'), 'lança-chamas deixa queimando');
  ok(o.PoisonDarts.statuses.includes('poisoned') && o.KnockoutGas.statuses.includes('poisoned'), 'veneno');
  ok(o.Killer_Bees.lost.resolve > 20 || o.Killer_Bees.mode === 'gone', 'abelhas tiram determinação');
  ok(o.FakeSafe.lost.skill > 0 && o.Hopscotch_trap.lost.skill > 0, 'cofre e amarelinha drenam perícia');
  ok(o.MagnetTrap.held > 3, 'ímã segura');
  ok(o.HunterSnare_Trap.held > 15, 'armadilha de urso prende por muito tempo');
  ok(o.FreezeRay.held >= 2, 'raio congela');
});

test('combo: ventilador joga o agente no tanque sem recuperação', () => {
  const rows = corridor(40, 4);
  const w = world(rows, {
    traps: [{ type: 'FanTrap', x: 4, z: 1, rot: 1 }, { type: 'SharkTank', x: 16, z: 1, rot: 1 }, { type: 'LaserWall', x: 26, z: 1 }],
    waves: [{ name: 'w', groups: [group('soldier', { level: 3 })] }],
  });
  w.startRun();
  ok(until(w, () => w.events.some(e => e.type === 'combo'), 60), 'combo registrado');
  const combo = w.events.find(e => e.type === 'combo');
  equal(combo.traps, ['FanTrap', 'SharkTank'], 'ordem do combo');
  const fire = w.events.filter(e => e.type === 'fire').map(e => e.kind);
  equal(fire.slice(0, 2), ['FanTrap', 'SharkTank'], 'tanque dispara com o agente ainda em deslocamento');
  ok(w.stats.bestCombo >= 2, 'placar de combo');
  // A walking agent between traps does not carry a combo.
  const solo = world(corridor(60, 4), { traps: [{ type: 'SoapTrap', x: 8, z: 2 }, { type: 'LaserWall', x: 40, z: 1 }], waves: [{ name: 'w', groups: [group('soldier', { level: 5 })] }] });
  solo.startRun();
  until(solo, () => solo.traps[1].fired === 1, 120);
  ok(solo.traps[1].fired === 1 && !solo.events.some(e => e.type === 'combo'), 'recuperar entre armadilhas não é combo');
});

test('bolha: o empurrão do ventilador leva a bolha mais longe', () => {
  const run = withBubble => {
    const traps = [{ type: 'FanTrap', x: 1, z: 1, rot: 1 }];
    if (withBubble) traps.unshift({ type: 'BubbleBlower', x: 7, z: 1, rot: 0 });
    const w = world(corridor(60, 4), { traps, waves: [{ name: 'w', groups: [group('soldier', { level: 3 })] }] });
    w.startRun();
    const fan = w.traps[w.traps.length - 1];
    until(w, () => fan.fired === 1, 60);
    const x0 = w.agents[0].x;
    until(w, () => fan.state === 'recharge' && w.agents[0].mode === 'walk', 90);
    return w.agents[0].x - x0;
  };
  const plain = run(false), bubbled = run(true);
  ok(bubbled > plain + 2, `bolha amplia o deslocamento: ${bubbled.toFixed(1)} > ${plain.toFixed(1)}`);
});

test('perícia: sabotador de nível alto desarma; a armadilha fica sabotada pelo tempo nativo', () => {
  const make = (agent, level) => {
    const w = world(corridor(30, 4), { traps: [{ type: 'LaserWall', x: 10, z: 1 }], waves: [{ name: 'w', groups: [group(agent, { level })] }] });
    w.startRun();
    until(w, () => w.traps[0].state !== 'idle', 60);
    return w;
  };
  const smart = make('saboteur', 5);
  equal(smart.traps[0].state, 'sabotaged', 'desarmada');
  equal(smart.traps[0].fired, 0, 'não disparou');
  const a = smart.agents[0];
  equal(a.skill, a.max.skill - content.traps.LaserWall.skill, 'perícia gasta');
  near(smart.traps[0].until - smart.time, smart.rules.disarmSeconds + 30, STEP * 2, 'sabotada por 30 s nativos após desarmar');
  ok(until(smart, () => smart.stats.escaped === 1, 120), 'o sabotador passa');
  const dumb = make('soldier', 1);
  equal(dumb.traps[0].fired, 1, 'soldado nível 1 cai');
  // Skill drain first, then the trap works even on the expert.
  const w = world(corridor(50, 4), { traps: [{ type: 'Hopscotch_trap', x: 6, z: 1 }, { type: 'Hopscotch_trap', x: 14, z: 1 }, { type: 'FakeSafe', x: 22, z: 1 }, { type: 'LaserWall', x: 34, z: 1 }],
    waves: [{ name: 'w', groups: [group('saboteur', { level: 3 })] }] });
  w.startRun();
  until(w, () => w.traps[3].state !== 'idle', 240);
  equal(w.traps[3].fired, 1, 'depois de perder perícia, o sabotador cai no laser');
});

test('ondas: várias entradas, tipos, níveis e intervalos', () => {
  const rows = [
    '......................',
    '.A###############....',
    '.....#..........#....',
    '.B####..........####1',
    '.....#..........#....',
    '.C###############....',
    '......................',
  ].map(r => (r + '......').slice(0, 22));
  const w = world(rows, { waves: [
    { name: 'Reconhecimento', groups: [group('investigator', { entrance: 'A', count: 3, interval: 2 }), group('rogue', { entrance: 'B', level: 2, count: 2, interval: 1, delay: 4 })] },
    { name: 'Assalto', at: 30, groups: [group('soldier', { entrance: 'C', level: 4, count: 4, interval: 1.5 }), group('saboteur', { entrance: 'A', level: 'super', count: 1 })] },
  ] });
  equal(w.layout.problems.filter(p => p.level === 'error'), [], 'ondas válidas');
  w.startRun();
  w.advance(29);
  equal(w.stats.spawned, 5, 'primeira onda inteira antes da segunda');
  const spawn = w.events.filter(e => e.type === 'spawn');
  equal(spawn.map(e => e.entrance), ['A', 'A', 'A', 'B', 'B'], 'duas entradas no mesmo relógio');
  near(spawn[1].t - spawn[0].t, 2, 0.02, 'intervalo do grupo');
  near(spawn[3].t, 4, 0.02, 'atraso do grupo');
  near(spawn[4].t - spawn[3].t, 1, 0.02, 'intervalo do segundo grupo');
  w.advance(12);
  equal(w.stats.spawned, 10, 'segunda onda no tempo marcado');
  const soldier = w.agents.find(a => a.type === 'soldier'), sup = w.agents.find(a => a.level === 'super');
  equal(soldier.max.health, Math.round(180 * 1.7), 'nível 4 x multiplicador do soldado');
  ok(sup.max.skill > soldier.max.skill * 5, 'super sabotador tem perícia muito maior');
  ok(until(w, () => w.ended, 300), 'rodada termina');
  equal(w.stats.escaped + w.stats.killed + w.stats.deserted, 10, 'todo agente tem desfecho');
});

test('porta: o primeiro agente arromba, o grupo passa, a porta fecha', () => {
  const w = world(corridor(30, 4), { traps: [{ type: 'Door_Standard', x: 12, z: 1, rot: 1 }], waves: [{ name: 'w', groups: [group('soldier', { count: 3, interval: 1 })] }] });
  equal(w.layout.problems.filter(p => p.level === 'error'), [], 'porta entre duas paredes');
  const free = world(corridor(30, 4), { waves: [{ name: 'w', groups: [group('soldier', { count: 3, interval: 1 })] }] });
  w.startRun(); free.startRun();
  until(w, () => w.ended, 200); until(free, () => free.ended, 200);
  equal(w.stats.escaped, 3, 'todos passam');
  ok(w.agents[0].endedAt - free.agents[0].endedAt >= 3.9, 'porta atrasa o primeiro em cerca de 4 s');
  ok(w.traps[0].fired >= 1, 'porta acionada');
  const badge = world(corridor(30, 6), { traps: [{ type: 'Door_Standard', x: 12, z: 1, rot: 1 }] });
  ok(badge.layout.problems.some(p => /dois lados/.test(p.text)), 'porta em corredor largo demais é recusada');
});

test('determinação: agente sem determinação desiste e sai pela entrada', () => {
  const w = world(corridor(40, 4), { traps: [{ type: 'Killer_Bees', x: 10, z: 1 }, { type: 'Killer_Bees', x: 16, z: 1 }], waves: [{ name: 'w', groups: [group('rogue')] }] });
  w.startRun();
  ok(until(w, () => w.events.some(e => e.type === 'desert'), 120), 'desiste');
  ok(until(w, () => w.events.some(e => e.type === 'gone'), 200), 'sai pela entrada');
  equal([w.stats.deserted, w.stats.escaped, w.stats.integrity], [1, 0, 10], 'desistência não custa integridade');
});

test('determinismo: mesma semente, mesma história; pausa congela', () => {
  const scenario = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/eg2/scenarios/espinha.json'), 'utf8'));
  const run = () => { const w = new World(content, normaliseScenario(scenario), { seed: 11 }); w.startRun(); w.advance(90); return JSON.stringify([w.events, w.snapshot().agents]); };
  const a = run();
  equal(a === run(), true, 'duas execuções idênticas');
  const w = new World(content, normaliseScenario(scenario), { seed: 11 });
  w.startRun(); w.advance(10); w.paused = true;
  const frozen = JSON.stringify(w.snapshot()); w.advance(5);
  equal(JSON.stringify(w.snapshot()), frozen, 'pausa congela');
  w.paused = false; w.reset();
  equal([w.time, w.agents.length, w.events.length], [0, 0, 0], 'reinício limpa');
});

test('cenários de referência: válidos, com caminho, e rodam até o fim', () => {
  const dir = path.join(ROOT, 'content/eg2/scenarios');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
  ok(files.length >= 3, 'três cenários de referência');
  for (const file of files) {
    const scenario = normaliseScenario(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));
    equal(JSON.parse(JSON.stringify(normaliseScenario(scenario))), scenario, file + ': salvar e abrir preserva');
    const w = new World(content, scenario, { seed: 3 });
    equal(w.layout.problems.filter(p => p.level === 'error'), [], file + ': sem erros');
    equal(w.layout.problems.filter(p => /Sem caminho/.test(p.text)), [], file + ': todas as entradas alcançam os objetivos');
    ok(scenario.entrances.length >= 2 && scenario.waves.length >= 1, file + ': várias entradas e ondas');
    w.startRun();
    ok(until(w, () => w.ended, 1500), file + ': a rodada termina');
    equal(w.stats.escaped + w.stats.killed + w.stats.deserted, w.stats.spawned, file + ': todo agente tem desfecho');
    ok(w.events.some(e => e.type === 'fire'), file + ': armadilhas disparam');
    observed['cenario:' + file] = { ...w.stats, seconds: +w.time.toFixed(1), fired: w.traps.filter(t => t.fired).length, devices: w.traps.length };
  }
});

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  (${r.checks})${r.pass ? '' : '\n      ' + r.error}`);
const summary = { tests: results.length, passed: results.length - failed.length, failed: failed.length, checks, observed };
fs.mkdirSync(path.join(ROOT, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'evidence/core-tests.json'), JSON.stringify({ schema: 'lair-core-tests/1', ...summary, results }, null, 1) + '\n');
console.log(JSON.stringify({ tests: summary.tests, passed: summary.passed, failed: summary.failed, checks }));
process.exit(failed.length ? 1 : 0);
