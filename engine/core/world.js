// Deterministic lair simulation. Fixed step, no DOM, no renderer, no Math.random.
//
// A trap is a native-timed interaction: an agent that enters the sensor is captured and
// carried through windup (Mount), active (Loop) and winddown (Dismount); then the trap
// recharges. What happens to the captured agent in each phase is the trap's `ops`
// program (content data). An agent caught by a second trap before it walks again
// extends its combo.
import { createRng } from './rng.js';
import { Layout } from './layout.js';
import { distanceField, nextCell } from './nav.js';
import { calculateBudget } from './economy.js';

export const STEP = 1 / 60;

export const DEFAULT_RULES = {
  disarmSeconds: 2.5,   // time an agent spends disarming
  slamDamage: 8,        // health lost when thrown against a wall
  recover: 1.2,         // seconds on the floor when the trap has no dismount clip
  fleeSpeed: 1.6,       // speed multiplier of an agent that lost its resolve
  bubbleBoost: 2,       // push multiplier while inside a bubble
  retriggerGuard: 1.0,  // seconds before the same trap may catch the same agent again
  agentRadius: 0.25,
  waveGap: 8,           // seconds between waves when a wave has no explicit start
  origin: 'assumed',
};

const INSTANT = new Set(['damage', 'launch', 'extinguish', 'toll', 'status', 'slide', 'suspend']);
const TRANSPORT = new Set(['push', 'pull']);
const BUSY = new Set(['windup', 'active', 'winddown']);
const OUT = new Set(['dead', 'escaped', 'gone']);

export class World {
  constructor(content, scenario, { seed = 1 } = {}) {
    this.content = content;
    this.scenario = scenario;
    this.rules = { ...DEFAULT_RULES, ...(content.rules || {}) };
    this.seed = seed;
    this.layout = new Layout(scenario, content);
    const { layout } = this;
    this.gateAt = new Int16Array(layout.w * layout.h).fill(-1);
    for (const device of layout.devices) {
      if (device.def.gate) for (const c of device.cells) if (layout.isFloor(c.x, c.z)) this.gateAt[layout.index(c.x, c.z)] = device.index;
    }
    this.fields = new Map();
    for (const o of scenario.objectives) this.fields.set('o:' + o.id, distanceField(layout, [[o.x, o.z]]));
    for (const e of scenario.entrances) this.fields.set('e:' + e.id, distanceField(layout, [[e.x, e.z]]));
    for (const e of scenario.entrances) {
      for (const o of scenario.objectives) {
        if (layout.walkable(e.x, e.z) && !Number.isFinite(this.fields.get('o:' + o.id)[layout.index(e.x, e.z)])) {
          layout.problems.push({ level: 'warn', id: e.id, text: `Sem caminho da entrada ${e.label || e.id} até ${o.label || o.id}` });
        }
      }
    }
    this.listeners = [];
    this.reset();
  }

  reset() {
    this.time = 0; this.tick = 0; this.paused = false;
    this.rng = createRng(this.seed);
    this.agents = []; this.nextAgent = 1; this.events = []; this.queue = [];
    this.stats = { integrity: this.scenario.rules.integrity, spawned: 0, killed: 0, deserted: 0, escaped: 0, bestCombo: 0, combos: 0, gold: 0, disarmed: 0 };
    this.traps = this.layout.devices.map(device => ({
      index: device.index, id: device.id, type: device.type, device, def: device.def,
      state: device.valid && device.enabled ? 'idle' : 'off', until: 0,
      t0: 0, tA: 0, tW: 0, tE: 0, timeline: [], done: 0, captured: new Set(), fired: 0, lastFired: -1,
    }));
    this.running = false; this.ended = false;
  }

  on(listener) { this.listeners.push(listener); return () => { this.listeners = this.listeners.filter(l => l !== listener); }; }

  emit(type, data = {}) {
    const event = { t: Math.round(this.time * 1000) / 1000, type, ...data };
    this.events.push(event);
    for (const listener of this.listeners) listener(event);
    return event;
  }

  // ---- waves -------------------------------------------------------------------------------

