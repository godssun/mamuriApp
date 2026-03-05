# Mamuri 리텐션 시스템 백엔드 아키텍처 리뷰

## 1. AI 후속 질문: Option A (동일 LLM 호출) 권장

### 근거

| 항목 | Option A (권장) | Option B (별도 호출) | Option C (템플릿) |
|------|----------------|-------------------|------------------|
| 토큰 비용 | +15% | +100% | 0 |
| 응답 품질 | 높음 | 높음 | 낮음 |
| 지연 시간 | +200ms | +1000ms | 0ms |
| 구현 복잡도 | 중간 | 높음 | 낮음 |

### DB 스키마 (V6 Migration)

```sql
ALTER TABLE ai_comments
ADD COLUMN IF NOT EXISTS followup_question TEXT;
```

### 프롬프트 변경 (v3)

JSON 형식 출력 강제:
```json
{
  "comment": "공감 코멘트 (2-5문장)",
  "followupQuestion": "후속 질문 (1문장, 20-50자)"
}
```

### 에러 처리

| 시나리오 | AI 코멘트 | 후속 질문 | 일기 저장 |
|---------|----------|----------|----------|
| 정상 (JSON 성공) | O | O | O |
| JSON 파싱 실패 | O (원본) | O (Fallback) | O |
| LLM 호출 실패 | X | X | O |
| 위기 감지 | O (안전 메시지) | X | O |

### 비용 영향

- 토큰 증가: ~+15% (50-60토큰/일기)
- 1만 사용자 기준 월 증가분: ~₩3,500
- ROI: 14,186% (프리미엄 전환율 +1%p 가정)

---

## 2. 스트릭 시스템: Option B (Denormalization) 권장

### DB 스키마 (V6 Migration)

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_diary_date DATE;
```

### 스트릭 로직 (User 엔티티)

```java
public void updateStreak(LocalDate diaryDate) {
    if (lastDiaryDate == null) {
        currentStreak = 1; longestStreak = 1;
    } else if (diaryDate.equals(lastDiaryDate)) {
        return; // 같은 날: 변화 없음
    } else if (diaryDate.equals(lastDiaryDate.plusDays(1))) {
        currentStreak++; // 연속
        longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diaryDate.isAfter(lastDiaryDate.plusDays(1))) {
        currentStreak = 1; // 중단 후 재시작
    }
    lastDiaryDate = diaryDate;
}
```

### API 설계

```
GET /api/user/streak
→ { currentStreak, longestStreak, lastDiaryDate, isActive }
```

### 타임존 전략

- 클라이언트가 `LocalDate` (YYYY-MM-DD) 형식으로 전송
- 서버는 타임존 독립적으로 저장/비교
- 사용자 선택 날짜 그대로 사용

### 엣지 케이스 대응

- 같은 날 여러 일기: 스트릭 변화 없음
- 백데이팅: MVP에서 무시 (스트릭 미갱신)
- 일기 삭제: last_diary_date 일치 시 재계산

---

## 3. 비용 최적화 전략

### Feature Flag 단계적 출시

| 단계 | 설정 | 대상 |
|------|------|------|
| 1 | enabled=false | 없음 (개발/테스트) |
| 2 | premium-only=true, rollout=10% | 프리미엄 10% |
| 3 | rollout=50% | 프리미엄 50% |
| 4 | rollout=100% | 전체 프리미엄 |
| 5 | premium-only=false | 전체 사용자 |

### 모니터링

- `ai_usage_log` 테이블로 일일 비용 추적
- 임계값 초과 시 Feature Flag 자동 OFF
- JSON 파싱 실패율 모니터링 (목표: <1%)
