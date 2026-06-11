// 포켓몬 목록 + 타입 (한글)
// size = 최대 치수(미터). 진화단계 반영 (1단<2단<3단).
export const POKEMON_LIST = [
  { id: 'pichu',      name: '피츄',     type: '전기',      file: 'models/pichu.glb',      size: 1.2 },
  { id: 'pikachu',    name: '피카츄',   type: '전기',      file: 'models/pikachu.glb',    size: 1.8 },
  { id: 'raichu',     name: '라이츄',   type: '전기',      file: 'models/raichu.glb',     size: 2.6 },
  { id: 'charmander', name: '파이리',   type: '불꽃',      file: 'models/charmander.glb', size: 1.7 },
  { id: 'charmeleon', name: '리자드',   type: '불꽃',      file: 'models/charmeleon.glb', size: 2.4 },
  { id: 'charizard',  name: '리자몽',   type: '불꽃/비행', file: 'models/charizard.glb',  size: 3.8 },
  { id: 'squirtle',   name: '꼬부기',   type: '물',        file: 'models/squirtle.glb',   size: 1.5 },
  { id: 'wartortle',  name: '어니부기', type: '물',        file: 'models/wartortle.glb',  size: 2.1 },
  { id: 'blastoise',  name: '거북왕',   type: '물',        file: 'models/blastoise.glb',  size: 3.3 },
  { id: 'bulbasaur',  name: '이상해씨', type: '풀/독',     file: 'models/bulbasaur.glb',  size: 1.5 },
  { id: 'ivysaur',    name: '이상해풀', type: '풀/독',     file: 'models/ivysaur.glb',    size: 2.2 },
  { id: 'venusaur',   name: '이상해꽃', type: '풀/독',     file: 'models/venusaur.glb',   size: 3.8 },
];

// 전역 게임 상태
export const GameState = {
  selectedId: null,
  models: new Map(), // id -> { scene, } 로드된 원본
};
