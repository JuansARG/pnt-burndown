import type { Sprint } from '../entities/Sprint';
import { getWorkingDays } from './workingDays';

export interface IdealPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

/**
 * Returns a linear burndown from totalPoints on startDate to 0 on endDate.
 * Guard: if startDate === endDate (totalDays === 0) returns a single point.
 * When sprint.useWorkingDays is true, distributes points evenly across working days
 * and carries the last working-day value forward on non-working days.
 * Pure function — no Date objects stored, only used for computation.
 */
export function calculateIdealLine(sprint: Sprint): IdealPoint[] {
  const startMs = dateToMs(sprint.startDate);
  const endMs = dateToMs(sprint.endDate);
  const totalDays = Math.round((endMs - startMs) / 86400000);

  // Guard: single-day sprint
  if (totalDays === 0) {
    return [{ date: sprint.startDate, value: sprint.totalPoints }];
  }

  // Working-days mode — emit only working day points (chart draws straight lines between them)
  if (sprint.useWorkingDays) {
    const workingDays = getWorkingDays(sprint.startDate, sprint.endDate, sprint.holidays ?? []);

    // Fall back to calendar behavior if no working days found
    if (workingDays.length > 0) {
      const wdCount = workingDays.length;
      const step = sprint.totalPoints / (wdCount - 1 || 1);

      return workingDays.map((date, i) => ({
        date,
        value: Math.max(0, Math.round((sprint.totalPoints - step * i) * 10) / 10),
      }));
    }
  }

  // Calendar mode (default / fallback)
  const step = sprint.totalPoints / totalDays;
  const points: IdealPoint[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const ms = startMs + i * 86400000;
    points.push({
      date: msToDate(ms),
      value: Math.max(0, Math.round((sprint.totalPoints - step * i) * 10) / 10),
    });
  }

  return points;
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
