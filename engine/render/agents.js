// Agent bodies: native skinned parts on the native skeleton, the type's native walk clip and
// the trap's native reaction clips (Mount / Loop / Dismount for the agent's rig family).
// The core decides where the agent is and what is happening to it; this file only shows it.
import * as THREE from 'three';
import { NativeRig } from '../../native-player.js';

const BLEND = 0.16;
const AIRBORNE_LIFT = { bubble: 0.9, launched: 0.55, bounced: 0.5, blown: 0.35 };
const BACKWARDS = new Set(['launched', 'bounced', 'blown', 'pulled']);

function barsTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 48;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture, key: '' };
}

function drawBars(bars, agent, colour, label) {
  const key = [Math.ceil(agent.health), Math.ceil(agent.resolve), Math.ceil(agent.skill), agent.combo.length].join();
  if (key === bars.key) return;
  bars.key = key;
  const g = bars.canvas.getContext('2d'); g.clearRect(0, 0, 128, 48);
  g.fillStyle = 'rgba(18,24,26,0.82)'; g.beginPath(); g.roundRect(0, 0, 128, 48, 8); g.fill();
  g.fillStyle = colour; g.beginPath(); g.roundRect(4, 4, 30, 40, 6); g.fill();
  g.fillStyle = '#16191a'; g.font = '700 22px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 19, 25);
  [['health', '#9fd86b'], ['resolve', '#6fb7ee'], ['skill', '#f0cf5a']].forEach(([stat, fill], i) => {
    g.fillStyle = '#39413f'; g.fillRect(40, 6 + i * 13, 82, 9);
    g.fillStyle = fill; g.fillRect(40, 6 + i * 13, 82 * Math.max(0, agent[stat] / Math.max(1, agent.max[stat])), 9);
  });
  bars.texture.needsUpdate = true;
}

