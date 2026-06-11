// 하단 미니맵: 경계 + 나무 + NPC + 플레이어(방향 화살표).
export class Minimap {
  constructor(canvas, map) {
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.map = map;
    this.half = map.size / 2; // 월드 반경
  }

  // 월드(x,z) → 캔버스(px). 게임 기본 카메라뷰와 일치:
  // 카메라가 +z서 -z 바라봄 → 화면 좌측=x+, 화면 위=z+.
  _p(x, z) {
    const px = (-x / this.half) * 0.5 + 0.5;
    const pz = (-z / this.half) * 0.5 + 0.5;
    return [px * this.w, pz * this.h];
  }

  draw(player, npcs) {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);

    // 경계
    c.strokeStyle = '#3a4a7a';
    c.lineWidth = 2;
    c.strokeRect(2, 2, this.w - 4, this.h - 4);

    // 중앙 길 (세로 밴드)
    const [lx] = this._p(-2.5, 0), [rx] = this._p(2.5, 0);
    c.fillStyle = '#1a223f';
    c.fillRect(lx, 0, rx - lx, this.h);

    // 나무
    c.fillStyle = '#2f7d3288';
    for (const t of (this.map.treePositions || [])) {
      const [x, y] = this._p(t.x, t.z);
      c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill();
    }

    // NPC
    c.fillStyle = '#56c8ff';
    for (const n of npcs) {
      const p = n.object.position;
      const [x, y] = this._p(p.x, p.z);
      c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }

    // 플레이어 (방향 삼각형)
    const pp = player.object.position;
    const [px, py] = this._p(pp.x, pp.z);
    const yaw = player.object.rotation.y;
    c.save();
    c.translate(px, py);
    c.rotate(-yaw); // 캔버스 z반전 보정
    c.fillStyle = '#ffcb05';
    c.beginPath();
    c.moveTo(0, -6); c.lineTo(4, 5); c.lineTo(-4, 5); c.closePath();
    c.fill();
    c.restore();
  }
}
