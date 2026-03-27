# Mamuri 2.0 — UX/UI 재설계 PART 3: 7개 핵심 화면

> 작성일: 2026-03-27
> 기반: `mobile/src/screens_v2/` + `mobile/src/design-system-v2/` 현재 구현 분석
> 방향: 텍스트 중심 → 스티커/비주얼 기반 감정 기록 앱
> 레퍼런스: 하루콩 (스티커 감정 기록), Day One (아름다운 저장 페이지), Daylio (빠른 감정 캡처)

---

## 현재 구현 → 재설계 갭 요약

| 화면 | 현재 (v2) | 재설계 목표 |
|------|-----------|-------------|
| 홈 | 텍스트 감정 칩 + 리스트 | 오늘의 감정 스티커 + 컴패니언 캐릭터 |
| 감정 선택 | 없음 (작성 화면 내 이모지 칩) | 전체 화면 스티커 그리드 |
| 일기 작성 | 텍스트 에디터만 | 사진+스티커+꾸미기 복합 에디터 |
| 일기 상세 | 텍스트 스크롤 | 아름다운 저장 페이지 |
| 아카이브 | 월별 텍스트 리스트 | 감정 스티커 캘린더 그리드 |
| 리플렉션 | 점 그래프 + 숫자 | 감정 여정 스토리 카드 |
| 컴패니언 | 설정 중심 프로필 페이지 | 대화형 캐릭터 + 관계 성장 |

---

# SCREEN 1: 홈/오늘 화면 (HomeScreenV2 → HomeStickerScreenV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri 감정 일기 앱 — 홈/오늘 화면 (v3 리빌드)
GOAL: 매일 앱을 열었을 때 "오늘의 감정을 기록하고 싶다"는 자연스러운 충동을 만드는 진입점.
      AI 컴패니언 캐릭터가 사용자를 반겨주고, 감정 스티커로 빠르게 오늘을 시작할 수 있다.

PLATFORM: React Native (Expo) — iOS/Android
SCREEN SIZE: 375×812 (iPhone 14 기준), safe area 고려

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ZONES (top → bottom)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ZONE 1] STATUS BAR AREA — safe area inset (자동)

