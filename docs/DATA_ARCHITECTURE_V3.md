# Mamuri 3.0 — 데이터/API 아키텍처 재설계

> 작성일: 2026-03-27
> 담당: 백엔드/데이터 아키텍트

---

## 1. 마이그레이션 계획

### V23: 감정 스티커 카탈로그 + Diary 확장

```sql
-- 감정 카테고리
CREATE TABLE emotion_categories (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30) NOT NULL UNIQUE,
    name_ko     VARCHAR(20) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    color_hex   VARCHAR(7),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- 감정 스티커
CREATE TABLE emotion_stickers (
    id           BIGSERIAL PRIMARY KEY,
    category_id  BIGINT NOT NULL REFERENCES emotion_categories(id),
    code         VARCHAR(50) NOT NULL UNIQUE,
    name_ko      VARCHAR(30) NOT NULL,
    image_url    VARCHAR(500) NOT NULL,
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    is_premium   BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotion_stickers_category ON emotion_stickers(category_id, display_order);

-- diary_emotions 확장 (Additive)
ALTER TABLE diary_emotions
    ADD COLUMN primary_sticker_id BIGINT REFERENCES emotion_stickers(id),
    ADD COLUMN secondary_sticker_ids JSONB DEFAULT '[]',
    ALTER COLUMN primary_emotion DROP NOT NULL;

CREATE INDEX idx_diary_emotions_sticker ON diary_emotions(primary_sticker_id, created_at DESC);

-- diaries 확장
ALTER TABLE diaries
    ALTER COLUMN content DROP NOT NULL,
    ADD COLUMN diary_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    ADD COLUMN cover_photo_id BIGINT,
    ADD COLUMN background_asset_id BIGINT;

-- 시드 데이터: 5개 기본 감정 카테고리
INSERT INTO emotion_categories (code, name_ko, display_order, color_hex) VALUES
('JOY', '좋아요', 1, '#FFD166'),
('CALM', '괜찮아요', 2, '#83C9A8'),
('SAD', '별로예요', 3, '#7BA7D9'),
('ANXIOUS', '힘들어요', 4, '#E8A87C'),
('COMPLEX', '복잡해요', 5, '#B8B0C8');

-- 시드 데이터: 기본 스티커 (각 카테고리 1개)
INSERT INTO emotion_stickers (category_id, code, name_ko, image_url, is_default, display_order) VALUES
(1, 'joy_default', '좋아요', 'bundle://stickers/emotion/joy.png', true, 1),
(2, 'calm_default', '괜찮아요', 'bundle://stickers/emotion/calm.png', true, 1),
(3, 'sad_default', '별로예요', 'bundle://stickers/emotion/sad.png', true, 1),
(4, 'anxious_default', '힘들어요', 'bundle://stickers/emotion/anxious.png', true, 1),
(5, 'complex_default', '복잡해요', 'bundle://stickers/emotion/complex.png', true, 1);
```

### V24: 사진 + 꾸미기

```sql
-- 일기 사진
CREATE TABLE diary_photos (
    id           BIGSERIAL PRIMARY KEY,
    diary_id     BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key  VARCHAR(500) NOT NULL,
    cdn_url      VARCHAR(1000),
    display_order INT NOT NULL DEFAULT 0,
    width_px     INT,
    height_px    INT,
    file_size_bytes BIGINT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diary_photos_diary ON diary_photos(diary_id, display_order);

-- 꾸미기 에셋 카탈로그
CREATE TABLE decoration_assets (
    id           BIGSERIAL PRIMARY KEY,
    asset_type   VARCHAR(20) NOT NULL,
    code         VARCHAR(50) NOT NULL UNIQUE,
    name_ko      VARCHAR(30) NOT NULL,
    image_url    VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    is_premium   BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 일기 내 꾸미기 배치
CREATE TABLE diary_decorations (
    id           BIGSERIAL PRIMARY KEY,
    diary_id     BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    asset_id     BIGINT REFERENCES decoration_assets(id) ON DELETE SET NULL,
    asset_type   VARCHAR(20) NOT NULL,
    position_x   FLOAT NOT NULL DEFAULT 0.5,
    position_y   FLOAT NOT NULL DEFAULT 0.5,
    scale        FLOAT NOT NULL DEFAULT 1.0,
    rotation     FLOAT NOT NULL DEFAULT 0.0,
    z_index      INT NOT NULL DEFAULT 0,
    extra_data   JSONB DEFAULT '{}',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diary_decorations_diary ON diary_decorations(diary_id);
```

### V25: 감정 통계

