// One placed device: native model (rigged when the pack has its skeleton and clips), the
// authored effect, a selection outline and a recharge gauge. Reads the trap runtime state.
import * as THREE from 'three';
import { NativeRig } from '../../native-player.js';
import { EFFECTS } from './fx.js';
import { pivotZ, viewOf } from './views.js';

const BUSY = new Set(['windup', 'active', 'winddown']);

export class DeviceView {
  constructor(assets, device, { wallClip = null } = {}) {
    this.assets = assets; this.device = device; this.def = device.def; this.view = viewOf(device.type);
    this.wallClip = wallClip; this.ownMaterials = [];
    const { w, d } = this.def.footprint;
    this.root = new THREE.Group();
    this.root.position.set(device.center[0], 0, device.center[1]);
    this.root.rotation.y = device.rot * Math.PI / 2;
    this.root.userData.device = device.id;
    // Selection outline on the footprint.
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w - 0.06, 0.02, d - 0.06)),
      new THREE.LineBasicMaterial({ color: '#ffd24a', depthTest: false, transparent: true }));
    outline.position.y = 0.06; outline.renderOrder = 9; outline.visible = false; this.outline = outline; this.root.add(outline);
    // Recharge gauge: a ring that fills while the trap recovers.
    this.gauge = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 28, 1, 0, 0.01), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide }));
    this.gauge.rotation.x = -Math.PI / 2; this.gauge.position.y = 0.09; this.gauge.renderOrder = 9; this.gauge.visible = false; this.gaugeValue = -1;
    this.root.add(this.gauge);
    this.rigs = []; this.clips = {}; this.fx = null; this.ready = false; this.disposed = false;
    this.load().catch(error => console.error('Dispositivo', device.type, error));
  }

  async load() {
    const { assets, def, view } = this;
    const names = def.view.models, primary = names[0];
    await Promise.all([...names, ...(view.companions || []).map(c => c.model)].map(n => assets.load(n)));
    if (this.disposed) return;
    const holders = [0, ...(view.mirror ? [1] : [])].map(side => {
      const holder = new THREE.Group();
      holder.position.z = pivotZ(view, def) * (side ? -1 : 1);
      holder.rotation.y = view.yaw + (side ? Math.PI : 0);
      holder.scale.z = -1; // un-mirror the native model, see views.js
      if (view.turn) { const inner = new THREE.Group(); inner.rotation.set(...view.turn); holder.add(inner); holder.userData.inner = inner; }
      this.root.add(holder); return holder;
    });
    const rigInfo = def.view.rig;
    for (const holder of holders) {
      const target = holder.userData.inner || holder;
      if (rigInfo && def.view.rigModel === primary) {
        const rig = await assets.file(rigInfo.path);
        if (this.disposed) return;
        const native = new NativeRig(rig.bones, { [primary]: rig }, n => assets.clone(n));
        target.add(native.root); this.rigs.push({ native, kind: 'device' });
      } else target.add(assets.clone(primary));
      for (const name of names.slice(1)) if (!(view.companions || []).some(c => c.model === name)) target.add(assets.clone(name));
    }
    for (const companion of view.companions || []) {
      const holder = holders[0];
      const rigPath = `rigs/${companion.model}.json`;
      if (companion.clip) {
        const [rig, clip] = await Promise.all([assets.file(rigPath), assets.file(`clips/${companion.clip}.json`)]);
        if (this.disposed) return;
        const native = new NativeRig(rig.bones, { [companion.model]: rig }, n => assets.clone(n));
        holder.add(native.root); this.rigs.push({ native, kind: 'companion', clip, when: companion.when });
      } else holder.add(assets.clone(companion.model));
    }
    if (view.door) this.#door(holders[0]);
    // Open architecture follows the wall cutaway. Tall walls expose the native
    // lintel; low walls retain the jambs without hiding agents and trap action.
    if (def.passage && this.wallClip) for (const holder of holders) holder.traverse(object => {
      if (!object.isMesh) return;
      const material = object.material.clone();
      material.clippingPlanes = [this.wallClip]; material.clipShadows = true;
      object.material = material; this.ownMaterials.push(material);
    });
    for (const [phase, info] of Object.entries(def.view.device || {})) this.clips[phase] = await assets.file(info.path);
    if (this.disposed) return;
    if (view.bind && this.clips[view.bind.clip]) {
      for (const { native, kind } of this.rigs) {
        if (kind !== 'device') continue;
        const rest = native.bones.map(b => ({ p: b.position.clone(), q: b.quaternion.clone() }));
        native.play(this.clips[view.bind.clip], 0);
        native.bones.forEach((bone, i) => { if (!view.bind.bones.includes(bone.name)) { bone.position.copy(rest[i].p); bone.quaternion.copy(rest[i].q); } });
        // Inverses in the rig's own space: the rig already hangs under the placed holder.
        this.root.updateMatrixWorld(true);
        const local = native.pose.matrixWorld.clone().invert();
        native.bones.forEach((bone, i) => native.skeleton.boneInverses[i].copy(bone.matrixWorld).premultiply(local).invert());
      }
    }
    if (view.fx && EFFECTS[view.fx]) {
      const zoneDepth = this.def.zone ? 8 : 0;
      this.fx = EFFECTS[view.fx]({ w: def.footprint.w, d: def.footprint.d, reach: zoneDepth || 8, colour: view.colour });
      this.root.add(this.fx.object);
    }
    this.root.traverse(o => { o.userData.device = this.device.id; });
    this.ready = true; this.#pose(null, 0);
  }

  // The frame carries the leaf; the leaf sinks into the floor while the gate is open (authored motion).
  #door(holder) {
    const leaf = holder.children.find(c => c.name === 'door_standard');
    this.leaf = leaf;
  }

  setSelected(on) { this.outline.visible = on; }

  /** 0..1: how strongly the trap is acting, with a short ramp at both ends. */
  #level(trap, now) {
    if (!trap || !BUSY.has(trap.state)) return 0;
    const start = trap.tA, end = trap.tW, ramp = 0.25;
    if (now < start) return this.view.fx === 'water' ? Math.min(1, (now - trap.t0) / Math.max(0.2, start - trap.t0 + 0.3)) : 0;
    if (now < end) return Math.min(1, (now - start) / ramp + 0.15);
    return Math.max(0, 1 - (now - end) / Math.max(ramp, trap.tE - end));
  }

  #pose(trap, now) {
    const { mount, loop, dismount } = this.clips;
    const rest = () => dismount ? [dismount, dismount.duration] : mount ? [mount, 0] : loop ? [loop, 0] : null;
    let pick = rest();
    if (trap && trap.fired && (BUSY.has(trap.state) || (dismount && now - trap.tW < dismount.duration))) {
      const t = now - trap.t0;
      if (now < trap.tW) {
        if (mount && t < mount.duration) pick = [mount, t];
        else if (loop) pick = [loop, (t - (mount?.duration || 0)) % loop.duration];
        else if (mount) pick = [mount, mount.duration];
      } else if (dismount) pick = [dismount, Math.min(dismount.duration, now - trap.tW)];
      else if (mount) pick = [mount, Math.max(0, mount.duration - (now - trap.tW))];
    }
    const open = trap && BUSY.has(trap.state);
    for (const rig of this.rigs) {
      if (rig.kind === 'device') { if (pick) rig.native.play(pick[0], pick[1]); } else {
        rig.native.root.visible = rig.when !== 'open' || Boolean(open && now >= trap.tA - 0.1);
        if (rig.native.root.visible) rig.native.play(rig.clip, now % rig.clip.duration);
      }
    }
  }

  update(trap, now) {
    if (!this.ready) return;
    this.#pose(trap, now);
    const level = this.#level(trap, now);
    if (this.fx) this.fx.update(now, level, trap);
    if (this.leaf) {
      const open = trap.state === 'winddown' ? Math.min(1, (now - trap.tW) / 0.5, Math.max(0, (trap.tE - now) / 0.5)) : 0;
      this.leaf.position.y = -2.8 * open;
    }
    // Recharge / sabotage gauge.
    const waiting = trap.state === 'recharge' || trap.state === 'sabotaged';
    this.gauge.visible = waiting;
    if (waiting) {
      const total = trap.state === 'recharge' ? this.def.timing.recharge : this.def.timing.sabotaged + 2.5;
      const value = Math.round(Math.max(0, Math.min(1, 1 - (trap.until - now) / Math.max(0.1, total))) * 40) / 40;
      if (value !== this.gaugeValue) {
        this.gaugeValue = value; this.gauge.geometry.dispose();
        this.gauge.geometry = new THREE.RingGeometry(0.26, 0.4, 32, 1, Math.PI / 2, -Math.PI * 2 * Math.max(0.02, value));
      }
      this.gauge.material.color.set(trap.state === 'sabotaged' ? '#ff5a4f' : '#ffd24a');
    }
  }

  dispose() {
    this.disposed = true;
    for (const rig of this.rigs) rig.native.dispose();
    this.ownMaterials.forEach(material => material.dispose());
    this.root.parent?.remove(this.root);
  }
}
