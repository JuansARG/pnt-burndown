# Tasks: Workspace with Multiple Burndowns

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 420–500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation + infra) → PR 2 (app hooks + pages + wiring) |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

> **⚠️ Maintainer action required**: delivery strategy is `single-pr` and estimated lines exceed 400. Provide `size:exception` approval OR choose a chain strategy (`stacked-to-main` / `feature-branch-chain`) before `sdd-apply` starts.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Install router + domain entities + infra layer | PR 1 | Foundation; no UI changes; targets main |
| 2 | App hooks + pages + App.tsx wiring + delete urlStateAdapter | PR 2 | Depends on PR 1; full feature |

---

## Phase 1: Dependencies & Domain

- [x] 1.1 Run `npm install @tanstack/react-router`; verify it appears in `package.json`
- [x] 1.2 Create `src/domain/entities/Workspace.ts` — `Workspace` interface (id, name, createdAt)
- [x] 1.3 Create `src/domain/entities/Burndown.ts` — `Burndown extends Sprint` interface (id, workspaceId, name, createdAt)

## Phase 2: Infrastructure

- [x] 2.1 Create `src/infrastructure/storage/workspaceStorageAdapter.ts` — `loadAll / save / remove` using `burnup:workspaces` key
- [x] 2.2 Create `src/infrastructure/storage/burndownStorageAdapter.ts` — `load / listByWorkspace / save / remove` using `burnup:burndown:{id}` keys
- [x] 2.3 Create `src/infrastructure/storage/migrateLegacySprint.ts` — check `burnup:sprint`, create default workspace + burndown, write `burnup:migrated:v2` flag, remove legacy key; idempotent
- [x] 2.4 Create `src/infrastructure/sharing/shareUrlAdapter.ts` — `encode(Sprint): string` and `decode(raw): Sprint | null` (base64url)
- [x] 2.5 Create `src/infrastructure/router/index.tsx` — `createHashHistory`, route tree: `/`, `/workspace/:wid`, `/workspace/:wid/burndown/:bid`, `/share`
- [x] 2.6 Delete `src/infrastructure/url/urlStateAdapter.ts`

## Phase 3: Application Hooks

- [x] 3.1 Create `src/application/useWorkspaces.ts` — wraps `workspaceStorageAdapter`; exposes `workspaces, create, rename, remove`
- [x] 3.2 Create `src/application/useBurndownList.ts` — wraps `burndownStorageAdapter.listByWorkspace(wid)`; exposes `burndowns, create, remove`
- [x] 3.3 Modify `src/application/useBurndown.ts` — accept `burndownId: string`; drop URL-hash sharing; call `shareUrlAdapter` for share action

## Phase 4: UI Pages

- [x] 4.1 Create `src/ui/pages/WorkspaceListPage.tsx` — list workspaces from `useWorkspaces()`; create/delete/navigate to workspace
- [x] 4.2 Create `src/ui/pages/WorkspacePage.tsx` — list burndowns from `useBurndownList(wid)`; create/delete/navigate to burndown
- [x] 4.3 Create `src/ui/pages/SharePage.tsx` — decode `?data=` via `shareUrlAdapter`; render read-only burndown or error message
- [x] 4.4 Create `src/ui/pages/NotFoundPage.tsx` — fallback page with "Go home" link to `/`
- [x] 4.5 Modify `src/ui/pages/BurndownPage.tsx` — read `burndownId` from route params; pass to `useBurndown(burndownId)`

## Phase 5: Wiring

- [x] 5.1 Modify `src/App.tsx` — call `migrateLegacySprint()` before render; wrap tree with `<RouterProvider router={router} />`

## Phase 6: Manual Verification

- [ ] 6.1 Verify migration: seed `burnup:sprint` in DevTools → reload → confirm default workspace + burndown created, flag written, legacy key removed
- [ ] 6.2 Verify routing: navigate to `/`, `/workspace/:wid`, `/workspace/:wid/burndown/:bid`, `/share?data=<valid>`, unknown path → each renders correct page
- [ ] 6.3 Verify storage isolation: delete one burndown; confirm others untouched in DevTools
- [ ] 6.4 Verify share: construct `/#/share?data=<base64url>` manually; confirm sprint loads read-only
