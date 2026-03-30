-- V26: 데코 에셋 시드 데이터 (감정 + 무드 스티커)
INSERT INTO decoration_assets (category, code, name_ko, image_url, is_premium, is_active, display_order) VALUES
('emotion', 'e_joy', '좋아요', 'bundle://stickers/emotion/joy.png', false, true, 1),
('emotion', 'e_calm', '괜찮아요', 'bundle://stickers/emotion/calm.png', false, true, 2),
('emotion', 'e_sad', '별로예요', 'bundle://stickers/emotion/sad.png', false, true, 3),
('emotion', 'e_anxious', '힘들어요', 'bundle://stickers/emotion/anxious.png', false, true, 4),
('emotion', 'e_complex', '복잡해요', 'bundle://stickers/emotion/complex.png', false, true, 5),
('mood', 'm_sunny', '맑음', 'bundle://stickers/deco/mood/sunny.png', false, true, 1),
('mood', 'm_cloudy', '흐림', 'bundle://stickers/deco/mood/cloudy.png', false, true, 2),
('mood', 'm_rainy', '비', 'bundle://stickers/deco/mood/rainy.png', false, true, 3),
('mood', 'm_snowy', '눈', 'bundle://stickers/deco/mood/snowy.png', false, true, 4),
('mood', 'm_rainbow', '무지개', 'bundle://stickers/deco/mood/rainbow.png', false, true, 5),
('mood', 'm_night_sky', '밤하늘', 'bundle://stickers/deco/mood/night_sky.png', false, true, 6),
('mood', 'm_flower', '꽃', 'bundle://stickers/deco/mood/flower.png', false, true, 7),
('mood', 'm_leaf', '잎사귀', 'bundle://stickers/deco/mood/leaf.png', false, true, 8),
('mood', 'm_tree', '나무', 'bundle://stickers/deco/mood/tree.png', false, true, 9),
('mood', 'm_star', '별', 'bundle://stickers/deco/mood/star.png', false, true, 10),
('mood', 'm_sparkle', '반짝', 'bundle://stickers/deco/mood/sparkle.png', false, true, 11),
('mood', 'm_wind', '바람', 'bundle://stickers/deco/mood/wind.png', false, true, 12)
ON CONFLICT (code) DO NOTHING;
