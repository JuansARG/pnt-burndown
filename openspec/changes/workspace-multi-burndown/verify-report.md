# Verification Report: workspace-multi-burndown

**Change**: workspace-multi-burndown  
**Mode**: Standard (no test runner)  
**Date**: 2026-05-11  
**Verified by**: sdd-verify agent

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 16 |
| Tasks complete (self-reported) | 16 |
| Tasks incomplete | 0 |

All tasks from phases 1–5 were implemented. Phase 6 (manual verification) is out of scope for automated verify.

---

## Build & Tests Execution

**Build / Type Check**: ❌ 1 type error

```
src/ui/components/Chart/BurndownChart.tsx(33,10): error TS6133: 
  'dateToDay' is declared but its value is never read.
```

**Tests**: ➖ No test runner configured (Standard mode — manual verification only per design.md)

**Coverage**: ➖ Not available

---

## Spec Compliance Matrix

No automated tests exist. Compliance is evaluated by static structural evidence only.

| Requirement | Scenario | Evidence | Result |
|-------------|----------|----------|--------|
| Create Workspace — UUID id, name 1-80 | Happy path | `useWorkspaces.create()` — generates UUID, trims name, validates 80-char in UI | ⚠️ PARTIAL — validation in UI layer only, not in hook |
| Create Workspace — empty name rejected | Edge case | `WorkspaceListPage.handleCreate()` guards `!name` | ✅ COMPLIANT (static) |
| List Workspaces — creation order | Happy path | `workspaceStorageAdapter.loadAll()` preserves push-order array | ✅ COMPLIANT (static) |
| Rename Workspace — id+createdAt unchanged | Happy path | `useWorkspaces.rename()` spreads existing `ws`, overrides only `name` | ✅ COMPLIANT (static) |
| Rename Workspace — whitespace-only rejected | Edge case | `handleRename` checks `!name` after `.trim()` | ✅ COMPLIANT (static) |
| Delete Workspace — remove workspace + all burndown:{id} keys | Happy path | `useWorkspaces.remove()` calls only `workspaceStorageAdapter.remove(id)` — burndown keys are NOT deleted | ❌ UNTESTED / FAILING |
| Delete Workspace — requires confirmation | Edge case | No confirmation dialog in `WorkspaceListPage` — direct `remove(ws.id)` on click | ❌ MISSING |
| List Burndowns per Workspace — creation order | Happy path | `burndownStorageAdapter.listByWorkspace()` sorts by `createdAt` | ✅ COMPLIANT (static) |
| List Burndowns — unknown wid → redirect with notice | Edge case | `WorkspacePage` finds no match but does NOT redirect — shows `undefined` workspace name, no notice | ❌ MISSING |
| Create Burndown — unique id, workspaceId ref, name; navigate to route | Happy path | `useBurndownList.create()` generates UUID, sets workspaceId; page navigates on create? Not verified — no navigate call found in `WorkspacePage` after create | ⚠️ PARTIAL |
| Delete Burndown — only that burndown's key affected | Happy path | `burndownStorageAdapter.remove(id)` removes single key | ✅ COMPLIANT (static) |
| Hash-Mode Router — TanStack Router + createHashHistory | Happy path | `src/infrastructure/router/index.tsx` uses `createHashHistory()` | ✅ COMPLIANT (static) |
| Routes: /#/ WorkspaceListPage, /#/workspace/:wid WorkspacePage, /#/workspace/:wid/burndown/:bid BurndownPage | Happy path | All three routes defined in router/index.tsx | ✅ COMPLIANT (static) |
| Route Params — :wid and :bid typed | Happy path | `useParams({ from: '/workspace/$wid/burndown/$bid' })` with TanStack typed params | ✅ COMPLIANT (static) |
| Not Found Handling — fallback with "Go home" | Happy path | `NotFoundPage` exists, has `<Link to="/">← Go home</Link>`, wired as `notFoundComponent` on rootRoute | ✅ COMPLIANT (static) |
| Share Route — /#/share?data=<base64url> | Happy path | `shareRoute` path `/share`; share() in useBurndown builds `#/share?data=${encoded}` | ✅ COMPLIANT (static) |
| Share — missing param → "Invalid share link" | Edge case | `SharePage` shows "No data provided in URL." (not exactly "Invalid share link") | ⚠️ PARTIAL |
| Share — tampered/corrupt param → graceful error | Edge case | `shareUrlAdapter.decode()` returns null; SharePage shows decode-error message | ✅ COMPLIANT (static) |
| Auto-Migrate on First Load — boot before routing | Happy path | `migrateLegacySprint()` called in `App.tsx` before `<RouterProvider>` | ✅ COMPLIANT (static) |
| Migration — idempotency via flag | Happy path | Flag `burnup:migrated:v2` checked first; flag written before legacy key deleted | ✅ COMPLIANT (static) |
| Corrupt Legacy Data — skip, write flag, console.warn | Edge case | Inner try/catch in `migrateLegacySprint` catches JSON parse errors, outer block still writes flag | ✅ COMPLIANT (static) |
| Storage Key Schema — burnup:workspaces, burnup:burndown:{id}, burnup:migrated:v2 | All | Verified in adapter constants | ✅ COMPLIANT (static) |
| Legacy burnup:sprint NOT written post-migration | Edge case | Legacy key is deleted, no code writes it post-migration | ✅ COMPLIANT (static) |
| Storage Isolation — writing one burndown MUST NOT affect others | Happy path | Each burndown stored under individual key; save() is single `setItem` | ✅ COMPLIANT (static) |
| urlStateAdapter.ts deleted | Removal | File not found in filesystem | ✅ COMPLIANT (static) |
| useBurndown accepts burndownId param | Happy path | `useBurndown(burndownId: string)` signature confirmed | ✅ COMPLIANT (static) |

