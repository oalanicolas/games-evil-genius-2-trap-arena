// Editor gate, driven by real pointer and keyboard input in headless Chrome on the real GPU.
//   node engine/tests/editor-qa.mjs            (server on 8767; QA_HEADED=1 to watch)
// Captures go to <workspace>/output/eg2-covil-qa (ignored by git), the receipt to engine/evidence.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, '../../../..');
const { chromium } = await import(path.join(workspace, 'libraries/metal-assault/lab/node_modules/playwright/index.mjs'));
const out = process.env.EG2_QA_OUT || path.join(workspace, 'output/eg2-covil-qa');
fs.mkdirSync(out, { recursive: true });
const base = process.env.LAIR_URL || 'http://127.0.0.1:8767/covil.html';

const checks = [];
const check = (name, pass, detail = '') => { checks.push({ name, pass: Boolean(pass), detail: String(detail).slice(0, 300) }); if (!pass) console.log('FAIL', name, detail); };
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.QA_HEADED !== '1', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e.stack || e).slice(0, 300)));
page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
page.on('dialog', d => d.accept('QA covil'));

const ready = async () => { await page.waitForFunction(() => window.Lair?.ready === true, null, { timeout: 60000 }); await page.waitForFunction(() => Lair.loading === 0, null, { timeout: 90000 }); };
const lair = fn => page.evaluate(fn);
const at = (x, z) => page.evaluate(([cx, cz]) => Lair.screenOf(cx, cz), [x, z]);
const click = async (x, z) => { const [px, py] = await at(x, z); await page.mouse.move(px, py); await page.mouse.click(px, py); };
const drag = async (x0, z0, x1, z1) => { const [ax, ay] = await at(x0, z0), [bx, by] = await at(x1, z1); await page.mouse.move(ax, ay); await page.mouse.down(); await page.mouse.move((ax + bx) / 2, (ay + by) / 2, { steps: 4 }); await page.mouse.move(bx, by, { steps: 4 }); await page.mouse.up(); };
const shot = name => page.screenshot({ path: path.join(out, name + '.png') });
const traps = () => lair(() => Lair.scenario.traps.map(t => ({ ...t })));

await page.goto(base);
await ready();
const gpu = await lair(() => Lair.gpu);
check('abre com o cenário de referência e as 22 armadilhas na paleta', await page.locator('.trap').count() === 23 && (await lair(() => Lair.scenario.name)).includes('Espinha'), await page.locator('.trap').count());
await shot('01-abertura');

// --- build a lair from scratch with the public tools ---
await page.click('#new'); await ready();
await page.click('#view-plan');
check('Novo: corredor inicial com uma entrada e um objetivo', await lair(() => Lair.scenario.entrances.length === 1 && Lair.scenario.objectives.length === 1 && Lair.scenario.traps.length === 0));

await page.keyboard.press('b');
await drag(14, 4, 25, 11);                       // a room above the corridor
await drag(18, 16, 21, 24);                      // a side corridor going down
const floor = await lair(() => Lair.scenario.floor);
check('Abrir piso: sala 12x8 e corredor 4x9 pintados por arrasto', floor[4].slice(14, 26) === 'c'.repeat(12) && floor[11][25] === 'c' && floor[24].slice(18, 22) === 'cccc' && floor[25][18] === '.', floor[4]);
await page.keyboard.press('e');
await drag(14, 4, 15, 5);
check('Fechar: rocha de volta num canto', (await lair(() => Lair.scenario.floor[4].slice(14, 17))) === '..c');
await page.keyboard.press('Meta+z');
check('Desfazer devolve o piso', (await lair(() => Lair.scenario.floor[4].slice(14, 17))) === 'ccc');

// traps: palette click, R to rotate, click to place
await page.click('.trap[data-type="FanTrap"]');
await page.keyboard.press('r');
await click(8, 14);
let list = await traps();
check('Ventilador posicionado no corredor, girado para leste', list.length === 1 && list[0].type === 'FanTrap' && list[0].rot === 1, JSON.stringify(list));
await page.click('.trap[data-type="SharkTank"]');
await page.keyboard.press('r');
await click(15, 14);
await page.click('.trap[data-type="BoxingGlove"]');
await click(20, 8);                              // middle of the room: no wall behind
const hintBad = await page.locator('#hint.bad').textContent().catch(() => '');
list = await traps();
check('Luva no meio da sala é recusada com o motivo', list.length === 2 && /parede/.test(hintBad), hintBad);
await click(20, 6);                              // against the room's north wall
list = await traps();
check('Luva encostada na parede é aceita', list.length === 3 && list[2].type === 'BoxingGlove' && list[2].z === 4, JSON.stringify(list[2]));
await page.click('.trap[data-type="LaserWall"]');
await page.keyboard.press('r');
await click(20, 20);                             // the 4-wide side corridor
await page.click('.trap[data-type="SoapTrap"]');
await click(30, 13);
await page.click('.trap[data-type="Door_Standard"]');
await page.keyboard.press('r');
await click(36, 14);
list = await traps();
check('Laser entre as duas paredes, piso escorregadio e porta posicionados', list.length === 6 && list.map(t => t.type).join() === 'FanTrap,SharkTank,BoxingGlove,LaserWall,SoapTrap,Door_Standard', list.map(t => t.type).join());
check('planta sem erros depois de montar', (await lair(() => Lair.world.layout.problems.filter(p => p.level === 'error').length)) === 0, JSON.stringify(await lair(() => Lair.world.layout.problems)));

