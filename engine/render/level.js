// Builds the room shell from the layout: native floor tiles and wall panels, plus the
// authored parts the game draws from its terrain (wall tops, rock, floor inlay, markers).
import * as THREE from 'three';
import { wallPieces, WALL_MODELS } from './shell.js';

const SIDES = [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]]; // dx, dz, yaw of a wall whose face looks back at the cell
const WALL_DEPTH = 0.5;

function rockTexture() {
  const size = 512, c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#62544d'; g.fillRect(0, 0, size, size);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Everything is drawn nine times, shifted by the tile size, so the texture repeats without a seam.
  const wrapped = draw => { for (const ox of [-size, 0, size]) for (const oz of [-size, 0, size]) { g.save(); g.translate(ox, oz); draw(); g.restore(); } };
  for (let i = 0; i < 900; i++) {
    const fill = `rgba(${30 + rnd() * 50 | 0},${26 + rnd() * 36 | 0},${24 + rnd() * 30 | 0},${0.04 + rnd() * 0.07})`;
    const x = rnd() * size, y = rnd() * size, r = 6 + rnd() * 30, ry = r * (0.4 + rnd() * 0.6), a = rnd() * 3;
    wrapped(() => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, r, ry, a, 0, 7); g.fill(); });
  }
  for (let i = 0; i < 16; i++) {
    const points = []; let x = rnd() * size, y = rnd() * size, a = rnd() * 6.28;
    for (let k = 0; k < 7; k++) { points.push([x, y]); a += (rnd() - 0.5) * 1.3; x += Math.cos(a) * (14 + rnd() * 22); y += Math.sin(a) * (14 + rnd() * 22); }
    wrapped(() => { g.strokeStyle = 'rgba(52,38,33,0.5)'; g.lineWidth = 1.5; g.beginPath(); points.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); });
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Flat quads at height y. rects: [x0, z0, x1, z1]. UV in world units / uvScale. */
function quads(rects, y, uvScale = 1) {
  const position = new Float32Array(rects.length * 12), uv = new Float32Array(rects.length * 8), index = [];
  rects.forEach(([x0, z0, x1, z1], i) => {
    position.set([x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0], i * 12);
    uv.set([x0 / uvScale, z0 / uvScale, x0 / uvScale, z1 / uvScale, x1 / uvScale, z1 / uvScale, x1 / uvScale, z0 / uvScale], i * 8);
    index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index); geometry.computeVertexNormals();
  return geometry;
}

function labelSprite(text, colour) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.font = '700 54px Arial'; const width = Math.min(500, g.measureText(text).width + 56);
  g.fillStyle = 'rgba(20,26,28,0.88)'; g.beginPath(); g.roundRect((512 - width) / 2, 20, width, 88, 18); g.fill();
  g.lineWidth = 6; g.strokeStyle = colour; g.stroke();
  g.fillStyle = '#f4f1e4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66, 440);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.renderOrder = 20; sprite.userData.label = true;
  return sprite;
}

export const ENTRANCE_COLOURS = ['#58c4f0', '#f08a4b', '#9be06a', '#e86fc0', '#f2d24b', '#b79cf5'];

