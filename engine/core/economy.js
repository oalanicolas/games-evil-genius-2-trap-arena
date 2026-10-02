// Construction gold is derived from the document, never a mutable wallet. Gold earned
// during a run is a simulation statistic and cannot change this budget.
const gold = value => value.toLocaleString('pt-BR');

export function validateGoldBudget(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0) return value;
  const error = new Error('Orçamento de ouro inválido: use um inteiro maior ou igual a zero, ou sem limite.');
  error.code = 'budget_invalid';
  throw error;
}

/** null means unknown, including an absent price. Zero is a real price. */
export function goldCost(def) {
  return typeof def?.cost === 'number' && Number.isFinite(def.cost) && def.cost >= 0 ? def.cost : null;
}

export function calculateBudget(scenario, content) {
  let budget = null;
  const problems = [], unknown = [];
  try { budget = validateGoldBudget(scenario.rules?.goldBudget); }
  catch (error) { problems.push({ level: 'error', code: error.code, text: error.message }); }
  const limited = budget !== null;
  let knownSpent = 0;
  // Count the document, not Layout.devices: disabled and incorrectly placed traps
  // still belong to the lair. Doors and architecture have no construction price.
  for (const placed of scenario.traps) {
    const def = content.traps[placed.type];
    if (def?.category !== 'trap') continue;
    const cost = goldCost(def);
    if (cost === null) {
      unknown.push({ id: placed.id, type: placed.type });
      problems.push({ level: limited ? 'error' : 'warn', code: 'budget_unknown_cost', id: placed.id,
        text: `${def.pt || def.name || placed.type}: preço de ouro desconhecido${limited ? '; não é possível soltar ondas com orçamento limitado' : ''}.` });
    } else knownSpent += cost;
  }
  if (limited && knownSpent > budget) problems.push({ level: 'error', code: 'budget_exceeded',
    text: `Saldo insuficiente: as armadilhas custam ${gold(knownSpent)} de ouro para um limite de ${gold(budget)} (faltam ${gold(knownSpent - budget)}).` });
  const spent = unknown.length ? null : knownSpent;
  return { budget, limited, knownSpent, spent, remaining: limited && spent !== null ? budget - spent : null,
    unknown, problems, blocked: problems.some(p => p.level === 'error') };
}
