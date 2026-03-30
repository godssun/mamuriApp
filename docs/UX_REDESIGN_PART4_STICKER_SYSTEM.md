# Mamuri 2.0 — UX/UI 재설계 PART 4: 감정 스티커/에셋 시스템

> 작성일: 2026-03-27
> 목적: 스티커 감정 시스템 전체 설계 — 카테고리 구조, 비주얼 스타일, 꾸미기 시스템, 에셋 전략

---

## 1. 감정 카테고리 구조 (2-Tier System)

### Tier 1 — 기본 감정 (Primary Emotions, 5종)
앱의 핵심 감정 분류. 캘린더/홈/리포트에서 메인 식별자로 사용.

| Key | 한국어 | 색상 | 스티커 컨셉 | 현재 코드 값 |
|-----|--------|------|------------|------------|
| JOY | 좋아요 | #FFD166 | 밝게 웃는 해/별 캐릭터 | ✅ 구현됨 |
| CALM | 괜찮아요 | #83C9A8 | 잔잔한 잎/달 캐릭터 | ✅ 구현됨 |
| SAD | 별로예요 | #7BA7D9 | 조용한 물방울 캐릭터 | ✅ 구현됨 |
| ANXIOUS | 힘들어요 | #E8A87C | 흔들리는 불꽃/파도 캐릭터 | ✅ 구현됨 |
| COMPLEX | 복잡해요 | #B8B0C8 | 소용돌이/별무리 캐릭터 | ✅ 구현됨 |

### Tier 2 — 세부 감정 태그 (Secondary Tags, 30종)
선택 필드. 기본 감정 선택 후 세부 뉘앙스를 추가. 텍스트 칩으로 표현 (스티커 없음).

```
JOY (6개): 설렘, 감사, 뿌듯함, 신남, 사랑스러움, 행복함
CALM (5개): 평온, 안정, 여유, 무덤덤, 차분함
SAD (6개): 외로움, 그리움, 공허함, 서운함, 슬픔, 쓸쓸함
ANXIOUS (7개): 불안, 걱정, 긴장, 피곤, 답답함, 지침, 부담스러움
COMPLEX (6개): 혼란, 후회, 아쉬움, 복잡함, 모르겠음, 무기력
```

---

## 2. 스티커 비주얼 스타일 가이드

### 2.1 디자인 방향 — "따뜻한 미니멀리즘"

**핵심 키워드**: 귀엽되 유치하지 않은 / 따뜻한 / 감정적으로 공명하는

| 속성 | 규칙 |
|------|------|
| 선 두께 | 2~3px 부드러운 라운드 선 (sharp edge 없음) |
| 표정 | 눈: 작은 원형 2개. 입: 단순 곡선. 과장 없음. |
| 몸 형태 | 기하학적 기반 (원형/타원 베이스). 팔다리 있으면 짧고 둥글게. |
| 색상 | 각 감정 팔레트 내 2~3색만 사용 (배경색 + 포인트색 + 라인색) |
| 배경 | 투명 PNG. 스티커 자체에 배경 없음. |
| 크기 | 기본 128×128px (2x), 캘린더용 48×48px (1x) |
| 스타일 | 플랫 2D. 그라데이션 최소화. 그림자 없음. |

### 2.2 감정별 스티커 컨셉 상세

#### JOY (좋아요) — #FFD166 계열
```
메인 스티커: 작고 둥근 해 캐릭터
  - 원형 몸체 (노란색 #FFD166)
  - 짧은 광선 6~8개 (amber200)
  - 둥근 눈 + 넓은 미소
  - 볼 블러시 (rose200, optional)

변형 스티커 (세부 감정 연계):
  - 설렘: 심장 포함 버전
  - 감사: 양손 모은 버전
  - 뿌듯함: 엄지 위로 버전
```

#### CALM (괜찮아요) — #83C9A8 계열
```
메인 스티커: 잔잔한 달 + 잎 캐릭터
  - 초승달 모양 몸체 (green400)
  - 눈 감은 표정 (평온함)
  - 작은 잎사귀 장식

변형:
  - 평온: 눈 감은 달 기본
  - 여유: 앉아서 기지개 동작
```

#### SAD (별로예요) — #7BA7D9 계열
```
메인 스티커: 작은 물방울 캐릭터
  - 물방울 형태 몸체 (blue400)
  - 슬픈 눈 (아래로 향한 눈썹)
  - 표정: 울지 않음. 조용히 슬픈 표정.

주의: 울거나 눈물 흘리는 표정 지양 (과도한 슬픔 강조 방지)
```

#### ANXIOUS (힘들어요) — #E8A87C 계열
```
메인 스티커: 흔들리는 작은 불꽃 캐릭터
  - 불꽃/파도 형태 몸체 (amber300)
  - 약간 찌푸린 눈썹 + 작은 땀방울
  - 흔들리는 동작감 (살짝 기울어진 형태)

주의: 공포/패닉 표현 지양. "힘들지만 버티고 있는" 느낌.
```

