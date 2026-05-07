# Exploration: Burndown Chart Webapp

**Change**: `burndown-dashboard`
**Project**: `burnup-gentle-ai`
**Date**: 2026-05-07
**Status**: ✅ Ready for Proposal

---

## Current State

The project is a **clean Vite + React 19 + TypeScript scaffold** with zero domain code. Only the default `App.tsx`, `main.tsx`, and CSS resets exist. The architecture folder structure has been agreed but not created yet. `openspec/config.yaml` is in place with Hexagonal/Clean rules, no TDD.

No charting library, no state management library, no routing library is installed. Only `react` + `react-dom` as runtime deps.

---

## Affected Areas

All files are net-new (greenfield). The scaffold files that will be replaced or extended:

- `src/App.tsx` — will be replaced by routing shell to `BurndownPage`
- `src/index.css` — may be extended or replaced with design tokens
- `src/main.tsx` — stays, just mounts App

New structure to create:

```
src/
├── domain/
│   ├── entities/        Sprint.ts, DayEntry.ts
│   └── usecases/        calculateIdealLine.ts, serializeState.ts
├── infrastructure/
│   ├── storage/         localStorageAdapter.ts
│   └── url/             urlStateAdapter.ts
├── application/         useBurndown.ts
└── ui/
    ├── pages/           BurndownPage.tsx
    ├── components/
    │   ├── Chart/       BurndownChart.tsx
    │   ├── DayForm/     DayForm.tsx
    │   ├── NoteModal/   NoteModal.tsx
    │   └── ShareButton/ ShareButton.tsx
    └── design-system/   tokens.css
```

---

## Questions Investigated

### 1. UX Flow

**Recommended flow** (single-page, progressive disclosure):

```
[Empty state]
  └─> SprintSetupForm (name, dates, totalPoints)
        └─> [Sprint created — chart shows ideal line only]
              └─> DayForm (date, remainingPoints, optional note)
                    └─> [Chart updates with actual line]
                          └─> ShareButton → copies URL hash
```

- No routing needed. One page. State drives which panel is visible.
- Sprint setup is shown on first load (no sprint in localStorage/URL).
- Once a sprint exists, it stays visible at top (collapsed or small).
- DayForm is always accessible to add/edit entries.
- Chart is always visible once sprint is created (starts empty, updates live).

**Alternative**: Wizard/stepper flow.  
→ Rejected: over-engineered for a single-sprint tool. More friction, no benefit.

---

### 2. Ideal Line Calculation

**Formula**: Linear interpolation from `totalPoints` on `startDate` to `0` on `endDate`.

```typescript
// domain/usecases/calculateIdealLine.ts
function calculateIdealLine(sprint: Sprint): Array<{ date: string; points: number }> {
  const start = new Date(sprint.startDate)
  const end = new Date(sprint.endDate)
  const totalDays = differenceInDays(end, start) // inclusive
  const step = sprint.totalPoints / totalDays

  return eachDayOfInterval({ start, end }).map((date, i) => ({
    date: formatISO(date, { representation: 'date' }),
    points: Math.round(sprint.totalPoints - step * i),
  }))
}
```

No external date library needed — pure JS `Date` math is sufficient:
- `(end - start) / 86400000` → total days
- Iterate with `+= 86400000`

Edge cases:
- `startDate === endDate` → divide by zero → guard: return `[{ date, points: totalPoints }]`
- Single-day sprint is valid (demo/test sprint)

---

### 3. URL Serialization

**Approach**: `JSON → UTF-8 bytes → gzip (CompressionStream) → Base64 → URL hash`

```typescript
// infrastructure/url/urlStateAdapter.ts
async function serializeToHash(sprint: Sprint): Promise<string> {
  const json = JSON.stringify(sprint)
  const compressed = await compress(json)           // CompressionStream('gzip')
  const base64 = btoa(String.fromCharCode(...compressed))
  return '#' + base64
}

async function deserializeFromHash(hash: string): Promise<Sprint | null> {
  if (!hash) return null
  const base64 = hash.slice(1)
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const json = await decompress(bytes)              // DecompressionStream('gzip')
  return JSON.parse(json)
}
```

**Why gzip?**: A typical Sprint with 14 day entries is ~400 bytes JSON. After gzip+Base64 it's ~250–300 chars — safe for URL hash (no browser limit for `#` fragment). Without gzip it's ~530 chars Base64 — still fine, but gzip is "free" via Web Streams API (no dependency).

**Alternative**: Just Base64 without compression.  
→ Acceptable too. Sprint data is small. Could simplify the code significantly.  
→ **Decision for proposal**: Start with plain Base64. Add gzip only if URLs grow too long (multiple entries with long notes).

**Snapshot semantics**: Each `ShareButton` click re-serializes the current state and replaces `window.location.hash`. It's a snapshot, not a live subscription.

---

### 4. LocalStorage Persistence

```typescript
// infrastructure/storage/localStorageAdapter.ts
const STORAGE_KEY = 'burnup:sprint'

function saveSprint(sprint: Sprint): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sprint))
}

function loadSprint(): Sprint | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}
```

