import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { POKEMON_LIST, GameState } from './data.js';

// 12개 모델 전부 로드. 진행률 콜백. 머티리얼별 머지 후 캐시.
export async function loadAllModels(onProgress) {
  const loader = new GLTFLoader();
  let done = 0;
  const total = POKEMON_LIST.length;

  for (const p of POKEMON_LIST) {
    try {
      const gltf = await loader.loadAsync(p.file);
      const merged = optimize(gltf.scene); // 드로우콜 대폭 감소
      normalize(merged, p.size || 2.0); // 진화단계별 크기
      merged.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      GameState.models.set(p.id, { scene: merged, info: p });
    } catch (e) {
      console.error('로드 실패', p.id, e);
    }
    done++;
    onProgress?.(done, total);
  }
}

// 머티리얼별로 지오메트리 병합 → 머티리얼당 메쉬 1개.
// 30~57개 메쉬 → 보통 5~7개로. 드로우콜/오버헤드 급감.
function optimize(root) {
  root.updateWorldMatrix(true, true);
  const groups = new Map(); // material -> [worldGeom]
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    // 머지 호환 위해 공통 속성만 유지
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    }
    if (!g.attributes.uv) {
      const n = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    }
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!groups.has(mat)) groups.set(mat, []);
    groups.get(mat).push(g);
  });

  const out = new THREE.Group();
  for (const [mat, geoms] of groups) {
    const g = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms, false);
    if (g) {
      out.add(new THREE.Mesh(g, mat));
    } else {
      // 머지 실패(속성 불일치) → 개별 메쉬 유지 (누락 방지)
      for (const gi of geoms) out.add(new THREE.Mesh(gi, mat));
    }
  }
  return out;
}

// 최대 치수 = targetSize, 바닥(y=0) 정렬
function normalize(root, targetSize) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  root.scale.setScalar(targetSize / maxDim);

  const box2 = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3(); box2.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box2.min.y;
}

// 캐시된 원본 복제 (지오메트리/머티리얼 공유)
export function cloneModel(id) {
  const entry = GameState.models.get(id);
  return entry ? entry.scene.clone(true) : null;
}