```sql
CREATE TABLE emotion_statistics (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type     VARCHAR(10) NOT NULL,
    period_start    DATE NOT NULL,
    primary_sticker_id BIGINT REFERENCES emotion_stickers(id),
    emotion_code    VARCHAR(30),
    count           INT NOT NULL DEFAULT 1,
    avg_score       FLOAT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period_type, period_start, primary_sticker_id)
);

CREATE INDEX idx_emotion_stats_user ON emotion_statistics(user_id, period_type, period_start DESC);
```

---

## 2. API 재설계

### 일기 관련

```
# 기존 유지 (확장)
POST   /api/diaries                       일기 작성 (확장된 DTO)
GET    /api/diaries                       목록 조회
GET    /api/diaries/{id}                  상세 조회 (사진/스티커 포함)
PUT    /api/diaries/{id}                  수정
DELETE /api/diaries/{id}                  삭제

# 캘린더 확장
GET    /api/diaries/calendar?year=&month=&v=2   CalendarDayEntry 반환

# 신규
POST   /api/diaries/{id}/photos           사진 업로드 (multipart)
DELETE /api/diaries/{id}/photos/{photoId}  사진 삭제
PUT    /api/diaries/{id}/decorations      꾸미기 배치 저장
GET    /api/diaries/{id}/decorations      꾸미기 배치 조회
PUT    /api/diaries/{id}/emotions         감정 스티커 저장/수정
```

### 스티커/에셋

```
GET    /api/stickers                      감정 스티커 목록
GET    /api/stickers/categories           감정 카테고리 목록
GET    /api/decorations/assets            꾸미기 에셋 목록
GET    /api/decorations/assets?type=STICKER   타입별 필터
```

### 리포트

```
GET    /api/reports/emotion-stats?period=MONTHLY&date=   감정 통계
```

---

## 3. 핵심 DTO

### DiaryCreateRequest (확장)

```json
{
  "diaryType": "MIXED",
  "title": "오늘 일기",
  "content": "오늘은...",
  "diaryDate": "2026-03-27",
  "primaryStickerId": 3,
  "secondaryStickerIds": [5, 7],
  "emotionScore": 4
}
```

### DiaryResponse (확장)

```json
{
  "id": 123,
  "diaryType": "MIXED",
  "title": "오늘 일기",
  "content": "오늘은...",
  "diaryDate": "2026-03-27",
  "photos": [
    { "id": 1, "cdnUrl": "https://...", "displayOrder": 0 }
  ],
  "emotion": {
    "primarySticker": { "id": 3, "code": "joy_default", "imageUrl": "...", "nameKo": "좋아요" },
    "emotionScore": 4,
    "secondaryTags": ["설렘", "감사"]
  },
  "decorations": [
    { "id": 1, "assetType": "STICKER", "positionX": 0.1, "positionY": 0.1, "scale": 1.0 }
  ],
  "aiComment": { ... },
  "createdAt": "..."
}
```

### CalendarDayEntry

```json
{
  "date": "2026-03-27",
  "diaryCount": 1,
  "primaryStickerUrl": "bundle://stickers/emotion/joy.png",
  "primaryEmotionCode": "JOY",
  "emotionScore": 4
}
```

---

## 4. 저장 전략

### StorageService 인터페이스

```java
public interface StorageService {
    StorageResult store(MultipartFile file, String keyPrefix);
    void delete(String storageKey);
    String getPublicUrl(String storageKey);
}

// LocalStorageService (dev) — @ConditionalOnProperty("storage.provider", "local")
// S3StorageService (prod) — @ConditionalOnProperty("storage.provider", "s3")
```

### 사진 제한

| 플랜 | 일기당 최대 | 장당 최대 |
|------|-----------|----------|
| FREE | 3장 | 5MB |
| PREMIUM | 10장 | 15MB |

### 캐시 전략

| 대상 | 전략 |
|------|------|
| 스티커 카탈로그 | HTTP Cache-Control: max-age=86400 |
| 캘린더 API | Cache-Control: max-age=60 + ETag |
| AI 코멘트 | 캐시 없음 |

---

## 5. 성능 고려

### 캘린더 최적화 인덱스

```sql
CREATE INDEX idx_diary_calendar ON diaries(user_id, diary_date) INCLUDE (id);
CREATE INDEX idx_diary_emotions_calendar ON diary_emotions(diary_id) INCLUDE (primary_sticker_id, emotion_score);
```

### N+1 방지

- 캘린더: 단일 JOIN 쿼리 (날짜별 GROUP BY)
- 일기 상세: fetch join (photos + decorations + emotion)
