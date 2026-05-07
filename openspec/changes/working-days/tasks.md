# Tasks: working-days

## Phase 1: Foundation — Domain Types

- [ ] 1.1 Extend `src/domain/entities/Sprint.ts` — add optional `holidays?: string[]` and `useWorkingDays?: boolean` fields to the `Sprint` interface
- [ ] 1.2 Create `src/domain/usecases/workingDays.ts` — implement `isWorkingDay(date, holidays)`: returns false for weekends (Sat/Sun) or if date is in holidays array
- [ ] 1.3 Add `getWorkingDays(start, end, holidays)` to `workingDays.ts` — iterates from start to end inclusive, collects dates where `isWorkingDay` is true
- [ ] 1.4 Add `getWorkingDayEndDate(start, count, holidays)` to `workingDays.ts` — advances from start, counting only working days until count is reached, returns ISO date string of the Nth working day

## Phase 2: Core Logic — Ideal Line

- [ ] 2.1 In `src/domain/usecases/calculateIdealLine.ts` — when `sprint.useWorkingDays === true`, call `getWorkingDays(startDate, endDate, sprint.holidays ?? [])` to get working-day slots
- [ ] 2.2 Guard in working-days branch: if `workingDays.length === 0`, fall back to existing calendar-linear behavior (avoids division by zero)
- [ ] 2.3 Distribute points evenly across working-day slots; for each calendar day in the full range, carry forward the value from the last working day (flat on non-working days)
- [ ] 2.4 Ensure `sprint.useWorkingDays` falsy (undefined / false) leaves existing behavior 100% unchanged — no regressions

## Phase 3: UI — SprintSetupForm

- [ ] 3.1 In `src/ui/pages/BurndownPage.tsx` (`SprintSetupForm`): add `mode: 'dates' | 'duration'` local state, defaulting to `'dates'`
- [ ] 3.2 Add a two-button toggle (Dates / Duration) that switches `mode`
- [ ] 3.3 Duration mode: render `workingDays` number input and a holidays add/remove list (plain ISO text inputs, no new deps)
- [ ] 3.4 Duration mode: compute and show a read-only `endDate` preview by calling `getWorkingDayEndDate(startDate, workingDays, holidays)` whenever inputs change
- [ ] 3.5 On submit in duration mode: set `useWorkingDays: true`, pass `holidays`, derive final `endDate` via `getWorkingDayEndDate`
- [ ] 3.6 On submit in dates mode: set `useWorkingDays: false`, `holidays: []` — existing pickers unchanged
- [ ] 3.7 Edit sprint: pre-populate `mode` from `sprint.useWorkingDays` and repopulate `holidays` / `workingDays` fields from existing sprint data

## Phase 4: Testing

- [ ] 4.1 Unit test `isWorkingDay` — Saturday, Sunday, holiday, regular weekday (spec: working-days utility scenarios)
- [ ] 4.2 Unit test `getWorkingDays` — range with weekends and holidays excluded; start/end on non-working days excluded
- [ ] 4.3 Unit test `getWorkingDayEndDate` — advances correctly past weekends and holidays to land on the Nth working day
- [ ] 4.4 Unit test `calculateIdealLine` with `useWorkingDays: true` — flat carry-forward on weekends confirmed; 0-working-days fallback confirmed
- [ ] 4.5 Unit test `calculateIdealLine` with `useWorkingDays: false/undefined` — output identical to pre-change behavior (regression)
- [ ] 4.6 Verify `Sprint` serialization round-trip — `holidays` and `useWorkingDays` persist and rehydrate correctly via existing `serializeState`
