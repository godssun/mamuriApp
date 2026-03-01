# AI Companion 개인화 시스템 UX 설계

## 문서 정보

- **작성일**: 2026-03-01
- **목적**: AI 컴패니언 개인화 기능의 UX 설계 (Figma/Gemini 프롬프트 형식)
- **대상 화면**: 온보딩 플로우, 설정 화면, 아바타 선택, 프로필 편집
- **구현**: React Native + Expo

---

## 설계 개요

### 기존 시스템 컨텍스트

- **앱 컬러 시스템**
  - 배경: `#FFF9F5`
  - 주요: `#FF9B7A`
  - 텍스트: `#2D2D2D`
  - 보조: `#999`, `#666`

- **현재 구현된 기능**
  - CompanionScreen: 식물 이모지 성장(🌰→🏞️), 이름 편집 모달, 레벨+성장 기록 표시
  - SettingsScreen: AI 톤(warm/calm/cheerful), AI 활성화 토글
  - 네비게이션: MainTabs (DiaryList, Companion) + MainStack (Settings, Paywall, Subscription)

### 설계 목표

1. **감정적 애착 형성**: 컴패니언 이름, 아바타, 성격 선택을 통한 개인화
2. **단순함 유지**: React Native + Expo 구현에 적합한 단순 레이아웃
3. **일관성**: 기존 디자인 시스템 준수
4. **상태 처리**: 모든 화면에 loading / error / empty / success 상태 포함

---

## 화면 1: AI 컴패니언 온보딩 플로우

### A. Figma / Gemini Prompt

```
Generate a React Native onboarding flow design for an AI companion personalization feature.

Implementation constraints:
- React Native + Expo
- Single screen per step (no complex gestures)
- Simple navigation (Next/Back buttons)
- Minimal animations (optional fade-in only)

Color system:
- Background: #FFF9F5
- Primary: #FF9B7A
- Text: #2D2D2D
- Secondary: #999, #666

Required frames:
1. Step 1 - Companion Name Setup
2. Step 2 - Avatar Selection
3. Step 3 - Speech Style Selection
4. Step 4 - Personality Tone Selection
5. Loading State
6. Error State

Frame naming convention:
- Onboarding_Step1_Name
- Onboarding_Step2_Avatar
- Onboarding_Step3_SpeechStyle
- Onboarding_Step4_PersonalityTone
- Onboarding_Loading
- Onboarding_Error

Required reusable components:
- OnboardingHeader (step indicator, progress bar)
- OnboardingCard (white card with rounded corners, padding 24px)
- PrimaryButton (background #FF9B7A, text white, border-radius 12px, padding vertical 14px)
- SecondaryButton (background #F0F0F0, text #666, border-radius 12px, padding vertical 14px)
- OptionButton (selectable button with emoji/icon, border changes on selection)

Step 1 - Companion Name Setup:
- Header: "AI 친구 이름 설정" (center, 22px, bold)
- Description: "함께할 AI 친구의 이름을 지어주세요" (center, 14px, #666)
- Text input field (placeholder: "예: 마음이, 루나, 별이...", max 20 characters)
- Next button (disabled when input empty)

Step 2 - Avatar Selection:
- Header: "AI 친구 아바타 선택" (center, 22px, bold)
- Description: "AI 친구를 표현할 아바타를 선택해주세요" (center, 14px, #666)
- 4x4 grid of emoji buttons (size 56x56, selected has border #FF9B7A)
- Categories: 동물, 자연, 감정, 판타지 (horizontal scroll tabs above grid)
- Next button (enabled when one selected)

Step 3 - Speech Style Selection:
- Header: "말투 스타일 선택" (center, 22px, bold)
- Description: "AI 친구가 어떻게 말하길 원하시나요?" (center, 14px, #666)
- Two options (vertical stack, spacing 12px):
  - Option 1: "캐주얼 (반말)" - "편하게 대화하고 싶어요" (icon: 💬)
  - Option 2: "포멀 (존댓말)" - "정중한 말투가 좋아요" (icon: 📝)
- Next button (enabled when one selected)

Step 4 - Personality Tone Selection:
- Header: "성격 톤 선택" (center, 22px, bold)
- Description: "AI 친구의 성격을 선택해주세요" (center, 14px, #666)
- Four options (vertical stack, spacing 12px):
  - Option 1: "차분한" - "안정적이고 담담한 톤" (icon: 🌙)
  - Option 2: "친근한" - "따뜻하고 공감하는 톤" (icon: ☀️)
  - Option 3: "활발한" - "밝고 긍정적인 톤" (icon: ⭐)
  - Option 4: "현실적인" - "솔직하고 객관적인 톤" (icon: 🎯)
- Complete button (enabled when one selected)

Loading State:
- Centered spinner (color #FF9B7A)
- Text: "AI 친구를 준비하고 있어요..." (14px, #666)

Error State:
- Error icon (❌ or ⚠️, size 48)
- Text: "설정을 저장할 수 없습니다" (16px, #2D2D2D)
- Retry button (PrimaryButton)

Behavior notes:
- Progress indicator at top shows 4 steps (1/4, 2/4, 3/4, 4/4)
- Back button on steps 2-4 (top-left)
- Skip button on all steps except step 4 (top-right, applies defaults)
- All buttons have disabled state (opacity 0.5, unclickable)
- Success state navigates to Companion screen automatically
```

