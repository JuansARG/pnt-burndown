# Delta for Progress Tracking

## MODIFIED Requirements

### Requirement: Progress Tracking

The system MUST allow the user to record remaining story points for a given date (YYYY-MM-DD).

If an entry already exists for that date, the system MUST upsert (replace) it — duplicate dates are NOT allowed.

An entry MAY include an optional freetext note (≤ 280 characters).

The note field in `DayForm` MUST be rendered as a `<textarea>` (multi-line), consistent with `NoteModal`. The textarea MUST enforce the 280-character limit, display a character counter, and support multi-line input.

The system MUST NOT accept entries with dates outside [startDate, endDate].

(Previously: Note field in DayForm was a single-line `<input type="text">`.)

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

#### Scenario: Note textarea accepts multiline input

- GIVEN the DayForm is open
- WHEN the user types a note containing newline characters
- THEN the textarea expands and preserves the multiline content

#### Scenario: Note character counter is visible

- GIVEN the DayForm is open with the note textarea
- WHEN the user types a note
- THEN a character counter showing current/280 is displayed and updates in real time

#### Scenario: Existing note renders in textarea

- GIVEN a progress entry exists with note="Deployed hotfix"
- WHEN the user opens DayForm for that entry
- THEN the textarea is pre-filled with "Deployed hotfix"
