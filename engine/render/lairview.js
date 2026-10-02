// Ties the core world to the scene: one LevelView, one DeviceView per device, one AgentView per
// agent alive. `sync` is called once per rendered frame with the world's current time.
import { Stage } from './stage.js';
import { LevelView } from './level.js';
import { DeviceView } from './devices.js';
import { AgentView } from './agents.js';
import { viewOf } from './views.js';

export class LairView {
  constructor(container, assets) {
    this.assets = assets; this.stage = new Stage(container);
    assets.renderer = this.stage.renderer;
    this.level = new LevelView(assets, this.stage);
    this.devices = new Map(); this.agents = new Map(); this.world = null; this.selected = null;
  }

  async prepare() { await this.level.prepare(); }

  /** Rebuild the scene for a (new) world. `frame` recentres the cameras. */
  setWorld(world, { frame = false } = {}) {
    this.world = world;
    const { layout } = world;
    const pits = new Set();
    for (const device of layout.devices) {
      if (viewOf(device.type).pit && device.valid) for (const c of device.cells) if (layout.isFloor(c.x, c.z)) pits.add(layout.index(c.x, c.z));
    }
    this.level.build(layout, { pits }); this.level.setPoints(world.scenario);
    for (const view of this.devices.values()) view.dispose();
    this.devices.clear(); this.clearAgents();
    for (const device of layout.devices) {
      const view = new DeviceView(this.assets, device, { wallClip: this.level.clip });
      this.stage.scene.add(view.root); this.devices.set(device.id, view);
    }
    if (frame) this.stage.frame(layout.w, layout.h);
    this.select(this.selected);
  }

  clearAgents() { for (const view of this.agents.values()) view.dispose(); this.agents.clear(); }

  select(id) {
    this.selected = id;
    for (const [key, view] of this.devices) view.setSelected(key === id);
  }

  sync() {
    const { world } = this; if (!world) return;
    const now = world.time;
    for (const trap of world.traps) this.devices.get(trap.id)?.update(trap, now);
    for (const agent of world.agents) {
      let view = this.agents.get(agent.id);
      const gone = agent.mode === 'escaped' || agent.mode === 'gone' || (agent.mode === 'dead' && now - agent.endedAt > 3);
      if (gone) { if (view) { view.dispose(); this.agents.delete(agent.id); } continue; }
      if (!view) { view = new AgentView(this.assets, world.content, agent); this.stage.scene.add(view.root); this.agents.set(agent.id, view); }
      view.update(agent, world, now, this.stage.camera);
    }
    this.stage.render();
  }

  get loading() { return [...this.devices.values()].filter(v => !v.ready).length + [...this.agents.values()].filter(v => !v.ready).length; }
}
