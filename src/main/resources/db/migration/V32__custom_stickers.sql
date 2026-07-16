-- V32: custom_stickers — 사용자가 사진으로 직접 만든 커스텀 스티커
-- 배경 제거(온디바이스)된 투명 PNG를 서버에 영속화하여 기기 변경/재설치에도 유지된다.
-- 유저당 최대 개수 제한은 서비스 레이어(CustomStickerService)에서 강제한다.

CREATE TABLE custom_stickers (
    id                BIGSERIAL    PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key       VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    content_type      VARCHAR(50),
    file_size         BIGINT       NOT NULL DEFAULT 0,
    width             INT,
    height            INT,
    border_style      VARCHAR(20),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_stickers_user ON custom_stickers (user_id, created_at DESC);
