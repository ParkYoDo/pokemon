import * as THREE from 'three';

// 시드 랜덤 (재현 가능한 나무 배치)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MapBuilder {
  constructor(scene) {
    this.scene = scene;
    this.size = 70;
    this.colliders = []; // {x, z, r}
    this.bound = this.size / 2 - 3;
  }

  build() {
    this._ground();
    this._path();
    this._trees();
    this._lights();
    return this;
  }

  _ground() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x5fa84f, roughness: 1 });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.receiveShadow = true;
    this.scene.add(m);
  }

  _path() {
    // 중앙을 가로지르는 밝은 길
    const geo = new THREE.PlaneGeometry(8, this.size);
    const mat = new THREE.MeshStandardMaterial({ color: 0xc9b489, roughness: 1 });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.receiveShadow = true;
    this.scene.add(m);
  }

  _trees() {
    const rng = mulberry32(20240611);
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });
    const leafGeo = new THREE.SphereGeometry(2, 10, 8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 1 });

    // 위치 먼저 수집
    const spots = [];
    let guard = 0;
    while (spots.length < 30 && guard < 240) {
      guard++;
      const x = (rng() - 0.5) * (this.size - 10);
      const z = (rng() - 0.5) * (this.size - 10);
      if (Math.hypot(x, z) < 8) continue;   // 스폰 회피
      if (Math.abs(x) < 5) continue;        // 길 회피
      spots.push({ x, z });
      this.colliders.push({ x, z, r: 2.0 });
    }
    this.treePositions = spots; // 미니맵용

    // InstancedMesh 2개 (trunk, leaf) → 드로우콜 2개
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, spots.length);
    trunks.castShadow = leaves.castShadow = true;
    const m = new THREE.Matrix4();
    spots.forEach((s, i) => {
      m.makeTranslation(s.x, 1.5, s.z); trunks.setMatrixAt(i, m);
      m.makeTranslation(s.x, 3.6, s.z); leaves.setMatrixAt(i, m);
    });
    trunks.instanceMatrix.needsUpdate = leaves.instanceMatrix.needsUpdate = true;
    this.scene.add(trunks, leaves);
  }

  _lights() {
    const amb = new THREE.AmbientLight(0xb8c6ff, 0.55);
    this.scene.add(amb);

    const sun = new THREE.DirectionalLight(0xfff2d0, 1.6);
    sun.position.set(40, 70, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    const d = 80;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.camera.far = 200;
    this.scene.add(sun);
  }

  // 이동 좌표를 충돌/경계에 맞게 보정해 반환
  resolve(x, z, radius = 0.8) {
    // 나무 충돌 (밀어내기) — 여러 번 반복해 겹친 경우도 해소
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const c of this.colliders) {
        const dx = x - c.x, dz = z - c.z;
        const dist = Math.hypot(dx, dz);
        const min = c.r + radius;
        if (dist < min) {
          if (dist < 0.0001) { x += min; continue; } // 정확히 중심: 임의 방향 탈출
          const push = (min - dist);
          x += (dx / dist) * push;
          z += (dz / dist) * push;
          moved = true;
        }
      }
      if (!moved) break;
    }
    // 경계 (마지막에 적용)
    x = THREE.MathUtils.clamp(x, -this.bound, this.bound);
    z = THREE.MathUtils.clamp(z, -this.bound, this.bound);
    return { x, z };
  }
}
