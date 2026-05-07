# Design: Burndown Dashboard

## Technical Approach

Greenfield implementation on top of the Vite scaffold. No external runtime deps beyond `react` + `react-dom`. All domain logic is pure TypeScript — no framework imports. `useBurndown` is the single orchestrator: it reads from URL hash first, then localStorage, then returns `null` (triggers setup form). State is persisted optimistically on every change.

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Pure SVG vs charting lib | +200 KB bundle / full control | **Pure SVG** — coordinates computed in hook |
| `Date` objects vs YYYY-MM-DD strings in domain | Timezone traps vs verbosity | **YYYY-MM-DD strings** — Date only at render boundary |
| Zod/Yup vs plain TS assertions | Runtime safety vs zero deps | **Plain TS** — schema validation is overkill for v1 |
| Gzip + Base64 vs plain Base64 | Shorter URLs vs complexity | **Plain Base64url** — CompressionStream is upgrade path |
| Multi-sprint vs single sprint | Flexibility vs scope | **Single sprint** — v1 constraint from proposal |

---

## Type Signatures

```ts
// domain/entities/Sprint.ts
export interface DayEntry {
  date: string;       // YYYY-MM-DD — no Date objects
  remaining: number;  // story points remaining after this day
  note?: string;
}

export interface Sprint {
  name: string;
  totalPoints: number;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  entries: DayEntry[];
}

// domain/usecases/calculateIdealLine.ts
export interface IdealPoint { date: string; value: number; }
export function calculateIdealLine(sprint: Sprint): IdealPoint[]

// domain/usecases/serializeState.ts
export function serialize(sprint: Sprint): string    // → Base64url
export function deserialize(raw: string): Sprint     // throws on invalid

// infrastructure/storage/localStorageAdapter.ts
export interface StorageAdapter {
  load(): Sprint | null;
  save(sprint: Sprint): void;
  clear(): void;
}

// infrastructure/url/urlStateAdapter.ts
export interface UrlAdapter {
  read(): Sprint | null;
  write(sprint: Sprint): void;
  clear(): void;
}

// application/useBurndown.ts
export interface BurndownState {
  sprint: Sprint | null;   // null = no sprint yet
  idealLine: IdealPoint[];
  isSharing: boolean;
  shareUrl: string;
}
export interface BurndownActions {
  setupSprint(sprint: Sprint): void;
  logDay(entry: DayEntry): void;       // upserts by date
  updateNote(date: string, note: string): void;
  share(): void;
  reset(): void;
}
export function useBurndown(): BurndownState & BurndownActions

// ui/components/Chart/BurndownChart.tsx
export interface BurndownChartProps {
  sprint: Sprint;
  idealLine: IdealPoint[];
  width?: number;
  height?: number;
}
```

---

## Key Algorithms

**Ideal line** — linear interpolation, pure date math:
```ts
// days = inclusive count of working calendar days from start to end
const totalDays = daysBetween(sprint.startDate, sprint.endDate); // ≥ 1
const step = sprint.totalPoints / totalDays;
// for each day i (0..totalDays): { date: nthDate(start, i), value: totalPoints - step * i }
// Guard: if totalDays === 0, return [{ date: start, value: totalPoints }]
```

**Base64url** — avoids `+` and `/` which break URL hash:
```ts
btoa(JSON.stringify(sprint))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
// decode: add padding back, swap chars, atob → JSON.parse
```

**SVG coordinate mapping**:
```
x = padding + (dayIndex / totalDays) * chartWidth
y = padding + ((totalPoints - value) / totalPoints) * chartHeight
```
(origin top-left, so higher remaining = lower y value — inverted)

---

## Data Flow

```
mount
  │
  ├─ urlAdapter.read() → Sprint?
  │     if null → localStorage.load() → Sprint?
  │           if null → sprint = null (render SprintSetupForm)
  │
user action: setupSprint / logDay / updateNote
  │
  ├─ update Sprint in state
  ├─ recalculate idealLine (pure)
  ├─ localStorage.save(sprint)
  └─ if shareUrl visible → urlAdapter.write(sprint)

share()
  ├─ urlAdapter.write(sprint)
  └─ isSharing = true  (renders ShareButton with URL)

reset()
  ├─ localStorage.clear()
  ├─ urlAdapter.clear()
  └─ sprint = null
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/Sprint.ts` | Create | `Sprint` + `DayEntry` interfaces |
| `src/domain/usecases/calculateIdealLine.ts` | Create | Pure ideal-line function |
| `src/domain/usecases/serializeState.ts` | Create | Base64url serialize/deserialize |
| `src/infrastructure/storage/localStorageAdapter.ts` | Create | localStorage read/write under key `burnup:sprint` |
| `src/infrastructure/url/urlStateAdapter.ts` | Create | URL hash read/write |
| `src/application/useBurndown.ts` | Create | Orchestrator hook |
| `src/ui/pages/BurndownPage.tsx` | Create | Root page, wires hook to components |
| `src/ui/components/Chart/BurndownChart.tsx` | Create | Pure SVG chart — no side effects |
| `src/ui/components/DayForm/DayForm.tsx` | Create | Log remaining points + note |
| `src/ui/components/NoteModal/NoteModal.tsx` | Create | Edit note for a past day |
| `src/ui/components/ShareButton/ShareButton.tsx` | Create | Copy shareable URL |
| `src/ui/design-system/tokens.css` | Create | CSS custom properties (colors, spacing) |
| `src/App.tsx` | Modify | Replace Vite default with `<BurndownPage />` |

---

## Testing Strategy

No test runner in this project (per project standards). Manual verification only.

---

## Migration / Rollout

No migration required. Greenfield. Rollback: delete `src/domain`, `src/infrastructure`, `src/application`, `src/ui` subdirectories and run `localStorage.removeItem('burnup:sprint')`.

---

## Open Questions

- [ ] Should `logDay` silently upsert on duplicate date or surface a warning to the user?
- [ ] Viewport: fixed SVG dimensions (e.g. 800×400) or responsive via `viewBox` + `width="100%"`?
