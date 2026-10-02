// Writes the reference scenarios. Each one is checked by the core before it is saved:
// a scenario with a placement error or an unreachable objective is not written.
//   node engine/tools/make_scenarios.mjs
import fs from 'node:fs';
import path from 'node:path';
import { emptyScenario, normaliseScenario, World } from '../core/index.js';
import { content, ROOT } from '../tests/helpers.mjs';

function sheet(w, h, name, note) {
  const s = emptyScenario(w, h, name);
  s.note = note; s.waves = [];
  const rows = s.floor.map(r => [...r]);
  let n = 0;
  const api = {
    s,
    rect(x, z, rw, rh, tile = 'c') { for (let j = z; j < z + rh; j++) for (let i = x; i < x + rw; i++) rows[j][i] = tile; return api; },
    trap(type, x, z, rot = 0, extra = {}) { s.traps.push({ id: 't' + (++n), type, x, z, rot, enabled: true, ...extra }); return api; },
    entrance(id, x, z, label) { s.entrances.push({ id, x, z, label }); return api; },
    objective(id, x, z, label) { s.objectives.push({ id, x, z, label }); return api; },
    wave(name, groups, at) { s.waves.push({ name, ...(at ? { at } : {}), groups: groups.map(([entrance, objective, agent, level, count, interval = 2.5, delay = 0]) => ({ entrance, objective, agent, level, count, interval, delay })) }); return api; },
    done() { s.floor = rows.map(r => r.join('')); return normaliseScenario(s); },
  };
  return api;
}

// 1. Image 1/4: spine of slippery floors with side rooms (two fans | shark tank + magnet).
function espinha() {
  const p = sheet(30, 33, 'Espinha de pisos escorregadios', 'Referência 1 e 4: corredor central com pisos escorregadios; salas laterais com dois ventiladores de um lado e tanque de tubarões com ímã do outro. Vãos abertos ligam as seis salas.');
  p.rect(13, 1, 2, 25).rect(15, 1, 4, 2);                 // spine and the core nook
  for (const z of [4, 11, 18]) {
    p.rect(2, z, 10, 4, 'r').rect(16, z, 12, 4, 'r');
    p.rect(12, z, 1, 4).rect(15, z, 1, 4);
    p.trap('Doorway', 12, z, 1).trap('Doorway', 15, z, 1);
  }
  p.rect(3, 25, 24, 6, 'r');                               // lower hall
  for (const z of [4, 11]) p.trap('FanTrap', 2, z, 1).trap('FanTrap', 7, z, 1).trap('SharkTank', 16, z, 1).trap('MagnetTrap', 23, z, 3);
  p.trap('MagnetTrap', 2, 18, 1).trap('SharkTank', 6, 18, 3).trap('FanTrap', 18, 18, 3).trap('FanTrap', 23, 18, 3); // mirrored band
  for (const z of [2, 8, 15, 22]) p.trap('SoapTrap', 13, z, 0);
  p.trap('Venus_Mantrap', 6, 25, 0).trap('Robot_Dog_Trap', 17, 27, 0);
  p.entrance('A', 13, 1, 'Heliporto').entrance('B', 3, 28, 'Doca').objective('cofre', 26, 28, 'Cofre').objective('nucleo', 18, 1, 'Núcleo');
  p.wave('Reconhecimento', [['A', 'cofre', 'investigator', 1, 3, 3], ['B', 'nucleo', 'rogue', 1, 2, 4, 2]]);
  p.wave('Assalto', [['A', 'cofre', 'soldier', 2, 4, 2], ['B', 'nucleo', 'saboteur', 3, 2, 3, 1]]);
  p.wave('Elite', [['A', 'cofre', 'investigator', 'super', 1], ['A', 'cofre', 'soldier', 4, 3, 2, 3], ['B', 'nucleo', 'rogue', 3, 3, 2]]);
  return p.done();
}

// 2. Image 2: maze of long corridors with doors and a trap in every stretch.
function labirinto() {
  const p = sheet(44, 32, 'Labirinto de corredores', 'Referência 2: corredores longos em serpentina, com portas e armadilhas a cada trecho.');
  const lanes = [2, 8, 14, 20, 26];
  for (const z of lanes) p.rect(2, z, 40, 4);
  p.rect(38, 6, 4, 2).rect(2, 12, 4, 2).rect(38, 18, 4, 2).rect(2, 24, 4, 2);
  // lane 1, eastbound
  p.trap('Door_Standard', 8, 2, 1).trap('SoapTrap', 12, 3).trap('LaserWall', 16, 2).trap('SoapTrap', 24, 3).trap('PinballBumper', 30, 3, 2).trap('BoxingGlove', 38, 2, 3);
  // lane 2, westbound
  p.trap('FreezeRay', 30, 8).trap('PoisonDarts', 26, 8).trap('Flamer', 18, 8).trap('KnockoutGas', 10, 8);
  // lane 3, eastbound
  p.trap('Paywall', 10, 14, 1).trap('Killer_Bees', 14, 14).trap('PinballBumper', 22, 15, 3).trap('LaserDIsco', 28, 14, 1);
  // lane 4, westbound: fan throws into the tank, the magnet drags across it
  p.trap('FanTrap', 38, 20, 3).trap('SharkTank', 30, 20, 3).trap('MagnetTrap', 20, 20, 1).trap('HunterSnare_Trap', 14, 20, 1).trap('Hopscotch_trap', 8, 20);
  // lane 5, eastbound
  p.trap('FakeSafe', 8, 26).trap('FanTrap', 13, 26, 1).trap('BubbleBlower', 18, 26).trap('Door_Standard', 28, 26, 1).trap('Narrative_VenomGasTrap', 32, 26);
  p.entrance('A', 2, 3, 'Entrada oeste').entrance('B', 41, 5, 'Entrada leste').objective('cofre', 41, 28, 'Cofre').objective('arquivo', 2, 21, 'Arquivo');
  p.wave('Batedores', [['A', 'cofre', 'investigator', 1, 4, 2.5], ['B', 'arquivo', 'rogue', 2, 2, 3, 6]]);
  p.wave('Invasão', [['A', 'cofre', 'soldier', 3, 5, 2], ['B', 'cofre', 'saboteur', 4, 2, 4, 4], ['A', 'arquivo', 'rogue', 3, 2, 3, 10]]);
  return p.done();
}