#### COMPLEX (복잡해요) — #B8B0C8 계열
```
메인 스티커: 소용돌이 별 캐릭터
  - 둥근 몸체 + 별 모양 포인트 (lavender)
  - 표정: 어리둥절 + 살짝 생각하는 눈
  - 머리 위 작은 물음표 or 별빛
```

### 2.3 스타일 금지 사항
- 극단적 표정 (과한 울음, 분노 표현) ❌
- 복잡한 배경 패턴 ❌
- 3D 효과/그라데이션 ❌
- 너무 귀여운 파스텔 과다 ❌ (유치한 느낌)
- 서양 이모지 스타일 직접 참조 ❌

---

## 3. 꾸미기 스티커 시스템 (데코 스티커)

### 3.1 카테고리 구조 (5개 팩)

| 팩 | 테마 | 수량 | 사용 위치 |
|----|------|------|----------|
| 기본 무드 | 날씨/자연 (맑음/흐림/비/밤하늘) | 12개 | 일기 페이지 꾸미기 |
| 일상 오브젝트 | 커피/책/꽃/음식 | 16개 | 일기 페이지 꾸미기 |
| 시간/계절 | 봄/여름/가을/겨울 계절별 | 16개 | 일기 페이지 꾸미기 |
| 감사/격려 | 별/반짝임/하트/왕관 | 12개 | 일기 강조 표현 |
| 텍스트 데코 | "오늘도 수고했어" 등 손글씨 스티커 | 8개 | 일기 마무리 |

### 3.2 데코 스티커 배치 방식

React Native 구현 가능한 **고정 위치 프리셋 방식**:
```
┌─────────────────────┐
│ [A]           [B]   │  A: 왼쪽 상단 (top-left)
│                     │  B: 오른쪽 상단 (top-right)
│    일기 내용        │
│                     │  C: 오른쪽 하단 (bottom-right)
│              [C]    │
└─────────────────────┘
```

- 최대 3개 동시 배치
- 위치 변경: 해당 위치 탭 → 다른 스티커로 교체 or 제거
- 자유 드래그 없음 (구현 복잡성 배제)

### 3.3 스티커 선택 UI (Bottom Sheet)

```
StickerPickerSheet 구조:
  - 탭 바: [감정 스티커 5] [기본 무드] [일상] [계절] [격려] [텍스트]
  - 그리드: 4열 × 3행 (12개 visible, 스크롤)
  - 각 셀: 64×64px
  - 선택 피드백: scale bounce
  - 닫기: 스와이프 다운 or 외부 탭
```

---

## 4. 커스터마이징 여부

### MVP 단계 (현재 목표)
| 기능 | 제공 여부 | 근거 |
|------|-----------|------|
| 감정 스티커 변경 | ❌ 고정 | 일관된 감정 데이터 추적 위해 |
| 데코 스티커 선택 | ✅ 자유 선택 | 표현의 다양성 |
| 일기 배경 테마 | ✅ 4가지 프리셋 | 간단한 개인화 |
| 컴패니언 아바타 | ✅ 3~5가지 선택 | 관계감 형성 |
| 추가 스티커 팩 | 🔒 프리미엄 잠금 | 수익화 레버 |

### Post-MVP
- 사용자 자체 이미지 스티커 업로드
- 시즌별 한정 스티커 팩
- Gemini 생성 개인화 스티커

---

## 5. 에셋 생성 전략

### 5.1 권장 전략: 정적 큐레이션 (MVP)

**이유**:
- 빠른 런칭 가능 (Gemini 생성 의존 없음)
- 브랜드 일관성 유지
- 오프라인 작동 (에셋 번들 내 포함)
- 감정 표현의 정확성 통제 가능

**실행 계획**:
```
1. 핵심 5개 감정 스티커 → Figma에서 디자인
   (기준 크기: 128×128px SVG)

2. 데코 스티커 56개 → Figma 일괄 생성
   (PNG 1x/2x/3x export)

3. 번들 포함:
   mobile/assets/stickers/
   ├── emotion/
   │   ├── joy.png (+ @2x, @3x)
   │   ├── calm.png
   │   ├── sad.png
   │   ├── anxious.png
   │   └── complex.png
   └── deco/
       ├── mood/ (12개)
       ├── daily/ (16개)
       ├── season/ (16개)
       ├── cheer/ (12개)
       └── text/ (8개)

4. require() 정적 import:
   const STICKER_MAP = {
     JOY: require('../assets/stickers/emotion/joy.png'),
     ...
   }
```

### 5.2 하이브리드 전략 (Post-MVP)

| 에셋 유형 | 방식 | 시점 |
|---------|------|------|
| 기본 감정 스티커 | 정적 번들 | 항상 |
| 계절/이벤트 스티커 | CDN 원격 로드 | Post-MVP |
| 개인화 AI 스티커 | Gemini 생성 + 캐시 | Premium 기능 |
| 커스텀 텍스트 스티커 | 앱 내 생성 | Post-MVP |

### 5.3 Gemini 스티커 생성 시 프롬프트 템플릿 (참고용)
```
"Create a simple, cute but not childish sticker illustration for a Korean emotion diary app.
Style: flat 2D, minimal, warm, rounded shapes, 2-3 colors only.
Emotion: [JOY/CALM/SAD/ANXIOUS/COMPLEX]
Color palette: [해당 감정 색상]
Size: 128×128px transparent PNG.
No text, no background. Clean, smooth lines."
```

