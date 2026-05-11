# Design: Workspace with Multiple Burndowns

## Technical Approach

Install TanStack Router (hash mode), introduce two new domain entities (`Workspace`, `Burndown`), replace the single flat-storage adapter with scoped adapters, run a one-time boot migration, and build three new pages wired to the new route tree. `useBurndown` is scoped to a `burndownId` param; sharing moves to a `/share` route + query param.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| 1 | Router placement | `src/infrastructure/router/` | `src/App.tsx` inline | Keeps routing infra-layer; App stays clean |
| 2 | Burndown entity | Extends `Sprint` fields + `{id, workspaceId, name}` | Separate type | Minimal diff; existing domain usecases unchanged |
| 3 | Storage per burndown | `burnup:burndown:{id}` (one key each) | Array in one key | Isolated writes; deletes are O(1); quota spread |
| 4 | Migration trigger | Boot-time, before router render | Route guard | Simpler; no route flicker; idempotent flag |
| 5 | Share URL | `/#/share?data=<base64url>` | Restore `window.location.hash` encoding | Hash prefix now owned by router; query param avoids collision |
| 6 | Hook scoping | `useBurndown(burndownId)` | Global singleton | Enables concurrent renders per burndown in future |

## Data Flow

```
Boot
 └─ migrateLegacySprint()          (infra/storage/migrateLegacySprint.ts)
     ├─ burnup:sprint present?
     │   yes → workspaceStorageAdapter.create("Default Workspace")
     │          burndownStorageAdapter.save(newBurndown)
     │          localStorage.setItem("burnup:migrated:v2", "1")
     │          localStorage.removeItem("burnup:sprint")
     └─ no  → noop

Router (createHashHistory)
 ├─ /                      → WorkspaceListPage
 │    useWorkspaces()      → workspaceStorageAdapter.loadAll()
 ├─ /workspace/:wid        → WorkspacePage
 │    useBurndownList(wid) → burndownStorageAdapter.listByWorkspace(wid)
 ├─ /workspace/:wid/burndown/:bid → BurndownPage
 │    useBurndown(bid)     → burndownStorageAdapter.load(bid)
 └─ /share?data=           → SharePage
      shareUrlAdapter.decode(data) → Sprint
```

## Interfaces / Contracts

```ts
// domain/entities/Workspace.ts
export interface Workspace {
  id: string;          // UUID v4
  name: string;        // 1-80 chars
  createdAt: string;   // ISO 8601
}

// domain/entities/Burndown.ts  (extends Sprint)
export interface Burndown extends Sprint {
  id: string;          // UUID v4
  workspaceId: string; // FK → Workspace.id
  name: string;        // display name (may differ from Sprint.name)
  createdAt: string;
}

// infrastructure/storage/workspaceStorageAdapter.ts
export interface WorkspaceStorageAdapter {
  loadAll(): Workspace[];
  save(ws: Workspace): void;
  remove(id: string): void;
}

// infrastructure/storage/burndownStorageAdapter.ts
export interface BurndownStorageAdapter {
  load(id: string): Burndown | null;
  listByWorkspace(workspaceId: string): Burndown[];
  save(burndown: Burndown): void;
  remove(id: string): void;
}

// infrastructure/sharing/shareUrlAdapter.ts
export interface ShareUrlAdapter {
  encode(sprint: Sprint): string;   // → base64url
  decode(raw: string): Sprint | null;
}

// application/useWorkspaces.ts
export function useWorkspaces(): {
  workspaces: Workspace[];
  create(name: string): Workspace;
  rename(id: string, name: string): void;
  remove(id: string): void;
}

// application/useBurndownList.ts
export function useBurndownList(workspaceId: string): {
  burndowns: Burndown[];
  create(name: string): Burndown;
  remove(id: string): void;
}

// application/useBurndown.ts  (signature change)
export function useBurndown(burndownId: string): BurndownState & BurndownActions;
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/Workspace.ts` | Create | `Workspace` interface |
| `src/domain/entities/Burndown.ts` | Create | `Burndown extends Sprint` interface |
| `src/infrastructure/storage/workspaceStorageAdapter.ts` | Create | CRUD for `burnup:workspaces` |
| `src/infrastructure/storage/burndownStorageAdapter.ts` | Create | CRUD for `burnup:burndown:{id}` keys |
| `src/infrastructure/storage/migrateLegacySprint.ts` | Create | One-time boot migration; idempotency flag |
| `src/infrastructure/sharing/shareUrlAdapter.ts` | Create | Encode/decode `Sprint` ↔ base64url |
| `src/infrastructure/router/index.tsx` | Create | TanStack Router, `createHashHistory`, route tree |
| `src/application/useWorkspaces.ts` | Create | Workspace CRUD hook |
| `src/application/useBurndownList.ts` | Create | Per-workspace burndown list hook |
| `src/application/useBurndown.ts` | Modify | Accept `burndownId: string`; drop URL-hash sharing logic; call `shareUrlAdapter` |
| `src/ui/pages/WorkspaceListPage.tsx` | Create | List/create/delete workspaces |
| `src/ui/pages/WorkspacePage.tsx` | Create | List/create/delete burndowns in a workspace |
| `src/ui/pages/SharePage.tsx` | Create | Decode `?data=` param, render read-only burndown |
| `src/ui/pages/NotFoundPage.tsx` | Create | Fallback with "Go home" link |
| `src/ui/pages/BurndownPage.tsx` | Modify | Read `burndownId` from route params instead of global state |
| `src/App.tsx` | Modify | Wrap with `RouterProvider`; call `migrateLegacySprint()` before render |
| `src/infrastructure/url/urlStateAdapter.ts` | Delete | Replaced by `shareUrlAdapter` |
| `package.json` / `package-lock.json` | Modify | Add `@tanstack/react-router` |

## Testing Strategy

No test runner is installed — manual verification only.

| Layer | What to verify | How |
|-------|---------------|-----|
| Migration | `burnup:sprint` → default workspace + burndown, flag written | Browser console + DevTools storage panel |
| Routing | All four routes render correct page; unknown route → NotFoundPage | Navigate by URL in browser |
| Share | `/#/share?data=<valid>` loads sprint; `?data=` missing → error message | Manual URL construction |
| Storage isolation | Delete one burndown; others unaffected | DevTools storage panel |
| Legacy key | `burnup:sprint` absent after migration | DevTools storage panel |

## Migration / Rollout

1. `migrateLegacySprint()` runs at boot before `<RouterProvider>` mounts.
2. Flag `burnup:migrated:v2` is written **before** legacy key is deleted (crash-safe).
3. If legacy data is corrupt: skip data, write flag, `console.warn` — no data loss.
4. Existing share links (`#<base64>`) will break — intentional; documented in proposal.

## Open Questions

- [ ] Should `WorkspacePage` show a burndown count badge on empty state, or just an empty-state illustration?
- [ ] Is renaming a workspace in scope for this change (spec says yes; UI design TBD)?
