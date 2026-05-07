# Delta Specs — working-days

## 1. New: Working Days Utility

> Full spec: `specs/working-days/spec.md`

### Requirement: isWorkingDay

`isWorkingDay(date, holidays)` MUST return false for Sat, Sun, or any date in holidays; true otherwise.

| Scenario | Given | When | Then |
|---|---|---|---|
| Weekday no holidays | holidays=[] | "2026-05-04" (Mon) | true |
| Saturday | holidays=[] | "2026-05-09" (Sat) | false |
| Sunday | holidays=[] | "2026-05-10" (Sun) | false |
| Holiday weekday | holidays=["2026-05-01"] | "2026-05-01" | false |

### Requirement: getWorkingDays

`getWorkingDays(start, end, holidays)` MUST return sorted ISO strings in [start,end] that pass `isWorkingDay`. Non-working start/end excluded.

| Scenario | Given | Then |
|---|---|---|
| Range with weekends | start=2026-05-04, end=2026-05-10, holidays=[] | 5 weekdays only |
| Start is weekend | start=2026-05-09 (Sat), end=2026-05-11 | ["2026-05-11"] |
| Holiday in range | start=2026-05-04, end=2026-05-06, holidays=["2026-05-05"] | ["2026-05-04","2026-05-06"] |
| All holidays | start=end=2026-05-04, holidays=["2026-05-04"] | [] |

---

## 2. Modified: Sprint Setup

> Delta spec: `specs/sprint-setup/spec.md`

### MODIFIED Requirement: Sprint Setup

Form MUST offer **Dates mode** (default) and **Duration mode** toggle.

- Duration mode adds: `workingDays` (int ≥ 1), `holidays` (list of ISO dates), read-only `endDate` preview.
- Submit in Duration mode → Sprint gets `useWorkingDays: true`, `holidays: string[]`.
- Submit in Dates mode → Sprint gets `useWorkingDays: false`; no holidays.
- Edit sprint → toggle + fields pre-populated from stored data.
- Validation: workingDays ≥ 1; holidays must be valid ISO within sprint range.

(Previously: form had Dates mode only; no holidays or useWorkingDays.)

Key scenarios: create (dates), reject startDate≥endDate, reject totalPoints≤0, duration submit, reject workingDays<1, reject invalid/out-of-range holiday, edit pre-populate.

---

## 3. Modified: Burndown Chart

> Delta spec: `specs/burndown-chart/spec.md`

### MODIFIED Requirement: Burndown Chart

When `sprint.useWorkingDays === true`: ideal line MUST distribute points only over working days; flat on weekends/holidays.
When `sprint.useWorkingDays` is false/undefined: existing linear calendar behavior unchanged.
If 0 working days found: MUST fall back to linear calendar behavior.

(Previously: ideal line always linear calendar, no working-day branching.)

Key scenarios: calendar mode unchanged, working-day line skips weekends, working-day line skips holidays, zero-working-days fallback, undefined flag backward-compat.