Auto-save trigger: inside `useBurndown.ts`, every state mutation calls `saveSprint`.

**Load priority** (on app start):
1. If URL hash is present → deserialize from hash (shared link scenario)
2. Else → load from localStorage
3. Else → null (show SprintSetupForm)

---

### 5. Chart Design

**Approach**: Pure SVG, no charting library.

Why no library:
- Recharts / Chart.js add 50–200 KB to bundle for what is essentially two polylines
- The domain is controlled — we know exactly what to render
- Clean Architecture: a chart library would couple the UI deeply to third-party shape

**SVG structure**:

```
<svg viewBox="0 0 800 400">
  <g class="grid">       <!-- horizontal gridlines -->
  <g class="axes">       <!-- x-axis (dates) + y-axis (points) -->
  <polyline class="ideal-line" .../>
  <polyline class="actual-line" .../>
  <g class="dots">       <!-- one circle per DayEntry, tooltip on hover -->
</svg>
```

- X axis: dates from startDate to endDate
- Y axis: 0 to totalPoints
- Ideal line: calculated, rendered in muted color
- Actual line: from DayEntry[], rendered in accent color
- Hover tooltip: shows date + remainingPoints + optional note
- Responsive: `viewBox` + `width="100%"` — scales to container

**Tooltip on hover**: Use SVG `<title>` for simplest implementation; upgrade to a positioned HTML tooltip (`position: absolute`) if richer formatting is needed.

---

### 6. Single vs Multiple Sprints

**Decision: Single active sprint.**

Rationale:
- The "share by URL" feature is per-sprint. Multi-sprint needs routing or tabs.
- Consulting teams typically work one sprint at a time per board.
- localStorage can hold one sprint cleanly. Multi-sprint would need indexed storage.
- Scope: keep it focused for v1.

Extension path: add a `sprints: Sprint[]` wrapper in localStorage if multi-sprint is needed later. The domain entities are already ID-keyed, so migration would be mechanical.

---

### 7. Edge Cases

| Case | Behavior |
|------|----------|
| Sprint not started (today < startDate) | Chart shows only ideal line, DayForm disabled with message |
| No entries yet | Chart shows ideal line only, actual line absent |
| Entry date < startDate | Validation error in DayForm, reject |
| Entry date > endDate | Validation error in DayForm, reject |
| Duplicate entry for same date | DayForm upserts (replaces existing entry for that date) |
| totalPoints = 0 | Validation error in SprintSetupForm |
| startDate = endDate | Valid (1-day sprint), ideal line is a single point |
| URL hash is malformed | Catch parse error → fall back to localStorage |
| localStorage unavailable | Catch SecurityError → app works in-memory only, warn user |

---

## Approaches for URL Serialization (detailed comparison)

| Approach | Bundle impact | URL length (14 entries) | Complexity |
|----------|--------------|-------------------------|------------|
| Plain Base64 (JSON) | 0 | ~530 chars | Low |
| gzip + Base64 (Web Streams) | 0 | ~300 chars | Medium |
| LZ-string library | ~3 KB | ~380 chars | Low |
| MessagePack + Base64 | ~6 KB | ~400 chars | Medium |

**Recommendation**: Plain Base64 for v1. Web Streams gzip if needed.

---

## Recommendation

**Greenfield, well-scoped, low risk.** The feature set is clear and fits the agreed architecture cleanly.

Key decisions locked:
1. **Single active sprint** — simplest, correct for the use case
2. **Pure SVG chart** — no charting library dependency
3. **Plain Base64 serialization** — simplest URL sharing, upgrade path is clear
4. **Auto-save to localStorage on every mutation** — handled inside `useBurndown` hook
5. **URL hash load priority > localStorage** — enables share-link scenario correctly

The `useBurndown` hook is the application layer coordinator: it owns state, triggers persistence, and exposes intent-based methods to the UI (`createSprint`, `addEntry`, `getShareUrl`).

---

## Risks

- **CompressionStream browser support**: Available in all modern browsers (Chrome 80+, Firefox 113+, Safari 16.4+). If IE11 support is needed (it won't be), use LZ-string instead. Non-issue for this project.
- **SVG tooltip accessibility**: `<title>` tooltips are not keyboard-accessible. If accessibility is required, implement ARIA live regions or a focus-managed tooltip.
- **Base64 URL encoding**: `btoa()` output may contain `+` and `/` which are valid in URL hash but could confuse some URL parsers. Use `base64url` variant (replace `+`→`-`, `/`→`_`) to be safe.
- **localStorage quota**: Typical limit is 5–10 MB. A sprint with 100 entries and long notes is < 10 KB. No risk in practice.
- **Date timezone handling**: `new Date('2026-01-01')` parses as UTC midnight, which can shift to previous day in negative-offset timezones. Always use ISO date strings (`YYYY-MM-DD`) and parse manually to avoid this.

---

## Ready for Proposal

**Yes.** All architectural questions are resolved. The proposal phase can proceed with:
- Scope: SprintSetupForm + BurndownChart + DayForm + ShareButton + localStorage + URL hash
- Architecture: as agreed (Hexagonal, domain-first)
- No external dependencies required (pure React + native Web APIs)