  startWave(index, at = this.time) {
    if (calculateBudget(this.scenario, this.content).blocked) return false;
    const wave = this.scenario.waves[index];
    if (!wave) return 0;
    let last = at, count = 0;
    wave.groups.forEach((group, gi) => {
      for (let n = 0; n < (group.count | 0); n++) {
        const time = at + (group.delay || 0) + n * (group.interval ?? 2);
        this.queue.push({ time, order: this.queue.length, group, wave: index });
        last = Math.max(last, time); count++;
      }
    });
    this.queue.sort((a, b) => a.time - b.time || a.order - b.order);
    this.running = true; this.ended = false;
    this.emit('wave', { wave: index, name: wave.name, agents: count, at: Math.round(at * 1000) / 1000 });
    return last;
  }

  /** Schedules every wave: at its `at`, or `waveGap` seconds after the previous one finishes spawning. */
  startRun() {
    if (calculateBudget(this.scenario, this.content).blocked) return false;
    let cursor = this.time;
    this.scenario.waves.forEach((wave, i) => {
      const at = Number.isFinite(wave.at) && wave.at > 0 ? this.time + wave.at : cursor;
      cursor = this.startWave(i, at) + this.rules.waveGap;
    });
    return true;
  }

  spawn({ agent: type, level = 1, entrance, objective = 'nearest' }) {
    const { layout, content } = this;
    const from = this.scenario.entrances.find(e => e.id === entrance) || this.scenario.entrances[0];
    const kind = content.agents.types[type], tier = content.agents.levels[level];
    if (!from || !kind || !tier || !layout.walkable(from.x, from.z)) return null;
    let goal = this.scenario.objectives.find(o => o.id === objective);
    if (!goal) {
      const at = layout.index(from.x, from.z);
      goal = [...this.scenario.objectives].sort((a, b) => this.fields.get('o:' + a.id)[at] - this.fields.get('o:' + b.id)[at])[0];
    }
    const stat = name => Math.round(tier[name] * (kind.mult?.[name] ?? 1));
    const lane = () => (this.rng() - 0.5) * 0.5;
    const agent = {
      id: this.nextAgent++, type, level: String(level), family: kind.family || 'A',
      x: from.x + 0.5, z: from.z + 0.5, hx: 0, hz: 1, laneX: lane(), laneZ: lane(),
      speed: kind.speed, radius: this.rules.agentRadius,
      health: stat('health'), resolve: stat('resolve'), skill: stat('skill'),
      max: { health: stat('health'), resolve: stat('resolve'), skill: stat('skill') },
      mode: 'walk', since: this.time, walkTime: 0, waiting: false,
      trap: -1, transport: false, hidden: false, anim: null, motion: null, down: null,
      sunk: false, bubbleUntil: 0, statuses: [], combo: [], hits: [], visited: {}, lastTrap: -1, releasedAt: -99,
      entrance: from.id, goal: goal ? goal.id : null, born: this.time, endedAt: null, cause: null,
    };
    this.agents.push(agent);
    this.stats.spawned++;
    this.emit('spawn', { agent: agent.id, kind: type, level: agent.level, entrance: from.id, goal: agent.goal });
    return agent;
  }

  // ---- stepping ----------------------------------------------------------------------------