**Compliance summary**: 18/26 scenarios compliant, 3 critical issues, 2 partial, 2 missing

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Domain entities match spec | ✅ Implemented | `Workspace.ts` and `Burndown.ts` match interfaces exactly |
| Storage keys correct | ✅ Implemented | `burnup:workspaces`, `burnup:burndown:{id}`, `burnup:migrated:v2` confirmed |
| Migration logic correct and idempotent | ✅ Implemented | Flag before delete, inner/outer try-catch |
| Router hash mode + correct route tree | ✅ Implemented | `createHashHistory`, all 4 routes defined |
| Share uses /share?data= query param | ✅ Implemented | Confirmed in useBurndown.share() and SharePage |
| useBurndown accepts burndownId | ✅ Implemented | Signature updated |
| All new UI pages exist | ✅ Implemented | WorkspaceListPage, WorkspacePage, SharePage, NotFoundPage, BurndownPage all present |
| App.tsx wires migration + RouterProvider | ✅ Implemented | Both present before/as the render tree |
| urlStateAdapter.ts deleted | ✅ Implemented | File does not exist |
| TypeScript types — no `any` | ⚠️ Partial | `SharePage` uses `(search as Record<string, string>)['data']` — type cast instead of typed search params |
| Delete Workspace cascade-deletes burndowns | ❌ Missing | `useWorkspaces.remove()` only removes workspace record; burndown keys leak in localStorage |
| Delete Workspace confirmation | ❌ Missing | No confirmation dialog in WorkspaceListPage |
| Unknown wid redirect + notice | ❌ Missing | WorkspacePage does not redirect when workspace not found |
| Navigate after create burndown | ⚠️ Partial | `WorkspacePage.handleCreate()` calls `create(name)` but does not navigate to new burndown route |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Router in `src/infrastructure/router/` | ✅ Yes | |
| Burndown extends Sprint | ✅ Yes | |
| Per-burndown storage key | ✅ Yes | |
| Boot-time migration before router | ✅ Yes | |
| Share URL as `/#/share?data=` query param | ✅ Yes | |
| `useBurndown(burndownId)` hook scoping | ✅ Yes | |
| No test runner — manual verification | ✅ Yes | Design explicitly states no test runner |

---

## Issues Found

### CRITICAL (must fix before archive)

**C-1 — Delete Workspace does not cascade-delete burndown keys**  
`useWorkspaces.remove(id)` only removes the workspace from `burnup:workspaces`. All `burnup:burndown:{id}` keys belonging to that workspace remain in `localStorage`, leaking orphaned data. This directly violates the spec: _"Delete Workspace MUST: remove workspace + all its `burnup:burndown:{id}` keys."_  
**Fix**: In `useWorkspaces.remove`, call `burndownStorageAdapter.listByWorkspace(id)` first, then `burndownStorageAdapter.remove` for each, before removing the workspace.

**C-2 — Delete Workspace has no confirmation dialog**  
The spec states _"Requires confirmation"_ for workspace deletion. `WorkspaceListPage` directly calls `remove(ws.id)` on button click with no modal or `window.confirm`.  
**Fix**: Add a confirmation modal (inline state, like `showReset` in BurndownPage) before calling `remove`.

**C-3 — TypeScript error: `dateToDay` declared but never read**  
`src/ui/components/Chart/BurndownChart.tsx:33` — `tsc --noEmit` returns exit 1.  
**Fix**: Either use `dateToDay` in the chart rendering logic (likely it was meant to be used for `day` axis mode) or remove the unused function.

### WARNING (should fix)

**W-1 — Unknown wid does not redirect with notice**  
Spec: _"Unknown wid → redirect to /#/ with notice."_ `WorkspacePage` silently shows a fallback workspace name (`'Workspace'`) without redirecting or notifying.  
**Fix**: After `workspace = workspaces.find(w => w.id === wid)`, if `undefined`, use `useNavigate` or TanStack Router `<Navigate to="/">` and show a toast/notice.

**W-2 — Create Burndown does not navigate to the new burndown route**  
Spec: _"Create Burndown MUST: navigate to `/#/workspace/:wid/burndown/:bid`."_ `WorkspacePage.handleCreate()` creates and refreshes the list but does not navigate.  
**Fix**: After `const bd = create(name)`, call `navigate({ to: '/workspace/$wid/burndown/$bid', params: { wid, bid: bd.id } })`.

**W-3 — SharePage uses unsafe type cast for search params**  
`(search as Record<string, string>)['data']` bypasses TanStack Router's typed search schema. This compiles but is an unvalidated cast.  
**Fix**: Declare a `validateSearch` on the `/share` route in `router/index.tsx` for `{ data?: string }`, then `useSearch` returns it typed.

**W-4 — "Invalid share link" message wording differs from spec**  
Spec: _"missing param → 'Invalid share link'"_. The implementation shows `"No data provided in URL."` for missing param and a different string for corrupt data.  
**Fix**: Align message text to match spec.

### SUGGESTION

**S-1 — Workspace name length validation lives only in the UI layer**  
The 80-char max and empty-name rejection should be enforced in `useWorkspaces.create()` so any non-UI caller also gets validation.

**S-2 — `listByWorkspace` iterates all localStorage keys in O(n)**  
This will degrade as more burndowns are added. A registry key (`burnup:workspace:{wid}:index`) or a single burndowns index per workspace would make lookup O(1). Not urgent but worth tracking.

---

## Verdict

**FAIL** — 3 critical issues must be resolved before archive:

1. Workspace delete does not cascade-delete burndown keys (data leak, spec violation)
2. Workspace delete has no confirmation (spec violation)
3. TypeScript build error — `tsc --noEmit` exits 1

Plus 4 warnings that should be fixed before shipping.
