# 커스텀 스티커 MVP 설계 문서

## 날짜: 2026-03-30

---

## 기능 개요

프리미엄 구독자가 갤러리 사진을 선택하여 나만의 스티커를 만들고,
일기 작성 시 스티커 서랍에서 바로 사용할 수 있는 기능.

---

## UX 흐름

### 비구독자
1. Settings → "커스텀 스티커" 또는 스티커 서랍 → "스티커 만들기"
2. PRO 잠금 화면 표시
3. "구독 살펴보기" → Paywall 이동

### 구독자
1. Settings → "커스텀 스티커" 또는 스티커 서랍 → "스티커 만들기"
2. 갤러리에서 사진 선택 (1:1 크롭)
3. 미리보기 표시
4. 테두리 스타일 선택 (없음 / 흰색 / 검은색 / 그림자)
5. "스티커로 저장"
6. 내 스티커 목록에 추가
7. 일기 에디터 스티커 서랍 "내 스티커" 탭에 즉시 반영
8. 탭하면 에디터 캔버스에 배치

---

## 데이터 구조

```typescript
interface CustomSticker {
  id: string;              // cs_timestamp_random
  originalUri: string;     // 원본 이미지 URI
  stickerUri: string;      // 앱 전용 디렉토리 복사본
  thumbnailUri: string;    // 썸네일 URI
  createdAt: string;       // ISO timestamp
  width: number;           // 스티커 크기
  height: number;
  borderStyle?: 'none' | 'white' | 'black' | 'shadow';
}
```

---

## 저장소

- **메타데이터**: AsyncStorage (`@mamuri_custom_stickers`)
- **파일**: `FileSystem.documentDirectory/custom_stickers/`
- 앱 시작 시 파일 존재 여부 검증, 깨진 항목 자동 제거

---

## 스티커 서랍 구조

| 탭 | 내용 |
|----|------|
| 감정 | JOY, CALM, SAD, ANXIOUS, COMPLEX 스티커 |
| 분위기 | 날씨, 자연, 별, 꽃 등 데코 스티커 |
| **내 스티커** | 사용자 커스텀 스티커 목록 |

"내 스티커" 탭:
- 최신순 정렬
- 빈 상태: "아직 만든 스티커가 없어요" + "스티커 만들기" CTA
- 선택 시 에디터 캔버스에 배치

---

## 에디터 연결

- `StickerPickerSheet.onSelect`가 `customUri` 포함 시 커스텀 스티커로 처리
- `DiaryCanvasEditorV3.handleStickerSelect`에서 `customUri` 분기:
  - 일반 스티커: `getStickerSource(code)` → 번들 에셋
  - 커스텀 스티커: `{ uri: customUri }` → 파일 시스템 URI
- `CanvasObject`는 `ImageSourcePropType`을 받으므로 두 형태 모두 지원

---

## 테두리 옵션

| 스타일 | 적용 |
|--------|------|
| 없음 | borderWidth: 0 |
| 흰색 | borderWidth: 4, borderColor: #FFFFFF |
| 검은색 | borderWidth: 4, borderColor: #000000 |
| 그림자 | elevation: 8, shadowRadius: 8 |

---

## 프리미엄 게이트

- `CustomStickerScreenV3`: `!isPremium` → PRO 잠금 화면
- `SubscriptionContext.entitlements.canCreateCustomSticker`
- `crisisFlag`는 스티커 권한 미개방 (AI 한도만 확장)

---

## 향후 개선

- [ ] 배경 제거 API 연동 (서버 사이드 ML)
- [ ] 스티커 개수 제한 (예: 최대 20개)
- [ ] 서버 동기화 + CDN 업로드
- [ ] 카메라 촬영 → 스티커 만들기
- [ ] 스티커 크기/회전 프리셋
- [ ] EXIF GPS 메타데이터 제거
