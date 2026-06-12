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

4) 스토리/단서 자동 추가 규칙
 - 스토리 콘텐츠는 `main.js`의 `stories` 배열에 배치합니다.
 - 새로운 단서를 추가할 때마다 에이전트는 다음을 수행해야 합니다:
	 1. `apply_patch`로 `main.js`의 `stories`에 노드 추가
	 2. `manage_todo_list`로 관련 TODO 항목을 `completed` 또는 `in-progress`로 갱신

5) 빠른 템플릿(다음 작업을 바로 수행하는 예)
 - 작업: '스토리 단서 팝업 구현'을 시작하려면 다른 에이전트가 다음을 수행합니다:
	 1. `apply_patch`로 `main.js`의 UI 코드 추가
	 2. `manage_todo_list`로 해당 항목을 `in-progress`로 표시

이 파일을 기준으로 에이전트가 작업하면, 다른 채팅에서도 동일한 절차(패치 적용 → TODO 갱신)를 반복하여 변경사항을 실시간처럼 반영할 수 있습니다.

# 기술 스택
# 규칙
