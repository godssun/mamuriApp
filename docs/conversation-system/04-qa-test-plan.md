# AI 대화 기능 QA 테스트 플랜

## 테스트 개요

- **대상**: AI 대화 시스템 (대화형 답변 기능)
- **작성일**: 2026-03-01
- **티어**: FREE (1회/일기), MEDIUM (5회/일기), PREMIUM (무제한)

---

## 1. Happy Path (P0)

### TC-001: FREE 유저 첫 대화 성공
- **Preconditions**: FREE 유저, 일기 작성 완료, reply 0회
- **Steps**: POST /conversation/reply {"content": "고마워"}
- **Expected**: 200 OK, aiResponse 존재, remainingReplies: 0

### TC-002: MEDIUM 유저 5회 대화 성공
- **Preconditions**: MEDIUM 유저, 일기 작성 완료
- **Steps**: 5회 연속 reply
- **Expected**: remainingReplies: 4→3→2→1→0

### TC-003: PREMIUM 유저 무제한 대화
- **Preconditions**: PREMIUM 유저
- **Steps**: 10회 연속 reply
- **Expected**: 모두 200, remainingReplies: null

### TC-004: 대화 이력 조회
- **Preconditions**: 3회 대화 기록 존재
- **Steps**: GET /conversation
- **Expected**: messages 6개 (USER 3 + AI 3), sequenceNumber 오름차순

---

## 2. 구독 티어 테스트 (P0-P1)

### TC-101: FREE → MEDIUM 업그레이드 후 한도 증가
- **Preconditions**: FREE 유저, 1회 reply 소진
- **Steps**: MEDIUM 업그레이드 → 추가 reply
- **Expected**: 200 OK, remainingReplies: 4

### TC-102: PREMIUM → FREE 다운그레이드
- **Preconditions**: PREMIUM 유저, 3회 reply
- **Steps**: FREE 다운그레이드 → 추가 reply
- **Expected**: 403 REPLY_LIMIT_EXCEEDED

### TC-103: 구독 만료 후 FREE 자동 전환
- **Preconditions**: PREMIUM 유저, 결제 실패
- **Steps**: 만료일 도달 → reply 시도
- **Expected**: FREE 한도 적용, 기존 대화 보존

---

## 3. Reply Limit Edge Cases (P0-P1)

### TC-201: FREE 유저 2번째 reply 차단
- **Expected**: 403 + 업그레이드 안내 메시지

### TC-202: MEDIUM 유저 6번째 reply 차단
- **Expected**: 403 + PREMIUM 업그레이드 안내

### TC-203: 동시 reply 요청 (Race Condition) [P1]
- **Steps**: 2개 클라이언트 동시 reply
- **Expected**: 1개만 성공, 1개 403

### TC-204: 다른 일기에는 독립적 한도
- **Steps**: 일기 A 한도 소진 → 일기 B reply
- **Expected**: 일기 B 200 OK

### TC-205: 일기 수정 후 reply 한도 유지
- **Steps**: 일기 수정 → 추가 reply
- **Expected**: 한도 리셋 안 됨

### TC-206: 일기 삭제 시 대화 삭제 (CASCADE)
- **Expected**: conversation_messages 모두 삭제

---

## 4. Crisis/Safety (P0)

### TC-301: 일기에 위기 키워드 → 모든 제한 무시
- **Steps**: 위기 키워드 포함 일기 → reply 2회
- **Expected**: 모두 200, crisis_flag 활성화

### TC-302: User Reply에 위기 키워드
- **Steps**: reply에 "사라지고 싶어" 포함
- **Expected**: 200 (한도 무시), 안전 우선 AI 응답

### TC-303: Crisis Flag 7일 후 자동 해제 [P1]
- **Expected**: 해제 후 FREE 한도 적용

### TC-304: 안전 응답은 월 한도 차감 안 됨 [P1]
- **Expected**: 안전 응답 시 quotaUsed 변경 없음

---

## 5. AI 응답 품질 (P1)

### TC-401: 응답 길이 2-5문장
### TC-402: 공감적 톤 유지 (판단/훈계 없음)
### TC-403: 대화 이력 컨텍스트 유지
### TC-404: 의료 진단/약물 처방 금지 [P0]
### TC-405: AI 응답 실패 시 Graceful Degradation [P0]
- **Expected**: USER 메시지 저장, AI null, 재시도 안내

---

## 6. Error Handling (P0)

### TC-501: 빈 메시지 → 400
### TC-502: 500자 초과 → 400
### TC-503: 존재하지 않는 일기 → 404
### TC-504: 다른 유저 일기 → 403
### TC-505: 미인증 → 401
### TC-506: 만료 토큰 → 401

---

## 7. Rate Limiting (P1-P2)

### TC-601: FREE 분당 6회 → 5번째까지 200, 6번째 429
### TC-602: MEDIUM 시간당 101회 → 101번째 429
### TC-603: PREMIUM 분당 21회 → 21번째 429
### TC-604: Rate limit 윈도우 리셋 후 정상 동작

---

## 8. Performance (P1-P2)

### TC-701: AI 응답 5초 이하 (95th percentile)
### TC-702: 대화 이력 조회 100ms 이하
### TC-703: 동시 100명 부하 테스트 [P2]
### TC-704: DB 인덱스 효율성 (Index Scan 확인) [P2]

---

## 9. Data Integrity (P1)

### TC-801: Sequence number 연속성 (중복/누락 없음)
### TC-802: USER-AI 메시지 페어링 정확성
### TC-803: Diary 삭제 시 CASCADE 삭제
### TC-804: Token count 정확성
### TC-805: Prompt version 기록

---

## 10. Regression (P0-P1)

### TC-901: 기존 ai_comments 테이블 정상 동작
### TC-902: Streak 시스템 정상 동작
### TC-903: Companion 개인화 (이름, 톤) 유지
### TC-904: 일기 수정 후 기존 AI 댓글 유지
### TC-905: 월 AI 댓글 한도와 Reply 한도 독립성 [P0]

---

## 11. Security (P0)

### TC-1001: SQL Injection 방어
### TC-1002: XSS 방어
### TC-1003: JWT 토큰 변조 방어
### TC-1004: 민감 정보 로깅 방지

---

## Revenue-Risk Blockers

| 위험 | 테스트 | 영향 |
|------|--------|------|
| FREE 무제한 사용 | TC-201 | CRITICAL |
| 업그레이드 후 한도 미적용 | TC-101 | HIGH |
| Crisis flag 악용 | TC-301 | HIGH |
| Rate limit 미작동 | TC-601 | MEDIUM |
| 타인 일기 접근 | TC-504 | MEDIUM |

## Safety Blockers

| 위험 | 테스트 | 영향 |
|------|--------|------|
| AI 의료 진단 제공 | TC-404 | CRITICAL |
| Crisis 키워드 미감지 | TC-301 | CRITICAL |
| 위기 시 일반 응답 | TC-302 | HIGH |

---

## Exit Criteria

- P0: 100% pass
- P1: 95% pass
- P2: 90% pass
- Revenue-Risk Blocker: 0건
- Safety Blocker: 0건
