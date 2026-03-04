import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

const LANGUAGE_KEY = '@mamuri_language';
const SUPPORTED_LANGS = ['ko', 'en', 'ja', 'zh'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGS)[number];

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved as SupportedLanguage)) {
        callback(saved);
        return;
      }
    } catch {}

    // Device language fallback
    const deviceLocales = getLocales();
    const deviceLang = deviceLocales[0]?.languageCode ?? 'en';
    const matched = SUPPORTED_LANGS.find((l) => deviceLang.startsWith(l));
    callback(matched ?? 'en');
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch {}
  },
};

// RTL preparation (none of the current 4 languages need it)
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

i18n.on('languageChanged', (lng) => {
  const isRTL = RTL_LANGUAGES.includes(lng);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGS],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
}

export default i18n;
