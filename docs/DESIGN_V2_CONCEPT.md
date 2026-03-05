# MamuriApp Design v2 — 컨셉 비교 & 선택

## 1. 현재 UI 문제점 (v1)

| 영역 | 문제 | 심각도 |
|------|------|--------|
| 디자인 토큰 | 색상 20+ 곳에 하드코딩, 토큰 시스템 없음 | 높음 |
| 스페이싱 | 14, 16, 20px 등 규칙 없이 혼용 | 높음 |
| 타이포그래피 | Type Scale 부재, fontWeight 불규칙 | 높음 |
| Border Radius | 12, 14, 16, 20px 목적 없이 혼용 | 중간 |
| 비주얼 위계 | 프라이머리 컬러가 모든 곳에 동일 사용 | 높음 |
| 다크 모드 | 단순 색상 반전, tonal elevation 없음 | 중간 |
| 그림자 | 너무 미묘해서 카드 구분감 부족 | 낮음 |

---

## 2. 3가지 디자인 컨셉

### Concept A — Minimal Premium (미니멀 프리미엄)

**영감**: Linear, Notion, Apple Notes

| 속성 | 값 |
|------|-----|
| 프라이머리 | `#1A1A1A` (모노크롬) |
| 엑센트 | `#0066FF` (블루) |
| 배경 | `#FFFFFF` / `#FAFAFA` |
| 카드 | 얇은 보더 (1px), 미니멀 그림자 |
| 타이포그래피 | Inter / SF Pro, 절제된 사이즈 |
| 느낌 | 깔끔, 전문적, 도구적 |

**장점**: 세련되고 시간이 지나도 질리지 않음
**단점**: 일기 앱에 너무 차갑고 감성 부족. 감정적 교감 어려움

---

### Concept B — Emotional Cozy Diary (감성 아늑한 일기)

**영감**: Reflectly, Day One, 종이 다이어리

| 속성 | 값 |
|------|-----|
| 프라이머리 | `#FF9B7A` (코랄) — 현재 색상 유지 |
| 엑센트 | `#FFD166` (앰버 골드) |
| 배경 | `#FFF9F5` (웜 크림) |
| 카드 | 둥근 모서리 (20px), 부드러운 그림자 |
| 타이포그래피 | 나눔명조 + System, 따뜻한 세리프 강조 |
| 느낌 | 따뜻, 아늑, 감성적 |

**장점**: 일기 앱에 적합한 따뜻한 감성
**단점**: AI 컴패니언 차별화 약함. "예쁜 일기앱" 수준에 머무를 수 있음

---

### Concept C — AI Companion Style (AI 컴패니언) ← **선택됨**

**영감**: Calm + Headspace 감정 UX + Linear 프리미엄 미니멀리즘

| 속성 | 값 |
|------|-----|
| 프라이머리 | `#6356D9` (인디고/라벤더) |
| 세컨더리 | `#F0706A` (웜 로즈) |
| 엑센트 | `#D9B34A` (앰버 골드) |
| 배경 | `#FAFAF8` (웜 오프화이트) |
| 다크 배경 | `#0F0F14` (딥 네이비 블랙) |
| 카드 | 16px radius, sm/md 그림자 |
| 버블 | AI `#F0EEFF` (인디고50), User `#6356D9` |
| 타이포그래피 | System (기본), Georgia (세리프 옵션), 17pt body |
| 느낌 | 신뢰, 내면 성찰, AI 교감, 프리미엄 |

**장점**:
1. 인디고/라벤더는 내면 성찰과 정신적 균형을 연상 (Calm, 명상 앱 검증)
2. AI 컴패니언의 존재감을 시각적으로 차별화
3. 감정 컬러 시스템 (mood colors) 내장
4. 라이트/다크 모두 프리미엄 느낌
5. 앱스토어에서 차별화되는 독특한 아이덴티티

---

## 3. 선택: Concept C — AI Companion Style

### 선택 이유

1. **제품 핵심 가치와 일치**: MamuriApp의 USP는 "AI가 따뜻한 친구처럼 공감"하는 것.
   인디고/라벤더 계열은 신뢰감 + 내면 성찰을 시각적으로 전달하여 제품 가치와 완벽히 정렬됨.

