# Exploration: Workspace with Multiple Burndowns

## Current State

### Data Model
The app has two domain entities (`src/domain/entities/Sprint.ts`):

```ts
interface DayEntry { date: string; remaining: number; note?: string; }
interface Sprint {
  name: string; totalPoints: number;
  startDate: string; endDate: string;
  entries: DayEntry[];
  holidays?: string[];
  useWorkingDays?: boolean;
}
```

A single Sprint is stored under the key `burnup:sprint` in localStorage.

### Storage
`src/infrastructure/storage/localStorageAdapter.ts` — one StorageAdapter tied to a single hardcoded key (`burnup:sprint`). Methods: `load()`, `save(sprint)`, `clear()`.

### URL Sharing
`src/infrastructure/url/urlStateAdapter.ts` — serializes a Sprint to Base64url and puts it in `window.location.hash`. On load, URL hash wins over localStorage, then writes it back to localStorage.

### Application Layer
`src/application/useBurndown.ts` — single hook managing one Sprint. Handles setup, logDay, deleteEntry, updateEntryDate, updateNote, share, reset. Directly couples storage and URL adapters.

### Routing
None. `App.tsx` renders `<BurndownPage />` directly. No router installed.

### UI
Single page: `src/ui/pages/BurndownPage.tsx`. Contains both the Sprint setup form (`SprintSetupForm`) and the main tracking view. Navigation is done by toggling a `showEdit` boolean state.

### Dependencies
No router. No state manager. React 19 + Vite. No `@tanstack/react-router` installed yet.

---

## Affected Areas

- `src/domain/entities/Sprint.ts` — needs two new entities: `Workspace` and `Burndown`
- `src/infrastructure/storage/localStorageAdapter.ts` — needs to support multiple burndowns per workspace and a workspace list
- `src/infrastructure/url/urlStateAdapter.ts` — URL sharing must encode `workspaceId + burndownId` or remain as a standalone share link
- `src/application/useBurndown.ts` — must be split: one hook for workspace list, one for individual burndown; or refactored to accept IDs
- `src/App.tsx` — needs TanStack Router wired in
- `src/ui/pages/BurndownPage.tsx` — needs a new `WorkspacePage` (list) and `BurndownPage` scoped to one burndown
- `package.json` — add `@tanstack/react-router`

---

## Proposed New Entities

```ts
// Workspace = named container for burndowns
interface Workspace {
  id: string;         // nanoid or crypto.randomUUID()
  name: string;
  createdAt: string;  // ISO date
  burndownIds: string[];  // ordered list
}

// Burndown = current Sprint + an ID
interface Burndown extends Sprint {
  id: string;
  workspaceId: string;
  createdAt: string;
}
```

`Sprint` stays as a pure value type (no ID). `Burndown` wraps it with identity. This keeps domain usecases untouched.

---

## Approaches

### Approach 1 — Flat key-per-entity storage (recommended)
Store each entity under its own key:
- `burnup:workspaces` → `Workspace[]` (index/list)
- `burnup:burndown:{id}` → `Burndown`

**Pros:** Simple, lazy-loading, no single blob that grows unbounded, easy partial reads.  
**Cons:** Requires iterating keys for "list all burndowns in workspace"; slightly more adapter surface.  
**Effort:** Low

### Approach 2 — Nested blob storage
Store one top-level key `burnup:data` → `{ workspaces: Workspace[]; burndowns: Burndown[] }`.

**Pros:** Single read/write, trivial to export/import.  
**Cons:** Grows to a large JSON blob; risk of partial write corruption on quota exceeded; entire blob must be parsed on every operation.  
**Effort:** Low — but worse tradeoffs

### Approach 3 — IndexedDB
Replace localStorage with IndexedDB for relational queries.

**Pros:** Better performance at scale, true async, no 5MB quota.  
**Cons:** Much higher complexity; no benefit at the user scale this app targets (personal sprints); would require a migration from localStorage.  
**Effort:** High

**Recommendation: Approach 1** — flat key-per-entity, keeping localStorage.

---

## Routing Plan

Install `@tanstack/react-router`. Three routes:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `WorkspaceListPage` | List all workspaces; create new |
| `/workspace/:workspaceId` | `WorkspacePage` | List burndowns in workspace |
| `/workspace/:workspaceId/burndown/:burndownId` | `BurndownPage` | Track individual burndown |

The existing URL hash sharing can be preserved as a standalone read-only share route:  
`/share#<base64>` — renders a read-only burndown from the hash, no storage write.

**GitHub Pages note:** The app deploys to `https://JuansARG.github.io/pnt-burndown`. TanStack Router's hash-based router mode (`createHashRouter`) is the safest option because GitHub Pages cannot serve deep paths without a 404 redirect hack. With hash mode, all routes live in the hash: `/#/`, `/#/workspace/:id`, etc.

---

## Storage Plan

```
localStorage keys:
  burnup:workspaces           → JSON array of Workspace (metadata only, no entries)
  burnup:burndown:{id}        → JSON Burndown object (Sprint data + id + workspaceId)
  burnup:sprint               → LEGACY — read on first boot for migration, then delete
```

New storage adapter interface:

```ts
interface WorkspaceStorageAdapter {
  listWorkspaces(): Workspace[];
  saveWorkspace(w: Workspace): void;
  deleteWorkspace(id: string): void;
}

interface BurndownStorageAdapter {
  loadBurndown(id: string): Burndown | null;
  saveBurndown(b: Burndown): void;
  deleteBurndown(id: string): void;
  listBurndownsForWorkspace(workspaceId: string): Burndown[]; // reads all burnup:burndown:* keys
}
```

---

## Migration Plan

On first load after the update:
1. Read `burnup:sprint` (the legacy key).
2. If it exists:
   a. Create a default workspace: `{ id: uuid(), name: "My Workspace", ... }`.
   b. Create a burndown from the legacy sprint: `{ id: uuid(), workspaceId, ...sprint }`.
   c. Write workspace to `burnup:workspaces`.
   d. Write burndown to `burnup:burndown:{id}`.
   e. Delete `burnup:sprint`.
3. If it doesn't exist, start fresh.

This migration runs once, deterministically, at app startup. It can live in `src/infrastructure/storage/migrateLegacySprint.ts`.

---

## Risks

1. **GitHub Pages hash collision** — current URL sharing uses `window.location.hash` for Base64 sprint data; hash-based routing also uses `#`. These will conflict. The share mechanism must be redesigned (query param or a dedicated `/share` page that reads hash only when there's no route hash).

2. **localStorage quota** — multiple workspaces/burndowns accumulate. Each burndown with 100 entries is ~5KB; 100 burndowns = 500KB. Well under the 5MB limit, but the app should handle `QuotaExceededError` gracefully.

3. **TanStack Router not installed** — `package.json` has no router dependency. Must be added before any routing work starts.

4. **URL sharing redesign scope** — the current share feature (`urlStateAdapter`) is deeply integrated in `useBurndown`. Decoupling it without breaking existing shared links is non-trivial. Consider making it a separate phase.

5. **`BurndownPage` size** — `BurndownPage.tsx` is 533 lines with the setup form embedded. Adding workspace-aware context increases coupling risk. Should be split in the same change or before.

6. **No test coverage** — there are no existing tests. Any refactor is done without a safety net. Adding tests for the storage adapters and migration function before or during this change is strongly recommended.

---

## Ready for Proposal
Yes. The scope is well-understood. The main decision before proposing is: **hash-router vs memory/browser router for GitHub Pages deployment**. Hash-router is the low-risk path. Confirm with the team before proceeding to proposal/spec.
