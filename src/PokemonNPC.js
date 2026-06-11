import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { AnimationManager } from './AnimationManager.js';

// 떠도는 NPC 포켓몬. wander AI + 머리 위 라벨 + 클릭 정보.
export class PokemonNPC {
  constructor(model, info, map, spawn) {
    this.info = info;
    this.map = map;
    this.speed = 2.2;
    this.wrapper = new THREE.Group();
    this.wrapper.position.set(spawn.x, 0, spawn.z);
    model.position.y = 0;
    this.wrapper.add(model);
    this.anim = new AnimationManager(model);
    this.radius = 0.8;

    this.target = null;
    this.waitTimer = 1 + Math.random() * 3;
    this.facing = Math.random() * Math.PI * 2;
    this.wrapper.rotation.y = this.facing;

    // CSS2D 이름표
    const div = document.createElement('div');
    div.className = 'npc-label';
    div.textContent = info.name;
    this.label = new CSS2DObject(div);
    this.label.position.set(0, 2.6, 0);
    this.wrapper.add(this.label);

    // 레이캐스트 식별용
    this.wrapper.userData.npc = this;
    model.traverse((o) => { if (o.isMesh) o.userData.npc = this; });
  }

  get object() { return this.wrapper; }

  update(delta) {
    if (this.target) {
      const p = this.wrapper.position;
      const dx = this.target.x - p.x, dz = this.target.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.3) {
        this.target = null;
        this.waitTimer = 2 + Math.random() * 3;
        this.anim.setState('idle');
      } else {
        const nx = dx / dist, nz = dz / dist;
        const tx = p.x + nx * this.speed * delta;
        const tz = p.z + nz * this.speed * delta;
        const r = this.map.resolve(tx, tz, this.radius);
        p.x = r.x; p.z = r.z;
        this.facing = Math.atan2(nx, nz);
        this.anim.setState('walk');
      }
    } else {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        // 근처 랜덤 지점 선택
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 8;
        const p = this.wrapper.position;
        this.target = { x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r };
      }
    }

    this.wrapper.rotation.y = lerpAngle(this.wrapper.rotation.y, this.facing, 0.12);
    this.anim.update(delta);
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
