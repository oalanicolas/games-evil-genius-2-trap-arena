// Scenario document -> derived, immutable layout: floor grid, placed devices with their
// world cells, blocked cells and a list of problems the editor shows to the author.
import { edgeDirection, expandCells, facing, localToOffset, localToWorld, rotatedSize, rotateVector } from './grid.js';
import { calculateBudget, validateGoldBudget } from './economy.js';

export const SCHEMA = 'lair-scenario/1';
export const ROCK = '.';

export function emptyScenario(w = 48, h = 32, name = 'Novo covil') {
  return {
    schema: SCHEMA, name, pack: 'eg2', w, h,
    floor: Array.from({ length: h }, () => ROCK.repeat(w)),
    traps: [], entrances: [], objectives: [],
    waves: [{ name: 'Onda 1', at: 0, groups: [] }],
    rules: { integrity: 10 },
  };
}

/** Structural normalisation: a scenario that came from disk or from an older build is made safe to use. */
export function normaliseScenario(input) {
  if (!input || input.schema !== SCHEMA) throw new Error('Cenário inválido: esperado ' + SCHEMA);
  const s = structuredClone(input);
  s.w = Math.max(4, Math.min(160, s.w | 0));
  s.h = Math.max(4, Math.min(160, s.h | 0));
  const rows = Array.isArray(s.floor) ? s.floor : [];
  s.floor = Array.from({ length: s.h }, (_, z) => (String(rows[z] ?? '') + ROCK.repeat(s.w)).slice(0, s.w));
  for (const key of ['traps', 'entrances', 'objectives', 'waves']) if (!Array.isArray(s[key])) s[key] = [];
  s.traps.forEach((t, i) => { t.id ??= 't' + (i + 1); t.rot = (t.rot | 0) & 3; t.enabled = t.enabled !== false; });
  s.rules = { integrity: 10, ...(s.rules || {}) };
  validateGoldBudget(s.rules.goldBudget);
  for (const wave of s.waves) if (!Array.isArray(wave.groups)) wave.groups = [];
  return s;
}