### B. Frontend Handoff Notes

**Component hierarchy:**
```
OnboardingFlow
├── OnboardingHeader (step indicator, back/skip buttons)
├── OnboardingStep1 (name input)
├── OnboardingStep2 (avatar grid)
├── OnboardingStep3 (speech style)
├── OnboardingStep4 (personality tone)
├── OnboardingLoading
└── OnboardingError
```

**Required props/state:**
- `OnboardingFlow`: currentStep (1-4), companionData { name, avatar, speechStyle, personalityTone }
- `OnboardingHeader`: step, totalSteps, onBack, onSkip
- `OnboardingStep1`: name, onNameChange, onNext
- `OnboardingStep2`: selectedAvatar, avatarCategory, onAvatarSelect, onCategoryChange, onNext
- `OnboardingStep3`: selectedStyle, onStyleSelect, onNext
- `OnboardingStep4`: selectedTone, onToneSelect, onComplete

**Responsive/layout behavior:**
- Fixed header (safe area top + 60px)
- Scrollable content area (allows keyboard visibility on step 1)
- Fixed footer with action buttons (safe area bottom + 20px)
- Emoji grid adjusts to screen width (min 4 columns, max 6 columns)

---

## 화면 2: AI 컴패니언 설정 화면

### A. Figma / Gemini Prompt

```
Generate a React Native settings screen design for AI companion personalization.

Implementation constraints:
- React Native + Expo
- Accessible from CompanionScreen or SettingsScreen
- Reuse existing SettingsScreen layout patterns
- Simple navigation (modal or stack navigation)

Color system:
- Background: #FFF9F5
- Primary: #FF9B7A
- Text: #2D2D2D
- Secondary: #999, #666

Required frames:
1. Companion Settings Main
2. Preview Modal (sample AI response with current settings)
3. Loading State
4. Error State
5. Success Toast

Frame naming convention:
- CompanionSettings_Main
- CompanionSettings_Preview
- CompanionSettings_Loading
- CompanionSettings_Error
- CompanionSettings_SuccessToast

Required reusable components:
- SettingsSection (group of related settings with title)
- SettingsRow (touchable row with label, description, chevron)
- PreviewCard (white card showing sample AI conversation)
- ToastNotification (success feedback after save)

Companion Settings Main:
- Header: "AI 친구 설정" (center, 17px, semi-bold) with back button
- Section 1 - 기본 정보:
  - Row 1: "이름" → shows current name, chevron, taps to edit modal
  - Row 2: "아바타" → shows current emoji, chevron, taps to avatar selector
- Section 2 - 대화 스타일:
  - Row 1: "말투 스타일" → shows "캐주얼/포멀", chevron, taps to selector
  - Row 2: "성격 톤" → shows current tone, chevron, taps to selector
- Preview Button (bottom, secondary style): "미리보기" (shows sample response)

Preview Modal:
- Semi-transparent overlay (rgba(0, 0, 0, 0.4))
- White card (border-radius 20px, padding 24px)
- Title: "AI 응답 미리보기" (18px, bold, center)
- Sample diary entry (gray box, 14px, italic): "오늘 하루 많이 힘들었어..."
- Sample AI response (white box with #FF9B7A border-left 4px): current settings-based response
- Close button (bottom, primary style)

Loading State:
- Centered spinner (color #FF9B7A)
- Text: "설정을 저장하고 있어요..." (14px, #666)

Error State:
- Alert dialog (white card, border-radius 20px, padding 24px)
- Title: "설정 저장 실패" (18px, bold, center)
- Message: error message from API (14px, #666, center)
- Retry button (primary)
- Cancel button (secondary)

Success Toast:
- Small banner at top (background #FF9B7A, padding 12px)
- Text: "설정이 저장되었습니다" (14px, white, center)
- Auto-dismiss after 2 seconds

Behavior notes:
- All changes save immediately when selected (optimistic update)
- Show success toast on successful save
- Show error alert on save failure (with retry option)
- Preview modal fetches sample response with current settings
- Back button confirms unsaved changes (if any) before exit
```