export class AgentView {
  constructor(assets, content, agent) {
    this.assets = assets; this.content = content; this.type = content.agents.types[agent.type];
    this.root = new THREE.Group(); this.body = new THREE.Group(); this.root.add(this.body);
    this.body.scale.z = -1; // un-mirror the native body (see views.js); it then looks down -Z
    this.bars = barsTexture();
    this.badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bars.texture, depthTest: false, transparent: true }));
    this.badge.scale.set(1.15, 0.43, 1); this.badge.position.y = 2.35; this.badge.renderOrder = 15; this.root.add(this.badge);
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 20), new THREE.MeshPhysicalMaterial({ color: '#c9f1f2', transparent: true, opacity: 0.26, roughness: 0.04, metalness: 0.15, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
    this.bubble.position.y = 1.0; this.bubble.visible = false; this.root.add(this.bubble);
    // Frozen agents wear the game's own ice block, loaded the first time one is needed.
    this.ice = new THREE.Group(); this.ice.visible = false; this.root.add(this.ice);
    this.aura = new THREE.PointLight('#ff8a30', 0, 3.5, 2); this.aura.position.y = 1.1; this.root.add(this.aura);
    this.ready = false; this.disposed = false; this.clipKey = ''; this.clip = null; this.previous = null; this.changedAt = -9; this.facing = 0;
    this.load().catch(error => console.error('Agente', agent.type, error));
  }

  async load() {
    const { assets } = this, view = this.type.view, resolved = view.resolved;
    const parts = [resolved.body, resolved.head, ...(resolved.parts || [])].filter(Boolean);
    const attach = view.attach || [];
    const [rigs] = await Promise.all([
      Promise.all(parts.map(p => assets.file(p.path))),
      Promise.all([...parts.map(p => p.model), ...attach.map(a => a.model)].map(n => assets.load(n))),
    ]);
    this.walk = await assets.file(resolved.walk.path);
    if (this.disposed) return;
    const models = Object.fromEntries(parts.map((p, i) => [p.model, rigs[i]]));
    this.rig = new NativeRig(rigs[0].bones, models, n => assets.clone(n));
    this.body.add(this.rig.root);
    for (const item of attach) {
      const bone = this.rig.bones.find(b => b.name === item.bone);
      if (bone) bone.add(assets.clone(item.model));
    }
    this.ready = true;
  }

  /** Clip for the agent's current situation; reaction clips are fetched on first use. */
  #select(agent, def, now) {
    const anim = agent.anim;
    if (!anim) return { clip: this.walk, time: agent.walkTime % this.walk.duration, key: 'walk', frozen: agent.waiting };
    const family = def?.view.agent[agent.family] || def?.view.agent.A || {};
    const info = family[anim.phase] || (anim.phase === 'mount' ? family.loop : anim.phase === 'dismount' ? family.loop : family.mount);
    if (!info) return { clip: this.walk, time: 0, key: 'walk' };
    const clip = this.assets.peek(info.path);
    if (!clip) return { clip: this.walk, time: 0, key: 'walk' };
    const elapsed = Math.max(0, now - anim.since);
    const looping = anim.phase === 'loop' && info === family.loop;
    return { clip, time: looping ? elapsed % clip.duration : Math.min(elapsed, clip.duration), key: info.path };
  }

  update(agent, world, now, camera) {
    const out = agent.mode === 'escaped' || agent.mode === 'gone';
    this.root.visible = this.ready && !out && !agent.hidden && !(agent.mode === 'dead' && now - agent.endedAt > 2.5);
    if (!this.root.visible) return;
    const tag = agent.motion?.tag || agent.down?.tag;
    const bubbled = agent.bubbleUntil > now;
    const lift = bubbled ? AIRBORNE_LIFT.bubble : agent.motion?.airborne ? (AIRBORNE_LIFT[agent.motion.tag] || 0.3) : 0;
    const level = agent.sunk ? -0.75 : lift; // in the water of a pit
    this.height = (this.height ?? 0) + (level - (this.height ?? 0)) * 0.18;
    this.root.position.set(agent.x, this.height, agent.z);
    let yaw = Math.atan2(agent.hx, agent.hz) + Math.PI;
    if (agent.motion && BACKWARDS.has(agent.motion.tag)) yaw += Math.PI;
    let delta = yaw - this.facing; delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    this.facing += delta * 0.25; this.body.rotation.y = this.facing;
    if (agent.mode === 'dead') { this.body.rotation.x = Math.min(Math.PI / 2, (now - agent.endedAt) * 4); this.body.position.y = 0.12; this.badge.visible = false; }

    const def = agent.anim ? world.content.traps[agent.anim.trap] : null;
    const pick = this.#select(agent, def, now);
    if (pick.key !== this.clipKey) {
      this.previous = this.rig.bones.map(b => ({ p: b.position.clone(), q: b.quaternion.clone() }));
      this.changedAt = now; this.clipKey = pick.key;
    }
    this.rig.play(pick.clip, pick.time);
    const blend = (now - this.changedAt) / BLEND;
    if (this.previous && blend < 1 && blend >= 0) {
      const k = blend * blend * (3 - 2 * blend);
      this.rig.bones.forEach((bone, i) => { bone.position.lerpVectors(this.previous[i].p, bone.position.clone(), k); bone.quaternion.copy(this.previous[i].q.clone().slerp(bone.quaternion, k)); });
      this.rig.root.updateMatrixWorld(true); this.rig.skeleton.update();
    }
    this.bubble.visible = bubbled; if (bubbled) this.bubble.rotation.y = now * 0.6;
    this.ice.visible = tag === 'frozen';
    if (this.ice.visible && !this.iceRequested) {
      this.iceRequested = true;
      this.assets.load('trap_iceblock').then(() => {
        const block = this.assets.clone('trap_iceblock'); block.scale.z = -1;
        block.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.72; o.material.depthWrite = false; } });
        this.ice.add(block);
      });
    }
    const burning = agent.statuses.some(s => s.kind === 'burning');
    this.aura.intensity = burning ? 9 + Math.sin(now * 30) * 2 : 0;
    drawBars(this.bars, agent, this.type.color, agent.level === 'super' ? 'S' : String(agent.level));
    this.badge.visible = agent.mode !== 'dead';
  }

  dispose() {
    this.disposed = true; this.rig?.dispose(); this.bars.texture.dispose();
    this.bubble.geometry.dispose(); this.root.parent?.remove(this.root);
  }
}
