-- 감정 카테고리
CREATE TABLE emotion_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name_ko VARCHAR(20) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    color_hex VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 감정 스티커
CREATE TABLE emotion_stickers (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES emotion_categories(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ko VARCHAR(30) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotion_stickers_category ON emotion_stickers(category_id, display_order);

-- diary_emotions 확장 (Additive - 기존 primary_emotion 유지)
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
    ADD COLUMN theme VARCHAR(20) DEFAULT 'default';

-- 시드 데이터
INSERT INTO emotion_categories (code, name_ko, display_order, color_hex) VALUES
('JOY', '좋아요', 1, '#FFD166'),
('CALM', '괜찮아요', 2, '#83C9A8'),
('SAD', '별로예요', 3, '#7BA7D9'),
('ANXIOUS', '힘들어요', 4, '#E8A87C'),
('COMPLEX', '복잡해요', 5, '#B8B0C8');

INSERT INTO emotion_stickers (category_id, code, name_ko, image_url, is_default, display_order)
SELECT id, 'joy_default', '좋아요', 'bundle://stickers/emotion/joy.png', true, 1 FROM emotion_categories WHERE code = 'JOY'
UNION ALL SELECT id, 'calm_default', '괜찮아요', 'bundle://stickers/emotion/calm.png', true, 1 FROM emotion_categories WHERE code = 'CALM'
UNION ALL SELECT id, 'sad_default', '별로예요', 'bundle://stickers/emotion/sad.png', true, 1 FROM emotion_categories WHERE code = 'SAD'
UNION ALL SELECT id, 'anxious_default', '힘들어요', 'bundle://stickers/emotion/anxious.png', true, 1 FROM emotion_categories WHERE code = 'ANXIOUS'
UNION ALL SELECT id, 'complex_default', '복잡해요', 'bundle://stickers/emotion/complex.png', true, 1 FROM emotion_categories WHERE code = 'COMPLEX';