  advance(seconds) {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i++) this.step();
    return this;
  }

  step() {
    if (this.paused) return;
    this.time = ++this.tick * STEP;
    const now = this.time;
    while (this.queue.length && this.queue[0].time <= now) this.spawn(this.queue.shift().group);
    for (const agent of this.agents) if (!OUT.has(agent.mode)) this.#statuses(agent, STEP);
    for (const trap of this.traps) this.#trap(trap, now);
    for (const agent of this.agents) if (!OUT.has(agent.mode)) this.#agent(agent, now);
    this.#triggers(now);
    for (const agent of this.agents) if (!OUT.has(agent.mode)) this.#vitals(agent, now);
    if (this.running && !this.queue.length && this.agents.every(a => OUT.has(a.mode))) {
      this.running = false; this.ended = true;
      this.emit('runEnd', { ...this.stats });
    }
  }

  // ---- traps -------------------------------------------------------------------------------

  #durations(def) { return def.timing.interaction || def.timing; }

  #eligible(trap, agent, now, fresh) {
    if (OUT.has(agent.mode) || agent.mode === 'flee' || agent.mode === 'disarm' || agent.hidden) return false;
    if (trap.def.oncePerAgent && agent.visited[trap.id]) return false;
    if (agent.lastTrap === trap.index && now - agent.releasedAt < this.rules.retriggerGuard) return false;
    if (agent.mode === 'captured') return fresh && agent.transport && agent.trap !== trap.index;
    return true;
  }

  #triggers(now) {
    const { layout } = this;
    for (const agent of this.agents) {
      if (OUT.has(agent.mode)) continue;
      const sensing = layout.sensors[layout.index(Math.floor(agent.x), Math.floor(agent.z))];
      if (!sensing) continue;
      for (const index of sensing) {
        const trap = this.traps[index];
        if (trap.state === 'idle' && this.#eligible(trap, agent, now, true)) this.#fire(trap, agent, now);
      }
    }
  }

  #inZone(trap, agent) {
    return trap.device.zoneSet.has(this.layout.index(Math.floor(agent.x), Math.floor(agent.z)));
  }

  #fire(trap, trigger, now) {
    const { def } = trap;
    const everyone = this.agents.filter(a => this.#eligible(trap, a, now, true) && (a === trigger || this.#inZone(trap, a)));
    if (def.skill != null) {
      const expert = everyone.filter(a => a.mode === 'walk' && a.skill >= def.skill).sort((a, b) => b.skill - a.skill || a.id - b.id)[0];
      if (expert) {
        expert.skill -= def.skill;
        this.#setMode(expert, 'disarm', now); expert.down = { until: now + this.rules.disarmSeconds, tag: 'disarm' };
        trap.state = 'sabotaged'; trap.until = now + this.rules.disarmSeconds + def.timing.sabotaged;
        this.stats.disarmed++;
        this.emit('disarm', { trap: trap.id, kind: trap.type, agent: expert.id, skillLeft: expert.skill });
        return;
      }
    }
    const d = this.#durations(def);
    trap.t0 = now; trap.tA = now + d.windup; trap.tW = trap.tA + d.active; trap.tE = trap.tW + d.winddown;
    trap.state = 'windup'; trap.fired++; trap.lastFired = now; trap.done = 0;
    const start = { windup: trap.t0, active: trap.tA, winddown: trap.tW };
    const length = { windup: d.windup, active: d.active, winddown: d.winddown };
    const end = { windup: trap.tA, active: trap.tW, winddown: trap.tE, 'windup+active': trap.tW, 'active+winddown': trap.tE };
    trap.timeline = (def.ops || []).map((op, order) => {
      const phase = op.phase || 'active';
      const offset = op.at === 'peak' ? Math.min(def.peak ?? 0, length[phase]) : 0;
      return { op, order, phase, time: start[phase] + offset, end: end[op.span || phase] };
    }).sort((a, b) => a.time - b.time || a.order - b.order);
    this.emit('fire', { trap: trap.id, kind: trap.type, by: trigger.id });
    const targets = def.targets === 'single' ? [trigger] : everyone;
    for (const agent of targets) this.#capture(trap, agent, now);
    this.#trap(trap, now);
  }

  #capture(trap, agent, now) {
    const previous = agent.mode === 'captured' ? this.traps[agent.trap] : null;
    if (previous) previous.captured.delete(agent.id);
    if (agent.mode === 'walk') agent.combo = [];
    if (!agent.combo.includes(trap.index)) agent.combo.push(trap.index);
    agent.hits.push(trap.type);
    agent.visited[trap.id] = true;
    this.#setMode(agent, 'captured', now);
    agent.trap = trap.index; agent.motion = null; agent.down = null; agent.waiting = false;
    agent.transport = (trap.def.ops || []).some(op => TRANSPORT.has(op.op));
    agent.anim = { trap: trap.type, phase: now >= trap.tW ? 'dismount' : now >= trap.tA ? 'loop' : 'mount', since: now };
    trap.captured.add(agent.id);
    this.emit('capture', { trap: trap.id, kind: trap.type, agent: agent.id, combo: agent.combo.length });
    if (agent.combo.length >= 2) {
      this.stats.bestCombo = Math.max(this.stats.bestCombo, agent.combo.length);
      if (agent.combo.length === 3) this.stats.combos++;
      this.emit('combo', { agent: agent.id, count: agent.combo.length, traps: agent.combo.map(i => this.traps[i].type) });
    }
  }

  #trap(trap, now) {
    if (trap.state === 'off' || trap.state === 'idle') return;
    if (trap.state === 'recharge' || trap.state === 'sabotaged') {
      if (now >= trap.until) { trap.state = 'idle'; this.emit('ready', { trap: trap.id, kind: trap.type }); }
      return;
    }
    const { def } = trap;
    const captured = () => [...trap.captured].map(id => this.agents[id - 1]).filter(a => a.mode === 'captured' && a.trap === trap.index);
    // Phase changes first, so an op scheduled at a phase start sees the right state.
    if (trap.state === 'windup' && now >= trap.tA) {
      trap.state = 'active';
      for (const a of captured()) a.anim = { trap: trap.type, phase: 'loop', since: trap.tA };
    }
    if (trap.state === 'active' && now >= trap.tW) {
      trap.state = 'winddown';
      for (const a of captured()) {
        if (def.gate) this.#release(trap, a, now, false);
        else a.anim = { trap: trap.type, phase: 'dismount', since: trap.tW };
      }
    }
    if (def.late && trap.state === 'active') {
      for (const agent of this.agents) {
        if (trap.captured.has(agent.id) || !this.#inZone(trap, agent) || !this.#eligible(trap, agent, now, false)) continue;
        this.#capture(trap, agent, now);
        for (let i = 0; i < trap.done; i++) {
          const item = trap.timeline[i];
          if (INSTANT.has(item.op.op) && agent.mode === 'captured' && agent.trap === trap.index) this.#instant(trap, item, agent, now);
        }
      }
    }
    while (trap.done < trap.timeline.length && trap.timeline[trap.done].time <= now) {
      const item = trap.timeline[trap.done++];
      if (INSTANT.has(item.op.op)) for (const a of captured()) this.#instant(trap, item, a, now);
    }
    for (const item of trap.timeline) {
      if (INSTANT.has(item.op.op) || now < item.time || now >= item.end) continue;
      for (const a of captured()) this.#continuous(trap, item, a, now);
    }
    if (now >= trap.tE) {
      for (const a of captured()) this.#release(trap, a, now, Boolean(def.release));
      trap.captured.clear();
      const recharge = def.timing.recharge;
      trap.state = recharge > 0 ? 'recharge' : 'idle'; trap.until = now + recharge;
      this.emit('spent', { trap: trap.id, kind: trap.type, recharge });
    }
  }

  #direction(trap, agent, dir) {
    if (dir === 'heading') return [agent.hx, agent.hz];
    if (dir === 'diagonal') return trap.device.diagonal;
    if (dir === 'away') {
      const dx = agent.x - trap.device.center[0], dz = agent.z - trap.device.center[1], l = Math.hypot(dx, dz) || 1;
      return [dx / l, dz / l];
    }
    return trap.device.facing;
  }

  #free(trap, agent, now) {
    trap.captured.delete(agent.id);
    agent.lastTrap = trap.index; agent.releasedAt = now; agent.transport = false; agent.hidden = false; agent.sunk = false;
  }

  #instant(trap, item, agent, now) {
    const { op } = item;
    switch (op.op) {
      case 'damage': this.#hurt(agent, op.stat, op.amount, trap); break;
      case 'status':
        agent.statuses = agent.statuses.filter(s => s.kind !== op.kind);
        agent.statuses.push({ kind: op.kind, stat: op.stat, perSecond: op.perSecond, until: now + op.duration, trap: trap.index });
        break;
      case 'extinguish': agent.statuses = agent.statuses.filter(s => s.kind !== 'burning'); break;
      case 'toll': this.stats.gold += op.gold; this.emit('toll', { trap: trap.id, agent: agent.id, gold: op.gold }); break;
      case 'launch': case 'slide': case 'suspend': {
        const [dx, dz] = this.#direction(trap, agent, op.dir);
        this.#free(trap, agent, now);
        this.#setMode(agent, 'forced', now);
        agent.motion = { vx: dx * op.speed, vz: dz * op.speed, speed: op.speed, tag: op.tag, trap: trap.index,
          remaining: op.op === 'launch' ? op.distance : Infinity, until: op.op === 'launch' ? Infinity : item.end,
          airborne: op.op !== 'slide', slams: op.op === 'launch', floats: op.op === 'suspend' };
        if (op.op === 'suspend') agent.bubbleUntil = item.end;
        if (dx || dz) { agent.hx = dx; agent.hz = dz; }
        agent.anim = { trap: trap.type, phase: 'loop', since: now };
        break;
      }
    }
  }

  #continuous(trap, item, agent, now) {
    const { op } = item;
    if (op.op === 'dot') { this.#hurt(agent, op.stat, op.perSecond * STEP, trap); return; }
    if (op.op === 'sink') {
      // In the pit (or swallowed, when the op hides the agent). The body drifts off the rim towards the middle.
      const last = now + STEP >= item.end;
      agent.sunk = !last; agent.hidden = Boolean(op.hide) && !last;
      const { device } = trap, inset = Math.min(1.1, device.W / 2 - 0.2, device.D / 2 - 0.2);
      const tx = Math.max(device.x + inset, Math.min(device.x + device.W - inset, agent.x));
      const tz = Math.max(device.z + inset, Math.min(device.z + device.D - inset, agent.z));
      const dx = tx - agent.x, dz = tz - agent.z, distance = Math.hypot(dx, dz);
      if (distance > 1e-3) { const step = Math.min(distance, 1.5 * STEP); agent.x += dx / distance * step; agent.z += dz / distance * step; }
      return;
    }
    if (op.op === 'push') {
      const [dx, dz] = trap.device.facing;
      const boost = agent.bubbleUntil > now ? this.rules.bubbleBoost : 1;
      const speed = op.speed * boost;
      agent.hx = dx; agent.hz = dz;
      const blocked = this.#move(agent, dx * speed * STEP, dz * speed * STEP);
      if (blocked) { this.#free(trap, agent, now); this.#slam(agent, trap, now); return; }
      if (!this.#inZone(trap, agent) || now + STEP >= item.end) {
        this.#free(trap, agent, now);
        this.#setMode(agent, 'forced', now);
        agent.motion = { vx: dx * speed, vz: dz * speed, speed, tag: op.tag, trap: trap.index, remaining: (op.coast ?? 0) * boost, until: Infinity, airborne: boost > 1, slams: true };
      }
      return;
    }
    if (op.op === 'pull') {
      const { device } = trap;
      let tx, tz;
      if (op.to === 'front') [tx, tz] = device.front; else [tx, tz] = device.center;
      const dx = tx - agent.x, dz = tz - agent.z, distance = Math.hypot(dx, dz);
      const stop = op.to === 'edge' ? Math.max(device.W, device.D) / 2 + 0.45 : 0.08;
      if (distance <= stop) { agent.transport = false; return; }
      const step = Math.min(op.speed * STEP, distance - stop);
      agent.hx = dx / distance; agent.hz = dz / distance;
      // Pulled agents ignore device bodies (they end on or against the device) but not rock.
      const nx = agent.x + agent.hx * step, nz = agent.z + agent.hz * step;
      if (this.layout.isFloor(Math.floor(nx), Math.floor(nz))) { agent.x = nx; agent.z = nz; } else agent.transport = false;
    }
  }

  #release(trap, agent, now, toFloor) {
    this.#free(trap, agent, now);
    if (toFloor) {
      this.#setMode(agent, 'down', now);
      agent.down = { until: now + (trap.def.release?.seconds ?? this.#recover(trap.def, agent)), tag: trap.def.release?.tag || 'recover' };
      agent.anim = { trap: trap.type, phase: trap.def.release ? 'loop' : 'dismount', since: now };
    } else this.#walk(agent, now);
    this.emit('release', { trap: trap.id, agent: agent.id });
  }

  #recover(def, agent) { return def.recover?.[agent.family] ?? def.recover?.A ?? this.rules.recover; }

  // ---- agents ------------------------------------------------------------------------------

  #setMode(agent, mode, now) { agent.mode = mode; agent.since = now; }

  #walk(agent, now) {
    this.#setMode(agent, 'walk', now);
    agent.anim = null; agent.motion = null; agent.down = null; agent.trap = -1; agent.walkTime = 0;
    if (agent.combo.length >= 2) this.emit('comboEnd', { agent: agent.id, count: agent.combo.length });
    agent.combo = [];
  }

  #gateClosed(index) { return this.traps[index].state !== 'winddown' && this.traps[index].state !== 'off'; }

  #blockedAt(px, pz, fromGate = -1) {
    const x = Math.floor(px), z = Math.floor(pz);
    if (!this.layout.walkable(x, z)) return true;
    const gate = this.gateAt[this.layout.index(x, z)];
    return gate !== -1 && gate !== fromGate && this.#gateClosed(gate);
  }

  /** Kinematic move with wall collision. Returns true when stopped by rock, a device body or a closed gate. */
  #move(agent, dx, dz) {
    const distance = Math.hypot(dx, dz);
    if (!distance) return false;
    const n = Math.ceil(distance / 0.2), ux = dx / distance, uz = dz / distance, r = agent.radius;
    const here = this.gateAt[this.layout.index(Math.floor(agent.x), Math.floor(agent.z))];
    for (let k = 0; k < n; k++) {
      const nx = agent.x + dx / n, nz = agent.z + dz / n;
      if (this.#blockedAt(nx + ux * r, nz + uz * r, here)) return true;
      agent.x = nx; agent.z = nz;
    }
    return false;
  }

  #slam(agent, trap, now) {
    this.emit('slam', { agent: agent.id, trap: trap.id });
    this.#hurt(agent, 'health', this.rules.slamDamage, trap);
    this.#land(agent, trap, now);
  }

  #land(agent, trap, now) {
    this.#setMode(agent, 'down', now);
    agent.motion = null;
    agent.down = { until: now + this.#recover(trap.def, agent), tag: 'recover' };
    agent.anim = { trap: trap.type, phase: 'dismount', since: now };
  }

  #hurt(agent, stat, amount, trap) {
    if (!amount) return;
    agent[stat] = Math.max(0, Math.min(agent.max[stat], agent[stat] - amount));
    if (amount > 0) { agent.cause = trap ? trap.type : agent.cause; if (stat === 'health') agent.bubbleUntil = 0; }
  }

  #statuses(agent, dt) {
    if (!agent.statuses.length) return;
    for (const s of agent.statuses) this.#hurt(agent, s.stat, s.perSecond * dt, this.traps[s.trap]);
    agent.statuses = agent.statuses.filter(s => s.until > this.time);
  }

  #vitals(agent, now) {
    if (agent.health <= 0) {
      if (agent.mode === 'captured') this.traps[agent.trap].captured.delete(agent.id);
      // Whoever dies inside a pit or a plant is not seen again.
      this.#setMode(agent, 'dead', now); agent.endedAt = now; agent.hidden = agent.hidden || Boolean(agent.sunk); agent.motion = null;
      this.stats.killed++;
      this.emit('kill', { agent: agent.id, by: agent.cause, combo: agent.combo.length });
    } else if (agent.resolve <= 0 && agent.mode !== 'flee' && agent.mode !== 'captured' && agent.mode !== 'forced') {
      this.#setMode(agent, 'flee', now); agent.anim = null; agent.motion = null; agent.down = null; agent.combo = [];
      this.stats.deserted++;
      this.emit('desert', { agent: agent.id, by: agent.cause });
    }
  }

  #agent(agent, now) {
    switch (agent.mode) {
      case 'walk': case 'flee': return this.#navigate(agent, now);
      case 'forced': {
        const m = agent.motion;
        const step = m.speed * STEP;
        const blocked = this.#move(agent, m.vx / m.speed * step, m.vz / m.speed * step);
        m.remaining -= step;
        const trap = this.traps[m.trap];
        if (now >= m.until || m.remaining <= 0) this.#land(agent, trap, now);
        else if (blocked && m.slams) this.#slam(agent, trap, now);
        else if (blocked && !m.floats) this.#land(agent, trap, now);
        return;
      }
      case 'down': case 'disarm':
        if (now >= agent.down.until) this.#walk(agent, now);
        return;
    }
  }

  #navigate(agent, now) {
    const { layout } = this;
    const fleeing = agent.mode === 'flee';
    const field = this.fields.get(fleeing ? 'e:' + agent.entrance : 'o:' + agent.goal);
    const cx = Math.floor(agent.x), cz = Math.floor(agent.z);
    agent.waiting = false;
    if (!field) return;
    if (field[layout.index(cx, cz)] === 0) {
      agent.endedAt = now;
      if (fleeing) { this.#setMode(agent, 'gone', now); this.emit('gone', { agent: agent.id }); return; }
      this.#setMode(agent, 'escaped', now);
      this.stats.escaped++; this.stats.integrity = Math.max(0, this.stats.integrity - 1);
      this.emit('escape', { agent: agent.id, goal: agent.goal, integrity: this.stats.integrity });
      return;
    }
    if (!Number.isFinite(field[layout.index(cx, cz)])) {
      // Thrown into a pocket with no way out: give up after a moment instead of standing forever.
      agent.waiting = true; agent.stranded = (agent.stranded || 0) + STEP;
      if (agent.stranded > 5) {
        agent.stranded = 0;
        if (fleeing) { agent.endedAt = now; this.#setMode(agent, 'gone', now); this.emit('gone', { agent: agent.id, stranded: true }); } else {
          this.#setMode(agent, 'flee', now); this.stats.deserted++; this.emit('desert', { agent: agent.id, by: 'stranded' });
        }
      }
      return;
    }
    const here = this.gateAt[layout.index(cx, cz)];
    // Doors open from the inside: an agent on its way out is never held by a gate.
    const next = nextCell(layout, field, cx, cz, fleeing ? null : (x, z) => {
      const gate = this.gateAt[layout.index(x, z)];
      return gate !== -1 && gate !== here && this.#gateClosed(gate);
    });
    if (!next || next.blocked) { agent.waiting = true; return; }
    const tx = next.cell[0] + 0.5 + agent.laneX, tz = next.cell[1] + 0.5 + agent.laneZ;
    const dx = tx - agent.x, dz = tz - agent.z, distance = Math.hypot(dx, dz) || 1;
    const speed = agent.speed * (fleeing ? this.rules.fleeSpeed : 1);
    const step = Math.min(speed * STEP, distance);
    agent.x += dx / distance * step; agent.z += dz / distance * step;
    // Heading eases towards the travel direction so the body does not snap at cell borders.
    const k = Math.min(1, 10 * STEP);
    agent.hx += (dx / distance - agent.hx) * k; agent.hz += (dz / distance - agent.hz) * k;
    const l = Math.hypot(agent.hx, agent.hz) || 1; agent.hx /= l; agent.hz /= l;
    agent.walkTime += STEP * (fleeing ? this.rules.fleeSpeed : 1);
  }

  // ---- inspection --------------------------------------------------------------------------

  snapshot() {
    return {
      time: this.time, tick: this.tick, stats: { ...this.stats }, running: this.running, ended: this.ended,
      agents: this.agents.map(a => ({ ...a, motion: a.motion && { ...a.motion }, down: a.down && { ...a.down }, anim: a.anim && { ...a.anim },
        max: { ...a.max }, statuses: a.statuses.map(s => ({ ...s })), combo: [...a.combo], hits: [...a.hits], visited: { ...a.visited } })),
      traps: this.traps.map(t => ({ id: t.id, type: t.type, state: t.state, until: t.until, fired: t.fired, captured: [...t.captured], t0: t.t0, tA: t.tA, tW: t.tW, tE: t.tE })),
      problems: this.layout.problems,
    };
  }
}
