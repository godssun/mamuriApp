-- V29: schedules — lightweight user calendar events
-- Part of the tab restructure: replaces the former "companion" tab with
-- a gentle schedule surface (monthly view + today list + diary linking).
-- Keep the schema minimal; repeat rules / colour categories / search are
-- reserved for Phase 2.

CREATE TABLE schedules (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(100) NOT NULL,
    start_at        TIMESTAMP    NOT NULL,
    end_at          TIMESTAMP    NULL,
    note            TEXT         NULL,
    is_all_day      BOOLEAN      NOT NULL DEFAULT FALSE,
    linked_diary_id BIGINT       NULL REFERENCES diaries(id) ON DELETE SET NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedule_user_start ON schedules (user_id, start_at DESC);
CREATE INDEX idx_schedule_linked_diary ON schedules (linked_diary_id);
