# Delta for Sprint Setup

## MODIFIED Requirements

### Requirement: Sprint Setup

The system MUST allow a user to create or edit a sprint. The form MUST offer two input modes via a toggle: **Dates mode** (default) and **Duration mode**.

**Dates mode** fields: name, startDate, endDate, totalPoints.
**Duration mode** fields: name, startDate, workingDays (positive integer), holidays (list of ISO dates), totalPoints. endDate MUST be derived and shown as a read-only preview.

Dates MUST be stored as YYYY-MM-DD strings. Date objects MUST NOT appear in domain entities.

The system MUST reject startDate >= endDate in Dates mode.
The system MUST reject totalPoints <= 0 in both modes.
The system MUST reject workingDays < 1 in Duration mode.
The system MUST reject holidays that are not valid ISO dates or fall outside [startDate, endDate].

On submit in Duration mode: Sprint entity MUST include `holidays: string[]` and `useWorkingDays: true`.
On submit in Dates mode: Sprint entity MUST have `useWorkingDays: false` (or omit the field); holidays MUST NOT be set.

When editing an existing sprint, the toggle and all fields MUST be pre-populated from stored sprint data.

(Previously: form had only Dates mode — name, startDate, endDate, totalPoints; no holidays or useWorkingDays fields)

#### Scenario: Create valid sprint (Dates mode)

- GIVEN no sprint is loaded
- WHEN the user submits name="S1", startDate="2026-05-01", endDate="2026-05-14", totalPoints=40 in Dates mode
- THEN the sprint is created with useWorkingDays=false and no holidays

#### Scenario: Reject single-day sprint

- GIVEN the sprint setup form is shown
- WHEN the user submits startDate="2026-05-01", endDate="2026-05-01"
- THEN the system MUST reject the form with a validation error

#### Scenario: Reject zero points

- GIVEN the sprint setup form is shown
- WHEN the user submits totalPoints=0
- THEN the system MUST reject the form with a validation error

#### Scenario: Edit existing sprint

- GIVEN a sprint already exists
- WHEN the user edits the name and resubmits
- THEN the sprint is updated and progress entries are preserved

#### Scenario: Duration mode — endDate preview

- GIVEN the user is in Duration mode with startDate="2026-05-04", workingDays=5, holidays=[]
- WHEN the form is rendered
- THEN a read-only endDate preview MUST show the calculated last working day

#### Scenario: Duration mode — submit

- GIVEN the user submits name="S2", startDate="2026-05-04", workingDays=5, holidays=[], totalPoints=20 in Duration mode
- WHEN the form is submitted
- THEN the sprint is created with useWorkingDays=true and holidays=[]

#### Scenario: Duration mode — reject workingDays < 1

- GIVEN Duration mode is active
- WHEN the user submits workingDays=0
- THEN the system MUST reject with a validation error

#### Scenario: Duration mode — reject invalid holiday date

- GIVEN Duration mode is active with startDate="2026-05-04", workingDays=5
- WHEN the user adds holiday="not-a-date"
- THEN the system MUST reject it with a validation error before form submission

#### Scenario: Duration mode — reject holiday outside sprint range

- GIVEN Duration mode is active with startDate="2026-05-04", workingDays=5
- WHEN the user adds holiday="2026-06-01" (outside sprint range)
- THEN the system MUST reject it with a validation error

#### Scenario: Edit sprint in Duration mode — pre-populate

- GIVEN a sprint with useWorkingDays=true, holidays=["2026-05-01"] is loaded
- WHEN the edit form is opened
- THEN the toggle is set to Duration mode and holidays field shows "2026-05-01"
