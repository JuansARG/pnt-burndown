# Design: Working Days Sprint Duration

## Technical Approach

Additive extension: new pure utility module (`workingDays.ts`) + branch inside `calculateIdealLine` + optional fields on `Sprint` entity + UI mode toggle in `SprintSetupForm`. Zero breaking changes — all new fields are optional, serialization is forward-compatible (JSON.stringify includes optional fields only when defined).

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `workingDays.ts` vs inline in `calculateIdealLine` | Separate file = testable, reusable; inline = fewer files | **New file** — functions are pure domain logic, referenced by both `calculateIdealLine` and form UX |
| Branch in `calculateIdealLine` vs new function | New function = cleaner API; branch = single entry point, no caller changes | **Branch** — callers (`useBurndown`) don't change, backward compat trivial |
| Date-picker lib for holidays vs plain text input | Library = UX polish; text input = zero deps, ISO string already the domain format | **Plain text input** — no new npm deps, ISO strings match existing domain convention |
| Derive `endDate` in form vs store working-days count in Sprint | Derived = endDate stays authoritative; stored count = redundant data | **Derive on form** — `endDate` is the canonical field, `workingDays` is input-only UX |

## Data Flow

```
SprintSetupForm (mode: 'dates' | 'duration')
  │
  ├─ mode='dates'  → user picks startDate + endDate directly (existing flow)
  │
  └─ mode='duration' → user picks startDate + workingDays (number) + holidays (string[])
                        │
                        └─ getWorkingDayEndDate(startDate, workingDays, holidays)
                              → derived endDate (read-only preview)
                              
onSetup({ ..., holidays, useWorkingDays: true })
  │
  └─ useBurndown → Sprint entity stored in localStorage
                    │
                    └─ calculateIdealLine(sprint)
                          │
                          ├─ sprint.useWorkingDays = false/undefined → existing linear logic
                          └─ sprint.useWorkingDays = true
                                │
                                └─ getWorkingDays(startDate, endDate, holidays)
                                     → array of working day strings
                                     → map index to point value
                                     → return IdealPoint[]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/Sprint.ts` | Modify | Add `holidays?: string[]` and `useWorkingDays?: boolean` |
| `src/domain/usecases/workingDays.ts` | **Create** | Pure functions: `isWorkingDay`, `getWorkingDays`, `getWorkingDayEndDate` |
| `src/domain/usecases/calculateIdealLine.ts` | Modify | Add `useWorkingDays` branch; reuse helpers from `workingDays.ts` |
| `src/ui/pages/BurndownPage.tsx` | Modify | `SprintSetupForm`: add mode toggle, workingDays input, holidays list UI |
| `src/domain/usecases/serializeState.ts` | No change | Additive fields serialize automatically via `JSON.stringify` |

## Interfaces / Contracts

```typescript
// src/domain/entities/Sprint.ts — additions only
export interface Sprint {
  name: string;
  totalPoints: number;
  startDate: string;
  endDate: string;
  entries: DayEntry[];
  holidays?: string[];       // ISO dates to exclude (weekends auto-excluded)
  useWorkingDays?: boolean;  // if true, ideal line skips non-working days
}

// src/domain/usecases/workingDays.ts
/** Returns true if date is Mon–Fri and not in holidays list */
export function isWorkingDay(date: string, holidays?: string[]): boolean;

/** Returns ordered array of working-day ISO strings in [startDate, endDate] inclusive */
export function getWorkingDays(startDate: string, endDate: string, holidays?: string[]): string[];

/** Returns the ISO endDate that yields exactly `count` working days from startDate */
export function getWorkingDayEndDate(startDate: string, count: number, holidays?: string[]): string;
```

### `calculateIdealLine` branch logic

```
if sprint.useWorkingDays:
  days = getWorkingDays(startDate, endDate, sprint.holidays)
  if days.length === 0: fallback to calendar linear (guard)
  step = totalPoints / (days.length - 1)  // -1: first day = full, last = 0
  return days.map((date, i) => ({ date, value: max(0, round(totalPoints - step*i, 1)) }))
else:
  // existing logic unchanged
```

### `SprintSetupForm` state additions

```typescript
const [mode, setMode] = useState<'dates' | 'duration'>(
  initial?.useWorkingDays ? 'duration' : 'dates'
);
const [workingDays, setWorkingDays] = useState(10);
const [holidays, setHolidays] = useState<string[]>(initial?.holidays ?? []);
// holidayInput: controlled text field for adding one holiday at a time

// Derived (duration mode only):
const derivedEndDate = getWorkingDayEndDate(startDate, workingDays, holidays);

// On submit (duration mode):
onSetup({ name, startDate, endDate: derivedEndDate, totalPoints, entries: [],
          holidays, useWorkingDays: true });
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `isWorkingDay`, `getWorkingDays`, `getWorkingDayEndDate` | Pure functions — input/output, boundary cases (0 days, holiday on start/end, all-holidays week) |
| Unit | `calculateIdealLine` with `useWorkingDays=true` | Verify point distribution, fallback on 0 working days |
| Unit | `serializeState` round-trip with new fields | Existing test extended |
| Integration | `SprintSetupForm` duration mode | Form submit with `useWorkingDays=true`, correct `endDate` computed |

## Migration / Rollout

No migration required. `holidays` and `useWorkingDays` are optional — existing sprints in localStorage and shared URLs deserialize as-is (`undefined` fields → `useWorkingDays=false` branch in `calculateIdealLine`).

## Open Questions

- None
