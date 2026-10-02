// Authored effects that accompany a device while it works. All of this is ours: the game's
// own particle systems (FXPT/FXST) are not decoded. Driven by the trap state, never drives it.
import * as THREE from 'three';

let dot;
function dotTexture() {
  if (dot) return dot;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.45, 'rgba(255,255,255,0.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c); return dot;
}

const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Stateless particle cloud: every particle's position is a function of time and its index. */
class Cloud {
  constructor({ count, colour, size, additive = false, opacity = 0.8, place }) {
    this.count = count; this.place = place; this.opacity = opacity;
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.points = new THREE.Points(this.geometry, new THREE.PointsMaterial({ map: dotTexture(), color: colour, size, transparent: true, opacity: 0,
      depthWrite: false, sizeAttenuation: true, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    this.points.frustumCulled = false; this.points.renderOrder = 8;
  }
  update(time, level) {
    this.points.visible = level > 0.01;
    if (!this.points.visible) return;
    this.points.material.opacity = this.opacity * level;
    const p = this.geometry.attributes.position.array, v = [0, 0, 0];
    for (let i = 0; i < this.count; i++) { this.place(i, time, v, hash); p[i * 3] = v[0]; p[i * 3 + 1] = v[1]; p[i * 3 + 2] = v[2]; }
    this.geometry.attributes.position.needsUpdate = true;
  }
}

const basic = (colour, opacity, additive = false) => new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });

/**
 * Effect factories. Each receives the device (footprint w x d, local frame: origin at the
 * footprint centre, +Z front) and returns { object, update(now, level, trap) } where
 * level is 0..1: how strongly the trap is working right now.
 */
export const EFFECTS = {
  wind({ w, d, reach = 8 }) {
    const group = new THREE.Group(), rings = [];
    const material = basic('#dff1f2', 0.3);
    for (let i = 0; i < 9; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.035, 6, 40), material.clone()); group.add(ring); rings.push(ring); }
    const cloud = new Cloud({ count: 90, colour: '#eef7f7', size: 0.22, opacity: 0.5, place(i, t, v, h) {
      const k = (t * 0.9 + h(i)) % 1; v[0] = (h(i + 40) - 0.5) * w * 0.8; v[1] = 0.5 + h(i + 80) * 1.6 + Math.sin(k * 9 + i) * 0.15; v[2] = d / 2 * 0.4 + k * (reach + d / 2); } });
    group.add(cloud.points);
    return { object: group, update(now, level) {
      group.visible = level > 0.01; cloud.update(now, level);
      rings.forEach((ring, i) => { const k = (now * 0.8 + i / rings.length) % 1; ring.position.set(Math.sin(k * 6.28 + i) * 0.25, 1.35, d / 2 * 0.3 + k * (reach + d / 2));
        ring.scale.setScalar(0.8 + k * 0.7); ring.material.opacity = 0.34 * level * (1 - k); });
    } };
  },
  magnet({ w, d, reach = 8 }) {
    const group = new THREE.Group(), rings = [];
    for (let i = 0; i < 8; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 28), basic('#ff8fd2', 0.6, true)); group.add(ring); rings.push(ring); }
    return { object: group, update(now, level) {
      group.visible = level > 0.01;
      rings.forEach((ring, i) => { const side = i % 2 ? 1 : -1, k = 1 - ((now * 0.9 + i / rings.length) % 1);
        ring.position.set(side * w * 0.2, 1.0, d / 2 + 0.2 + k * reach * 0.85); ring.scale.setScalar(0.6 + k * 1.6); ring.material.opacity = 0.7 * level * (1 - k * 0.8); });
    } };
  },
  water({ w, d }) {
    const material = new THREE.MeshPhysicalMaterial({ color: '#4fa9d8', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.86, clearcoat: 1 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.5, d - 0.5, 16, 24), material); water.rotation.x = -Math.PI / 2; water.position.y = -0.22;
    const base = water.geometry.attributes.position.array.slice();
    const foam = new Cloud({ count: 46, colour: '#e8f7ff', size: 0.26, opacity: 0.75, place(i, t, v, h) {
      const k = (t * 0.35 + h(i)) % 1; v[0] = (h(i + 9) - 0.5) * (w - 1) + Math.sin(t + i) * 0.2; v[1] = -0.16; v[2] = (h(i + 21) - 0.5) * (d - 1) + Math.cos(t * 0.7 + i) * 0.2 * k; } });
    const group = new THREE.Group(); group.add(water, foam.points);
    return { object: group, update(now, level) {
      group.visible = level > 0.01; foam.update(now, level); material.opacity = 0.86 * Math.min(1, level * 2);
      const p = water.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.array[i * 3 + 2] = Math.sin(base[i * 3] * 2.2 + now * 2.1) * 0.035 + Math.cos(base[i * 3 + 1] * 1.8 + now * 1.6) * 0.035;
      p.needsUpdate = true;
    } };
  },
  laser({ w, d }) {
    const group = new THREE.Group();
    const beam = new THREE.CylinderGeometry(0.022, 0.022, d - 0.5, 6), glow = new THREE.CylinderGeometry(0.075, 0.075, d - 0.5, 6);
    const hot = basic('#ff3b2f', 0.95), halo = basic('#ff7a52', 0.22, true);
    for (let i = 0; i < 4; i++) for (const y of [0.35, 0.9, 1.45, 2.0]) for (const [geometry, material] of [[beam, hot], [glow, halo]]) {
      const mesh = new THREE.Mesh(geometry, material); mesh.rotation.x = Math.PI / 2; mesh.position.set(-w / 2 + 0.5 + i, y, 0); group.add(mesh);
    }
    return { object: group, update(now, level) { group.visible = level > 0.01; hot.opacity = (0.8 + Math.sin(now * 40) * 0.15) * level; halo.opacity = 0.24 * level; } };
  },
  darts({ w, d }) {
    const cloud = new Cloud({ count: 26, colour: '#d9f06a', size: 0.14, opacity: 1, place(i, t, v, h) {
      const k = (t * 2.6 + h(i)) % 1, dir = i % 2 ? 1 : -1; v[0] = (h(i + 5) - 0.5) * w * 0.7; v[1] = 0.5 + h(i + 13) * 1.5; v[2] = dir * (d / 2 - 0.3) * (1 - 2 * k); } });
    return { object: cloud.points, update(now, level) { cloud.update(now, level); } };
  },
  fire({ w, d }) {
    const mk = (colour, size, count, speed) => new Cloud({ count, colour, size, additive: true, opacity: 0.85, place(i, t, v, h) {
      const k = (t * speed + h(i)) % 1; v[0] = (h(i + 3) - 0.5) * (w - 0.6) + Math.sin(t * 5 + i) * 0.1; v[1] = 0.25 + h(i + 17) * 1.9 + k * 0.5; v[2] = -d / 2 + 0.7 + k * (d - 1.1); } });
    const a = mk('#ff7a1a', 0.7, 150, 0.9), b = mk('#ffd24a', 0.42, 110, 1.25), group = new THREE.Group(); group.add(a.points, b.points);
    const light = new THREE.PointLight('#ff8a30', 0, 9, 2); light.position.set(0, 1.2, 0); group.add(light);
    return { object: group, update(now, level) { a.update(now, level); b.update(now, level); light.intensity = 18 * level * (0.8 + Math.sin(now * 23) * 0.2); } };
  },
  frost({ w, d }) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.34, d - 1, 12, 1, true), basic('#bfeeff', 0.5, true)); beam.rotation.x = Math.PI / 2; beam.position.set(0, 1.15, 0.25);
    const cloud = new Cloud({ count: 80, colour: '#e6fbff', size: 0.2, additive: true, opacity: 0.8, place(i, t, v, h) {
      const k = (t * 1.4 + h(i)) % 1; v[0] = (h(i + 2) - 0.5) * 0.8 * (0.4 + k); v[1] = 0.6 + h(i + 31) * 1.1; v[2] = -d / 2 + 0.9 + k * (d - 1.3); } });
    const group = new THREE.Group(); group.add(beam, cloud.points);
    return { object: group, update(now, level) { beam.visible = level > 0.01; beam.material.opacity = 0.45 * level; cloud.update(now, level); } };
  },
  gas({ w, d, colour = '#b58be0' }) {
    const cloud = new Cloud({ count: 120, colour, size: 1.5, opacity: 0.2, place(i, t, v, h) {
      const k = (t * 0.22 + h(i)) % 1, a = h(i + 11) * 6.28, r = k * (Math.max(w, d) / 2 + 1); v[0] = Math.cos(a) * r; v[1] = 0.3 + k * 1.5 + h(i + 5) * 0.4; v[2] = Math.sin(a) * r; } });
    return { object: cloud.points, update(now, level) { cloud.update(now, level); } };
  },
  bees({ w, d }) {
    const cloud = new Cloud({ count: 140, colour: '#2a2208', size: 0.085, opacity: 1, place(i, t, v, h) {
      const s = 2.5 + h(i) * 3; v[0] = Math.sin(t * s + i) * (w / 2 - 0.2) * h(i + 7); v[1] = 0.6 + (Math.sin(t * s * 1.3 + i * 2) * 0.5 + 0.5) * 1.6; v[2] = -d / 2 + 0.6 + (Math.cos(t * s * 0.8 + i) * 0.5 + 0.5) * (d - 1); } });
    const gold = new Cloud({ count: 60, colour: '#f1c232', size: 0.07, opacity: 1, place(i, t, v, h) {
      const s = 3 + h(i + 99) * 3; v[0] = Math.cos(t * s + i) * (w / 2 - 0.2) * h(i + 3); v[1] = 0.6 + (Math.cos(t * s + i * 3) * 0.5 + 0.5) * 1.6; v[2] = -d / 2 + 0.6 + (Math.sin(t * s * 0.9 + i) * 0.5 + 0.5) * (d - 1); } });
    const group = new THREE.Group(); group.add(cloud.points, gold.points);
    return { object: group, update(now, level) { cloud.update(now, level); gold.update(now, level); } };
  },
  suds({ w, d }) {
    const slick = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, d) * 0.62, 40), new THREE.MeshPhysicalMaterial({ color: '#c79af0', transparent: true, opacity: 0, roughness: 0.05, clearcoat: 1, depthWrite: false }));
    slick.rotation.x = -Math.PI / 2; slick.position.y = 0.13;
    const cloud = new Cloud({ count: 46, colour: '#e9d2ff', size: 0.24, opacity: 0.85, place(i, t, v, h) {
      const k = (t * 0.5 + h(i)) % 1, a = h(i + 4) * 6.28, r = h(i + 8) * 1.1; v[0] = Math.cos(a) * r; v[1] = 0.15 + k * 0.9; v[2] = Math.sin(a) * r; } });
    const group = new THREE.Group(); group.add(slick, cloud.points);
    return { object: group, update(now, level) { slick.visible = level > 0.01; slick.material.opacity = 0.55 * level; cloud.update(now, level); } };
  },
  bubbles({ w, d }) {
    const cloud = new Cloud({ count: 40, colour: '#d4f4f3', size: 0.3, opacity: 0.7, place(i, t, v, h) {
      const k = (t * 0.8 + h(i)) % 1; v[0] = (h(i + 6) - 0.5) * 1.2 * (0.3 + k); v[1] = 1.3 + Math.sin(k * 3.14) * 0.5 + h(i + 2) * 0.4; v[2] = -d / 2 + 0.4 + k * (d - 0.8); } });
    return { object: cloud.points, update(now, level) { cloud.update(now, level); } };
  },
  disco({ w, d }) {
    const group = new THREE.Group(), beams = [];
    const colours = ['#ff4fd8', '#4fd8ff', '#ffe14f', '#6dff7a', '#ff6a4f', '#a06bff'];
    for (let i = 0; i < 6; i++) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.3, 3.4, 8, 1, true), basic(colours[i], 0.4, true)); beam.geometry.translate(0, -1.7, 0); beam.position.y = 3.0; group.add(beam); beams.push(beam); }
    const light = new THREE.PointLight('#ff4fd8', 0, 10, 2); light.position.y = 2.4; group.add(light);
    return { object: group, update(now, level) {
      group.visible = level > 0.01;
      beams.forEach((beam, i) => { beam.rotation.set(Math.sin(now * 1.7 + i * 1.1) * 0.6, 0, Math.cos(now * 1.3 + i * 1.7) * 0.6); beam.material.opacity = 0.42 * level; });
      light.color.set(colours[Math.floor(now * 3) % colours.length]); light.intensity = 26 * level;
    } };
  },
};
