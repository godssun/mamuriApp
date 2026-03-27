-- 일기 사진
CREATE TABLE diary_photos (
    id BIGSERIAL PRIMARY KEY,
    diary_id BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    storage_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    content_type VARCHAR(50),
    file_size BIGINT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diary_photos_diary ON diary_photos(diary_id, display_order);

-- 꾸미기 에셋
CREATE TABLE decoration_assets (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(30) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ko VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decoration_assets_category ON decoration_assets(category, display_order);

-- 일기별 꾸미기 배치
CREATE TABLE diary_decorations (
    id BIGSERIAL PRIMARY KEY,
    diary_id BIGINT NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    asset_id BIGINT NOT NULL REFERENCES decoration_assets(id),
    position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    scale DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
    z_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diary_decorations_diary ON diary_decorations(diary_id);

-- diaries에 cover_photo_id FK 추가 (V23에서 컬럼만 추가했으므로)
ALTER TABLE diaries
    ADD CONSTRAINT fk_diary_cover_photo FOREIGN KEY (cover_photo_id) REFERENCES diary_photos(id) ON DELETE SET NULL;