// 3. Image 3: L-shaped corridors with slippery floors, triangle bumpers, fan, magnet and tank.
function corredores() {
  const p = sheet(30, 30, 'Corredores em L', 'Referência 3: corredores em L com pisos escorregadios, rebatedores triangulares, ventilador, ímã e tanque de tubarões.');
  p.rect(2, 2, 20, 4).rect(18, 2, 4, 16).rect(2, 14, 20, 4).rect(4, 14, 4, 14).rect(4, 24, 24, 4);
  p.trap('SoapTrap', 6, 3).trap('SoapTrap', 10, 3).trap('PinballBumper', 14, 2, 1).trap('PinballBumper', 14, 4, 0);
  p.trap('FanTrap', 18, 2, 0).trap('SharkTank', 18, 7, 0);            // fan blows down the leg into the tank
  p.trap('SoapTrap', 14, 15).trap('PinballBumper', 11, 14, 3).trap('MagnetTrap', 4, 14, 1);
  p.trap('PinballBumper', 4, 19, 0).trap('SoapTrap', 5, 21).trap('PinballBumper', 6, 26, 2);
  p.trap('SoapTrap', 10, 25).trap('LaserWall', 14, 24).trap('SoapTrap', 20, 25).trap('BoxingGlove', 24, 24, 3);
  p.entrance('A', 2, 3, 'Entrada norte').entrance('B', 2, 15, 'Entrada oeste').objective('cofre', 27, 27, 'Cofre');
  p.wave('Curiosos', [['A', 'cofre', 'investigator', 1, 4, 2.5], ['B', 'cofre', 'rogue', 1, 2, 3, 5]]);
  p.wave('Força', [['A', 'cofre', 'soldier', 3, 4, 2], ['B', 'cofre', 'saboteur', 2, 3, 3, 3]]);
  return p.done();
}

// 4. Every device once, as a test track.
function galeria() {
  const p = sheet(64, 28, 'Galeria: todas as armadilhas', 'Pista com as 22 armadilhas do pacote e a porta, uma de cada, para ver cada efeito.');
  p.rect(2, 2, 60, 4).rect(58, 6, 4, 2).rect(2, 8, 60, 4).rect(2, 12, 4, 2).rect(2, 14, 60, 6).rect(58, 20, 4, 2).rect(2, 22, 60, 4);
  let x = 6;
  for (const [type, rot, w] of [['SoapTrap', 0, 2], ['BoxingGlove', 0, 2], ['PinballBumper', 2, 2], ['LaserWall', 0, 4], ['PoisonDarts', 0, 1], ['FreezeRay', 0, 2], ['Flamer', 0, 4], ['Killer_Bees', 0, 4], ['Door_Standard', 1, 1]]) {
    p.trap(type, x, type === 'SoapTrap' || type === 'PinballBumper' ? 3 : 2, rot); x += w + 3;
  }
  x = 54;
  for (const [type, rot, w] of [['BubbleBlower', 0, 2], ['KnockoutGas', 0, 4], ['Narrative_VenomGasTrap', 0, 4], ['LaserDIsco', 1, 6], ['HunterSnare_Trap', 1, 2], ['Hopscotch_trap', 0, 4], ['FakeSafe', 0, 4], ['Paywall', 1, 1]]) {
    x -= w; p.trap(type, x, 8, rot); x -= 3;
  }
  p.trap('Venus_Mantrap', 10, 14).trap('Robot_Dog_Trap', 22, 16).trap('FanTrap', 30, 15, 1).trap('SharkTank', 35, 15, 1).trap('MagnetTrap', 44, 15, 3);
  p.trap('SharkTank_SuperDiver', 44, 22, 3).trap('FanTrap', 52, 22, 3);
  p.entrance('A', 2, 3, 'Entrada').entrance('B', 61, 15, 'Atalho').objective('fim', 2, 23, 'Saída');
  p.wave('Passeio', [['A', 'fim', 'soldier', 3, 2, 6], ['A', 'fim', 'investigator', 2, 2, 6, 3], ['B', 'fim', 'rogue', 2, 1, 1, 40]]);
  return p.done();
}

const out = path.join(ROOT, 'content/eg2/scenarios');
fs.mkdirSync(out, { recursive: true });
const index = [];
for (const [file, build] of Object.entries({ espinha, labirinto, corredores, galeria })) {
  const scenario = build();
  const world = new World(content, scenario, { seed: 1 });
  const errors = world.layout.problems.filter(p => p.level === 'error' || /Sem caminho/.test(p.text));
  if (errors.length) { console.error(file, errors); process.exitCode = 1; continue; }
  fs.writeFileSync(path.join(out, file + '.json'), JSON.stringify(scenario, null, 1) + '\n');
  index.push({ file: file + '.json', name: scenario.name, note: scenario.note, traps: scenario.traps.length, entrances: scenario.entrances.length, waves: scenario.waves.length, size: [scenario.w, scenario.h] });
  console.log(file, { traps: scenario.traps.length, kinds: new Set(scenario.traps.map(t => t.type)).size, warnings: world.layout.problems.length });
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ schema: 'lair-scenarios/1', scenarios: index }, null, 1) + '\n');
