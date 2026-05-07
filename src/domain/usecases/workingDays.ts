/**
 * Working days utilities — pure functions, no external deps.
 * Dates are always YYYY-MM-DD strings. Parse as UTC to avoid timezone traps.
 */

function toUTCDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

function toISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns true if date is Mon-Fri and NOT in holidays array */
export function isWorkingDay(date: string, holidays: string[]): boolean {
  const d = toUTCDate(date);
  const dow = d.getUTCDay(); // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return false;
  return !holidays.includes(date);
}

/** Returns sorted array of working day ISO strings from start to end (inclusive) */
export function getWorkingDays(start: string, end: string, holidays: string[]): string[] {
  const result: string[] = [];
  const startMs = toUTCDate(start).getTime();
  const endMs = toUTCDate(end).getTime();

  for (let ms = startMs; ms <= endMs; ms += 86400000) {
    const dateStr = toISODate(new Date(ms));
    if (isWorkingDay(dateStr, holidays)) {
      result.push(dateStr);
    }
  }

  return result;
}

/**
 * Starting from startDate, count N working days forward, return the ISO date of the Nth working day.
 * startDate itself counts as day 1 if it's a working day.
 * Example: getWorkingDayEndDate("2026-05-22", 3, []) → "2026-05-26"
 */
export function getWorkingDayEndDate(start: string, count: number, holidays: string[]): string {
  if (count <= 0) return start;

  let found = 0;
  let ms = toUTCDate(start).getTime();

  // Safety ceiling: at most count * 14 days (handles dense holiday blocks)
  const maxIterations = count * 14;
  for (let i = 0; i < maxIterations; i++) {
    const dateStr = toISODate(new Date(ms));
    if (isWorkingDay(dateStr, holidays)) {
      found++;
      if (found >= count) return dateStr;
    }
    ms += 86400000;
  }

  // Fallback: return last iterated date if ceiling hit
  return toISODate(new Date(ms));
}
