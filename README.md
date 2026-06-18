# 수동 심박기 (Manual Pacemaker) - Unity 2D 횡스크롤 프로토타입

Unity 2D 프로젝트 기반으로 전환 중입니다. 이 레포지토리에는 Unity 스크립트 골격과 프로젝트 플래그먼트가 포함되어 있습니다.

## Unity 개발 시작
1. Unity Hub 또는 Unity 에디터 없이도 이 폴더는 기본 스크립트와 프로젝트 구조를 포함합니다.
2. `Assets/Scripts/PlayerController.cs`, `Assets/Scripts/GameManager.cs`, `Assets/Scripts/WaveData.cs`를 확인합니다.
3. Unity 프로젝트를 생성한 뒤 `Assets` 폴더를 이 레포지토리 폴더에 복사하거나 해당 스크립트를 참조합니다.
4. `Assets/Scenes/MainScene.txt`를 참고하여 씬 구성을 구성하세요.
5. Microsoft Visual Studio 없이도 텍스트 편집기로 C# 스크립트를 수정할 수 있습니다.

## 핵심 조작
- 좌/우 이동: `A/D` 또는 방향키 좌/우
- `Space`: 심장 박자 유지
- `C`: 움직임 정지/재개
- `L`: 단서 로그(향후 Unity UI로 전환 예정)

## 웨이브 및 패턴
- `WaveData` ScriptableObject로 템포 및 이벤트 데이터를 구성
- 좌클릭/우클릭/휠클릭 패턴을 `PatternType`으로 확장
- 일부 웨이브에서 박자 템포가 느려지거나 빨라집니다

## 프로젝트 구조
- `Assets/Scripts/`: Unity C# 스크립트
- `Assets/Scenes/`: 씬 설명 및 설계 문서
- `Assets/Prefabs/`: 프리팹 설명
- `Assets/Resources/`: 런타임 리소스
- `ProjectSettings/`: Unity 프로젝트 설정 자리 표시자
- `Packages/`: Unity 패키지 매니페스트 자리 표시자

## 향후 작업
- Unity UI로 스토리/로그/게임오버 화면 구성
- 횡스크롤 레벨 디자인과 장애물 배치
- 패턴 입력 판정 및 시각 힌트 추가

구현된 항목:
-- `requestAnimationFrame` 기반 독립 게임 루프
-- WebAudio를 이용한 심장 비트 오디오(비주얼과 독립적으로 스케줄됨)
-- 스페이스바 리듬 판정 (허용 오차 ±0.12s)
-- 마우스 기믹: 클릭, 드래그(닦아내기), 홀드
-- 웨이브 데이터(간단 샘플)와 이벤트 스폰
-- 웨이브 종료 → `STORY`(휴식) 페이즈 전환 및 클릭으로 다음 웨이브 진행
-- 분기형 스토리 선택: 일부 스토리 페이지에서 선택지를 고르세요
-- 단서 로그: `L` 키 또는 `단서 로그` 버튼으로 수집 단서 확인 및 검색
-- 즉시 리트라이 UI (재시도 버튼 및 `R` 키)

참고: 구현은 프로토타입 수준으로, 타이밍/밸런스/사운드는 추후 조정 가능합니다.