export class Layout {
  constructor(scenario, content) {
    this.scenario = scenario;
    this.content = content;
    this.w = scenario.w;
    this.h = scenario.h;
    const n = this.w * this.h;
    this.floor = new Uint8Array(n);
    for (let z = 0; z < this.h; z++) {
      const row = scenario.floor[z];
      for (let x = 0; x < this.w; x++) this.floor[z * this.w + x] = row[x] === ROCK ? 0 : row.charCodeAt(x);
    }
    this.solid = new Uint8Array(n);
    this.occupied = new Int16Array(n).fill(-1);
    this.budget = calculateBudget(scenario, content);
    this.problems = [...this.budget.problems];
    this.devices = scenario.traps.map((placed, index) => this.#place(placed, index)).filter(Boolean);
    this.sensors = Array.from({ length: n }, () => null);
    for (const device of this.devices) {
      for (const index of device.sensor) (this.sensors[index] ??= []).push(device.index);
    }
    this.#checkPoints();
  }

  index(x, z) { return z * this.w + x; }
  inside(x, z) { return x >= 0 && z >= 0 && x < this.w && z < this.h; }
  isFloor(x, z) { return this.inside(x, z) && this.floor[z * this.w + x] !== 0; }
  /** Static walkability: floor not covered by a device body. Closed gates are dynamic and live in the world. */
  walkable(x, z) { return this.isFloor(x, z) && !this.solid[z * this.w + x]; }
  cellOf(px, pz) { return [Math.floor(px), Math.floor(pz)]; }

  #place(placed, index) {
    const def = this.content.traps[placed.type];
    if (!def) { this.problems.push({ level: 'error', id: placed.id, text: `Tipo desconhecido: ${placed.type}` }); return null; }
    const { w, d } = def.footprint;
    const rot = placed.rot & 3;
    const [W, D] = rotatedSize(w, d, rot);
    const toWorld = (i, j) => { const [dx, dz] = localToOffset(i, j, w, d, rot); return [placed.x + dx, placed.z + dz]; };
    const device = {
      index, id: placed.id, type: placed.type, def, x: placed.x, z: placed.z, rot, W, D,
      enabled: placed.enabled !== false, level: placed.level ?? 1,
      facing: facing(rot),
      // Bounce direction of the triangle bumper: away from its hypotenuse (native edge slots +x and +y).
      diagonal: rotateVector(Math.SQRT1_2, Math.SQRT1_2, rot),
      center: [placed.x + W / 2, placed.z + D / 2],
      front: localToWorld(w / 2, d + 0.35, w, d, placed.x, placed.z, rot),
      cells: [], sensor: [], zone: [], valid: true,
    };
    const fail = text => { device.valid = false; this.problems.push({ level: 'error', id: placed.id, text: `${def.pt || def.name}: ${text}` }); };
    let offFloor = false, overlap = false, wallMissing = false;
    for (const cell of def.cells) {
      const [x, z] = toWorld(cell.i, cell.j);
      device.cells.push({ x, z, solid: def.blocks ? true : cell.solid, clear: cell.clear });
      if (!this.isFloor(x, z)) { offFloor = true; continue; }
      const at = this.index(x, z);
      if (this.occupied[at] !== -1) overlap = true;
      this.occupied[at] = index;
      if (def.blocks || cell.solid) this.solid[at] = 1;
      for (const edge of cell.wall) {
        const [ex, ez] = edgeDirection(edge, rot);
        if (this.isFloor(x + ex, z + ez)) wallMissing = true;
      }
    }
    if (offFloor) fail('parte da base está fora do piso');
    if (overlap) fail('sobrepõe outro dispositivo');
    if (wallMissing) fail(def.mount === 'opposing_walls' || def.mount === 'gate'
      ? 'precisa de paredes dos dois lados, na largura da base' : 'precisa estar encostada na parede');
    const cellsOf = spec => expandCells(spec, def).map(([i, j]) => toWorld(i, j))
      .filter(([x, z]) => this.isFloor(x, z)).map(([x, z]) => this.index(x, z));
    device.sensor = cellsOf(def.sensor ?? 'footprint');
    device.zone = cellsOf(def.zone ?? def.sensor ?? 'footprint');
    device.zoneSet = new Set(device.zone);
    device.sensorSet = new Set(device.sensor);
    return device;
  }

  #checkPoints() {
    const s = this.scenario;
    const ids = new Set();
    for (const kind of ['entrances', 'objectives']) {
      for (const point of s[kind]) {
        if (ids.has(point.id)) this.problems.push({ level: 'error', id: point.id, text: `Identificador repetido: ${point.id}` });
        ids.add(point.id);
        if (!this.walkable(point.x, point.z)) {
          this.problems.push({ level: 'error', id: point.id, text: `${kind === 'entrances' ? 'Entrada' : 'Objetivo'} ${point.label || point.id} está fora do piso livre` });
        }
      }
    }
    if (!s.entrances.length) this.problems.push({ level: 'warn', text: 'Nenhuma entrada de agentes.' });
    if (!s.objectives.length) this.problems.push({ level: 'warn', text: 'Nenhum objetivo: os agentes não têm para onde ir.' });
    const entrance = new Set(s.entrances.map(e => e.id)), objective = new Set(s.objectives.map(o => o.id));
    s.waves.forEach((wave, wi) => wave.groups.forEach((group, gi) => {
      const where = `${wave.name || 'Onda ' + (wi + 1)}, grupo ${gi + 1}`;
      if (!entrance.has(group.entrance)) this.problems.push({ level: 'error', text: `${where}: entrada inexistente` });
      if (group.objective && group.objective !== 'nearest' && !objective.has(group.objective)) this.problems.push({ level: 'error', text: `${where}: objetivo inexistente` });
      if (!this.content.agents.types[group.agent]) this.problems.push({ level: 'error', text: `${where}: tipo de agente desconhecido` });
      if (!this.content.agents.levels[group.level]) this.problems.push({ level: 'error', text: `${where}: nível desconhecido` });
    }));
  }
}
