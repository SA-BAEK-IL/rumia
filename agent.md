# 절대 규칙
데이터베이스 접근이 필요한 사항에 대해서는 이 파일에 모두 요약해서 진술할 것.

# 에이전트용 실행/업데이트 가이드
다른 채팅(또는 에이전트)이 이 레포지토에서 작업을 "즉시" 시작하고, 진행 상황을 TODO에 바로 반영하도록 하는 표준 지침입니다.

1) 작업 시작(빠른 실행)
 - 로컬 테스트(브라우저): `index.html` 파일을 열어 플레이합니다.
 - 변경 적용: 파일 편집은 `apply_patch` 규격을 사용합니다. 예) main.js 수정 패치 적용.

2) 진행상황(TODO) 즉시 업데이트
 - 모든 작업 변경 뒤에 `manage_todo_list` 도구를 호출해 TODO 상태를 갱신해야 합니다.
 - 예시 호출(다른 에이전트/세션에서 그대로 사용할 수 있음):

	{
		"todoList": [
			{"id":1,"title":"프로토타입 파일 생성","status":"completed"},
			{"id":2,"title":"게임 루프 및 리듬 판정 구현","status":"completed"},
			{"id":3,"title":"마우스 기믹(드래그/클릭/홀드) 구현","status":"completed"},
			{"id":4,"title":"사망/리트라이 및 UI 연출 추가","status":"completed"},
			{"id":5,"title":"간단한 웨이브 데이터와 README 작성","status":"completed"},
			{"id":6,"title":"스토리 노드 추가 및 데이터 정리","status":"completed"},
			{"id":7,"title":"스토리 UI 및 페이즈 전환 구현","status":"completed"},
			{"id":8,"title":"스토리 내 단서/로그 보기 구현","status":"in-progress"}
		],
		"description":"Update from agent: story UI implemented, log view in progress"
	}

3) 스크립트/명령 템플릿 (권장)
 - 파일 편집 후: `apply_patch` + 변경 설명(explanation)
 - 진행 갱신: `manage_todo_list`로 상태 반영
 - 확인(선택): `read_file`로 변경된 파일 일부를 읽어 결과를 검증

4) 다른 채팅/에이전트와 유연하게 협업하기
 - 간결하고 명확하게 상태를 보고하고, 필요한 경우 바로 작업을 이어갑니다.
 - 사용자 요구가 구체적이면 바로 구현으로 연결하고, 모호하면 최소한의 질문으로 명확히 합니다.
 - 작업 범위가 크면 작은 단위로 쪼개어 `TODO`를 갱신합니다.
 - 이미 만들어진 `README.md`, `agent.md`, `Assets/Scripts/` 구조를 활용하여 추가 변경을 판단합니다.
 - 새로운 파일이나 폴더가 필요하면 이름과 목적을 `agent.md`에 바로 추가합니다.
 - `agent.md` 내용에 따라 다른 채팅방에서도 일관된 절차로 작업할 수 있도록 합니다.
 - 사용자 또는 다른 에이전트에게는 항상 최신 진행 상태와 다음 계획을 간략히 제공합니다.

4) 스토리/단서 자동 추가 규칙
 - 스토리 콘텐츠는 `main.js`의 `stories` 배열에 배치합니다.
 - 기본 페이지: `{title, text}`
 - 단서 페이지: `{title, text, type:'clue'}`
 - 분기 페이지: `{type:'choice', title, text, options:[{label, nextIndex, clue?}]}`
 - 패턴/템포 이벤트는 `waves[].events`에 추가합니다.
   - 클릭 패턴: `{t, type:'pattern', pattern:'left-click'|'right-click'|'middle-click', text:'...'}`
   - 템포 변화: `{t, type:'tempo', bpm:숫자, duration:초, title:'...'}`
 - 새로운 단서를 추가할 때마다 에이전트는 다음을 수행해야 합니다:
	 1. `apply_patch`로 `main.js`의 `stories`에 노드 추가
	 2. `manage_todo_list`로 관련 TODO 항목을 `completed` 또는 `in-progress`로 갱신

5) 빠른 템플릿(다음 작업을 바로 수행하는 예)
 - 작업: '스토리 단서 팝업 구현'을 시작하려면 다른 에이전트가 다음을 수행합니다:
	 1. `apply_patch`로 `main.js`의 UI 코드 추가
	 2. `manage_todo_list`로 해당 항목을 `in-progress`로 표시

이 파일을 기준으로 에이전트가 작업하면, 다른 채팅에서도 동일한 절차(패치 적용 → TODO 갱신)를 반복하여 변경사항을 실시간처럼 반영할 수 있습니다.

# 파일/폴더
- index.html: 웹 프로토타입 진입점(기존)
- style.css: 웹 프로토타입 스타일(기존)
- main.js: 웹 프로토타입 게임 로직(기존)
- README.md: 실행 및 사용 설명서
- agent.md: 에이전트 작업 지침과 정책
- Assets/: Unity 2D 프로젝트 에셋
  - Scripts/: C# 게임 스크립트
  - Scenes/: Unity 씬 파일 및 씬 관련 설명
  - Prefabs/: 플레이어, 장애물, UI 프리팹
  - Resources/: 런타임 로드 자원
- ProjectSettings/: Unity 프로젝트 설정 placeholder
- Packages/: Unity 패키지 매니페스트 placeholder

## Unity-only 작업 안내
- 이 레포지토리는 Unity 에디터가 없어도 스크립트/구조를 보관하며, 추후 Unity로 가져가도 됩니다.
- Microsoft Visual Studio 없이도 기본 텍스트 편집기나 다른 코드 편집기를 사용하여 C# 스크립트를 수정할 수 있습니다.
- Unity 에디터를 설치하지 않은 환경에서도 파일 작업은 가능합니다.

# 향후 추가 가능 파일/폴더
- assets/: 웹 프로토타입 정적 자산
- sounds/: 오디오 파일
- data/: 웨이브, 스토리, 패턴 데이터를 별도 JSON/모듈로 관리
- docs/: 추가 게임 기획서, 사용자 지침, 기술 문서

# 기술 스택
# 규칙
