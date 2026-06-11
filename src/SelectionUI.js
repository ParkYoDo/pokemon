import * as THREE from 'three';
import { POKEMON_LIST, GameState } from './data.js';
import { cloneModel } from './ModelLoader.js';

const PREVIEW_PX = 180;

// 4x3 카드 그리드. WebGL 렌더러 1개를 공유해 12개 미리보기를 순차 렌더 →
// 각 카드의 2D 캔버스에 drawImage (컨텍스트 1개만 사용).
export class SelectionUI {
  constructor(onStart) {
    this.onStart = onStart;
    this.previews = []; // {ctx, scene, camera, model}
    this.grid = document.getElementById('grid');
    this.startBtn = document.getElementById('start-btn');

    // 공유 오프스크린 렌더러
    this.shared = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.shared.setSize(PREVIEW_PX, PREVIEW_PX, false);
    this.shared.setPixelRatio(Math.min(devicePixelRatio, 2));

    this._build();
    this._raf();
  }

  _build() {
    POKEMON_LIST.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.id = p.id;

      const canvas = document.createElement('canvas');
      canvas.className = 'preview';
      canvas.width = PREVIEW_PX; canvas.height = PREVIEW_PX;
      card.appendChild(canvas);

      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = p.name;
      const tp = document.createElement('div'); tp.className = 'tp'; tp.textContent = p.type;
      card.appendChild(nm); card.appendChild(tp);

      card.addEventListener('click', () => this._select(p.id, card));
      this.grid.appendChild(card);

      this._makePreview(canvas, p.id);
    });

    this.startBtn.addEventListener('click', () => {
      if (GameState.selectedId) this.onStart();
    });
  }

  _makePreview(canvas, id) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const d = new THREE.DirectionalLight(0xffffff, 1.4);
    d.position.set(3, 5, 4); scene.add(d);

    const model = cloneModel(id);
    if (model) {
      fitPreview(model, 1.9); // 카드 안에 균일 크기로 맞춤 (진화 크기차 무시)
      scene.add(model);
    }

    this.previews.push({ ctx: canvas.getContext('2d'), scene, camera, model });
  }

  _select(id, card) {
    GameState.selectedId = id;
    document.querySelectorAll('.card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    this.startBtn.classList.add('ready');
  }

  _raf() {
    const gl = this.shared.domElement;
    const loop = () => {
      this._frame = requestAnimationFrame(loop);
      for (const p of this.previews) {
        if (p.model) p.model.rotation.y += 0.012;
        this.shared.render(p.scene, p.camera);
        p.ctx.clearRect(0, 0, PREVIEW_PX, PREVIEW_PX);
        p.ctx.drawImage(gl, 0, 0, PREVIEW_PX, PREVIEW_PX);
      }
    };
    loop();
  }

  show() { document.getElementById('selection').style.display = 'flex'; }

  hide() {
    document.getElementById('selection').style.display = 'none';
    cancelAnimationFrame(this._frame);
    this.shared.dispose(); // 컨텍스트 1개만 해제
  }
}

// 모델을 미리보기 프레임(maxDim)에 맞게 균일 스케일 + 바닥 정렬
function fitPreview(model, maxDim) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3(); box.getSize(size);
  const m = Math.max(size.x, size.y, size.z) || 1;
  model.scale.multiplyScalar(maxDim / m);
  const box2 = new THREE.Box3().setFromObject(model);
  const c = new THREE.Vector3(); box2.getCenter(c);
  model.position.x -= c.x;
  model.position.z -= c.z;
  model.position.y -= box2.min.y; // 바닥 y=0
}
