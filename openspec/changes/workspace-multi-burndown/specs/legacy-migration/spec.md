# Legacy Migration Specification

## Purpose

One-time, idempotent migration that moves the existing `burnup:sprint`
localStorage value into the new multi-burndown schema so existing users do not
lose data.

## Requirements

### Requirement: Auto-Migrate on First Load

The system MUST run migration at application boot, before any routing or
rendering. If `burnup:sprint` exists AND `burnup:migrated:v2` does NOT exist,
the migration MUST execute automatically.

#### Scenario: Migration happy path

- GIVEN `burnup:sprint` contains a valid sprint payload
- AND `burnup:migrated:v2` does not exist
- WHEN the app boots
- THEN a Workspace named "Default Workspace" is created in `burnup:workspaces`
- AND a Burndown entry is written to `burnup:burndown:{newId}` with the sprint data
- AND `burnup:migrated:v2` is written with value `true`
- AND `burnup:sprint` is deleted

#### Scenario: Migration already done

- GIVEN `burnup:migrated:v2` is `true`
- WHEN the app boots
- THEN migration logic is skipped entirely

#### Scenario: No legacy data

- GIVEN `burnup:sprint` does not exist
- AND `burnup:migrated:v2` does not exist
- WHEN the app boots
- THEN migration writes `burnup:migrated:v2 = true` and creates no data
- AND the app proceeds normally to the workspace list

---

### Requirement: Idempotency

The migration MUST be safe to trigger multiple times. The presence of
`burnup:migrated:v2` is the sole guard — no other check is required.

#### Scenario: Flag written before deleting legacy key

- GIVEN migration starts
- WHEN the new Workspace and Burndown are successfully persisted
- THEN `burnup:migrated:v2` is written BEFORE `burnup:sprint` is deleted
- AND if deletion fails, re-running migration detects the flag and skips

---

### Requirement: Corrupt Legacy Data Handling

If `burnup:sprint` exists but cannot be parsed as valid JSON, the system MUST
skip the data migration, write the `burnup:migrated:v2` flag, and log a
console warning. Data MUST NOT be silently lost without a log entry.

#### Scenario: Corrupt sprint data

- GIVEN `burnup:sprint` contains invalid JSON
- WHEN the app boots and migration runs
- THEN no Workspace or Burndown is created from the corrupt data
- AND `burnup:migrated:v2` is written to prevent repeated attempts
- AND a `console.warn` message identifies the corrupt key
