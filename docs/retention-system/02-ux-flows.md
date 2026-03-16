# Mamuri 리텐션 시스템 UX 플로우

## 전체 플로우

```
1. 앱 실행
   ↓
2. 오늘 일기 작성 여부 확인
   ↓
   ├─ [미작성] EmptyTodayState 표시
   │   ├─ QuickStartButton 탭 → WriteDiaryScreen
   │   └─ FollowUpReminder 탭 → WriteDiaryScreen (질문 미리 채움)
   │
   └─ [작성 완료] DiaryListScreen (스트릭 캘린더)
       ├─ 날짜 탭 → DiaryDetailScreen
       │   └─ FollowUpQuestionCard 탭 → WriteDiaryScreen
       └─ FAB 탭 → WriteDiaryScreen (새 일기)
```

---

## Screen 1: AI 후속 질문 (DiaryDetailScreen 확장)

### 컴포넌트 계층

```
DiaryDetailScreen
├── ScrollView
│   ├── DiaryContentCard
│   │   ├── Text (날짜)
│   │   └── Text (일기 내용)
│   ├── Separator
│   ├── AICommentCard
│   │   ├── Icon (AI 아바타)
│   │   ├── Text (AI 이름)
│   │   └── Text (AI 답변)
│   ├── Separator
│   └── FollowUpQuestionSection
│       ├── [Loading] ActivityIndicator
│       ├── [Error] RetryButton
│       ├── [Empty] null
│       └── [Success] FollowUpQuestionCard
│           ├── Icon (질문 아이콘)
│           ├── Text (후속 질문)
│           └── Icon (화살표)
```

### 상태 관리

```typescript
interface DiaryDetailState {
  diary: Diary | null;
  aiComment: AIComment | null;
  followUpQuestion: string | null;
  followUpState: 'loading' | 'success' | 'error' | 'empty';
}
```

### 디자인 가이드

- AI 답변: 따뜻한 베이지/크림 배경
- 후속 질문: 연한 파스텔 블루/그린 배경, 질문 아이콘
- 탭 시 opacity 0.7 피드백 → WriteDiaryScreen 이동

---

## Screen 2: 스트릭 캘린더 (DiaryListScreen 확장)

### 컴포넌트 계층

```
DiaryListScreen
├── SafeAreaView
│   ├── StreakHeader (고정)
│   │   ├── View (현재 스트릭: X일 연속)
│   │   └── View (최장 스트릭: Y일)
│   ├── ScrollView
│   │   ├── CalendarGrid
│   │   │   └── FlatList<DayCell>
│   │   ├── MonthlyStatsBar
│   │   │   ├── ProgressBar
│   │   │   └── Text (X/30일 작성)
│   │   └── DiaryList (기존)
│   └── MilestoneBadge (조건부)
```

### 상태 관리

```typescript
interface StreakState {
  currentStreak: number;
  longestStreak: number;
  monthlyDiaryDates: Date[];
  milestoneAchieved: 7 | 30 | 100 | null;
  loading: boolean;
}
```

### 디자인 가이드

- 작성일: 따뜻한 오렌지/코랄 색상
- 미작성일: 연한 회색 (초대하는 느낌)
- 오늘: 테두리 강조
- 스트릭 카운터: 불꽃/하트 아이콘

---

## Screen 3: 빈 상태 (오늘 미작성)

### 컴포넌트 계층

```
EmptyTodaySection (DiaryListScreen 내 조건부)
├── CompanionGreeting
│   ├── Image (AI 캐릭터, 레벨별)
│   ├── View (말풍선)
│   │   └── Text (인사말)
│   └── Text (레벨 표시)
├── FollowUpReminder (조건부)
│   ├── Icon (질문 아이콘)
│   └── Text (어제 질문)
├── StreakRiskBadge (조건부, streak > 0)
│   ├── Icon (불꽃)
│   └── Text ("스트릭이 끊길 수 있어요")
└── QuickStartButton
    ├── Icon (펜)
    └── Text ("오늘 하루 기록하기")
```

### 디자인 가이드

- "해야 한다"가 아닌 "하고 싶게 만드는" 디자인
- 명령형 아닌 제안형 텍스트
- 넓은 여백으로 여유로운 느낌

---

## 공통 디자인 시스템

### 색상 팔레트

| 용도 | 색상 |
|------|------|
| Primary (CTA) | 따뜻한 코랄/오렌지 (#FF9070) |
| Background | 부드러운 크림 (#FFF8F0) |
| AI Comment | 연한 베이지 (#FFF4E6) |
| Follow-up Question | 연한 파스텔 그린 (#E8F5E9) |
| Text | 어두운 회색 (#333333) |
| Disabled | 연한 회색 (#CCCCCC) |

### 접근성

- 모든 인터랙티브 요소에 accessibilityLabel
- 최소 터치 영역: 44x44pt (iOS HIG)
- 충분한 색상 대비 (WCAG AA)
