import * as THREE from 'three';

// glb에 클립이 없으므로 절차적 애니메이션.
// wrapper(Group) 안에 model을 넣고 wrapper를 이동/회전,
// model 내부에 bob/lean을 적용한다.
export class AnimationManager {
  constructor(model) {
    this.model = model;
    this.t = Math.random() * 10; // 개체별 위상차
    this.state = 'idle';
    this.baseY = model.position.y;
  }

  setState(s) { this.state = s; }

  update(delta) {
    this.t += delta;
    const m = this.model;

    if (this.state === 'walk') {
      // 빠른 상하 바운스 + 좌우 살짝 기울임 (걷는 느낌)
      const f = this.t * 11;
      m.position.y = this.baseY + Math.abs(Math.sin(f)) * 0.14;
      m.rotation.z = Math.sin(f) * 0.07;
      m.rotation.x = -0.05 + Math.sin(f * 2) * 0.02;
    } else {
      // idle: 느린 호흡 보빙
      const f = this.t * 2.2;
      m.position.y = this.baseY + Math.sin(f) * 0.04;
      m.rotation.z = Math.sin(f * 0.5) * 0.015;
      m.rotation.x = 0;
    }
  }
}
