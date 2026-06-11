import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// 렌더러/씬/카메라 + 플레이어 추적 카메라 + 마우스 오빗.
export class SceneManager {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 35, 90);

    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
    this.camera.position.set(0, 8, 12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // CSS2D (NPC 라벨)
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(innerWidth, innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    // 포스트프로세싱: 불꽃 emission 발광 (bloom)
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight),
      0.7,  // strength
      0.5,  // radius
      1.0   // threshold (밝은 emission만 발광)
    );
    this.composer.addPass(this.bloom);

    // 추적 카메라 파라미터
    this.camYaw = Math.PI;       // 플레이어 뒤
    this.camPitch = 0.45;
    this.camDist = 11;
    this.target = null;          // 따라갈 Object3D

    this._initOrbitInput();
    addEventListener('resize', () => this._onResize());
  }

  follow(object) { this.target = object; }

  _initOrbitInput() {
    const el = this.renderer.domElement;
    let dragging = false, px = 0, py = 0;
    el.addEventListener('mousedown', (e) => { dragging = true; px = e.clientX; py = e.clientY; });
    addEventListener('mouseup', () => { dragging = false; });
    addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.camYaw -= (e.clientX - px) * 0.005;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch - (e.clientY - py) * 0.004, 0.1, 1.2);
      px = e.clientX; py = e.clientY;
    });
    el.addEventListener('wheel', (e) => {
      this.camDist = THREE.MathUtils.clamp(this.camDist + e.deltaY * 0.01, 5, 22);
    }, { passive: true });
  }

  updateCamera() {
    if (!this.target) return;
    const t = this.target.position;
    const offX = Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDist;
    const offZ = Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDist;
    const offY = Math.sin(this.camPitch) * this.camDist;
    const desired = new THREE.Vector3(t.x + offX, t.y + offY + 1.5, t.z + offZ);
    this.camera.position.lerp(desired, 0.12);
    this.camera.lookAt(t.x, t.y + 1.5, t.z);
  }

  render() {
    this.composer.render();
    this.labelRenderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    this.labelRenderer.setSize(innerWidth, innerHeight);
  }
}
