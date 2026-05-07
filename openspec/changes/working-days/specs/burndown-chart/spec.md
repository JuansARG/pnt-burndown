# Delta for Burndown Chart

## MODIFIED Requirements

### Requirement: Burndown Chart

The system MUST render a burndown chart as pure SVG (no third-party charting library).

The chart MUST display two lines:
1. **Ideal line** — when `sprint.useWorkingDays === true`, points MUST be distributed only over working days (dates that pass `isWorkingDay(date, sprint.holidays ?? [])`). On weekends and holidays the ideal value MUST remain flat (same as the previous working day). When `sprint.useWorkingDays` is `false` or `undefined`, the ideal line MUST be linear from totalPoints on startDate to 0 on endDate (existing behavior, unchanged).
2. **Actual line** — connects each progress entry in chronological order (unchanged).

If the sprint has only one day (startDate === endDate), the ideal line MUST NOT be rendered (divide-by-zero guard).

If `sprint.useWorkingDays === true` but `getWorkingDays` returns an empty array (0 working days), the system MUST fall back to the calendar-linear ideal line.

The chart MUST NOT import React or any framework in the domain calculation layer.

(Previously: ideal line was always linear from totalPoints on startDate to 0 on endDate, no working-day branching)

#### Scenario: Render ideal and actual lines (calendar mode)

- GIVEN a sprint with totalPoints=40, 14 days, useWorkingDays=false, and 3 progress entries
- WHEN the chart is rendered
- THEN an ideal line from 40 to 0 across 14 calendar days is drawn AND the actual line connects the 3 entries

#### Scenario: No progress entries

- GIVEN a sprint with no progress entries
- WHEN the chart is rendered
- THEN only the ideal line is shown; no actual line is rendered

#### Scenario: One-day sprint guard

- GIVEN a sprint where startDate === endDate
- WHEN the chart is rendered
- THEN no ideal line is drawn and no divide-by-zero error occurs

#### Scenario: Working-day ideal line skips weekends

- GIVEN a sprint with totalPoints=10, startDate="2026-05-04" (Mon), endDate="2026-05-10" (Sun), useWorkingDays=true, holidays=[]
- WHEN the chart is rendered
- THEN the ideal line drops 2 pts/day on Mon–Fri AND remains flat on Sat–Sun

#### Scenario: Working-day ideal line skips holidays

- GIVEN a sprint with totalPoints=8, startDate="2026-05-04", endDate="2026-05-07", useWorkingDays=true, holidays=["2026-05-05"]
- WHEN the chart is rendered
- THEN the ideal line skips 2026-05-05 (value stays flat) and distributes points only across the 3 remaining working days

#### Scenario: Zero working days fallback

- GIVEN a sprint with useWorkingDays=true but all dates are holidays/weekends
- WHEN the chart is rendered
- THEN the system MUST fall back to the linear calendar ideal line without throwing an error

#### Scenario: Sprint without useWorkingDays — backward compat

- GIVEN an existing sprint with no useWorkingDays field (undefined)
- WHEN the chart is rendered
- THEN the calendar-linear ideal line is used (no change in behavior)
