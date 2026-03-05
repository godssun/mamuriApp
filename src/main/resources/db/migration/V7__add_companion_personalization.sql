-- 컴패니언 개인화: 아바타 선택 + 말투 스타일
ALTER TABLE user_settings ADD COLUMN ai_avatar VARCHAR(10) DEFAULT NULL;
ALTER TABLE user_settings ADD COLUMN ai_speech_style VARCHAR(20) NOT NULL DEFAULT 'formal';
