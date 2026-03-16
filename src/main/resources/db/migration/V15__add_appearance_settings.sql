ALTER TABLE user_settings ADD COLUMN background_theme VARCHAR(20) NOT NULL DEFAULT 'warm';
ALTER TABLE user_settings ADD COLUMN font_family VARCHAR(20) NOT NULL DEFAULT 'system';
ALTER TABLE user_settings ADD COLUMN font_size VARCHAR(20) NOT NULL DEFAULT 'medium';
