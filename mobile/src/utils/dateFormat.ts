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

/**
 * 일정 화면에서 사용할 datetime 라벨 포맷.
 * Hermes Android 일부 단말은 ICU 데이터가 부족해 인자 없는 toLocaleString이
 * RangeError를 던지므로, 항상 인자를 명시하고 catch에서 직접 조립한다.
 *
 * allDay=false → 'YYYY. M. D. (요일) HH:mm'
 * allDay=true  → 'YYYY. M. D. (요일)'
 */
export function formatScheduleDateTime(date: Date, allDay: boolean): string {
  const opts: Intl.DateTimeFormatOptions = allDay
    ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
    : {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
        hour: '2-digit', minute: '2-digit',
      };
  try {
    return date.toLocaleString(getLocale(), opts);
  } catch {
    return formatScheduleDateTimeFallback(date, allDay);
  }
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function formatScheduleDateTimeFallback(date: Date, allDay: boolean): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = i18n.t(`schedule.weekday.${WEEKDAY_KEYS[date.getDay()]}`);
  const datePart = `${y}. ${m}. ${d}. (${dow})`;
  if (allDay) return datePart;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${mm}`;
}
