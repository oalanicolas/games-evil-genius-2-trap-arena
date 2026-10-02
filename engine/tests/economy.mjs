import { calculateBudget, goldCost } from '../core/economy.js';

export function registerEconomyTests({ test, ok, equal, content, plan, corridor, World, Layout, normaliseScenario }) {
  const make = (traps = [], budget) => {
    const scenario = plan(corridor(36, 6), { traps,
      waves: [{ name: 'Onda paga', groups: [{ entrance: 'A', objective: 'o1', agent: 'soldier', level: 1, count: 3, interval: 2 }] }] });
    if (budget !== undefined) scenario.rules.goldBudget = budget;
    return scenario;
  };
  const glove = { type: 'BoxingGlove', x: 6, z: 1 };
  const budgetProblems = layout => layout.problems.filter(p => p.code?.startsWith('budget_'));

  test('ouro: as 22 armadilhas têm preço numérico e cada exemplar entra na soma', () => {
    const expected = { BoxingGlove: 4000, BubbleBlower: 16000, FakeSafe: 64000, FanTrap: 4000, Flamer: 36000,
      FreezeRay: 4000, Hopscotch_trap: 0, HunterSnare_Trap: 0, Killer_Bees: 36000, KnockoutGas: 36000,
      LaserDIsco: 64000, LaserWall: 16000, MagnetTrap: 16000, Narrative_VenomGasTrap: 36000,
      Paywall: 64000, PinballBumper: 4000, PoisonDarts: 4000, Robot_Dog_Trap: 64000, SharkTank: 36000,
      SharkTank_SuperDiver: 16000, SoapTrap: 16000, Venus_Mantrap: 64000 };
    const defs = Object.values(content.traps).filter(d => d.category === 'trap');
    equal(defs.length, 22, 'cobertura dos preços');
    for (const def of defs) equal(goldCost(def), expected[def.id], def.id + ': preço');
    const s = make(defs.map(def => ({ type: def.id, x: -20, z: -20, enabled: false })));
    equal(calculateBudget(s, content).spent, Object.values(expected).reduce((a, b) => a + b, 0), 'todas contam, mesmo inválidas e desligadas');
    s.traps.push({ ...s.traps[0], id: 'repetida' });
    equal(calculateBudget(s, content).spent, 604000, 'repetida soma de novo');
  });

  test('ouro: limite exato, excesso, remoção, movimento e arquitetura', () => {
    const s = make([glove, { ...glove, x: 12, enabled: false }, { type: 'Door_Standard', x: 20, z: 1 }, { type: 'Doorway', x: 24, z: 1 }], 8000);
    let budget = calculateBudget(s, content);
    equal([budget.spent, budget.remaining, budget.blocked], [8000, 0, false], 'limite exato, arquitetura excluída, desligada cobrada');
    Object.assign(s.traps[0], { x: -80, rot: 3 });
    equal(calculateBudget(s, content).spent, 8000, 'mover/girar para fora do piso não altera custo');
    s.rules.goldBudget = 7999;
    budget = calculateBudget(s, content);
    equal([budget.remaining, budget.blocked], [-1, true], 'um ouro acima bloqueia');
    ok(budgetProblems(new Layout(s, content)).some(p => p.code === 'budget_exceeded'), 'layout publica o código');
    s.traps.splice(0, 1);
    equal([calculateBudget(s, content).spent, calculateBudget(s, content).remaining], [4000, 3999], 'remover libera custo');
    const zero = make([{ type: 'Hopscotch_trap', x: 6, z: 1 }, { type: 'HunterSnare_Trap', x: 12, z: 1 }], 0);
    equal([calculateBudget(zero, content).spent, calculateBudget(zero, content).blocked], [0, false], 'zero é preço real e cabe no limite zero');
  });

  test('ouro: preço desconhecido não vira zero nem permite onda limitada', () => {
    for (const price of [undefined, null, NaN, Infinity, -1, '0']) {
      const pack = { ...content, traps: { ...content.traps, BoxingGlove: { ...content.traps.BoxingGlove, cost: price } } };
      const s = make([glove], 4000), w = new World(pack, s), budget = w.layout.budget;
      equal([budget.spent, budget.remaining, budget.blocked], [null, null, true], String(price) + ' permanece desconhecido');
      ok(budget.problems.some(p => p.code === 'budget_unknown_cost' && p.id === 't1'), 'problema aponta o item');
      equal([w.startRun(), w.startWave(0), w.queue.length, w.events.length, w.running], [false, false, 0, 0, false], 'nenhuma onda agendada');
      s.rules.goldBudget = null;
      equal(calculateBudget(s, pack).blocked, false, 'sem limite mantém compatibilidade');
    }
  });

  test('ouro: orçamento inválido é recusado na normalização e no núcleo', () => {
    for (const value of [-1, 1.5, NaN, Infinity, -Infinity, '8000', '', false, true, {}, []]) {
      const s = make([glove], value);
      let error = null;
      try { normaliseScenario(s); } catch (caught) { error = caught; }
      equal(error?.code, 'budget_invalid', String(value) + ' recusado, sem converter para sem limite');
      const w = new World(content, s);
      ok(budgetProblems(w.layout).some(p => p.code === 'budget_invalid'), 'núcleo também aponta orçamento inválido');
      equal([w.startRun(), w.startWave(0), w.queue.length], [false, false, 0], 'inválido não agenda');
    }
    for (const value of [undefined, null, 0, 4000]) {
      const s = make([], value), reloaded = normaliseScenario(s);
      equal(reloaded.rules.goldBudget, value, String(value) + ' preservado');
    }
  });

  test('ouro: salvar/abrir preserva a regra e covis antigos continuam sem limite', () => {
    for (const value of [undefined, null, 0, 123456]) {
      const s = make([glove], value), reloaded = normaliseScenario(JSON.parse(JSON.stringify(s)));
      equal(reloaded.rules.goldBudget, value, 'roundtrip da regra');
      equal(calculateBudget(reloaded, content), calculateBudget(s, content), 'mesmo orçamento derivado após abrir');
    }
    const old = make([glove]);
    equal(calculateBudget(old, content).limited, false, 'cenário antigo sem limite');
    ok(new World(content, old).startRun(), 'cenário antigo solta ondas');
  });

  test('ouro: excesso impede run/onda sem reset, evento ou fila e pedágio não financia montagem', () => {
    const s = make([glove], 3999), w = new World(content, s);
    w.stats.gold = 1000000;
    equal([w.startRun(), w.startWave(0), w.queue.length, w.events.length, w.running], [false, false, 0, 0, false], 'bloqueio atômico mesmo com ouro do pedágio');
    equal(w.stats.gold, 1000000, 'recusa não reinicia a simulação');
    s.rules.goldBudget = 4000;
    equal(w.startRun(), true, 'limite exato inicia');
    equal(w.queue.length, 3, 'todos agentes agendados');
    const queue = JSON.stringify(w.queue), events = JSON.stringify(w.events);
    s.rules.goldBudget = 0;
    equal([w.startRun(), w.startWave(0)], [false, false], 'nova tentativa recusada');
    equal([JSON.stringify(w.queue), JSON.stringify(w.events)], [queue, events], 'recusa preserva fila existente sem duplicar');
  });
}
