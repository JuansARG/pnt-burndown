import type { Sprint } from '../entities/Sprint';
import { getWorkingDays } from './workingDays';
import { effectiveTotalPoints } from './effectiveTotalPoints';

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

/** Find the latest scope-change date ≤ the given date (or startDate if none). */
function getSegmentStart(date: string, sortedChangeDates: string[], startDate: string): string {
  let start = startDate;
  for (const scDate of sortedChangeDates) {
    if (scDate <= date) start = scDate;
    else break;
  }
  return start;
}

/**
 * Returns a segmented burndown line from totalPoints on startDate to 0 on endDate.
 * Each scope change starts a new linear segment from the effective total at that date.
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
    return [{ date: sprint.startDate, value: effectiveTotalPoints(sprint, sprint.startDate) }];
  }

  const sortedChangeDates = (sprint.scopeChanges ?? [])
    .map(sc => sc.date)
    .filter(d => d >= sprint.startDate && d <= sprint.endDate)
    .sort();

  // Working-days mode — emit only working day points (chart draws straight lines between them)
  if (sprint.useWorkingDays) {
    const workingDays = getWorkingDays(sprint.startDate, sprint.endDate, sprint.holidays ?? []);

    if (workingDays.length > 0) {
      return workingDays.map(date => {
        const segmentStart = getSegmentStart(date, sortedChangeDates, sprint.startDate);
        const effectiveAtStart = effectiveTotalPoints(sprint, segmentStart);
        const segmentWorkingDays = workingDays.filter(w => w >= segmentStart);
        const wdCount = segmentWorkingDays.length;
        const indexInSegment = segmentWorkingDays.indexOf(date);
        const step = effectiveAtStart / (wdCount - 1 || 1);
        return {
          date,
          value: Math.max(0, Math.round((effectiveAtStart - step * indexInSegment) * 10) / 10),
        };
      });
    }
  }

  // Calendar mode (default / fallback)
  const points: IdealPoint[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const ms = startMs + i * 86400000;
    const date = msToDate(ms);
    const segmentStart = getSegmentStart(date, sortedChangeDates, sprint.startDate);
    const effectiveAtStart = effectiveTotalPoints(sprint, segmentStart);
    const segmentStartMs = dateToMs(segmentStart);
    const segmentDays = Math.round((endMs - segmentStartMs) / 86400000);
    const indexInSegment = Math.round((ms - segmentStartMs) / 86400000);
    const value = segmentDays <= 0
      ? effectiveAtStart
      : effectiveAtStart * (1 - indexInSegment / segmentDays);

    points.push({
      date,
      value: Math.max(0, Math.round(value * 10) / 10),
    });
  }

  return points;
}