2. **앱스토어 차별화**: 대부분의 일기 앱이 파스텔/코랄/핑크를 사용.
   인디고 기반은 "AI 컴패니언"이라는 독특한 포지셔닝을 시각적으로 즉시 전달함.

3. **감정 시스템 확장성**: 8가지 mood color가 인디고 베이스와 잘 조화됨.
   향후 감정 분석 시각화, 감정 트렌드 차트 등에 자연스럽게 확장 가능.

4. **다크 모드 프리미엄**: Calm 앱 영감의 딥 네이비 다크모드는
   "밤에 쓰는 일기" 경험에 최적화. 경쟁 앱 대비 월등한 다크 모드 품질.

---

## 4. 디자인 시스템 구조

```
mobile/src/design-system-v2/
├── colors.ts          # 프리미티브 팔레트 + 시맨틱 토큰 (Light/Dark)
├── typography.ts      # 15단계 타입 스케일 + 폰트 패밀리
├── spacing.ts         # 8pt grid + 레이아웃 상수
├── elevation.ts       # 6단계 그림자 + border radius
├── animations.ts      # 타이밍 토큰 + spring config + 피드백
├── theme.ts           # 테마 조합 + 팩토리 함수
├── ThemeContext.tsx    # React Context Provider + Hook
└── index.ts           # Public API
```

---

## 5. 구현된 스크린

```
mobile/src/screens_v2/
├── components/
│   ├── Button.tsx          # 4 variants, 3 sizes, press animation
│   ├── Input.tsx           # Focus animation, error state, label
│   ├── Card.tsx            # Elevation, press animation + DiaryCard
│   ├── ScreenContainer.tsx # Safe area, scroll, keyboard avoiding
│   ├── ChatBubble.tsx      # AI/User bubbles, typing indicator
│   └── index.ts
├── LoginScreenV2.tsx       # Entrance animation, centered layout
├── SignupScreenV2.tsx       # Progressive form, password strength
├── DiaryListScreenV2.tsx    # Mood timeline, streak, FAB
├── DiaryWriteScreenV2.tsx   # Distraction-free, mood selector
├── DiaryDetailScreenV2.tsx  # Reading + AI conversation
├── AICommentScreenV2.tsx    # Full chat, suggestions, typing
└── index.ts
```

---

## 6. 핵심 디자인 결정

| 결정 | 근거 |
|------|------|
| 프라이머리 인디고 `#6356D9` | 내면 성찰 + 신뢰 (Calm, Headspace 검증) |
| Body 17pt | Apple HIG 권장 기본 사이즈 |
| 8pt grid | Apple + Google 표준, 일관된 시각적 리듬 |
| 무드 컬러 바 (카드 왼쪽) | 한눈에 감정 파악, Reflectly 패턴 |
| AI 버블 인디고50 | AI 존재감 시각화, 유저 버블과 명확 구분 |
| Spring 애니메이션 | 자연스러운 감정 전달, iOS 네이티브 느낌 |
| 다크 모드 tonal elevation | MD3 패턴, 그림자 대신 표면 밝기 변화 |

---

## 7. Figma 캡처 (STEP 8)

> Figma MCP는 기존 파일 읽기/검사만 가능하며 새 디자인 생성은 불가합니다.
> 대신 이 디자인 스펙 문서와 구현 코드가 Figma 대체 산출물입니다.
> Expo 앱을 실행하여 실제 스크린을 캡처할 수 있습니다.

---

## 8. 다음 단계

1. [ ] v2 스크린을 실제 네비게이션에 연결 (A/B 테스트 가능)
2. [ ] API 연동 (mock data → real data)
3. [ ] Expo 실행 후 스크린 캡처 → 앱스토어 스크린샷 제작
4. [ ] 성능 프로파일링 (FlatList 최적화, 애니메이션 프레임 드롭 체크)
5. [ ] 접근성 검증 (컬러 대비, 터치 타겟, 스크린 리더)
