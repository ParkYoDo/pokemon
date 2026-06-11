import * as THREE from 'three';
import { AnimationManager } from './AnimationManager.js';

// 플레이어 조종 포켓몬. wrapper(이동/방향) > model(애니메이션).
export class CharacterController {
  constructor(model, map) {
    this.map = map;
    this.speed = 5;
    this.wrapper = new THREE.Group();
    model.position.y = 0; // 모델 자체는 바닥기준 정렬됨
    this.wrapper.add(model);
    this.anim = new AnimationManager(model);
    this.facing = 0; // 목표 yaw
    this.radius = 0.9;
  }

  get object() { return this.wrapper; }
  getPosition() { return this.wrapper.position.clone(); }

  update(delta, keys, camera) {
    // 방향키 전용, 월드 고정 방향 (카메라 무관 → 예측가능)
    let ix = 0, iz = 0;
    if (keys['arrowup']) iz += 1;
    if (keys['arrowdown']) iz -= 1;
    if (keys['arrowleft']) ix += 1;
    if (keys['arrowright']) ix -= 1;

    const moving = ix !== 0 || iz !== 0;

    if (moving) {
      const len = Math.hypot(ix, iz) || 1;
      const nx = ix / len, nz = iz / len;

      const p = this.wrapper.position;
      const tx = p.x + nx * this.speed * delta;
      const tz = p.z + nz * this.speed * delta;
      const r = this.map.resolve(tx, tz, this.radius);
      p.x = r.x; p.z = r.z;

      this.facing = Math.atan2(nx, nz);
      this.anim.setState('walk');
    } else {
      this.anim.setState('idle');
    }

    // 부드러운 방향 전환
    this.wrapper.rotation.y = lerpAngle(this.wrapper.rotation.y, this.facing, 0.18);
    this.anim.update(delta);
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