### B. Frontend Handoff Notes

**Component hierarchy:**
```
CompanionSettingsScreen
├── Header (back button, title)
├── ScrollView
│   ├── SettingsSection (기본 정보)
│   │   ├── SettingsRow (이름)
│   │   └── SettingsRow (아바타)
│   ├── SettingsSection (대화 스타일)
│   │   ├── SettingsRow (말투 스타일)
│   │   └── SettingsRow (성격 톤)
│   └── PreviewButton
├── PreviewModal (conditional render)
├── LoadingOverlay (conditional render)
├── ErrorAlert (conditional render)
└── SuccessToast (conditional render)
```

**Required props/state:**
- `CompanionSettingsScreen`: profile, isLoading, error, onUpdate
- `SettingsSection`: title, children
- `SettingsRow`: label, currentValue, onPress
- `PreviewModal`: visible, sampleResponse, onClose
- `SuccessToast`: visible, message

**Responsive/layout behavior:**
- Settings rows use flexbox (label on left, value on right)
- Modals center on screen with max width 320px
- Toast appears at top with safe area inset
- All interactive elements have minimum touch target 44x44

---

## 화면 3: 아바타 선택 화면

### A. Figma / Gemini Prompt

```
Generate a React Native avatar selection screen design.

Implementation constraints:
- React Native + Expo
- Accessible from onboarding or settings
- Emoji-based avatars (no custom images)
- Simple grid layout with category filtering

Color system:
- Background: #FFF9F5
- Primary: #FF9B7A
- Text: #2D2D2D
- Secondary: #999, #666

Required frames:
1. Avatar Selector Main
2. Category Filter State (different categories selected)
3. Empty State (no avatars in category)
4. Loading State
5. Success State (avatar selected)

Frame naming convention:
- AvatarSelector_Main
- AvatarSelector_CategoryAnimals
- AvatarSelector_CategoryNature
- AvatarSelector_CategoryEmotions
- AvatarSelector_CategoryFantasy
- AvatarSelector_Empty
- AvatarSelector_Loading
- AvatarSelector_Success

Required reusable components:
- CategoryTab (horizontal scroll tabs for filtering)
- AvatarGrid (4-6 columns responsive grid)
- AvatarButton (emoji button with selection border)
- SelectButton (primary button for confirming selection)

Avatar Selector Main:
- Header: "아바타 선택" (center, 17px, semi-bold) with back button
- Category tabs (horizontal scroll, sticky at top):
  - "전체" (default selected)
  - "동물" (🐻)
  - "자연" (🌿)
  - "감정" (💙)
  - "판타지" (✨)
- Grid of emoji avatars (56x56 each, spacing 12px):
  - Default border: transparent
  - Selected border: 2px solid #FF9B7A
  - Active background: #FFF0EB
- Footer with Select button (fixed at bottom, enabled when one selected)

Category Filter States:
- Show different emoji sets based on selected category:
  - 동물: 🐻 🐱 🐶 🦊 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🦉 🦅 🐺 🦝
  - 자연: 🌿 🌸 🌺 🌻 🌼 🌷 🌹 🌱 🌲 🌳 🌴 🌵 🍀 🌾 🌰 🏞️
  - 감정: 💙 💚 💛 🧡 💜 🤍 🖤 💗 💖 💕 💓 💞 💝 ❤️ 🩷 🩵
  - 판타지: ✨ ⭐ 🌟 💫 ⚡ 🔮 🎀 🎁 🎈 🎊 🎉 🧚 🦄 🐉 👑 🎭

Empty State:
- Icon: 🔍 (size 48)
- Text: "이 카테고리에 아바타가 없습니다" (14px, #999, center)
- Suggestion: "다른 카테고리를 확인해보세요" (12px, #BBB, center)

Loading State:
- Centered spinner (color #FF9B7A)
- Text: "아바타를 불러오고 있어요..." (14px, #666)

Success State:
- Show selected avatar with checkmark (✓)
- Auto-navigate back after selection (optional 200ms delay for visual feedback)

Behavior notes:
- Single selection only (radio behavior)
- Category tabs scroll horizontally if overflowing
- Grid adjusts columns based on screen width (4-6 columns)
- Select button saves selection and navigates back
- Current avatar (if any) is pre-selected on load
```

