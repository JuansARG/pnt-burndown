# Proposal: Burndown Dashboard

## Intent

Build a single-page burndown chart tool that lets a team visualize sprint progress via a shareable URL. No backend, no auth — pure client-side. Users configure a sprint, log daily progress, and share the chart via a Base64-encoded URL hash.

## Scope

### In Scope
- Sprint setup form (name, start date, end date, total points)
- Daily progress logging (date + remaining points, with upsert on duplicate date)
- SVG burndown chart (actual line + ideal line)
- URL serialization via Base64 (JSON → Base64 → `#` hash)
- Persistence: URL hash > localStorage > empty form
- Single active sprint only (v1)

### Out of Scope
- Multi-sprint management
- Backend / API
- User authentication
- Gzip URL compression (upgrade path deferred)
- Charting library (pure SVG only)
- Date-picker library (use native `<input type="date">`)

## Capabilities

### New Capabilities
- `sprint-setup`: Configure sprint metadata (name, dates, total points)
- `progress-tracking`: Log and upsert daily remaining-points entries
- `burndown-chart`: Render SVG chart with actual + ideal lines
- `url-serialization`: Encode/decode sprint state to/from Base64 URL hash
- `state-persistence`: Load sprint state with priority: URL hash > localStorage > null

### Modified Capabilities
None

## Approach

Hexagonal/Clean layering:
- **domain/**: `Sprint`, `ProgressEntry` value objects — pure TS, zero imports
- **application/**: `useBurndown` hook coordinates state, persistence, and URL sync
- **infrastructure/**: `LocalStorageAdapter`, `UrlHashAdapter` (Base64url encode/decode)
- **ui/**: `SprintSetupForm`, `ProgressLogger`, `BurndownChart` (SVG), `App` shell

SVG chart uses pure JS date math for ideal-line interpolation. No runtime deps beyond `react` + `react-dom`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/` | New | Sprint + ProgressEntry entities |
| `src/application/` | New | `useBurndown` hook |
| `src/infrastructure/` | New | localStorage + URL hash adapters |
| `src/ui/` | New | Form, logger, SVG chart, App shell |
| `index.html` / `main.tsx` | Modified | Mount App, remove Vite defaults |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Base64 URL exceeds browser limit (~2 KB) | Low | v1 scope is one sprint; Gzip is upgrade path |
| Timezone bugs on date comparison | Med | Always use `YYYY-MM-DD` strings, never `Date` objects in domain |
| SVG layout breaks on small screens | Low | Use `viewBox` + `preserveAspectRatio` |
| Divide-by-zero on 1-day sprint | Med | Guard in ideal-line calculation |

## Rollback Plan

Pure frontend, no backend changes. Rollback = revert commits or delete `src/domain/`, `src/application/`, `src/infrastructure/`, `src/ui/`. localStorage key is namespaced (`burnup:sprint`) — clear via DevTools if needed.

## Dependencies

- React 19 + TypeScript + Vite (already scaffolded)
- No new runtime dependencies

## Success Criteria

- [ ] User can configure a sprint and see a burndown chart rendered as SVG
- [ ] Chart URL can be shared and loads the same state on reload
- [ ] State persists in localStorage across page refreshes
- [ ] Ideal line is correctly interpolated for sprints of any length ≥ 1 day
- [ ] No charting library in the bundle
