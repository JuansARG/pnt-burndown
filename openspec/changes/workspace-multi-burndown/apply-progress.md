# Apply Progress: workspace-multi-burndown

## Status
16/16 implementation tasks complete. Phase 6 (manual verification) pending — requires browser.

## Delivery
- Mode: size:exception (single PR, maintainer pre-approved in prompt)
- 5 conventional commits — one per phase

## Completed Tasks
- [x] 1.1 npm install @tanstack/react-router (v1.169.2 added to package.json)
- [x] 1.2 src/domain/entities/Workspace.ts created
- [x] 1.3 src/domain/entities/Burndown.ts created
- [x] 2.1 src/infrastructure/storage/workspaceStorageAdapter.ts created
- [x] 2.2 src/infrastructure/storage/burndownStorageAdapter.ts created
- [x] 2.3 src/infrastructure/storage/migrateLegacySprint.ts created
- [x] 2.4 src/infrastructure/sharing/shareUrlAdapter.ts created
- [x] 2.5 src/infrastructure/router/index.tsx created (hash mode, 4 routes)
- [x] 2.6 src/infrastructure/url/urlStateAdapter.ts deleted
- [x] 3.1 src/application/useWorkspaces.ts created
- [x] 3.2 src/application/useBurndownList.ts created
- [x] 3.3 src/application/useBurndown.ts modified (burndownId param, shareUrlAdapter)
- [x] 4.1 src/ui/pages/WorkspaceListPage.tsx created
- [x] 4.2 src/ui/pages/WorkspacePage.tsx created
- [x] 4.3 src/ui/pages/SharePage.tsx created
- [x] 4.4 src/ui/pages/NotFoundPage.tsx created
- [x] 4.5 src/ui/pages/BurndownPage.tsx modified (useParams, back link, empty burndown check)
- [x] 5.1 src/App.tsx modified (migrateLegacySprint + RouterProvider)

## Files Changed
| File | Action |
|------|--------|
| src/domain/entities/Workspace.ts | Created |
| src/domain/entities/Burndown.ts | Created |
| src/infrastructure/storage/workspaceStorageAdapter.ts | Created |
| src/infrastructure/storage/burndownStorageAdapter.ts | Created |
| src/infrastructure/storage/migrateLegacySprint.ts | Created |
| src/infrastructure/sharing/shareUrlAdapter.ts | Created |
| src/infrastructure/router/index.tsx | Created |
| src/infrastructure/url/urlStateAdapter.ts | Deleted |
| src/application/useWorkspaces.ts | Created |
| src/application/useBurndownList.ts | Created |
| src/application/useBurndown.ts | Modified |
| src/ui/pages/WorkspaceListPage.tsx | Created |
| src/ui/pages/WorkspacePage.tsx | Created |
| src/ui/pages/SharePage.tsx | Created |
| src/ui/pages/NotFoundPage.tsx | Created |
| src/ui/pages/BurndownPage.tsx | Modified |
| src/App.tsx | Modified |
| package.json / package-lock.json | Modified |

## Deviations from Design
- `useBurndown` `reset()` does not call `localStorageAdapter.clear()` (deleted). It resets the burndown in-place (keeps id/workspaceId, clears sprint data). Design said "reset" scoped to the burndown, not full storage clear.
- `BurndownPage` setup form condition extended to `!sprint.startDate` to handle new empty burndowns (totalPoints=0, startDate='') created by `useBurndownList.create()`.
- `SprintSetupForm` accepts optional `backTo` prop for navigation — not in spec but required for UX.
- Share URL format: `${origin}${pathname}#/share?data=${encoded}` — matches design decision #5.

## Remaining
- Phase 6 (manual verification): browser-only, cannot be automated.
