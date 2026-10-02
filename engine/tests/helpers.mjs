import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareContent, emptyScenario, normaliseScenario, World } from '../core/index.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/eg2', name), 'utf8'));
export const content = prepareContent({ traps: read('traps.json'), agents: read('agents.json'), behaviours: read('behaviours.json') });

/** Scenario from an ASCII plan: '#' floor, '.' rock, letters A-D entrances, digits 1-9 objectives. */
export function plan(rows, { traps = [], waves = null, integrity = 10 } = {}) {
  const s = emptyScenario(rows[0].length, rows.length, 'teste');
  s.floor = rows.map(r => r.replace(/[^.]/g, 'c'));
  rows.forEach((row, z) => [...row].forEach((ch, x) => {
    if (/[A-D]/.test(ch)) s.entrances.push({ id: ch, x, z, label: ch });
    if (/[1-9]/.test(ch)) s.objectives.push({ id: 'o' + ch, x, z, label: 'Objetivo ' + ch });
  }));
  s.traps = traps.map((t, i) => ({ id: 't' + (i + 1), rot: 0, enabled: true, ...t }));
  s.waves = waves || [{ name: 'Onda 1', groups: [] }];
  s.rules.integrity = integrity;
  return normaliseScenario(s);
}

export const world = (rows, options = {}) => new World(content, plan(rows, options), { seed: options.seed ?? 7 });

export function corridor(length = 40, width = 4) {
  const rows = ['.'.repeat(length + 2)];
  for (let z = 0; z < width; z++) rows.push('.' + '#'.repeat(length) + '.');
  rows.push('.'.repeat(length + 2));
  const mid = 1 + Math.floor(width / 2);
  const put = (row, x, ch) => row.slice(0, x) + ch + row.slice(x + 1);
  rows[mid] = put(put(rows[mid], 1, 'A'), length, '1');
  return rows;
}
