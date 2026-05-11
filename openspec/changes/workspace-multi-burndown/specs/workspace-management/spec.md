# Workspace Management Specification

## Purpose

CRUD operations for named Workspaces in localStorage. Each Workspace is a
named container that groups one or more Burndowns.

## Requirements

### Requirement: Create Workspace

The system MUST allow the user to create a named Workspace. A Workspace MUST
have a unique generated `id` (UUID v4), a `name` (1–80 chars), and a
`createdAt` ISO timestamp. The system MUST persist the new Workspace to
`burnup:workspaces` immediately after creation.

#### Scenario: Happy path — create first workspace

- GIVEN no workspaces exist
- WHEN the user submits a non-empty name
- THEN a new Workspace is created with a unique id and stored
- AND the app navigates to `/#/workspace/:wid`

#### Scenario: Duplicate name allowed

- GIVEN one workspace named "Team A" already exists
- WHEN the user creates another workspace named "Team A"
- THEN a second Workspace with a distinct id is created (names need not be unique)

#### Scenario: Empty name rejected

- GIVEN the creation form is open
- WHEN the user submits an empty or whitespace-only name
- THEN the Workspace is NOT created and an inline validation message is shown

---

### Requirement: List Workspaces

The system MUST display all persisted Workspaces in creation order on the
`WorkspaceListPage`.

#### Scenario: Multiple workspaces displayed

- GIVEN three Workspaces exist
- WHEN the user visits `/#/`
- THEN all three names are shown in creation order

#### Scenario: Empty state

- GIVEN no Workspaces exist
- WHEN the user visits `/#/`
- THEN an empty-state prompt to create the first Workspace is displayed

---

### Requirement: Rename Workspace

The system MUST allow the user to rename an existing Workspace. The same
length constraint (1–80 chars) applies. The `id` and `createdAt` MUST remain
unchanged.

#### Scenario: Rename happy path

- GIVEN a Workspace named "Sprint 1"
- WHEN the user renames it to "Q3 Sprint"
- THEN the Workspace name updates in localStorage and in the UI

#### Scenario: Whitespace-only name rejected

- GIVEN the rename form is open
- WHEN the user submits "   "
- THEN the rename is NOT saved and a validation message is shown

---

### Requirement: Delete Workspace

The system MUST allow the user to delete a Workspace. Deleting a Workspace
MUST also delete all `burnup:burndown:{id}` keys belonging to that Workspace.

#### Scenario: Delete workspace with burndowns

- GIVEN a Workspace with two burndowns exists
- WHEN the user confirms deletion
- THEN the Workspace is removed from `burnup:workspaces`
- AND both `burnup:burndown:{id}` keys are removed from localStorage

#### Scenario: Delete last workspace

- GIVEN only one Workspace exists
- WHEN the user confirms deletion
- THEN the Workspace and its burndowns are deleted
- AND the app returns to `/#/` showing the empty-state prompt

#### Scenario: Deletion requires confirmation

- GIVEN a Workspace exists
- WHEN the user triggers delete without confirming
- THEN the Workspace is NOT deleted until the user confirms

---

### Requirement: List Burndowns per Workspace

The system MUST display all Burndowns belonging to a Workspace on the
`WorkspacePage`, in creation order.

#### Scenario: Burndown list shown

- GIVEN a Workspace with three burndowns
- WHEN the user navigates to `/#/workspace/:wid`
- THEN all three burndown names are shown

#### Scenario: Workspace not found

- GIVEN the user navigates to `/#/workspace/unknown-id`
- WHEN no Workspace with that id exists
- THEN the app redirects to `/#/` and shows a "workspace not found" notice

---

### Requirement: Create Burndown

The system MUST allow the user to create a new Burndown within a Workspace. A
Burndown MUST have a unique id, a `workspaceId` reference, and a `name`.

#### Scenario: Create burndown

- GIVEN a Workspace exists
- WHEN the user submits a non-empty burndown name
- THEN a new Burndown is persisted at `burnup:burndown:{id}`
- AND the app navigates to `/#/workspace/:wid/burndown/:bid`

---

### Requirement: Delete Burndown

The system MUST allow the user to delete an individual Burndown from a
Workspace without affecting other Burndowns.

#### Scenario: Delete single burndown

- GIVEN a Workspace with two burndowns
- WHEN the user deletes one burndown
- THEN only the deleted `burnup:burndown:{id}` key is removed
- AND the other burndown remains unchanged
