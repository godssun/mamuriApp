import i18n from '../i18n/i18n';

const LOCALE_MAP: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

function getLocale(): string {
  return LOCALE_MAP[i18n.language] ?? 'en-US';
}

/**
 * '2024-03-03' → locale-aware full date
 * ko: '2024년 3월 3일 월요일'
 * en: 'Monday, March 3, 2024'
 * ja: '2024年3月3日月曜日'
 * zh: '2024年3月3日星期一'
 */
export function formatDiaryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(getLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * '2024-03-03T22:23:00' → locale-aware time
 * ko: '오후 10:23'
 * en: '10:23 PM'
 */
export function formatTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get short weekday label for a given day index (0=Sun)
 * Uses Intl.DateTimeFormat for locale-aware output.
 */
export function getShortWeekday(dayIndex: number): string {
  // Use a known Sunday (2024-01-07) as base
  const base = new Date(2024, 0, 7 + dayIndex);
  return base.toLocaleDateString(getLocale(), { weekday: 'short' });
}

/**
 * Format year/month header for DateStrip
 * ko: '2024년 3월'
 * en: 'March 2024'
 */
export function formatYearMonth(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString(getLocale(), { year: 'numeric', month: 'long' });
}
