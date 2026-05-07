# Proposal: Working Days Sprint Duration

## Intent

Users running sprints with weekends or public holidays need the ideal burndown line to
reflect **actual working days** — not calendar days. Currently, `calculateIdealLine`
distributes points evenly across every calendar day, making the ideal line
unrealistically optimistic on weekends.

This change lets users define sprint duration by working days count + a holiday list,
so the ideal line drops only on days where work happens.

## Scope

### In Scope
- `Sprint` entity: add optional `holidays?: string[]` and `useWorkingDays?: boolean`
- Domain utility `workingDays.ts`: `getWorkingDays(start, end, holidays)` + `isWorkingDay(date, holidays)`
- `calculateIdealLine`: branch when `useWorkingDays=true` — emit points only on working days
- `SprintSetupForm`: toggle "Fechas / Duración" — duration mode accepts startDate + workingDays count + holidays list
- Serialization: additive fields survive URL round-trip with no schema change

### Out of Scope
- Country-specific holiday presets / calendar APIs
- Recurring holiday calendars
- Backend or server-side validation
- Holiday import/export
- Weekend configuration (Mon–Fri assumed fixed)

## Capabilities

> Contract for sdd-spec phase.

### New Capabilities
- `working-days`: domain utility and ideal-line logic for working-day-aware burndown

### Modified Capabilities
- `sprint-setup`: new optional fields (`holidays`, `useWorkingDays`) + duration-mode UI in setup form
- `burndown-chart`: ideal line conditionally skips non-working days when `useWorkingDays=true`

## Approach

**Approach A — Additive / Non-breaking** (chosen):

- All new fields on `Sprint` are **optional** — existing sprints deserialize without change.
- `calculateIdealLine` keeps existing behavior as default; the working-days branch only
  activates when `useWorkingDays === true`.
- No existing tests break; new unit tests cover `workingDays.ts` in isolation.

Why not a separate entity? A new `WorkingDaySprint` subtype would require changes to
every consumer of `Sprint` and breaks the serialization contract. Additive fields are
the minimal, reversible path.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/sprint.ts` | Modified | Add `holidays?: string[]`, `useWorkingDays?: boolean` |
| `src/domain/workingDays.ts` | New | `getWorkingDays`, `isWorkingDay` utilities |
| `src/domain/calculateIdealLine.ts` | Modified | Branch on `useWorkingDays` flag |
| `src/ui/SprintSetupForm.tsx` | Modified | Toggle + holidays list input in duration mode |
| `src/application/useBurndown.ts` | Unchanged | No changes needed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| startDate is a holiday → ideal never drops day 1 | Low | Document as known behavior (v1); add UI warning |
| Long holiday list inflates share URL | Low | Acceptable for v1; compress in future iteration |
| Working-days count of 0 after subtracting holidays | Low | Validate: working days ≥ 1 before form submission |

## Rollback Plan

All new fields are optional. Reverting the feature means:
1. Remove the `workingDays.ts` utility
2. Remove the `useWorkingDays` branch from `calculateIdealLine`
3. Remove the duration-mode toggle from `SprintSetupForm`
4. Remove optional fields from `Sprint` type

Existing serialized sprints without these fields continue to work as-is.

## Dependencies

- None (no new libraries required — date arithmetic uses native JS `Date`)

## Success Criteria

- [ ] `isWorkingDay` correctly identifies Mon–Fri non-holiday days
- [ ] `getWorkingDays` returns accurate working-day list for a date range with holidays
- [ ] `calculateIdealLine` emits one point per working day when `useWorkingDays=true`
- [ ] Ideal line total points unchanged — just redistributed across working days
- [ ] Existing sprints (no `useWorkingDays`) render identically to before
- [ ] `SprintSetupForm` duration mode correctly computes `endDate` from startDate + workingDays count
- [ ] URL round-trip preserves `holidays` and `useWorkingDays` fields