[ZONE 2] COMPANION GREETING CARD — height: ~140px
  배경: primarySubtle (#F0EEFF) + borderRadius 24px
  margin: 16px 수평
  구성:
    - 왼쪽: 컴패니언 캐릭터 일러스트 (80×80px, 원형 clip)
      → 상태별 표정 변형: 기본/기쁨/걱정/졸림
    - 오른쪽: 인사 텍스트 영역
      · 상단: 시간대별 인사 (좋은 아침/오후/저녁/고요한 밤) — caption, textTertiary
      · 중단: 컴패니언 멘트 (최대 2줄) — bodyMedium, textPrimary
        예: "어젯밤 이야기 기억해요. 오늘은 어때요?"
      · 하단: 오른쪽 화살표 아이콘 (→, 8×8pt)
  탭 인터랙션: 컴패니언 화면으로 이동

[ZONE 3] TODAY'S EMOTION PROMPT — height: ~auto
  상단 라벨: "오늘의 기분은?" — labelSmall, uppercase, textTertiary
  margin-top: 32px

  감정 스티커 그리드 (2행 × 3열 = 6개 기본 감정):
    각 셀: 80×88px
    구성:
      · 스티커 이미지 (48×48px): PNG/SVG 캐릭터
        JOY(노란 해): #FFD166
        CALM(초록 잎): #83C9A8
        SAD(파란 물방울): #7BA7D9
        ANXIOUS(주황 물결): #E8A87C
        COMPLEX(보라 소용돌이): #B8B0C8
        BLANK(회색 물음표): #DDDBD4 — "모르겠어요" 옵션
      · 스티커 아래 라벨 (10px, textTertiary)
    선택 상태: 배경 원형 halo (emotion color + 20% opacity, r=44px)
    미선택 상태: 배경 없음

[ZONE 4] TODAY'S STATUS (오늘 기록 있을 때만) — height: ~72px
  이미 기록한 경우: "오늘 기록했어요" 배너
    배경: successSubtle, borderRadius 12px
    아이콘: 체크 이미지 스티커
    텍스트: "오늘의 감정 기록을 완료했어요" + 날짜
    탭: 오늘 일기 상세로 이동

[ZONE 5] THIS WEEK EMOTION STRIP — height: ~80px
  라벨: "이번 주" — labelSmall
  7개 요일 컬럼 (일~토):
    · 스티커 미니 (24×24px) — 기록 있는 날
    · 빈 원형 (24×24, border: borderSubtle) — 기록 없는 날
    · 요일 라벨 (9px, 해당 날짜 색상)
    · 오늘 강조: 컴패니언 색상 border

[ZONE 6] QUICK WRITE CTA — height: 54px
  버튼: "오늘 기록 시작하기"
    배경: primary (#6356D9)
    border-radius: 16px
    glow shadow: indigo
    오늘 이미 기록했으면: secondary color + "일기 더 쓰기" 텍스트

[ZONE 7] RECENT ENTRIES PREVIEW (스크롤 영역)
  "최근 기록" 라벨
  가로 스크롤 카드 (200×120px each):
    · 배경: 일기 대표 색상 (감정 색상 tint)
    · 날짜 + 감정 스티커 미니
    · 제목 (1줄)
    · 미리보기 텍스트 (2줄)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Home/Default — 기록 없는 빈 상태
- Home/Today-Recorded — 오늘 기록 완료 상태
- Home/Loading — skeleton 로딩
- Home/Error — 네트워크 오류 (retry 버튼)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REUSABLE COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- CompanionGreetingCard (props: name, message, avatarState, onPress)
- EmotionStickerGrid (props: emotions[], selected?, onSelect)
- WeekStrip (props: weekData[], today)
- RecentEntryCard (props: diary, onPress)
- PrimaryCtaButton (props: label, onPress, variant)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 감정 스티커 탭 → 해당 감정 pre-select 상태로 일기 작성 화면 이동
- 컴패니언 카드 탭 → 컴패니언 채팅 화면 이동
- 주간 스트립의 과거 날짜 탭 → 해당 날짜 일기 상세/아카이브 이동
- Pull-to-refresh: 컴패니언 멘트 + 주간 데이터 갱신
- 스티커 선택 시 작은 bounce 애니메이션 (scale 1.0 → 1.15 → 1.0)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAMING CONVENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frame: Home/[State]
Component: Home_[ComponentName]
Color: use design-system-v2 tokens only
```

## Section B — Frontend Handoff Notes

### 컴포넌트 계층
```
HomeStickerScreenV3
├── CompanionGreetingCard
│   ├── Image (companion avatar, 80×80)
│   ├── Text (greeting sub)
│   ├── Text (companion message)
│   └── Icon (arrow)
├── SectionLabel ("오늘의 기분은?")
├── EmotionStickerGrid
│   └── EmotionStickerCell × 6
│       ├── Image (sticker 48×48)
│       └── Text (label)
├── TodayRecordedBanner (conditional)
├── WeekStrip
│   └── WeekDayCell × 7
│       ├── Image|CircleEmpty (sticker mini 24×24)
│       └── Text (day label)
├── PrimaryCtaButton
└── ScrollView (horizontal) — RecentEntryCard × n
```

### Props/State 명세
```typescript
// 핵심 State
const [todayEntry, setTodayEntry] = useState<Diary | null>(null);
const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
const [weekData, setWeekData] = useState<WeekEntry[]>([]);
const [companionMsg, setCompanionMsg] = useState<string>('');
const [recentDiaries, setRecentDiaries] = useState<Diary[]>([]);

// EmotionStickerCell Props
interface EmotionStickerCellProps {
  emotionKey: 'JOY' | 'CALM' | 'SAD' | 'ANXIOUS' | 'COMPLEX' | 'BLANK';
  label: string;
  stickerSource: ImageSourcePropType; // PNG asset
  color: string;
  isSelected: boolean;
  onPress: (key: EmotionKey) => void;
}
```

### 레이아웃 노트
- `ScrollView` + `contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}`
- `EmotionStickerGrid`: `FlatList numColumns={3}` — React Native에서 가장 안정적
- 컴패니언 카드: `position: relative` — 절대위치 없이 flow에 포함
- 스티커 bounce: `Animated.sequence` (useNativeDriver: true)

---

# SCREEN 2: 감정 선택 화면 (신규: EmotionPickerScreenV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri — 감정 선택 전체 화면 (신규 화면)
GOAL: 텍스트 리스트 없이, 스티커/캐릭터 기반으로 감정을 고르는 즐거운 경험.
      1단계(기본 감정 5종) → 2단계(세부 감정 태그 선택) 플로우.

PLATFORM: React Native (Expo) Modal 또는 Stack Screen
TRIGGER: 홈 화면의 감정 스티커 탭 OR 일기 작성 화면의 감정 추가 버튼

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT — STEP 1: 기본 감정 선택
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HEADER]
  닫기 버튼 (X, 왼쪽) + "오늘의 감정" 제목 (center) + 여백 (오른쪽)

[HERO PROMPT]
  "지금 어떤 마음인가요?" — displayMedium, textPrimary, center
  margin-top: 40px

[EMOTION STICKER GRID — 5개 기본 감정]
  3행 배치 (2+2+1, 마지막은 center 정렬):

  각 감정 카드: 148×148px
    배경: 감정 색상 + 10% opacity (borderRadius 28px)
    선택 시: 감정 색상 + 30% opacity + border 2px (감정 색상)

    구성 (세로 center-align):
      · 스티커 이미지 64×64px
      · 감정 이름 (16px/600, textPrimary)
      · 감정 설명 (12px/400, textSecondary, optional)

    JOY: 노란 해 캐릭터 "좋아요" / CALM: 초록 잎 "괜찮아요"
    SAD: 파란 구름 "별로예요" / ANXIOUS: 주황 소용돌이 "힘들어요"
    COMPLEX: 보라 별 "복잡해요"

[CONFIRM BUTTON]
  "다음" — full width, primary color, disabled until 선택 완료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT — STEP 2: 세부 감정 태그
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HEADER]
  뒤로가기 버튼 + 선택한 기본 감정 스티커 (32px) + "태그 추가"

[PROMPT]
  "어떤 느낌인지 더 골라볼까요?" — titleLarge, center
  "(선택 안 해도 돼요)" — caption, textTertiary

[TAG CHIPS — 감정별 세부 태그 6~10개]
  Wrap 레이아웃 (flexWrap: 'wrap', justifyContent: 'center')
  각 태그 칩: height 36px, paddingH 16px, borderRadius 18px
    미선택: border 1px (border color), background: surface
    선택: background (emotion color + 20%), border (emotion color), text color (emotion)

  JOY 하위: 설렘 / 감사 / 뿌듯함 / 신남 / 사랑스러움 / 행복함
  CALM 하위: 평온 / 안정 / 여유 / 무덤덤 / 차분함
  SAD 하위: 외로움 / 그리움 / 공허함 / 서운함 / 슬픔
  ANXIOUS 하위: 불안 / 걱정 / 긴장 / 피곤 / 답답함
  COMPLEX 하위: 혼란 / 후회 / 아쉬움 / 복잡함 / 모르겠음

[CONFIRM BUTTON]
  "이 감정으로 시작하기" — full width, primary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- EmotionPicker/Step1-Empty
- EmotionPicker/Step1-Selected (JOY 예시)
- EmotionPicker/Step2-Tags (JOY → 태그들)
- EmotionPicker/Step2-TagsSelected

REUSABLE COMPONENTS
- EmotionCard (props: key, label, desc, stickerSrc, color, isSelected, onPress)
- EmotionTagChip (props: label, color, isSelected, onPress)
- StepHeader (props: step, title, onBack, onClose)
```

## Section B — Frontend Handoff Notes

### 구현 방식
- React Navigation Stack Screen (Modal presentation style)
- `route.params.preselectedEmotion`으로 Step 1 초기 선택값 전달 가능
- Step 1 → Step 2: 내부 `step` state로 관리 (별도 화면 아님)

```typescript
type EmotionKey = 'JOY' | 'CALM' | 'SAD' | 'ANXIOUS' | 'COMPLEX';

interface EmotionPickerState {
  step: 1 | 2;
  primaryEmotion: EmotionKey | null;
  secondaryTags: string[]; // max 3개 선택
}

// 완료 시 callback
interface EmotionPickerResult {
  primaryEmotion: EmotionKey;
  secondaryTags: string[];
}
```

### 레이아웃 노트
- `FlatList numColumns={2}` (Step 1 감정 카드)
- 마지막 홀수 아이템(COMPLEX): `ListFooterComponent`로 center 배치
- Tag Chips: `View flexWrap="wrap" flexDirection="row"`
- Animated.spring으로 카드 선택 피드백

---

# SCREEN 3: 일기 작성 화면 (DiaryWriteScreenV2 → DiaryExpressiveEditorV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri — 표현적 일기 에디터 (v3)
GOAL: 텍스트만이 아닌, 사진 + 스티커 + 꾸미기가 가능한 표현적 공간.
      "내 일기가 예쁘게 저장되고 싶다"는 욕구를 자극.

PLATFORM: React Native (Expo) Stack Screen
CONSTRAINT:
  - 복잡한 드래그/자유 배치 제스처 없음 (React Native 구현 고려)
  - 사진은 상단 고정 영역 (자유 삽입 아님)
  - 스티커는 텍스트 위 고정 위치 레이어 (4~6개 preset 위치)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ZONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ZONE 1] HEADER BAR — height: 56px
  취소(왼쪽 텍스트) | 날짜 (center, caption, textTertiary) | 저장(오른쪽, primary color)
  저장: 내용 입력 전 disabled (textDisabled)

