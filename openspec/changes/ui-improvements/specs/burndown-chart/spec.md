# Delta for Burndown Chart

## MODIFIED Requirements

### Requirement: Burndown Chart

The system MUST render a burndown chart as pure SVG (no third-party charting library).

The chart MUST display two lines:
1. **Ideal line** — linear from totalPoints on startDate to 0 on endDate.
2. **Actual line** — connects each progress entry in chronological order.

When rendering the actual line, the chart MUST inject an implicit Day 1 point `{ date: startDate, remaining: totalPoints }` as the first point IFF no real progress entry exists for `startDate`. When a real entry for `startDate` exists, the implicit point MUST NOT be injected — the real entry is used instead.

If the sprint has only one day (startDate === endDate), the ideal line MUST NOT be rendered (divide-by-zero guard).

The chart MUST NOT import React or any framework in the domain calculation layer.

(Previously: Actual line connected only real progress entries — no implicit Day 1 anchor.)

#### Scenario: Render ideal and actual lines

- GIVEN a sprint with totalPoints=40, 14 days, and 3 progress entries
- WHEN the chart is rendered
- THEN an ideal line from 40 to 0 across 14 days is drawn AND the actual line connects the 3 entries

#### Scenario: No progress entries

- GIVEN a sprint with no progress entries
- WHEN the chart is rendered
- THEN only the ideal line is shown; no actual line is rendered

#### Scenario: One-day sprint guard

- GIVEN a sprint where startDate === endDate
- WHEN the chart is rendered
- THEN no ideal line is drawn and no divide-by-zero error occurs

#### Scenario: Implicit Day 1 point injected when no entry for startDate

- GIVEN a sprint with startDate="2026-05-01" and totalPoints=40
- AND no progress entry exists for "2026-05-01"
- WHEN the chart renders the actual line
- THEN the actual line starts from the implicit point { date: "2026-05-01", remaining: 40 }

#### Scenario: Implicit Day 1 point NOT injected when entry exists for startDate

- GIVEN a sprint with startDate="2026-05-01" and totalPoints=40
- AND a real progress entry exists for "2026-05-01" with remaining=35
- WHEN the chart renders the actual line
- THEN the actual line starts from { date: "2026-05-01", remaining: 35 } and NO duplicate implicit point is prepended
