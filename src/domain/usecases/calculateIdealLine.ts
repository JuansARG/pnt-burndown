import type { Sprint } from '../entities/Sprint';
import { getWorkingDays } from './workingDays';

export interface IdealPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

/** Parse YYYY-MM-DD → UTC midnight ms (avoids timezone traps) */
function dateToMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** UTC ms → YYYY-MM-DD */
function msToDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns a single straight ideal line from the effective total on startDate to 0 on endDate.
 * Scope changes affect the initial height of the line (total + all scope changes),
 * but the line is always a single continuous slope from start to end.
 * Guard: if startDate === endDate (totalDays === 0) returns a single point.
 * When sprint.useWorkingDays is true, distributes points evenly across working days
 * and carries the last working-day value forward on non-working days.
 * Pure function — no Date objects stored, only used for computation.
 */
export function calculateIdealLine(sprint: Sprint): IdealPoint[] {
  const startMs = dateToMs(sprint.startDate);
  const endMs = dateToMs(sprint.endDate);
  const totalDays = Math.round((endMs - startMs) / 86400000);

  // Total effective points = totalPoints + sum of all scope changes within sprint range
  const totalEffective = sprint.totalPoints +
    (sprint.scopeChanges ?? [])
      .filter(sc => sc.date >= sprint.startDate && sc.date <= sprint.endDate)
      .reduce((sum, sc) => sum + sc.delta, 0);

  // Guard: single-day sprint
  if (totalDays === 0) {
    return [{ date: sprint.startDate, value: totalEffective }];
  }

  // Working-days mode — emit only working day points (chart draws straight lines between them)
  if (sprint.useWorkingDays) {
    const workingDays = getWorkingDays(sprint.startDate, sprint.endDate, sprint.holidays ?? []);

    if (workingDays.length > 0) {
      const step = totalEffective / (workingDays.length - 1 || 1);
      return workingDays.map((date, index) => ({
        date,
        value: Math.max(0, Math.round((totalEffective - step * index) * 10) / 10),
      }));
    }
  }

  // Calendar mode (default / fallback) — single straight line
  const step = totalEffective / totalDays;
  const points: IdealPoint[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const ms = startMs + i * 86400000;
    const date = msToDate(ms);
    points.push({
      date,
      value: Math.max(0, Math.round((totalEffective - step * i) * 10) / 10),
    });
  }

  return points;
}
