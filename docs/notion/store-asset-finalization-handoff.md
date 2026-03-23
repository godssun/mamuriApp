# 스토어 에셋 최종 핸드오프 문서

> 작성일: 2026-03-23
> 상태: 에셋 생성 완료 — 제출 준비 상태 확인 필요

---

## 1. 생성된 에셋 전체 목록

### 제출용 최종 에셋 (`assets/store-graphics/final/`)

| 파일명 | 크기 | 알파 | 용도 | 제출 준비 상태 |
|--------|------|------|------|---------------|
| `icon-ios-1024x1024.png` | 1024×1024 | 없음 (RGB) | iOS App Store 아이콘 | ✅ 즉시 제출 가능 |
| `icon-play-store-512x512.png` | 512×512 | 없음 (RGB) | Google Play Store 아이콘 | ✅ 즉시 제출 가능 |
| `feature-graphic-1024x500.png` | 1024×500 | 없음 (RGB) | Google Play Feature Graphic (한글 텍스트 포함) | ✅ 즉시 제출 가능 |
| `feature-graphic-1024x500-textfree.png` | 1024×500 | 없음 (RGB) | Feature Graphic 텍스트 없는 배경 (백업용) | 📦 백업 — 텍스트 직접 교체 시 사용 |
| `splash-icon-1024x1024.png` | 1024×1024 | 없음 (RGB) | Expo 스플래시 화면 | ✅ 즉시 사용 가능 |

### Android Adaptive Icon (`assets/store-graphics/adaptive-icon/`)

| 파일명 | 크기 | 알파 | 용도 | 제출 준비 상태 |
|--------|------|------|------|---------------|
| `adaptive-icon-foreground.png` | 1024×1024 | 있음 (RGBA) | Android Adaptive Icon 전경 레이어 | ✅ 즉시 사용 가능 |
| `adaptive-icon-background.png` | 1024×1024 | 없음 (RGB) | Android Adaptive Icon 배경 레이어 (참고용) | 📦 참고용 — Expo는 `backgroundColor`로 단색 지정 |

### Favicon (`assets/store-graphics/favicon/`)

| 파일명 | 크기 | 알파 | 용도 | 제출 준비 상태 |
|--------|------|------|------|---------------|
| `favicon.png` | 48×48 | 없음 (RGB) | 웹 파비콘 | ✅ 즉시 사용 가능 |
| `favicon-192x192.png` | 192×192 | 없음 (RGB) | 웹 매니페스트 아이콘 | ✅ 즉시 사용 가능 |

### 컨셉 초안 (참고/아카이브)

| 디렉토리 | 내용 |
|----------|------|
| `app-icon-concepts/` | 앱 아이콘 3가지 컨셉 (A1 빛점, A2 별, A3 빛 구체) |
| `feature-graphic-concepts/` | Feature Graphic 3가지 컨셉 (중앙 미니멀, 분할+목업, 달 중심) |

---

## 2. Expo 프로젝트 적용 상태

다음 파일들이 `mobile/assets/`에 직접 복사되어 Expo가 즉시 참조합니다:

| Expo 경로 | 원본 | 상태 |
|-----------|------|------|
| `mobile/assets/icon.png` | `icon-ios-1024x1024.png` | ✅ 교체 완료 |
| `mobile/assets/adaptive-icon.png` | `adaptive-icon-foreground.png` | ✅ 교체 완료 |
| `mobile/assets/splash-icon.png` | `splash-icon-1024x1024.png` | ✅ 교체 완료 |
| `mobile/assets/favicon.png` | `favicon.png` | ✅ 교체 완료 |

### app.config.ts 변경사항

| 설정 | 변경 전 | 변경 후 | 이유 |
|------|---------|---------|------|
| `splash.backgroundColor` | `#ffffff` | `#6356D9` | 스플래시 배경을 브랜드 인디고 컬러로 통일 |
| `android.adaptiveIcon.backgroundColor` | `#ffffff` | `#3B2D8B` | Adaptive Icon 배경을 딥 인디고로 설정 (앱 아이콘과 일관) |

---

## 3. 디자인 의사결정 요약

### 앱 아이콘: "마무리 달 + 빛 구체" (A3)

