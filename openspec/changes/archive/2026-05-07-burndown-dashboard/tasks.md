# Tasks: Burndown Dashboard

## Phase 1: Domain (pure TypeScript, no React)

- [x] 1.1 Create `src/domain/entities/Sprint.ts` — define `DayEntry` and `Sprint` interfaces (YYYY-MM-DD strings only, no Date objects)
- [x] 1.2 Create `src/domain/usecases/calculateIdealLine.ts` — implement `calculateIdealLine(sprint)` with linear interpolation and `totalDays===0` guard
- [x] 1.3 Create `src/domain/usecases/serializeState.ts` — implement `serialize(sprint): string` (Base64url: `+→-`, `/→_`, strip `=`) and `deserialize(raw): Sprint` (throws on invalid)

## Phase 2: Infrastructure

- [x] 2.1 Create `src/infrastructure/storage/localStorageAdapter.ts` — implement `StorageAdapter` with `load/save/clear` under key `burnup:sprint`; handle JSON parse errors gracefully
- [x] 2.2 Create `src/infrastructure/url/urlStateAdapter.ts` — implement `UrlAdapter` with `read/write/clear` via `window.location.hash`; use `deserialize`/`serialize` from domain; return `null` on malformed hash

## Phase 3: Application

- [x] 3.1 Create `src/application/useBurndown.ts` — implement `useBurndown()` hook returning `BurndownState & BurndownActions`; on mount: URL hash → localStorage → `null`; `setupSprint`, `logDay` (upsert by date), `updateNote`, `share`, `reset`; recalculate `idealLine` on every state change

## Phase 4: UI

- [x] 4.1 Create `src/ui/design-system/tokens.css` — define CSS custom properties for colors, spacing, typography, and border-radius used across all components
- [x] 4.2 Create `src/ui/components/Chart/BurndownChart.tsx` — pure SVG chart accepting `{ sprint, idealLine, width?, height? }`; render ideal line (dashed) and actual line (entries); SVG coordinate formula: `x = padding + (dayIndex/totalDays)*chartW`, `y = padding + ((totalPoints-value)/totalPoints)*chartH`; handle empty entries gracefully
- [x] 4.3 Create `src/ui/components/DayForm/DayForm.tsx` — form to log remaining points for a date; inputs: date (YYYY-MM-DD), remaining (number), optional note (max 280 chars); calls `logDay` on submit
- [x] 4.4 Create `src/ui/components/NoteModal/NoteModal.tsx` — modal to edit note for a past day entry; textarea (max 280 chars); calls `updateNote(date, note)` on save; dismissable
- [x] 4.5 Create `src/ui/components/ShareButton/ShareButton.tsx` — button that calls `share()`; when `isSharing=true` renders the `shareUrl` and a copy-to-clipboard action
- [x] 4.6 Create `src/ui/pages/BurndownPage.tsx` — root page; uses `useBurndown()`; if `sprint===null` renders setup form (inline or separate component); otherwise renders `BurndownChart`, `DayForm`, `NoteModal`, `ShareButton`
- [x] 4.7 Modify `src/App.tsx` — replace Vite default content with `<BurndownPage />`; import `tokens.css`