[ZONE 2] MOOD BANNER — height: 56px (선택된 감정 있을 때)
  감정 스티커 (32px) + 감정 이름 + 세부 태그 칩들 (최대 3개)
  오른쪽 끝: "변경" 링크 (caption, primary)
  배경: 해당 감정 색상 + 8% opacity

  감정 미선택 시:
    점선 border 버튼 "감정 추가하기 +" (dashed, textTertiary)

[ZONE 3] PHOTO ZONE — height: 200px (사진 없으면 collapse, height: 0)
  사진 추가 버튼: 점선 border 직사각형 (16:9 비율)
    아이콘 + "사진 추가" 텍스트, textTertiary
  사진 추가 후: 이미지 full-width (200px height, cover)
    오른쪽 상단 X 버튼으로 제거

[ZONE 4] PAGE THEME SELECTOR — height: 48px
  가로 스크롤 미니 테마 칩 4개:
    · 기본 (흰 배경)
    · 노트 (연황색 + 줄무늬 느낌)
    · 야간 (다크 + 별)
    · 꽃잎 (연분홍 + 원형 데코)
  선택한 테마 → ZONE 5~6 배경색 반영

[ZONE 5] TITLE INPUT — height: auto
  placeholder: "제목 (선택사항)"
  typography: headlineMedium, textPrimary
  underline separator (border 1px, borderSubtle)