- **선택 이유**: 초승달이 빛 구체를 감싸는 형태가 "마무리"의 핵심 가치(따뜻한 공감, 보호, 안전감)를 가장 잘 표현
- **컬러**: 딥 인디고(#2E1F6B → #6B5ED0) radial gradient + 앰버 골드(#FFD876) 달
- **경쟁 차별화**: Calm/Headspace/Day One과 확실히 다른 시각 언어

### Feature Graphic: "달 중심 + 중앙 텍스트" (FG3 기반)

- **선택 이유**: 앱 아이콘과 시각 모티프 통일 → 스토어에서 브랜드 인지도 극대화
- **텍스트**: "마무리" (Apple SD Gothic Neo Bold 72px) + "하루의 끝, 따뜻한 AI 친구" (Regular 30px)
- **한글 처리**: Pillow + AppleSDGothicNeo 시스템 폰트로 정확하게 렌더링 완료

---

## 4. 제출 전 최종 확인 체크리스트

### 즉시 제출 가능 (수동 작업 불필요)

- [x] iOS 앱 아이콘 1024×1024, RGB, 알파 없음
- [x] Google Play 아이콘 512×512, RGB
- [x] Feature Graphic 1024×500, RGB, 알파 없음, 한글 텍스트 정확
- [x] Android Adaptive Icon 전경 (RGBA, 투명 배경)
- [x] Favicon 48×48
- [x] Expo `app.config.ts` 배경색 업데이트
- [x] `mobile/assets/` 파일 교체 완료

### 실기기 확인 필요 (EAS Build 후)

- [ ] iOS 시뮬레이터/실기기에서 아이콘 표시 확인
- [ ] Android 시뮬레이터/실기기에서 Adaptive Icon 표시 확인 (원형/사각형/둥근사각형 마스크)
- [ ] 스플래시 화면 표시 확인 (인디고 배경 + 달 아이콘)
- [ ] 작은 크기(29×29, 40×40, 60×60)에서 식별성 확인

### 선택사항 (품질 개선을 원할 경우)

- [ ] Feature Graphic 폰트를 Pretendard Bold로 교체 (현재 AppleSDGothicNeo — 충분히 양호)
- [ ] Adaptive Icon 전경의 달 요소를 안전 영역(66%) 내로 약간 축소 (현재 거의 맞음)
- [ ] Feature Graphic 텍스트 그림자 강도 미세 조정

---

## 5. 수동 작업이 필요한 항목

### 수동 작업 없음 — 모든 에셋 자동 생성 완료

유일하게 남은 작업은 **EAS Build 후 실기기 검증**뿐입니다.

만약 이후에 텍스트나 레이아웃을 수정하고 싶다면:
1. `feature-graphic-1024x500-textfree.png`를 Figma/Canva에 불러오기
2. 텍스트만 오버레이
3. 1024×500 PNG로 내보내기

---

## 6. 파일 구조 최종

```
assets/store-graphics/
├── final/                              ← 제출용 최종 에셋
│   ├── icon-ios-1024x1024.png          ← iOS App Store
│   ├── icon-play-store-512x512.png     ← Google Play Store
│   ├── feature-graphic-1024x500.png    ← Google Play Feature Graphic
│   ├── feature-graphic-1024x500-textfree.png  ← 텍스트 없는 백업
│   └── splash-icon-1024x1024.png       ← Expo 스플래시
├── adaptive-icon/                      ← Android Adaptive Icon
│   ├── adaptive-icon-foreground.png    ← 전경 (RGBA)
│   └── adaptive-icon-background.png    ← 배경 그라데이션 (참고용)
├── favicon/                            ← 웹 파비콘
│   ├── favicon.png                     ← 48×48
│   └── favicon-192x192.png            ← 192×192
├── app-icon-concepts/                  ← 아이콘 컨셉 초안 (아카이브)
│   ├── icon-concept-A1-moon-glow.png
│   ├── icon-concept-A2-moon-star.png
│   └── icon-concept-A3-moon-orb.png
└── feature-graphic-concepts/           ← FG 컨셉 초안 (아카이브)
    ├── fg-concept-1-center-minimal.png
    ├── fg-concept-2-split-mockup.png
    └── fg-concept-3-moon-centered.png

mobile/assets/                          ← Expo 직접 참조 (교체 완료)
├── icon.png                            ← = icon-ios-1024x1024.png
├── adaptive-icon.png                   ← = adaptive-icon-foreground.png
├── splash-icon.png                     ← = splash-icon-1024x1024.png
└── favicon.png                         ← = favicon.png (48×48)
```