### B. Frontend Handoff Notes

**Component hierarchy:**
```
AvatarSelectorScreen
├── Header (back button, title)
├── CategoryTabs (horizontal scroll)
│   ├── CategoryTab (전체)
│   ├── CategoryTab (동물)
│   ├── CategoryTab (자연)
│   ├── CategoryTab (감정)
│   └── CategoryTab (판타지)
├── AvatarGrid (FlatList or ScrollView)
│   └── AvatarButton[] (emoji buttons)
└── Footer (Select button)
```

**Required props/state:**
- `AvatarSelectorScreen`: selectedAvatar, currentCategory, onAvatarSelect, onSave
- `CategoryTabs`: categories, activeCategory, onCategoryChange
- `CategoryTab`: label, emoji, isActive, onPress
- `AvatarGrid`: avatars (filtered by category), selectedAvatar, onAvatarPress
- `AvatarButton`: emoji, isSelected, onPress

**Responsive/layout behavior:**
- Category tabs use ScrollView horizontal with bounces disabled
- Avatar grid uses FlatList with numColumns={4} on small screens, {6} on tablets
- Grid item size calculated dynamically: (screenWidth - padding - gaps) / numColumns
- Footer fixed at bottom with safe area inset
- Emoji size scales with grid item size (0.7x container size)

**Avatar data structure:**
```typescript
type AvatarCategory = 'all' | 'animals' | 'nature' | 'emotions' | 'fantasy';

type Avatar = {
  emoji: string;
  category: AvatarCategory[];
  id: string;
};

const AVATARS: Avatar[] = [
  { emoji: '🐻', category: ['animals'], id: 'bear' },
  { emoji: '🌿', category: ['nature'], id: 'herb' },
  // ...
];
```

---

## 화면 4: 컴패니언 프로필 편집 화면

### A. Figma / Gemini Prompt

