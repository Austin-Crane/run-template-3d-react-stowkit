import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { loadStowKitPack, disposeStowKitPack } from './loadStowKitPack';

export class GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private diceContainer: THREE.Group | null = null;

  constructor(private container: HTMLDivElement) {
    const { clientWidth: w, clientHeight: h } = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.set(3, 2, 3);

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);
    this.scene.add(new THREE.GridHelper(10, 10, 0x333333, 0x222222));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;

    window.addEventListener('resize', this.onResize);
    this.start();
    this.loadAssets();
  }

  private onResize = () => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private async loadAssets() {
    try {
      const pack = await loadStowKitPack('default');
      const mesh = await pack.loadMesh('sm_dice');

      this.diceContainer = new THREE.Group();
      this.diceContainer.add(mesh);
      this.scene.add(this.diceContainer);
    } catch (err) {
      RundotGameAPI.error('[GameScene] Error loading assets:', err);
    }
  }

  private update = () => {
    this.animationFrameId = requestAnimationFrame(this.update);
    const delta = this.clock.getDelta();

    if (this.diceContainer) {
      this.diceContainer.rotation.x += delta * 0.5;
      this.diceContainer.rotation.y += delta * 0.7;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  start() {
    this.clock.start();
    this.update();
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    disposeStowKitPack('default');
  }
}