[ZONE 6] CONTENT AREA — min-height: 300px
  placeholder: "오늘 어떤 일이 있었나요?\n떠오르는 것들을 자유롭게 적어보세요."
  typography: bodyLarge, textPrimary, lineHeight: 28
  배경: 선택한 테마 색상 적용

  텍스트 위 스티커 오버레이 (선택사항):
    최대 3개 스티커를 텍스트 영역 모서리에 배치
    (고정 위치: top-right, bottom-left, top-left)

[ZONE 7] TOOLBAR (keyboard 위에 고정)
  아이콘 버튼 5개 (36×36px):
    📷 사진 추가
    🎨 테마 변경
    ✨ 스티커 추가 (데코 스티커 피커 열기)
    😊 감정 수정
    글자수 카운터 (n/2000)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Write/Empty — 아무것도 없는 초기 상태
- Write/WithEmotion — 감정 선택 후
- Write/WithPhoto — 사진 포함
- Write/WithStickers — 데코 스티커 추가 후
- Write/FullyDecorated — 감정+사진+스티커+테마
- Write/StickerPicker — 스티커 선택 bottom sheet
- Write/Loading — 저장 중 (버튼 spinner)

REUSABLE COMPONENTS
- MoodBanner (props: emotion, tags, onEdit)
- PhotoZone (props: uri?, onAdd, onRemove)
- ThemeSelector (props: themes[], selected, onSelect)
- EditorToolbar (props: onPhoto, onTheme, onSticker, onMood, charCount)
- DecoStickerOverlay (props: stickers[], positions[])
- StickerPickerSheet (props: visible, stickers[], onSelect, onClose)
```

## Section B — Frontend Handoff Notes

```typescript
interface DiaryEditorState {
  title: string;
  content: string;
  photoUri: string | null;
  selectedTheme: 'default' | 'note' | 'night' | 'petal';
  primaryEmotion: EmotionKey | null;
  secondaryTags: string[];
  decoStickers: DecoStickerPlacement[]; // 최대 3개
}

