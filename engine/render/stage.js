// Renderer, lights and the two cameras (plan and perspective). Presentation only.
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/three/examples/jsm/controls/OrbitControls.js';

export class Stage {
  constructor(container) {
    this.container = container;
    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
    renderer.localClippingEnabled = true;
    container.prepend(renderer.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#2b2522');
    this.scene.add(new THREE.HemisphereLight('#f1f5e8', '#6d6258', 2.1));
    this.sun = new THREE.DirectionalLight('#fff3d6', 3.0);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);
    const fill = new THREE.DirectionalLight('#bfdde2', 0.9); fill.position.set(8, 10, -14); this.scene.add(fill);
    this.perspective = new THREE.PerspectiveCamera(34, 1, 0.5, 400);
    this.plan = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.5, 400);
    this.camera = this.perspective;
    this.controls = new OrbitControls(this.perspective, renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.46; this.controls.minDistance = 4; this.controls.maxDistance = 160;
    this.controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.screenSpacePanning = false;
    this.planControls = new OrbitControls(this.plan, renderer.domElement);
    this.planControls.enableRotate = false; this.planControls.enableDamping = true; this.planControls.dampingFactor = 0.12;
    this.planControls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    this.planControls.screenSpacePanning = true; this.planControls.enabled = false;
    this.mode = 'perspective'; this.bounds = { w: 40, h: 30 };
    this.raycaster = new THREE.Raycaster(); this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h);
    this.perspective.aspect = w / h; this.perspective.updateProjectionMatrix();
    this.#fitPlan();
  }

  #fitPlan() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    const half = Math.max((this.bounds.w + 4) / 2 * h / w, (this.bounds.h + 4) / 2);
    Object.assign(this.plan, { left: -half * w / h, right: half * w / h, top: half, bottom: -half });
    this.plan.updateProjectionMatrix();
  }

  /** Frame a map of w x h cells. */
  frame(w, h) {
    this.bounds = { w, h };
    const cx = w / 2, cz = h / 2, span = Math.max(w, h * 1.5);
    this.controls.target.set(cx, 0, cz);
    this.perspective.position.set(cx, span * 0.95, cz + span * 0.62);
    this.controls.update();
    this.plan.position.set(cx, 120, cz); this.plan.up.set(0, 0, -1); this.plan.lookAt(cx, 0, cz); this.plan.zoom = 1;
    this.planControls.target.set(cx, 0, cz); this.planControls.update();
    this.#fitPlan();
    const reach = Math.max(w, h) * 0.75 + 8;
    this.sun.position.set(cx - reach * 0.45, reach * 1.25, cz + reach * 0.5); this.sun.target.position.set(cx, 0, cz);
    Object.assign(this.sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: reach * 4 });
    this.sun.shadow.camera.updateProjectionMatrix();
  }

  setMode(mode) {
    this.mode = mode;
    const plan = mode === 'plan';
    this.camera = plan ? this.plan : this.perspective;
    this.controls.enabled = !plan; this.planControls.enabled = plan;
  }

  /** World point on the floor under a pointer event, or null. */
  pick(event) {
    const box = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.floorPlane, hit) ? hit : null;
  }

  render() {
    (this.mode === 'plan' ? this.planControls : this.controls).update();
    this.renderer.render(this.scene, this.camera);
  }

  get gpu() {
    const gl = this.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  }
}