```
Generate a React Native companion profile edit screen design (extends existing name edit modal).

Implementation constraints:
- React Native + Expo
- Extends existing name edit modal from CompanionScreen
- Modal presentation (overlay + card)
- Simple form layout

Color system:
- Background: #FFF9F5
- Primary: #FF9B7A
- Text: #2D2D2D
- Secondary: #999, #666

Required frames:
1. Profile Edit Modal
2. Validation Error State
3. Loading State (saving)
4. Success State

Frame naming convention:
- ProfileEdit_Modal
- ProfileEdit_ValidationError
- ProfileEdit_Loading
- ProfileEdit_Success

Required reusable components:
- EditModal (overlay + white card container)
- FormField (label + input/selector)
- ModalButtons (cancel + save buttons)

Profile Edit Modal:
- Semi-transparent overlay (rgba(0, 0, 0, 0.4))
- White card (border-radius 20px, padding 24px, max-width 320px)
- Title: "AI 친구 프로필 수정" (18px, bold, center, margin-bottom 20px)
- Form fields (vertical stack, spacing 16px):
  - Field 1: "이름" (label 14px, semi-bold)
    - TextInput (background #F8F8F8, border-radius 12px, padding 14px, max 20 chars)
  - Field 2: "아바타" (label 14px, semi-bold)
    - Avatar preview button (shows current emoji 32px, tap to change)
  - Field 3: "말투 스타일" (label 14px, semi-bold)
    - Toggle buttons (캐주얼 | 포멀)
  - Field 4: "성격 톤" (label 14px, semi-bold)
    - Dropdown or button selector (차분한, 친근한, 활발한, 현실적인)
- Button row (horizontal, spacing 12px):
  - Cancel button (flex 1, background #F0F0F0, text #666)
  - Save button (flex 1, background #FF9B7A, text white)

Validation Error State:
- Show error text below invalid field (12px, #FF6B6B)
- Examples:
  - "이름을 입력해주세요" (empty name)
  - "이름은 20자 이하여야 합니다" (too long)
  - "아바타를 선택해주세요" (no avatar)

Loading State (saving):
- Save button shows spinner (ActivityIndicator, color white)
- Save button text replaced with spinner
- Cancel button disabled (opacity 0.5)

Success State:
- Modal closes automatically
- Show success toast in parent screen: "프로필이 저장되었습니다"

Behavior notes:
- Tap outside modal to dismiss (with unsaved changes warning)
- Cancel button dismisses modal (with unsaved changes warning)
- Save button disabled when no changes or validation errors
- Avatar field taps navigate to AvatarSelectorScreen (modal stack)
- All fields support keyboard navigation (tab order)
- TextInput auto-focuses on modal open
```

### B. Frontend Handoff Notes

**Component hierarchy:**
```
ProfileEditModal
├── Overlay (touchable to dismiss)
├── ModalCard
│   ├── ModalTitle
│   ├── Form
│   │   ├── FormField (이름)
│   │   │   └── TextInput
│   │   ├── FormField (아바타)
│   │   │   └── AvatarButton (navigates to selector)
│   │   ├── FormField (말투 스타일)
│   │   │   └── ToggleButtons
│   │   └── FormField (성격 톤)
│   │       └── Selector
│   └── ModalButtons (cancel + save)
└── ValidationErrors (conditional render)
```

**Required props/state:**
- `ProfileEditModal`: visible, profile, onClose, onSave
- `FormField`: label, error (optional), children
- `ModalButtons`: onCancel, onSave, isSaving, hasChanges

**Responsive/layout behavior:**
- Modal card centers on screen with horizontal padding 24px
- Form fields stack vertically with consistent spacing 16px
- Keyboard aware scroll (use KeyboardAvoidingView on iOS)
- Modal dismisses on overlay tap (with unsaved changes check)
- Avatar button opens AvatarSelectorScreen in modal stack

**Validation rules:**
```typescript
type ValidationRule = {
  field: 'name' | 'avatar' | 'speechStyle' | 'personalityTone';
  validate: (value: any) => string | null; // returns error message or null
};

const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'name',
    validate: (name: string) => {
      if (!name.trim()) return '이름을 입력해주세요';
      if (name.length > 20) return '이름은 20자 이하여야 합니다';
      return null;
    },
  },
  {
    field: 'avatar',
    validate: (avatar: string) => {
      if (!avatar) return '아바타를 선택해주세요';
      return null;
    },
  },
];
```

---

## 공통 디자인 가이드라인

### Typography

| 용도 | Size | Weight | Color |
|------|------|--------|-------|
| Screen Title | 28px | 700 | #2D2D2D |
| Section Title | 18px | 600 | #2D2D2D |
| Modal Title | 18px | 600 | #2D2D2D |
| Body Text | 15-16px | 400 | #2D2D2D |
| Description | 13-14px | 400 | #666 |
| Caption | 12-13px | 400 | #999 |
| Button Text | 15px | 600 | varies |

### Spacing

| Element | Spacing |
|---------|---------|
| Screen Padding | 20px |
| Card Padding | 24-28px |
| Section Margin | 24-32px |
| Item Gap | 12-16px |
| Button Padding | 14px vertical |

### Border Radius