interface DecoStickerPlacement {
  stickerId: string;
  position: 'top-right' | 'top-left' | 'bottom-left'; // 고정 preset
}
```

### 레이아웃/구현 노트
- Toolbar: `KeyboardAccessoryView` (react-native-keyboard-accessory) 또는 `position: absolute, bottom: keyboardHeight`
- Photo: `expo-image-picker` — `ImagePicker.launchImageLibraryAsync`
- 스티커 오버레이: `View` with `position: absolute`, `pointerEvents: 'none'`
- 테마 선택: 4개 배경색/패턴만 변경 (복잡한 렌더링 없음)
- Bottom Sheet: `@gorhom/bottom-sheet` 또는 Modal + Animated.Value

---

# SCREEN 4: 일기 상세 화면 (DiaryDetailScreenV2 → DiaryPageDetailV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri — 일기 상세 (저장된 페이지) v3
GOAL: 작성한 일기를 "다시 보고 싶은 아름다운 페이지"로 표현.
      AI 컴패니언의 공감 답변이 아래 자연스럽게 이어짐.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ZONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ZONE 1] NAVIGATION BAR
  뒤로가기(←) | 날짜 (center) | 더보기(...) 메뉴 (수정/삭제)

[ZONE 2] DIARY PAGE — 전체 표현 영역
  배경: 선택한 테마 색상 (작성 시 선택)
  borderRadius: 0 (full width)
  paddingH: 24px

  [2a] EMOTION DISPLAY
    감정 스티커 (40px) + 감정 이름 (titleSmall) + 날짜 (caption, textTertiary)
    세부 감정 태그 칩들 (read-only 스타일)

  [2b] PHOTO (있을 때)
    full-width 이미지 (max-height: 240px, borderRadius: 16px)

  [2c] TITLE
    typography: headlineLarge, textPrimary

  [2d] CONTENT
    typography: bodyLarge, lineHeight: 30
    색상: textPrimary

  [2e] DECO STICKERS OVERLAY
    작성 시 배치한 스티커들 (read-only)

  [2f] METADATA FOOTER
    글자수 | 작성 시간 (HH:MM) — caption, textTertiary, right-aligned

[ZONE 3] DIVIDER — 얇은 선 + 컴패니언 아이콘 (center)
  패턴: ─── 💬 ───
  색상: borderSubtle

[ZONE 4] AI COMPANION RESPONSE
  [4a] COMPANION HEADER
    캐릭터 아바타 (36px) + 이름 + "의 답변" — titleSmall

  [4b] AI COMMENT BUBBLE
    배경: aiBubbleBg (#F0EEFF)
    borderRadius: 16px (top-left: 4px)
    padding: 16px
    typography: bodyMedium, aiBubbleText

  [4c] AI 없을 경우: "답변을 불러오는 중..." skeleton OR "재시도" 버튼

[ZONE 5] CONVERSATION AREA (기존 채팅 기능 유지)
  [5a] CONVERSATION HISTORY
    ChatBubble 컴포넌트 (기존 유지)

  [5b] REPLY INPUT BAR (키보드 위 고정)
    TextInput + 전송 버튼
    남은 대화 횟수 표시 (premium 아닌 경우)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Detail/Default — AI 답변 있음
- Detail/NoAI — AI 로딩 중 (skeleton)
- Detail/WithPhoto — 사진 포함 일기
- Detail/WithConversation — 대화 이어진 상태
- Detail/Error — 로드 실패
```

