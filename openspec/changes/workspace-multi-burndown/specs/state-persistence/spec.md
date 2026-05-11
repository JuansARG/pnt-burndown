# Delta for State Persistence

## MODIFIED Requirements

### Requirement: Storage Key Schema

The system MUST use a flat key-per-entity schema in localStorage.
(Previously: a single key `burnup:sprint` held all sprint data.)

| Key | Value | Description |
|-----|-------|-------------|
| `burnup:workspaces` | `Workspace[]` JSON | Ordered list of all workspaces |
| `burnup:burndown:{id}` | `Burndown` JSON | One key per burndown |
| `burnup:migrated:v2` | `"true"` | Migration completion flag |

The legacy `burnup:sprint` key MUST NOT be written after migration.

#### Scenario: Workspace list persisted

- GIVEN two workspaces exist
- WHEN the user creates a third workspace
- THEN `burnup:workspaces` is updated to contain all three workspace objects

#### Scenario: Burndown persisted independently

- GIVEN workspace "abc" has burndowns "b1" and "b2"
- WHEN the user edits burndown "b1"
- THEN only `burnup:burndown:b1` is written; `burnup:burndown:b2` is untouched

#### Scenario: Load on navigation

- GIVEN `burnup:burndown:xyz` exists in localStorage
- WHEN the user navigates to `/#/workspace/:wid/burndown/xyz`
- THEN the burndown data is read from `burnup:burndown:xyz` and rendered

---

### Requirement: Storage Write Priority

The system MUST write burndown state changes immediately on every mutation
(same as existing behaviour). Workspace list writes MUST also be immediate.
No batching or debounce is required.

#### Scenario: Immediate persistence on edit

- GIVEN the user is on a BurndownPage
- WHEN the user changes a day-entry value
- THEN `burnup:burndown:{id}` is updated in localStorage before the next render

---

## ADDED Requirements

### Requirement: Storage Isolation Between Burndowns

Each Burndown's data MUST be stored under its own key. Reading or writing one
Burndown's key MUST NOT affect any other Burndown key.

#### Scenario: Two burndowns coexist

- GIVEN burndowns "b1" and "b2" both have data
- WHEN "b1" is updated
- THEN `localStorage.getItem("burnup:burndown:b2")` is unchanged