| Element | Radius |
|---------|--------|
| Card | 16-20px |
| Button | 12px |
| Input | 12px |
| Modal | 20px |

### Shadows (iOS)

```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 8,
elevation: 2, // Android
```

---

## 네비게이션 플로우

```
회원가입 완료
  ↓
OnboardingFlow (Step 1-4)
  ↓
CompanionScreen (메인 탭)
  ↓ (⚙️ 아이콘 탭)
Settings (스택 네비게이션)
  ↓ (AI 친구 이름 또는 아바타 탭)
CompanionSettingsScreen
  ↓ (아바타 선택)
AvatarSelectorScreen
  ↓ (선택 완료)
CompanionSettingsScreen (업데이트)
  ↓ (뒤로가기)
Settings
```

**대체 플로우** (CompanionScreen에서 직접 편집):

```
CompanionScreen
  ↓ (이름 옆 ✏️ 아이콘 탭)
ProfileEditModal
  ↓ (아바타 필드 탭)
AvatarSelectorScreen (모달 스택)
  ↓ (선택 완료)
ProfileEditModal (업데이트)
  ↓ (저장)
CompanionScreen (업데이트)
```

---

## 구현 우선순위

### Phase 1: 온보딩 플로우 (필수)
- OnboardingFlow 4 steps
- 기본 아바타 세트 (16개 이모지)
- 말투/톤 선택
- API 연동 (POST /companion/profile)

### Phase 2: 설정 화면 확장 (필수)
- CompanionSettingsScreen
- 기존 SettingsScreen에 "AI 친구 설정" 메뉴 추가
- 설정 변경 API 연동 (PATCH /companion/profile)

### Phase 3: 아바타 선택기 (권장)
- AvatarSelectorScreen
- 카테고리별 필터링
- 전체 아바타 세트 (64개 이모지)

### Phase 4: 프로필 편집 모달 (선택)
- ProfileEditModal
- 모든 설정 통합 편집
- 미리보기 기능

### Phase 5: 폴리시 (선택)
- 미리보기 모달 (sample AI response)
- 애니메이션 (fade-in, slide transitions)
- 햅틱 피드백

---

## API 요구사항

### Endpoints

```typescript
// 컴패니언 프로필 초기 생성 (온보딩)
POST /api/companion/profile
Request: {
  name: string;
  avatar: string; // emoji
  speechStyle: 'casual' | 'formal';
  personalityTone: 'calm' | 'warm' | 'cheerful' | 'realistic';
}
Response: CompanionProfile

// 컴패니언 프로필 조회
GET /api/companion/profile
Response: CompanionProfile

// 컴패니언 프로필 수정
PATCH /api/companion/profile
Request: Partial<{
  name: string;
  avatar: string;
  speechStyle: 'casual' | 'formal';
  personalityTone: 'calm' | 'warm' | 'cheerful' | 'realistic';
}>
Response: CompanionProfile

// 미리보기 (선택)
POST /api/companion/preview
Request: {
  sampleDiary: string;
  speechStyle?: 'casual' | 'formal';
  personalityTone?: 'calm' | 'warm' | 'cheerful' | 'realistic';
}
Response: {
  sampleResponse: string;
}
```

### Data Model

```typescript
type CompanionProfile = {
  id: string;
  userId: string;
  name: string; // AI 친구 이름 (기본값: "마음이")
  avatar: string; // emoji (기본값: "🌰")
  speechStyle: 'casual' | 'formal'; // 말투 (기본값: "formal")
  personalityTone: 'calm' | 'warm' | 'cheerful' | 'realistic'; // 성격 (기본값: "warm")
  level: number; // 성장 레벨 (기존 필드)
  diaryCount: number; // 일기 개수 (기존 필드)
  createdAt: string;
  updatedAt: string;
};
```

---

## 에러 처리

### 공통 에러 시나리오

| 시나리오 | 상태 코드 | 메시지 | 처리 |
|---------|----------|--------|------|
| 이름 중복 | 409 | "이미 사용 중인 이름입니다" | 입력 필드 에러 표시 |
| 유효성 검사 실패 | 400 | "이름은 20자 이하여야 합니다" | 입력 필드 에러 표시 |
| 네트워크 에러 | - | "네트워크 연결을 확인해주세요" | 재시도 버튼 제공 |
| 서버 에러 | 500 | "잠시 후 다시 시도해주세요" | 재시도 버튼 제공 |
| 인증 만료 | 401 | "다시 로그인해주세요" | 로그아웃 후 로그인 화면 |