export class LevelView {
  constructor(assets, stage) {
    this.assets = assets; this.stage = stage;
    this.root = new THREE.Group(); this.overlay = new THREE.Group(); this.markers = new THREE.Group();
    stage.scene.add(this.root, this.overlay, this.markers);
    this.wallHeight = 1.4;
    this.rock = new THREE.MeshStandardMaterial({ map: rockTexture(), roughness: 0.95, color: '#ffffff' });
    this.cap = new THREE.MeshStandardMaterial({ color: '#f3f1ea', roughness: 0.7 });
    this.inlay = new THREE.MeshStandardMaterial({ color: '#c8662c', roughness: 0.55 });
    this.inlayDark = new THREE.MeshStandardMaterial({ color: '#5d6a66', roughness: 0.55 });
    this.clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.wallHeight);
  }

  async prepare() { await Promise.all(['corridor_floor_basic', ...WALL_MODELS].map(n => this.assets.load(n))); }

  dispose(group = this.root) {
    for (const child of [...group.children]) { group.remove(child); child.geometry?.dispose(); if (child.isInstancedMesh) child.dispose(); }
  }

  build(layout, { pits = new Set() } = {}) {
    this.dispose(this.root); this.layout = layout;
    const { w, h } = layout, H = this.wallHeight;
    this.clip.constant = H;
    const floorCells = [], capRects = [], rockRects = [], inlay = [], inlayDark = [];
    this.pieces = wallPieces(layout);
    const floor = (x, z) => layout.isFloor(x, z);
    const margin = 5;
    for (let z = -margin; z < h + margin; z++) for (let x = -margin; x < w + margin; x++) {
      if (!floor(x, z)) { rockRects.push([x, z, x + 1, z + 1]); continue; }
      if (!pits.has(layout.index(x, z))) floorCells.push([x, z]);
      SIDES.forEach(([dx, dz, yaw], side) => {
        if (floor(x + dx, z + dz)) return;
        // wall top: half a cell into the rock, along this edge
        const x0 = dx > 0 ? x + 1 : dx < 0 ? x - WALL_DEPTH : x, x1 = dx > 0 ? x + 1 + WALL_DEPTH : dx < 0 ? x : x + 1;
        const z0 = dz > 0 ? z + 1 : dz < 0 ? z - WALL_DEPTH : z, z1 = dz > 0 ? z + 1 + WALL_DEPTH : dz < 0 ? z : z + 1;
        capRects.push([x0, z0, x1, z1]);
        this.#inlay(inlay, inlayDark, floor, x, z, dx, dz);
      });
      // rock corners that touch this cell only diagonally still get a wall-top square
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        if (floor(x + dx, z + dz) || floor(x + dx, z) || floor(x, z + dz)) continue;
        const x0 = dx > 0 ? x + 1 : x - WALL_DEPTH, z0 = dz > 0 ? z + 1 : z - WALL_DEPTH;
        capRects.push([x0, z0, x0 + WALL_DEPTH, z0 + WALL_DEPTH]);
      }
    }
    const tile = this.assets.templates.get('corridor_floor_basic').children[0];
    const floorMaterial = tile.material.clone(); floorMaterial.roughness = 0.34;
    const floorGeometry = tile.geometry;
    const tiles = new THREE.InstancedMesh(floorGeometry, floorMaterial, floorCells.length);
    const m = new THREE.Matrix4();
    floorCells.forEach(([x, z], i) => tiles.setMatrixAt(i, m.makeTranslation(x + 0.5, 0, z + 0.5)));
    tiles.receiveShadow = true; this.root.add(tiles);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
    for (const model of WALL_MODELS) {
      const placements = this.pieces.filter(p => p.model === model);
      if (!placements.length) continue;
      const template = this.assets.templates.get(model);
      // Exported corners have different pivots, some at half-height. Seat the whole
      // model on its lowest vertex after the loader's Y reflection, never stretch it.
      const bounds = new THREE.Box3().setFromObject(template);
      const y = -bounds.min.y;
      for (const part of template.children) {
      const material = part.material.clone(); material.clippingPlanes = [this.clip]; material.clipShadows = true;
      const walls = new THREE.InstancedMesh(part.geometry, material, placements.length);
      walls.name = model;
      placements.forEach(({ x, z, rot }, i) => walls.setMatrixAt(i, m.compose(new THREE.Vector3(x + 0.5, y, z + 0.5), q.setFromAxisAngle(up, rot * Math.PI / 2), one)));
      walls.castShadow = true; walls.receiveShadow = true; this.root.add(walls);
      }
    }
    const add = (geometry, material, shadow = true) => { const mesh = new THREE.Mesh(geometry, material); mesh.receiveShadow = true; mesh.castShadow = shadow; this.root.add(mesh); return mesh; };
    add(quads(capRects, H), this.cap);
    add(quads(rockRects, H - 0.015, 6), this.rock, false);
    add(quads(inlay, 0.012), this.inlay, false); add(quads(inlayDark, 0.012), this.inlayDark, false);
    // Under the rock, so nothing shows through the gaps of the shell or an open pit.
    const under = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * margin, h + 2 * margin), new THREE.MeshBasicMaterial({ color: '#12181a' }));
    under.rotation.x = -Math.PI / 2; under.position.set(w / 2, -4.2, h / 2); this.root.add(under);
  }

  // Double inlay line 0.32 inside each wall, trimmed or extended at corners so the lines meet.
  #inlay(orange, dark, floor, x, z, dx, dz) {
    const inset = 0.3, wide = 0.07, gap = 0.1;
    const along = dx ? [0, 1] : [1, 0];
    const ends = [-1, 1].map(s => {
      const nx = x + along[0] * s, nz = z + along[1] * s;
      if (!floor(nx, nz)) return -inset;               // inner room corner: stop short of the other wall's line
      return floor(nx + dx, nz + dz) ? inset : 0;      // rock corner sticking into the room: reach round it
    });
    for (const [list, offset, width] of [[orange, inset, wide], [dark, inset + gap, wide * 0.6]]) {
      const cx = x + 0.5 + dx * (0.5 - offset), cz = z + 0.5 + dz * (0.5 - offset);
      const a0 = -0.5 - ends[0], a1 = 0.5 + ends[1];
      if (dx) list.push([cx - width / 2, z + 0.5 + a0, cx + width / 2, z + 0.5 + a1]);
      else list.push([x + 0.5 + a0, cz - width / 2, x + 0.5 + a1, cz + width / 2]);
    }
  }

  /** Entrance and objective markers. */
  setPoints(scenario) {
    for (const child of [...this.markers.children]) this.markers.remove(child);
    scenario.entrances.forEach((e, i) => {
      const colour = ENTRANCE_COLOURS[i % ENTRANCE_COLOURS.length];
      const pad = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.46, 32), new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.95, depthWrite: false }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(e.x + 0.5, 0.03, e.z + 0.5);
      const label = labelSprite(`Entrada ${e.id}${e.label ? ' · ' + e.label : ''}`, colour); label.position.set(e.x + 0.5, this.wallHeight + 1.5, e.z + 0.5);
      pad.userData.point = label.userData.point = { kind: 'entrance', id: e.id };
      this.markers.add(pad, label);
    });
    scenario.objectives.forEach(o => {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.46, 6), new THREE.MeshBasicMaterial({ color: '#f2c94c', transparent: true, opacity: 0.95, depthWrite: false }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(o.x + 0.5, 0.03, o.z + 0.5);
      const label = labelSprite(`★ ${o.label || o.id}`, '#f2c94c'); label.position.set(o.x + 0.5, this.wallHeight + 1.5, o.z + 0.5);
      this.markers.add(pad, label);
    });
    this.setLabelMode(this.planLabels ?? false);
  }

  /** Labels keep a constant size on screen in perspective and a map size in plan view. */
  setLabelMode(plan) {
    this.planLabels = plan;
    for (const child of this.markers.children) {
      if (!child.userData.label) continue;
      child.material.sizeAttenuation = plan; child.material.needsUpdate = true;
      if (plan) child.scale.set(4.2, 1.05, 1); else child.scale.set(0.11, 0.0275, 1);
    }
  }

  /** Editor overlay: coloured cell sets and polylines above the floor. Replaces the previous overlay. */
  setOverlay({ cells = [], lines = [], grid = false } = {}) {
    for (const child of [...this.overlay.children]) { this.overlay.remove(child); child.geometry.dispose(); child.material.dispose(); }
    for (const { list, colour, opacity = 0.35, y = 0.04 } of cells) {
      if (!list.length) continue;
      const mesh = new THREE.Mesh(quads(list.map(([x, z]) => [x + 0.04, z + 0.04, x + 0.96, z + 0.96]), y), new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false }));
      mesh.renderOrder = 5; this.overlay.add(mesh);
    }
    for (const { points, colour } of lines) {
      if (points.length < 2) continue;
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, 0.07, z)));
      const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: colour, dashSize: 0.35, gapSize: 0.2, transparent: true, opacity: 0.9, depthTest: false }));
      line.computeLineDistances(); line.renderOrder = 6; this.overlay.add(line);
    }
    if (grid && this.layout) {
      const { w, h } = this.layout, points = [];
      for (let x = 0; x <= w; x++) points.push(new THREE.Vector3(x, 0.02, 0), new THREE.Vector3(x, 0.02, h));
      for (let z = 0; z <= h; z++) points.push(new THREE.Vector3(0, 0.02, z), new THREE.Vector3(w, 0.02, z));
      const lines2 = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, depthTest: false }));
      lines2.renderOrder = 4; this.overlay.add(lines2);
    }
  }
}
