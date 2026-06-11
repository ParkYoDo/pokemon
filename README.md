# 포켓몬 월드 (Pokémon World)

Three.js로 만든 3D 포켓몬 탐험 게임. 12마리 포켓몬은 Blender로 모델링해 `.glb`로 export.

## 실행

ES 모듈 + glb fetch 때문에 `file://`로는 안 됨. 로컬 HTTP 서버 필요.

```bash
cd pokemon-world
python3 -m http.server 8123
# 브라우저: http://localhost:8123
```

## 플레이

- **방향키** 이동, **마우스 드래그** 카메라 회전, **휠** 줌
- 시작 화면에서 12마리 중 파트너 선택 → 모험 시작
- 나머지 11마리는 NPC로 맵을 배회, 클릭 시 이름/타입 표시
- 우하단 미니맵에 전체 맵·NPC·내 위치 표시

## 구조

```
pokemon-world/
├── index.html              로딩/선택/HUD/미니맵 UI + CSS + importmap
├── main.js                 부트 → 선택 → 게임 루프
├── models/                 12 glb (Blender export)
└── src/
    ├── data.js             포켓몬 목록(한글명·타입·진화별 크기) + GameState
    ├── ModelLoader.js      로드, 머티리얼별 지오메트리 머지, clone 캐시
    ├── SelectionUI.js      4×3 선택 카드 + 공유 렌더러 3D 미리보기
    ├── SceneManager.js     렌더러/추적카메라/오빗/CSS2D/블룸
    ├── MapBuilder.js       잔디·길·나무(InstancedMesh)·라이트·충돌
    ├── CharacterController.js  방향키 이동, 충돌
    ├── PokemonNPC.js        wander AI + 이름표 + 클릭 정보
    ├── AnimationManager.js  절차적 idle/walk 애니메이션
    └── Minimap.js           하단 미니맵
```

## 기술

- Three.js r158 (importmap, CDN)
- GLTFLoader, EffectComposer + UnrealBloomPass (불꽃 발광)
- InstancedMesh / 지오메트리 머지로 드로우콜 최적화
- 빌드 도구 없음 — 정적 파일만
