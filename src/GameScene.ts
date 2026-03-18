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
  private resizeObserver: ResizeObserver;
  private diceContainer: THREE.Group | null = null;

  constructor(container: HTMLDivElement) {
    const { clientWidth: w, clientHeight: h } = container;

    // Renderer — alpha: true is cheaper than false on some mobile GPUs (avoids RGB-on-RGBA emulation)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });

    // Manual DPR handling — don't use setPixelRatio (breaks post-processing, GPU picking, gl_FragCoord)
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(w * dpr, h * dpr, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;

    // Shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Camera — near 0.5 to avoid z-fighting at distance, keep near/far ratio < 10000:1
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 50);
    this.camera.position.set(3, 2, 3);

    this.scene = new THREE.Scene();

    // Ambient fill
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Directional light with shadows — target must be added to scene for shadow camera orientation
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);
    this.scene.add(dirLight.target); // Required — Three.js needs the target in the scene graph

    // Ground plane that receives shadows
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.3 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid for visual reference
    const grid = new THREE.GridHelper(10, 10, 0x333333, 0x222222);
    grid.position.y = -0.99; // Slightly above ground to avoid z-fighting
    this.scene.add(grid);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;

    // ResizeObserver — better than window resize (element-level, fires between layout and paint)
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(container);

    this.start();
    this.loadAssets();
  }

  private onResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (!entry) return;
    const { width: w, height: h } = entry.contentRect;
    if (w === 0 || h === 0) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(w * dpr, h * dpr, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private async loadAssets() {
    try {
      const pack = await loadStowKitPack('default');
      const mesh = await pack.loadMesh('sm_dice');

      // castShadow/receiveShadow don't propagate — traverse to enable on all child meshes
      mesh.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });

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
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    disposeStowKitPack('default');
  }
}