### 에러 UI 패턴

```typescript
// Inline error (form field)
<FormField label="이름" error={nameError}>
  <TextInput ... />
</FormField>

// Alert dialog (blocking error)
Alert.alert('설정 저장 실패', errorMessage, [
  { text: '취소', style: 'cancel' },
  { text: '재시도', onPress: retry },
]);

// Toast (non-blocking error)
<Toast
  visible={showToast}
  message="네트워크 연결을 확인해주세요"
  type="error"
/>
```

---

## 접근성 (a11y)

### 필수 요구사항

- 모든 interactive 요소는 최소 44x44 터치 영역
- 모든 이미지/아이콘에 accessibilityLabel 제공
- 입력 필드에 accessibilityHint 제공
- 색상 대비 WCAG AA 준수 (최소 4.5:1)
- Screen reader 지원 (VoiceOver, TalkBack)

### accessibilityLabel 예시

```typescript
<TouchableOpacity
  accessibilityLabel="아바타 선택"
  accessibilityHint="AI 친구의 아바타를 변경합니다"
  onPress={openAvatarSelector}
>
  <Text style={styles.avatarEmoji}>{avatar}</Text>
</TouchableOpacity>
```

---

## 테스트 체크리스트

### 온보딩 플로우
- [ ] Step 1-4 순차 진행
- [ ] Back 버튼으로 이전 단계 이동
- [ ] Skip 버튼으로 기본값 적용
- [ ] 이름 입력 유효성 검사 (빈 값, 20자 초과)
- [ ] 아바타 선택 (단일 선택)
- [ ] 말투/톤 선택 (단일 선택)
- [ ] 완료 시 CompanionScreen 이동
- [ ] 네트워크 에러 처리 (재시도)

### 설정 화면
- [ ] 각 설정 항목 탭 시 변경 화면 이동
- [ ] 설정 변경 즉시 저장 (optimistic update)
- [ ] 저장 성공 토스트 표시
- [ ] 저장 실패 에러 처리
- [ ] 미리보기 모달 열기/닫기
- [ ] 미리보기 샘플 응답 표시

### 아바타 선택기
- [ ] 카테고리 탭 전환
- [ ] 아바타 단일 선택
- [ ] 현재 아바타 pre-select
- [ ] 선택 완료 후 이전 화면으로 돌아가기
- [ ] Empty state (카테고리에 아바타 없음)

### 프로필 편집 모달
- [ ] 모달 열기/닫기
- [ ] 모든 필드 편집 가능
- [ ] 유효성 검사 (이름, 아바타 필수)
- [ ] 변경사항 없을 때 Save 버튼 비활성화
- [ ] 저장 중 로딩 상태
- [ ] 저장 성공 후 모달 닫기
- [ ] Overlay 탭으로 모달 닫기 (unsaved changes 경고)

---

## 마무리

이 문서는 AI Companion 개인화 시스템의 UX 설계를 Figma/Gemini 프롬프트 형식으로 정리했습니다.

**다음 단계**:
1. Figma 프롬프트를 Gemini에 입력하여 초기 디자인 생성
2. 생성된 디자인을 바탕으로 프론트엔드 구현 시작
3. Backend API 구현 (companion profile CRUD)
4. 통합 테스트 및 UX 검증

**구현 시 주의사항**:
- React Native + Expo 제약사항 준수
- 기존 디자인 시스템 일관성 유지
- 모든 상태 (loading/error/empty/success) 처리
- 접근성 가이드라인 준수
- 감정적 애착 형성에 초점

**참고 문서**:
- `docs/retention-system/01-product-spec.md` (전체 retention 시스템 기획)
- `docs/retention-system/02-ux-flows.md` (상세 UX 플로우)
- `mobile/src/screens/CompanionScreen.tsx` (기존 구현)
- `mobile/src/screens/SettingsScreen.tsx` (기존 구현)

---

End of document.
