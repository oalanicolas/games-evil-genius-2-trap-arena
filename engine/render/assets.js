// Loads the content pack and the native models it references. Presentation only.
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { prepareContent } from '../core/content.js';

const PACK = new URL('../content/eg2/', import.meta.url).href;
const library = path => '/library/' + path;
const json = async path => { const r = await fetch(PACK + path); if (!r.ok) throw new Error('Conteúdo ausente: ' + path); return r.json(); };

export class Assets {
  constructor(renderer) {
    this.renderer = renderer;
    this.gltf = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.textures = new Map(); this.templates = new Map(); this.pending = new Map(); this.files = new Map(); this.values = new Map();
  }

  async init() {
    const [traps, agents, behaviours, models, kit, scenarios] = await Promise.all(
      ['traps.json', 'agents.json', 'behaviours.json', 'models.json', 'kit.json', 'scenarios/index.json'].map(json));
    this.content = prepareContent({ traps, agents, behaviours });
    this.models = models.models; this.kit = kit; this.scenarios = scenarios.scenarios;
    return this;
  }

  scenario(file) { return json('scenarios/' + file); }

  /** Cached JSON of the pack (rigs, clips). */
  file(path) {
    if (!this.files.has(path)) this.files.set(path, json(path).then(value => { this.values.set(path, value); return value; }));
    return this.files.get(path);
  }

  /** Synchronous view of a pack file: the value when loaded, otherwise null (and the load starts). */
  peek(path) {
    const value = this.values.get(path);
    if (value === undefined) { this.file(path).catch(() => this.values.set(path, null)); return null; }
    return value;
  }

  texture(path, colour) {
    const key = path + (colour ? ':c' : ':n');
    if (!this.textures.has(key)) {
      this.textures.set(key, this.textureLoader.loadAsync(library(path)).then(t => {
        t.flipY = false; t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        return t;
      }));
    }
    return this.textures.get(key);
  }

  /** Loads one native model as a group of per-material meshes. Native Y points down; it is reflected here. */
  load(name) {
    if (this.pending.has(name)) return this.pending.get(name);
    const task = (async () => {
      const spec = this.models[name];
      if (!spec) throw new Error('Modelo fora do pacote: ' + name);
      const gltf = await this.gltf.loadAsync(library(spec.glb));
      let source; gltf.scene.traverse(o => { if (o.isMesh) source = o; });
      if (!source) throw new Error('Sem malha: ' + name);
      const group = new THREE.Group(); group.name = name;
      const index = source.geometry.index.array;
      const base = source.geometry.clone(); base.scale(1, -1, 1);
      for (const sub of spec.submeshes) {
        const geometry = base.clone(); geometry.clearGroups();
        // Native triangles wind the other way round; the reflection above already turns them into
        // front faces, so the index is used as it is.
        geometry.setIndex(Array.from(index.slice(sub.startIndex, sub.startIndex + sub.indexCount)));
        const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.06, side: THREE.DoubleSide });
        const { colour, normal } = sub.maps;
        if (colour) material.map = await this.texture(colour.preview, true);
        if (normal) { material.normalMap = await this.texture(normal.preview, false); material.normalScale.set(0.7, -0.7); }
        const label = (colour?.name || '').toLowerCase();
        material.userData.texture = label;
        if (label.includes('decal')) { material.transparent = true; material.alphaTest = 0.1; material.depthWrite = false; material.polygonOffset = true; material.polygonOffsetFactor = -1; }
        if (label.includes('glass')) { material.color.set('#aed5d4'); material.transparent = true; material.opacity = 0.3; material.roughness = 0.12; material.depthWrite = false; }
        if (label.includes('glow')) { material.emissive.set('#d5a144'); material.emissiveIntensity = 0.7; }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name + ':' + sub.submesh; mesh.userData.submesh = sub.submesh;
        mesh.castShadow = true; mesh.receiveShadow = true;
        group.add(mesh);
      }
      this.templates.set(name, group);
      return group;
    })();
    this.pending.set(name, task);
    return task;
  }

  /** Clone of a loaded model. Geometry and materials are shared with the template. */
  clone(name) {
    const template = this.templates.get(name);
    if (!template) throw new Error('Modelo não carregado: ' + name);
    return template.clone(true);
  }
}
