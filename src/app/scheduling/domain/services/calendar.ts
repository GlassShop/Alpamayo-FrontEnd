/**
 * Calendar arithmetic on local date keys ("YYYY-MM-DD"), weeks starting on
 * Monday. All maths go through UTC so results never depend on the machine's
 * time zone or daylight-saving changes.
 */

export type DateKey = string;

/** Hours shown in the week view (7:00 to 20:00). */
export const DAY_HOURS: readonly number[] = Array.from({length: 14}, (_, i) => i + 7);

export function toDateKey(year: number, month: number, day: number): DateKey {
  const d = new Date(Date.UTC(year, month - 1, day));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseDateKey(key: DateKey): {year: number; month: number; day: number} {
  const [year, month, day] = key.split('-').map(Number);
  return {year, month, day};
}

/** Today's local date. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(key: DateKey, days: number): DateKey {
  const {year, month, day} = parseDateKey(key);
  return toDateKey(year, month, day + days);
}

/** First day of the month `months` away (keeps navigation stable on the 31st). */
export function addMonths(key: DateKey, months: number): DateKey {
  const {year, month} = parseDateKey(key);
  return toDateKey(year, month + months, 1);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(key: DateKey): number {
  const {year, month, day} = parseDateKey(key);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -weekdayIndex(key));
}

/** The 7 days (Monday to Sunday) of the week containing `key`. */
export function weekDays(key: DateKey): DateKey[] {
  const monday = startOfWeek(key);
  return Array.from({length: 7}, (_, i) => addDays(monday, i));
}

/** Weeks (rows of 7 days) covering the whole month of `key`, including spill-over days. */
export function monthGrid(key: DateKey): DateKey[][] {
  const {year, month} = parseDateKey(key);
  const first = toDateKey(year, month, 1);
  const last = addDays(toDateKey(year, month + 1, 1), -1);
  const weeks: DateKey[][] = [];
  for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(Array.from({length: 7}, (_, i) => addDays(monday, i)));
  }
  return weeks;
}

export function sameMonth(a: DateKey, b: DateKey): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** "HH:mm" → minutes since midnight. */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Hour slot a time falls in (e.g. "10:45" → 10), clamped to the hours shown. */
export function hourSlot(time: string): number {
  const hour = Math.floor(minutesOf(time) / 60);
  return Math.min(Math.max(hour, DAY_HOURS[0]), DAY_HOURS[DAY_HOURS.length - 1]);
}

/** JS Date for formatting a key with Intl (midday avoids any date shift). */
export function keyToDate(key: DateKey): Date {
  const {year, month, day} = parseDateKey(key);
  return new Date(year, month - 1, day, 12);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
