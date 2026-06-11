import * as THREE from 'three';
import { POKEMON_LIST, GameState } from './src/data.js';
import { loadAllModels, cloneModel } from './src/ModelLoader.js';
import { SelectionUI } from './src/SelectionUI.js';
import { SceneManager } from './src/SceneManager.js';
import { MapBuilder } from './src/MapBuilder.js';
import { CharacterController } from './src/CharacterController.js';
import { PokemonNPC } from './src/PokemonNPC.js';
import { Minimap } from './src/Minimap.js';

const $ = (s) => document.querySelector(s);

// 화면에 에러 표시 (콘솔 못 볼 때 진단용)
function showError(msg) {
  const t = $('#load-text');
  if (t) { t.style.color = '#ff7a7a'; t.textContent = '에러: ' + msg; }
  console.error(msg);
}
addEventListener('error', (e) => showError(e.message + ' @ ' + (e.filename || '')));
addEventListener('unhandledrejection', (e) => showError('promise: ' + (e.reason?.message || e.reason)));

// ===== 1. 로딩 =====
async function boot() {
  const bar = $('#bar'), txt = $('#load-text');
  await loadAllModels((done, total) => {
    bar.style.width = `${(done / total) * 100}%`;
    txt.textContent = `로딩중... ${done}/${total}`;
  });

  // 로딩 → 선택
  const loading = $('#loading');
  loading.style.opacity = '0';
  setTimeout(() => { loading.style.display = 'none'; }, 600);

  const ui = new SelectionUI(() => startGame(ui));
  ui.show();
}

// ===== 2. 페이드 후 게임 진입 =====
function startGame(ui) {
  const fade = $('#fade');
  fade.classList.add('show');
  setTimeout(() => {
    ui.hide();
    new Game(GameState.selectedId);
    requestAnimationFrame(() => fade.classList.remove('show'));
  }, 650);
}

// ===== 3. 게임 월드 =====
class Game {
  constructor(playerId) {
    this.sm = new SceneManager($('#app'));
    this.map = new MapBuilder(this.sm.scene).build();
    this.keys = {};
    this.npcs = [];
    this.clock = new THREE.Clock();

    this._spawnPlayer(playerId);
    this._spawnNPCs(playerId);
    this._input();

    $('#hud').style.display = 'block';
    $('#hud-name').textContent = POKEMON_LIST.find((p) => p.id === playerId).name;

    // 미니맵
    $('#minimap-wrap').style.display = 'block';
    this.minimap = new Minimap($('#minimap'), this.map);

    this._loop();
  }

  _spawnPlayer(id) {
    const model = cloneModel(id);
    model.scale.multiplyScalar(1.15); // 플레이어 살짝 크게
    this.player = new CharacterController(model, this.map);
    this.sm.scene.add(this.player.object);
    this.sm.follow(this.player.object);
  }

  _spawnNPCs(playerId) {
    const others = POKEMON_LIST.filter((p) => p.id !== playerId); // 11마리
    others.forEach((info, i) => {
      const model = cloneModel(info.id);
      // 스폰 위치: 중앙 회피, 분산
      const a = (i / others.length) * Math.PI * 2 + 0.4;
      const r = 9 + (i % 3) * 6;
      const spawn = { x: Math.cos(a) * r, z: Math.sin(a) * r };
      const npc = new PokemonNPC(model, info, this.map, spawn);
      this.sm.scene.add(npc.object);
      this.npcs.push(npc);
    });
  }

  _input() {
    addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });

    // NPC 클릭 → 팝업
    const ray = new THREE.Raycaster();
    const popup = $('#npc-popup');
    this.sm.renderer.domElement.addEventListener('click', (e) => {
      const m = new THREE.Vector2(
        (e.clientX / innerWidth) * 2 - 1,
        -(e.clientY / innerHeight) * 2 + 1
      );
      ray.setFromCamera(m, this.sm.camera);
      const hits = ray.intersectObjects(this.npcs.map((n) => n.object), true);
      const hit = hits.find((h) => findNPC(h.object));
      if (hit) {
        const npc = findNPC(hit.object);
        popup.querySelector('.pn').textContent = npc.info.name;
        popup.querySelector('.pt').textContent = `타입: ${npc.info.type}`;
        popup.style.left = e.clientX + 'px';
        popup.style.top = e.clientY + 'px';
        popup.style.display = 'block';
        clearTimeout(this._popupT);
        this._popupT = setTimeout(() => { popup.style.display = 'none'; }, 2500);
      } else {
        popup.style.display = 'none';
      }
    });
  }

  _loop() {
    const tick = () => {
      requestAnimationFrame(tick);
      const delta = Math.min(this.clock.getDelta(), 0.05);
      this.player.update(delta, this.keys, this.sm.camera);
      for (const n of this.npcs) n.update(delta);
      this.sm.updateCamera();
      this.minimap.draw(this.player, this.npcs);
      this.sm.render();
    };
    tick();
  }
}

function findNPC(obj) {
  let o = obj;
  while (o) { if (o.userData && o.userData.npc) return o.userData.npc; o = o.parent; }
  return null;
}

boot();