---

## 6. React Native 구현 가이드

### 6.1 스티커 로딩 패턴
```typescript
// 정적 에셋 매핑
export const EMOTION_STICKERS: Record<EmotionKey, ImageSourcePropType> = {
  JOY: require('../../assets/stickers/emotion/joy.png'),
  CALM: require('../../assets/stickers/emotion/calm.png'),
  SAD: require('../../assets/stickers/emotion/sad.png'),
  ANXIOUS: require('../../assets/stickers/emotion/anxious.png'),
  COMPLEX: require('../../assets/stickers/emotion/complex.png'),
};

// 사용
<Image source={EMOTION_STICKERS[entry.primaryEmotion]} style={{ width: 48, height: 48 }} />
```

### 6.2 스티커 크기 표준
```typescript
export const STICKER_SIZES = {
  hero: 80,      // 감정 선택 화면 메인
  medium: 48,    // 홈/일기 작성 감정 선택
  small: 32,     // 일기 상세 헤더, 배너
  mini: 24,      // 캘린더 셀, 주간 스트립
  tiny: 20,      // 리포트 감정 비율 바
} as const;
```

### 6.3 스티커 선택 애니메이션
```typescript
// bounce 피드백 (useNativeDriver: true 필수)
const bounceAnim = useRef(new Animated.Value(1)).current;

const onStickerSelect = () => {
  Animated.sequence([
    Animated.timing(bounceAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
    Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
  ]).start();
};
```

---

## 7. Section A — Figma/Gemini 스티커 시스템 통합 프롬프트

```
FEATURE: Mamuri 감정 일기 앱 — 스티커 에셋 시스템 설계
GOAL: 5개 기본 감정을 대표하는 일관된 캐릭터 스티커 세트 +
      일기 꾸미기용 데코 스티커 팩 (56개).

STYLE DIRECTION:
  - "따뜻한 미니멀리즘" (Warm Minimal)
  - 한국 감성 앱 사용자 타겟 (25~35세 여성 중심)
  - 귀엽지만 유치하지 않음 (Not childish, just warm)
  - 플랫 2D, 라운드 형태, 그림자 없음
  - 감정 감도 높은 표현 (과장 없이 공감을 얻는)

EMOTION STICKER SET (5개):
  각 스티커: 128×128px, 투명 PNG, flat 2D

  1. JOY (#FFD166): 작고 둥근 해/별 캐릭터. 밝은 미소. 광선 6개.
  2. CALM (#83C9A8): 초승달 + 잎 캐릭터. 눈 감은 평온한 표정.
  3. SAD (#7BA7D9): 작은 물방울 캐릭터. 조용히 슬픈 눈 (눈물 없음).
  4. ANXIOUS (#E8A87C): 흔들리는 불꽃 캐릭터. 살짝 찌푸린 눈.
  5. COMPLEX (#B8B0C8): 소용돌이 별 캐릭터. 어리둥절한 눈. 머리 위 물음표.

DECO STICKER PACK (예시 — 기본 무드 12개):
  날씨 테마: 맑음, 구름, 비, 눈, 무지개, 밤하늘
  자연 테마: 꽃, 잎, 나무, 달, 별, 바람

NAMING:
  emotion_joy.png / emotion_calm.png / ...
  deco_mood_sunny.png / deco_mood_rain.png / ...

OUTPUT FRAMES:
  - Sticker/Emotion-Set (5개 나란히)
  - Sticker/Deco-MoodPack (12개 그리드)
  - Sticker/Size-Variants (80/48/32/24px 각각 예시)
  - Sticker/Usage-Context (실제 앱 화면에 배치된 예시)
```

## Section B — 스티커 시스템 Frontend Handoff

### 파일 구조
```
mobile/assets/stickers/
├── emotion/
│   ├── joy.png + @2x.png + @3x.png
│   ├── calm.png + @2x.png + @3x.png
│   ├── sad.png + @2x.png + @3x.png
│   ├── anxious.png + @2x.png + @3x.png
│   └── complex.png + @2x.png + @3x.png
└── deco/
    ├── mood/ (12개)
    ├── daily/ (16개)
    ├── season/ (16개)
    ├── cheer/ (12개)
    └── text/ (8개)
```

### 스티커 메타데이터 타입
```typescript
export interface StickerMeta {
  id: string;           // 'emotion_joy', 'deco_mood_sunny'
  category: 'emotion' | 'deco_mood' | 'deco_daily' | 'deco_season' | 'deco_cheer' | 'deco_text';
  source: ImageSourcePropType;
  label: string;        // 한국어 이름
  isPremium: boolean;   // 프리미엄 잠금 여부
}
```

### 우선순위 구현 순서
1. 감정 스티커 5개 (MVP 필수)
2. 데코 스티커 기본 무드 팩 12개 (MVP 필수)
3. 나머지 데코 팩 (Post-MVP, 또는 프리미엄)