// second entrance and second objective
await page.keyboard.press('Escape');
await page.keyboard.press('n');
await click(19, 24);
await page.keyboard.press('o');
await click(24, 6);
const points = await lair(() => ({ e: Lair.scenario.entrances.map(e => e.id), o: Lair.scenario.objectives.map(o => o.id), groups: Lair.scenario.waves[0].groups.length }));
check('Segunda entrada (com grupo automático) e segundo objetivo', points.e.join() === 'A,B' && points.o.length === 2 && points.groups === 2, JSON.stringify(points));

// waves: change type, level and count through the form
await page.click('.tabs button[data-tab="waves"]');
const group = page.locator('.wave').first().locator('.group').nth(1);
await group.locator('select[aria-label="Tipo de agente"]').selectOption('soldier');
await page.locator('.wave').first().locator('.group').nth(1).locator('select[aria-label="Nível"]').selectOption('3');
await page.locator('.wave').first().locator('.group').nth(1).locator('select[aria-label="Objetivo"]').selectOption('o2');
const count = page.locator('.wave').first().locator('.group').nth(1).locator('.nums input').first();
await count.fill('2'); await count.press('Tab');
await page.click('text=+ Onda');
await page.locator('.wave').nth(1).locator('text=+ Grupo').click();
await page.locator('.wave').nth(1).locator('select[aria-label="Tipo de agente"]').selectOption('saboteur');
await page.locator('.wave').nth(1).locator('select[aria-label="Nível"]').selectOption('super');
const waves = await lair(() => Lair.scenario.waves);
check('Ondas: grupo B vira 2 soldados nível 3 rumo ao segundo objetivo; segunda onda com super sabotador',
  waves.length === 2 && waves[0].groups[1].agent === 'soldier' && waves[0].groups[1].level === 3 && waves[0].groups[1].count === 2 && waves[0].groups[1].objective === 'o2' && waves[1].groups[0].agent === 'saboteur' && waves[1].groups[0].level === 'super', JSON.stringify(waves));

// select, rotate, remove, undo
await page.keyboard.press('v');
await click(30, 13);
check('Selecionar mostra a ficha da armadilha', /Piso escorregadio/.test(await page.locator('#tab-selection h3').textContent()));
await page.keyboard.press('Delete');
check('Delete remove a selecionada', (await traps()).length === 5);
await page.keyboard.press('Meta+z');
check('Desfazer devolve a armadilha', (await traps()).length === 6);
await shot('02-covil-montado-planta');
await page.click('#view-persp');
await shot('03-covil-montado-perspectiva');

// --- play it ---
await page.click('.speed button[data-speed="4"]');
await page.click('#run');
await page.waitForFunction(() => Lair.world.events.some(e => e.type === 'fire'), null, { timeout: 60000 });
await page.waitForTimeout(600);
await shot('04-em-jogo');
const t1 = await lair(() => Lair.world.time);
await page.keyboard.press(' ');
await page.waitForTimeout(500);
const t2 = await lair(() => Lair.world.time); await page.waitForTimeout(500);
const t3 = await lair(() => Lair.world.time);
check('Espaço pausa: o relógio para', t2 > t1 - 1 && t3 === t2, `${t1} ${t2} ${t3}`);
await page.keyboard.press(' ');
await page.click('.speed button[data-speed="8"]');
await page.waitForFunction(() => Lair.world.ended, null, { timeout: 240000 });
const end = await lair(() => ({ stats: Lair.world.stats, spawned: Lair.world.agents.length, fired: Lair.world.traps.filter(t => t.fired).map(t => t.type), log: document.querySelectorAll('#log li').length, out: document.querySelector('#stat-out').textContent, escaped: document.querySelector('#stat-escaped').textContent }));
check('Rodada inteira: 8 agentes entram pelas duas entradas e todos têm desfecho', end.spawned === 8 && end.stats.killed + end.stats.deserted + end.stats.escaped === 8, JSON.stringify(end.stats));
check('Armadilhas disparam e o placar da tela acompanha', end.fired.length >= 3 && end.log > 6 && +end.out === end.stats.killed + end.stats.deserted && +end.escaped === end.stats.escaped, JSON.stringify(end));
await shot('05-fim-da-rodada');
const sound = await lair(() => Lair.audio);
check('Sons nativos das armadilhas decodificados e tocados no disparo', sound.enabled && sound.context === 'running' && sound.decoded >= 2, JSON.stringify(sound));
await page.click('#reset');
check('Reiniciar zera relógio, agentes e registro', await lair(() => Lair.world.time === 0 && Lair.world.agents.length === 0 && document.querySelectorAll('#log li').length === 0));

