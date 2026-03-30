/**
 * Sticker code → ImageSource mapping
 *
 * Used by DraggableSticker and DiaryPageDetailV3 to resolve
 * sticker codes (e.g. 'e_joy', 'm_sunny') to require()'d images.
 */

import { ImageSourcePropType } from 'react-native';

const STICKER_SOURCE_MAP: Record<string, ImageSourcePropType> = {
  // Emotion stickers
  e_joy: require('../../assets/stickers/emotion/joy.png'),
  e_calm: require('../../assets/stickers/emotion/calm.png'),
  e_sad: require('../../assets/stickers/emotion/sad.png'),
  e_anxious: require('../../assets/stickers/emotion/anxious.png'),
  e_complex: require('../../assets/stickers/emotion/complex.png'),

  // Mood stickers
  m_sunny: require('../../assets/stickers/deco/mood/sunny.png'),
  m_cloudy: require('../../assets/stickers/deco/mood/cloudy.png'),
  m_rainy: require('../../assets/stickers/deco/mood/rainy.png'),
  m_snowy: require('../../assets/stickers/deco/mood/snowy.png'),
  m_rainbow: require('../../assets/stickers/deco/mood/rainbow.png'),
  m_night_sky: require('../../assets/stickers/deco/mood/night_sky.png'),
  m_flower: require('../../assets/stickers/deco/mood/flower.png'),
  m_leaf: require('../../assets/stickers/deco/mood/leaf.png'),
  m_tree: require('../../assets/stickers/deco/mood/tree.png'),
  m_star: require('../../assets/stickers/deco/mood/star.png'),
  m_sparkle: require('../../assets/stickers/deco/mood/sparkle.png'),
  m_wind: require('../../assets/stickers/deco/mood/wind.png'),
};

export function getStickerSource(code: string): ImageSourcePropType | null {
  return STICKER_SOURCE_MAP[code] ?? null;
}
