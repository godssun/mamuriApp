-- ai_avatar 컬럼을 이미지 파일 경로 저장용으로 확장
ALTER TABLE user_settings ALTER COLUMN ai_avatar TYPE VARCHAR(500);