// --- save, reload, export ---
await page.click('#save');
const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
check('Exportar baixa o cenário completo', exported.schema === 'lair-scenario/1' && exported.traps.length === 6 && exported.entrances.length === 2 && exported.waves.length === 2, exported.name);
fs.writeFileSync(path.join(out, 'covil-exportado.json'), JSON.stringify(exported, null, 1));
await page.reload(); await ready();
const after = await lair(() => ({ name: Lair.scenario.name, traps: Lair.scenario.traps.length, mine: [...document.querySelectorAll('#scenario-select optgroup[label="Meus covis"] option')].map(o => o.textContent) }));
check('Salvar e recarregar: o covil volta como estava e aparece em Meus covis', after.name === 'QA covil' && after.traps === 6 && after.mine.includes('QA covil'), JSON.stringify(after));

// --- the reference scenarios, live ---
const reference = {};
for (const name of ['espinha', 'labirinto', 'corredores', 'galeria']) {
  await page.selectOption('#scenario-select', 'ref:' + name + '.json');
  await page.waitForFunction(file => Lair.state.file === file, 'ref:' + name + '.json', { timeout: 30000 }); await ready();
  await page.click('#view-plan'); await page.waitForTimeout(400); await shot(`10-${name}-planta`);
  await page.click('#view-persp'); await page.waitForTimeout(400); await shot(`11-${name}-perspectiva`);
  await page.click('.speed button[data-speed="8"]');
  await page.click('#run');
  await page.waitForFunction(() => Lair.world.events.filter(e => e.type === 'fire').length >= 3, null, { timeout: 120000 });
  await page.waitForFunction(() => Lair.loading === 0, null, { timeout: 60000 }); await page.waitForTimeout(500);
  await shot(`12-${name}-em-jogo`);
  await page.waitForFunction(() => Lair.world.ended, null, { timeout: 420000 });
  const result = await lair(() => ({ ...Lair.world.stats, seconds: +Lair.world.time.toFixed(1), kinds: [...new Set(Lair.world.traps.filter(t => t.fired).map(t => t.type))].length, devices: Lair.world.traps.length }));
  reference[name] = result;
  check(`Referência ${name}: roda até o fim ao vivo, todo agente com desfecho`, result.killed + result.deserted + result.escaped === result.spawned && result.kinds >= 3, JSON.stringify(result));
}

// --- narrower desktop ---
await page.setViewportSize({ width: 1280, height: 760 }); await page.waitForTimeout(500);
const fit = await lair(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth, canvas: document.querySelector('#viewport canvas').clientWidth }));
check('1280x760: sem rolagem horizontal e a cena continua visível', fit.scroll <= fit.width && fit.canvas > 600, JSON.stringify(fit));
await shot('20-1280');

check('sem erros de console, de página ou de rede', errors.length === 0, errors.slice(0, 5).join(' | '));
const failed = checks.filter(c => !c.pass);
const receipt = { schema: 'lair-editor-qa/1', date: new Date().toISOString(), url: base, renderer: gpu, headless: process.env.QA_HEADED !== '1', input: 'real pointer and keyboard events (Playwright); Lair.screenOf only converts a cell to page coordinates',
  checks: checks.length, passed: checks.length - failed.length, failed: failed.length, results: checks, reference, captures: fs.readdirSync(out).filter(f => f.endsWith('.png')).sort(), capturesDir: 'output/eg2-covil-qa (workspace, fora do git)' };
fs.writeFileSync(path.join(here, '../evidence/editor-qa.json'), JSON.stringify(receipt, null, 1) + '\n');
console.log(JSON.stringify({ checks: receipt.checks, passed: receipt.passed, failed: receipt.failed, renderer: gpu, reference }));
await browser.close();
process.exit(failed.length ? 1 : 0);
