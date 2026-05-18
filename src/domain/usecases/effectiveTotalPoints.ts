import type { Sprint } from '../entities/Sprint';

/**
 * Returns the effective total story points at a given date,
 * accounting for all scope changes logged on or before that date.
 * Backward compatible: undefined or empty scopeChanges returns totalPoints.
 * Pure function — no side effects, no Date objects stored.
 */
export function effectiveTotalPoints(sprint: Sprint, date: string): number {
  const deltas = (sprint.scopeChanges ?? [])
    .filter(sc => sc.date <= date)
    .reduce((sum, sc) => sum + sc.delta, 0);
  return sprint.totalPoints + deltas;
}