## Section B — Frontend Handoff Notes

- 기존 `DiaryDetailScreenV2` 로직 대부분 재사용 (API calls, ChatBubble 컴포넌트)
- 변경 핵심: ZONE 2 (Diary Page 비주얼) 레이아웃 추가
- 테마 배경: `diary.theme` 필드 추가 필요 (백엔드 API 확장)
- 데코 스티커: `diary.decoStickers: DecoStickerPlacement[]` 필드 추가 필요
- 스크롤: `ScrollView` — 일기 페이지 전체가 컨텐츠

---

# SCREEN 5: 캘린더/아카이브 화면 (DiaryArchiveScreenV2 → EmotionCalendarV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri — 감정 캘린더/아카이브 v3
GOAL: "감정 지도"처럼 과거 기록을 시각적으로 한눈에 볼 수 있는 화면.
      각 날짜에 감정 스티커가 쌓여 "나의 감정 역사"를 만드는 경험.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ZONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ZONE 1] HEADER
  "< 2026년 3월 >" — 월 네비게이션 (← 년월 →)
  오른쪽: 총 기록 수 배지 (ex: "23개")

[ZONE 2] CALENDAR GRID
  7열 × 5~6행 날짜 그리드

  각 날짜 셀: 48×56px
    · 날짜 숫자 (11px, textTertiary)
    · 감정 스티커 미니 (28×28px) — 기록 있는 날
    · 빈 원형 점 (8×8px, borderSubtle) — 기록 없는 날
    · 오늘: 날짜 숫자 배경 원 (primary color, 흰 텍스트)
    · 선택된 날짜: 감정 색상 배경 원 (32×32px)

  요일 헤더 행: 일 월 화 수 목 금 토 (10px, textTertiary)

[ZONE 3] SELECTED DAY DETAIL (탭 시 슬라이드업)
  날짜 + 감정 스티커 + 감정 이름
  → 일기 제목 미리보기 카드 (있을 경우)
  → "일기 보기" 버튼

[ZONE 4] MONTHLY EMOTION SUMMARY
  "이번 달 감정 패턴" 라벨
  5개 감정 비율 바 (가로):
    감정 스티커 미니 (20px) + 감정 이름 + 퍼센트 바 + n회

[ZONE 5] ALL ENTRIES LIST (아래 스크롤)
  "전체 기록 (n)" 라벨
  월별 그룹 SectionList — 기존 DiaryArchiveScreenV2 로직 재사용
  단, 각 항목 왼쪽에 감정 스티커 (36px) 추가

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Calendar/Month-Filled — 기록 많은 달
- Calendar/Month-Empty — 기록 없는 달
- Calendar/DaySelected — 날짜 선택 상태
- Calendar/Loading
- Calendar/Error

