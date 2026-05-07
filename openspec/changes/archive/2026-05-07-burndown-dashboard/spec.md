# Burndown Dashboard — Full Specification

## Purpose

Single-page burndown chart app. No backend. State lives in localStorage and/or a shareable URL hash. Five capabilities: sprint-setup, progress-tracking, burndown-chart, url-serialization, state-persistence.

---

## Requirements

### Requirement: Sprint Setup

The system MUST allow a user to create or edit a sprint with the following fields: name (string), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), and totalPoints (positive integer).

Dates MUST be stored as YYYY-MM-DD strings. Date objects MUST NOT appear in domain entities.

The system MUST reject a sprint where startDate >= endDate.
The system MUST reject totalPoints <= 0.

#### Scenario: Create valid sprint

- GIVEN no sprint is loaded
- WHEN the user submits name="S1", startDate="2026-05-01", endDate="2026-05-14", totalPoints=40
- THEN the sprint is created and available for progress tracking

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

---

### Requirement: Progress Tracking

The system MUST allow the user to record remaining story points for a given date (YYYY-MM-DD).

If an entry already exists for that date, the system MUST upsert (replace) it — duplicate dates are NOT allowed.

An entry MAY include an optional freetext note (≤ 280 characters).

The system MUST NOT accept entries with dates outside [startDate, endDate].

#### Scenario: Add daily entry

- GIVEN a sprint exists
- WHEN the user submits remainingPoints=30 for date="2026-05-02"
- THEN a progress entry is stored for that date

#### Scenario: Upsert on duplicate date

- GIVEN a progress entry exists for date="2026-05-02" with remainingPoints=30
- WHEN the user submits remainingPoints=25 for the same date
- THEN the old entry is replaced; only one entry exists for that date

#### Scenario: Reject out-of-range date

- GIVEN a sprint from "2026-05-01" to "2026-05-14"
- WHEN the user submits an entry for date="2026-04-30"
- THEN the system MUST reject it with a validation error

#### Scenario: Entry with note

- GIVEN a sprint exists
- WHEN the user submits remainingPoints=20 with note="Team was blocked"
- THEN the entry is stored with the note attached

---

### Requirement: Burndown Chart

The system MUST render a burndown chart as pure SVG (no third-party charting library).

The chart MUST display two lines:
1. **Ideal line** — linear from totalPoints on startDate to 0 on endDate.
2. **Actual line** — connects each progress entry in chronological order.

If the sprint has only one day (startDate === endDate), the ideal line MUST NOT be rendered (divide-by-zero guard).

The chart MUST NOT import React or any framework in the domain calculation layer.

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

---

### Requirement: URL Serialization

The system MUST serialize sprint state (sprint metadata + all progress entries) to a Base64url string and store it in the URL hash (`window.location.hash`).

Base64url encoding MUST replace `+` with `-` and `/` with `_` to avoid URL parser issues.

The system MUST be able to deserialize a valid Base64url hash back into sprint state.

On deserialization failure (malformed JSON or invalid base64), the system MUST fall back gracefully without crashing.

#### Scenario: Serialize to URL hash

- GIVEN a sprint with progress entries
- WHEN the user triggers "share" or the state is auto-serialized
- THEN `window.location.hash` is set to a Base64url-encoded JSON string representing current state

#### Scenario: Deserialize from URL hash

- GIVEN the URL hash contains a valid Base64url sprint state
- WHEN the app loads
- THEN the sprint and progress entries are restored from the hash

#### Scenario: Malformed hash — graceful fallback

- GIVEN the URL hash contains invalid base64 or invalid JSON
- WHEN the app loads
- THEN the system MUST NOT throw; it MUST fall back to localStorage or null

#### Scenario: Base64url characters

- GIVEN a serialized sprint state
- WHEN encoded
- THEN the resulting string MUST NOT contain `+` or `/` characters

---

### Requirement: State Persistence

The system MUST persist sprint state to `localStorage` under the key `burnup:sprint`.

Load priority MUST be: URL hash > localStorage > null (show empty sprint setup form).

When state is loaded from URL hash, it SHOULD also be written to localStorage so it persists after hash removal.

#### Scenario: Load from URL hash priority

- GIVEN both a URL hash and a localStorage entry exist
- WHEN the app loads
- THEN the URL hash state is loaded and takes precedence over localStorage

#### Scenario: Load from localStorage fallback

- GIVEN no URL hash is present and a valid localStorage entry exists
- WHEN the app loads
- THEN the localStorage state is loaded

#### Scenario: Load null — show setup form

- GIVEN no URL hash and no localStorage entry
- WHEN the app loads
- THEN the sprint setup form is displayed empty

#### Scenario: Persist to localStorage on save

- GIVEN a sprint with entries is active
- WHEN the user saves any change
- THEN the state is written to `burnup:sprint` in localStorage

#### Scenario: URL hash syncs to localStorage

- GIVEN the app loads state from a URL hash
- WHEN state is fully restored
- THEN the same state SHOULD be written to localStorage
