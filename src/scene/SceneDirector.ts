import * as THREE from 'three';
import { CameraMode, SceneMetrics } from '../types';
import { TrackKinematics } from './TrackKinematics';
import { ScenePlaceholders } from './Placeholders';
import { CameraManager } from './CameraManager';

export class SceneDirector {
  public container: HTMLDivElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  public trackKinematics: TrackKinematics;
  public placeholders: ScenePlaceholders;
  public cameraManager: CameraManager;

  // Lighting references
  public sunLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  private environmentTexture: THREE.Texture | null = null;
  public isHighQuality: boolean = true;

  // Train state
  public trainDistance: number = 0;
  public trainSpeed: number = 7.5; // meters per second (~27 km/h, authentic rustic speed)
  public isTrainPlaying: boolean = true;
  public isStoppedAtPlatform: boolean = false;

  // Animation frame
  private animationId: number | null = null;
  private clock: THREE.Clock;

  // Metrics
  public metrics: SceneMetrics = { fps: 60, drawCalls: 0, triangles: 0 };
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = 0;

  // Callback
  public onMetricsUpdate?: (metrics: SceneMetrics) => void;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Renderer Setup with ACES Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
    });
    // Critical iPhone Safari safeguard: Cap pixel ratio at 2.0 to prevent thermal throttling
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02; // balanced afternoon exposure, prevents blown-out whites

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Atmospheric Fog Setup
    this.scene = new THREE.Scene();
    // Warm afternoon countryside haze reminiscent of Osaka reference & 1970s Tai Po
    const fogColor = new THREE.Color(0xdce5dc);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0035);

    // 3. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.3, 1000);

    // 4. Lighting & Natural Environment Reflection Setup
    this.setupLighting();

    // 5. Track & Models Setup
    this.trackKinematics = new TrackKinematics();
    this.placeholders = new ScenePlaceholders(this.trackKinematics);
    this.scene.add(this.placeholders.group);

    // Initial train position: place train approaching the station from south
    this.trainDistance = 50.0;
    this.placeholders.updateTrainMotion(this.trainDistance);

    // 6. Camera Manager Setup
    this.cameraManager = new CameraManager(this.camera, this.placeholders);

    // 7. Event Listeners
    this.bindEvents();

    // 8. Start Rendering
    this.start();
  }

  private setupLighting() {
    // A. Lightweight procedural sky-ground reflection map (zero bundle cost, zero duplicate imports)
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 64;
    envCanvas.height = 64;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#dce8f8');   // warm afternoon sky
      grad.addColorStop(0.45, '#ede9e1'); // soft horizon haze
      grad.addColorStop(0.55, '#c9c4b7');
      grad.addColorStop(1, '#665d50');   // earthy ground bounce
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      this.environmentTexture = new THREE.CanvasTexture(envCanvas);
      this.environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = this.environmentTexture;
      this.scene.environmentIntensity = 0.55;
    }

    // B. Hemisphere light: cool sky tone + warm ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xdce8fa, 0x766d5b, 0.85);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // C. Natural warm afternoon sun with gentle slant angle (DirectionalLight)
    this.sunLight = new THREE.DirectionalLight(0xffecd0, 1.65);
    this.sunLight.position.set(-42, 58, -32);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    this.sunLight.shadow.radius = 2.0; // soft shadow penumbra

    // Shadow coverage frustum
    const d = 45;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    // D. Secondary subtle fill light from river/east side to lift shadow contrast
    const fillLight = new THREE.DirectionalLight(0xcce0e0, 0.28);
    fillLight.position.set(40, 25, 35);
    this.scene.add(fillLight);
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: true });

    // Touch pinch events for mobile
    el.addEventListener('touchstart', this.onTouchStart, { passive: true });
    el.addEventListener('touchmove', this.onTouchMove, { passive: true });
    el.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.cameraManager.onPointerDown(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent) => {
    this.cameraManager.onPointerMove(e.clientX, e.clientY);
  };

  private onPointerUp = () => {
    this.cameraManager.onPointerUp();
  };

  private onWheel = (e: WheelEvent) => {
    this.cameraManager.onWheel(e.deltaY);
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.cameraManager.onTouchPinch(dist);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.cameraManager.onTouchPinch(dist);
    }
  };

  private onTouchEnd = () => {
    this.cameraManager.onTouchPinchEnd();
  };

  public setCameraMode(mode: CameraMode) {
    this.cameraManager.switchMode(mode);
  }

  public togglePlay(play?: boolean) {
    this.isTrainPlaying = play !== undefined ? play : !this.isTrainPlaying;
  }

  public setSpeed(multiplier: number) {
    this.trainSpeed = 7.5 * multiplier;
  }

  public stopAtStation() {
    // Aligns train formation directly along Platform 1 with clear passenger window sightlines
    this.trainDistance = 104.0;
    this.placeholders.updateTrainMotion(this.trainDistance);
    this.isTrainPlaying = false;
    this.isStoppedAtPlatform = true;
  }

  private start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Train motion
      if (this.isTrainPlaying) {
        this.trainDistance += this.trainSpeed * delta;
        this.placeholders.updateTrainMotion(this.trainDistance);
      }

      // Camera update
      this.cameraManager.update(delta);

      // Render
      this.renderer.render(this.scene, this.camera);

      // Profiling
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdateTime > 500) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
        this.frameCount = 0;
        this.lastFpsUpdateTime = now;

        this.metrics = {
          fps,
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
        };
        if (this.onMetricsUpdate) {
          this.onMetricsUpdate(this.metrics);
        }
      }
    };

    animate();
  }

  public toggleQuality(): boolean {
    this.isHighQuality = !this.isHighQuality;
    this.sunLight.castShadow = this.isHighQuality;
    this.renderer.shadowMap.enabled = this.isHighQuality;
    this.renderer.setPixelRatio(
      this.isHighQuality ? Math.min(window.devicePixelRatio || 1, 2.0) : 1.0
    );
    return this.isHighQuality;
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    if (this.environmentTexture) {
      this.environmentTexture.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
