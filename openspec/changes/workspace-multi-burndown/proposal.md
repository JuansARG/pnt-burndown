# Proposal: Workspace with Multiple Burndowns

## Intent

Users need to manage multiple sprints or teams from a single browser session without juggling multiple tabs. Currently the app stores exactly one sprint in `burnup:sprint` with no concept of grouping. This change introduces **Workspaces** — named collections of burndowns — backed by localStorage and navigated via a hash router compatible with GitHub Pages.

## Scope

### In Scope
- Install TanStack Router in hash mode (`#/...`)
- `WorkspaceListPage` — create, rename, delete workspaces
- `WorkspacePage` — list burndowns within a workspace; create/delete burndowns
- `BurndownPage` routed under `/#/workspace/:wid/burndown/:bid`
- Flat localStorage schema: `burnup:workspaces`, `burnup:burndown:{id}`
- Auto-migration: `burnup:sprint` → default workspace + burndown → delete legacy key
- URL sharing redesigned as query param on `/share` route (resolves hash collision)

### Out of Scope
- Members-per-entry feature (separate change)
- Backend or remote sync
- Multi-user collaboration
- Sprint template library

## Capabilities

> Contract for sdd-spec.

### New Capabilities
- `workspace-management`: CRUD for workspaces and listing burndowns per workspace
- `multi-burndown-routing`: TanStack Router hash-mode routes for workspace/burndown navigation
- `legacy-migration`: one-time migration of `burnup:sprint` to new multi-burndown schema

### Modified Capabilities
- `url-serialization`: move from `window.location.hash` to `/share` route + query param (breaking change to existing share links)
- `state-persistence`: key schema changes; load priority updated for multi-burndown context

## Approach

1. Add `@tanstack/react-router` with hash history.
2. Define new storage entities (`Workspace`, `Burndown extends Sprint`).
3. Implement `migrateLegacySprint` — runs once at boot, idempotent.
4. Build `WorkspaceListPage` and `WorkspacePage` as new route components.
5. Move `BurndownPage` under the new route tree.
6. Replace `urlStateAdapter` (hash-based) with a `/share?data=<base64url>` approach.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/App.tsx` | Modified | Replace direct render with router provider |
| `src/pages/BurndownPage.tsx` | Modified | Accept burndownId from route params |
| `src/pages/WorkspaceListPage.tsx` | New | Workspace list and creation UI |
| `src/pages/WorkspacePage.tsx` | New | Burndown list within a workspace |
| `src/infrastructure/storage/` | Modified + New | New keys, migration module |
| `src/infrastructure/router/` | New | TanStack Router config (hash mode) |
| `src/infrastructure/sharing/` | Modified | Share via `/share?data=` query param |
| `openspec/specs/url-serialization/` | Delta spec | Share mechanism change |
| `openspec/specs/state-persistence/` | Delta spec | Storage key schema change |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing share links break (hash → query param) | High | Accept as intentional; document in migration notes |
| Migration runs on every load if flag lost | Med | Write `burnup:migrated:v2` flag after success |
| BurndownPage (533 lines) hard to adapt | Med | Split into sub-components in this change |
| TanStack Router learning curve for contributors | Low | Minimal router config; docs linked in README |

## Rollback Plan

Revert the `@tanstack/react-router` install and the new storage keys. The legacy `burnup:sprint` key is deleted only after migration succeeds — if migration is reverted, restore the deletion guard so old data stays intact. No server changes; rollback is a git revert + localStorage clear in the browser.

## Dependencies

- `@tanstack/react-router` ≥ 1.x (not yet installed)

## Success Criteria

- [ ] User can create two workspaces and navigate between them via the hash URL
- [ ] Each workspace shows its own list of burndowns
- [ ] Existing users see their sprint auto-migrated into "Default Workspace" on first load
- [ ] Share link uses `/#/share?data=<base64url>` and loads correctly
- [ ] No regression on burndown chart, progress tracking, or sprint setup
