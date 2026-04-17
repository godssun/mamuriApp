# 아이패드 사진 잘림 — 댓글 영역 레이아웃 수정

## 문제 요약
아이패드/태블릿 화면에서 사진을 캔버스 아래쪽에 배치하면, 상세 화면에서 사진 하단이 잘리거나 댓글 영역에 가려지는 문제.

## 재현 경로
1. 아이패드 또는 큰 화면 기기에서 일기 작성
2. 사진을 캔버스 아래쪽에 배치
3. 저장
4. 상세 화면에서 사진 하단이 잘려 보임

## 근본 원인 분석

### 원인 1: canvasCard의 overflow: hidden
- `DiaryPageDetailV3.tsx`의 `canvasCard` 스타일에 `overflow: 'hidden'` 적용
- 캔버스 내부 사진은 absolute positioning으로 배치
- 사진이 캔버스 경계(minHeight: 400px)를 넘으면 잘림
- 아이패드에서는 넓은 화면으로 사진을 더 아래에 배치하는 경향

### 원인 2: 고정 minHeight와 absolute 포지셔닝 불일치
- `DiaryPageRenderer`의 `pageContainer`는 `minHeight: 400` 고정
- 사진은 absolute로 배치되어 컨테이너 높이에 영향을 주지 않음
- 사진 bottom이 400px 초과 시 잘림 발생

### 원인 3: 회전된 사진의 바운딩 박스 미반영
- 사진이 회전되면 실제 차지하는 영역이 더 커짐
- 컨테이너 높이 계산에 회전 효과가 반영되지 않음

## 수정 내용

### Fix 1: 동적 minHeight 계산 (DiaryPageRenderer.tsx)
- 모든 오브젝트의 y + height 최대값 계산
- 회전된 오브젝트는 height × 0.2 버퍼 추가
- `Math.max(400, objectsMaxBottom + LINE_HEIGHT)`로 동적 minHeight 적용
- 에디터와 상세 화면 모두에 적용 (공유 렌더러)

### Fix 2: overflow: visible 추가 (DiaryPageDetailV3.tsx)
- canvasCard 인라인 스타일에 `overflow: 'visible'` 추가
- 이미 배경/테두리/그림자가 제거된 상태이므로 시각적 부작용 없음
- 동적 높이와 함께 이중 안전장치 역할

## 수정 파일
- `mobile/src/screens_v2/components/DiaryPageRenderer.tsx` — 동적 minHeight 계산
- `mobile/src/screens_v2/DiaryPageDetailV3.tsx` — overflow: visible

## 기기별 영향
| 기기 | 캔버스 너비 | 영향 |
|------|-----------|------|
| iPhone SE | ~375px | 영향 적음 (사진이 작아 minHeight 내) |
| iPhone 15 Pro | ~393px | 영향 적음 |
| iPad Mini | ~744px | 개선됨 — 사진 배치 자유도 증가 |
| iPad Pro 12.9" | ~1024px | 개선됨 — 넓은 화면 활용 가능 |

## 검증 시나리오
1. 아이패드에서 사진을 캔버스 아래쪽에 배치 → 저장 → 잘림 없음 확인
2. 사진 회전(45도) 후 저장 → 회전된 부분 잘림 없음 확인
3. 사진 2장을 세로로 배치 → 저장 → 모두 표시 확인
4. 댓글 영역과 사진 영역 겹침 없음 확인
5. 가로/세로 회전 후 레이아웃 안정 확인
6. iPhone에서도 기존과 동일하게 작동 확인 (리그레션 없음)