REUSABLE COMPONENTS
- MonthNavigator (props: year, month, onPrev, onNext)
- CalendarGrid (props: days[], selectedDate?, onDayPress)
- CalendarDayCell (props: date, entry?, isToday, isSelected)
- DayDetailPanel (props: date, entry, onViewDiary)
- MonthEmotionSummary (props: emotionCounts{})
- EmotionDiaryListItem (props: diary, onPress)
```

## Section B — Frontend Handoff Notes

```typescript
interface CalendarDayData {
  date: string; // YYYY-MM-DD
  hasEntry: boolean;
  primaryEmotion?: EmotionKey;
  stickerSource?: ImageSourcePropType;
  diaryId?: number;
}

// 기존 emotionApi.getCalendar(year, month) 활용
// 반환값에 감정 정보 이미 포함됨
```

- Calendar Grid: `FlatList` 또는 직접 계산 렌더 (7×6 고정 Grid)
- 선택 날짜 패널: `Animated.Value` height 슬라이드 또는 별도 Modal
- 기존 `DiaryArchiveScreenV2` SectionList 로직 ZONE 5에 재사용

---

# SCREEN 6: 리포트/리플렉션 화면 (ReflectScreenV2 → ReflectionStoryV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri — 리플렉션/리포트 화면 v3
GOAL: 숫자/그래프 나열이 아닌, "나의 감정 여정" 스토리 카드 형태.
      AI가 해석한 감정 변화 인사이트를 따뜻한 말로 전달.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ZONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ZONE 1] HEADER
  "리플렉션" 타이틀 (headlineLarge)
  서브: "나의 감정 기록" (caption, textTertiary)

[ZONE 2] THIS WEEK STORY CARD — 가장 중요한 카드
  배경: primarySubtle (#F0EEFF), borderRadius 24px
  padding: 24px

  [2a] 주간 감정 스트립 (7개 스티커 미니, 가로)
  [2b] AI 한줄 요약: "이번 주 가장 많이 느낀 건 '괜찮음'이었어요."
       → italic bodyMedium, textPrimary
  [2c] 감정 분포 도넛 (단순 비율 텍스트로 대체 가능):
       좋아요 3일 | 괜찮아요 2일 | 힘들어요 2일
  [2d] "자세히 보기" → ReportDetailScreen

[ZONE 3] PAST REPORTS LIST
  "지난 리포트" 라벨 (labelSmall, uppercase)
  가로 스크롤 카드 (180×220px each):
    배경: 해당 주 주요 감정 색상 tint
    제목: "n월 m주차"
    감정 스티커 스트립 (5개 미니)
    AI 요약 1줄 (캡션)
    탭 → ReportDetailScreen

[ZONE 4] EMOTION JOURNEY MAP
  "감정 흐름" 라벨
  30일 감정 미니 스티커 그리드 (달력형, 5×6)
  → Calendar 화면과 동일한 그리드 컴포넌트 재사용

[ZONE 5] EMPTY STATE (리포트 없을 때)
  컴패니언 캐릭터 + "7일치 기록이 쌓이면 리포트가 생성돼요"
  진행 바 (현재 n/7일)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Reflect/WithReports — 리포트 있음
- Reflect/NoReports — 빈 상태 (진행 바)
- Reflect/Loading
```

## Section B — Frontend Handoff Notes

- 기존 `ReflectScreenV2` → Weekly data, Calendar data, Reports API 재사용
- WeekStoryCard: 기존 `reportApi2.getAll()` 결과를 카드로 렌더
- 도넛 차트: 구현 복잡성 고려, 단순 텍스트/바 형식으로 대체 권장
- EmotionJourneyMap: `CalendarDayCell` 컴포넌트 재사용 (30일 축소형)

---

# SCREEN 7: AI 컴패니언 화면 (CompanionScreenV2 → CompanionChatV3)

## Section A — Figma / Gemini Prompt

```
FEATURE: Mamuri — AI 컴패니언 화면 v3
GOAL: 설정 중심 페이지에서 "맥락을 기억하는 친구와의 대화" 중심 화면으로 전환.
      캐릭터 감정 표현 + 대화 히스토리 + 관계 성장이 보이는 화면.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT ZONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ZONE 1] COMPANION PROFILE ZONE — height: ~180px
  배경: primarySubtle gradient (top→bottom)

  [1a] 컴패니언 캐릭터 아바타 (80×80px, 원형)
       하단 상태 뱃지: 현재 감정 스티커 미니 (24px) + 상태 텍스트 (예: "기억하고 있어요")
  [1b] 이름 (headlineMedium) + "이름 변경" 링크
  [1c] 관계 레벨 바:
       "함께한 지 n일" + 레벨 바 (0~100%)
       레벨 라벨: 새싹 → 친구 → 단짝 → 소울메이트
  [1d] 오늘의 한마디 (AI 생성): 말풍선 모양 텍스트 박스

[ZONE 2] COMPANION CONTEXT PILLS (기억 힌트)
  "기억하고 있어요:" 라벨
  가로 스크롤 태그:
    · 최근 감정 태그 (예: "이번 주 많이 힘들었죠")
    · 기억된 주제 (예: "직장 스트레스에 대해 이야기했어요")
    탭 → 해당 일기로 이동

[ZONE 3] QUICK CHAT (간단 대화 시작)
  "지금 어떤 이야기 해볼까요?" 프롬프트
  3개 퀵 리플라이 버튼:
    · "오늘 있었던 일 이야기할게요"
    · "감정이 복잡해요"
    · "그냥 안부 인사"
  탭 → DiaryWrite (해당 컨텍스트) 또는 일기 상세 내 대화

[ZONE 4] SETTINGS SECTION (접이식 아코디언)
  "AI 설정" 섹션 헤더 (기존 CompanionScreenV2 설정 유지)
  펼치면: 톤/말투/AI 코멘트 토글

[ZONE 5] DIARY ARCHIVE LINK
  "함께한 일기 n개" → DiaryArchive 이동

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FRAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Companion/Default
- Companion/Loading
- Companion/NoProfile (초기 설정 유도)
- Companion/SettingsExpanded

REUSABLE COMPONENTS
- CompanionAvatarCard (props: name, avatarState, levelData, todayMessage)
- RelationshipLevelBar (props: days, level, maxLevel)
- MemoryContextPills (props: memories[], onPress)
- QuickChatButtons (props: options[], onSelect)
```

## Section B — Frontend Handoff Notes

- 기존 `CompanionScreenV2` 로직 대부분 재사용
- 핵심 추가: `RelationshipLevelBar` (diaryCount 기반 레벨 계산)
- `MemoryContextPills`: `UserMemory` 백엔드 엔티티 활용 (이미 구현됨: `/ai/repository/UserMemoryRepository.java`)
- Quick Chat 버튼: 각 버튼별 `prefilledText` 파라미터로 DiaryWrite 진입

---

# 공통 UX 원칙 적용 매핑

| UX 원칙 | 화면별 적용 |
|---------|------------|
| 감정 안전 최우선 | 모든 화면에서 감정 부정/판단 없는 UI (선택 강제 없음, 스킵 가능) |
| 즉각적 공감 | AI 응답 없어도 감정 색상/스티커로 즉각 시각 피드백 |
| 표현의 자유 | Write 화면: 사진/스티커/텍스트 중 아무거나 선택 가능 |
| 아름다운 보관 | Detail 화면: 테마+스티커로 고유한 페이지 느낌 |
| 성장하는 관계 | Companion 화면: 레벨 바, 기억 힌트로 관계 시각화 |
| 비침투적 AI | AI 섹션은 항상 하단/후순위, 사용자 표현이 먼저 |
| 심플한 입력 | 감정 선택: 텍스트 입력 없이 탭만으로 완료 가능 |
| 시각적 역사 | Archive/Reflect: 텍스트 목록 → 스티커 지도 |
| 컴패니언 일관성 | 모든 화면의 AI 요소는 동일 캐릭터로 표현 |
| 프라이버시 존중 | 기억/메모리 기능 명시적 표시, 설정에서 off 가능 |
