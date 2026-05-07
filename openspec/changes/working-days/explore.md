# Exploration: Working Days Sprint Duration

**Date**: 2026-05-07  
**Change**: working-days  
**Feature**: Define sprint duration in working days, handle public holidays, adjust ideal line to working-days only

---

## Current State

### `Sprint` entity (`src/domain/entities/Sprint.ts`)
- Simple flat interface: `name`, `totalPoints`, `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD), `entries[]`
- **No concept of working days, holidays, or duration-in-days**
- Dates are always YYYY-MM-DD strings — no Date objects in domain (good constraint)

### `calculateIdealLine` (`src/domain/usecases/calculateIdealLine.ts`)
- Pure function: takes a `Sprint`, returns `IdealPoint[]`
- Generates a point for **every calendar day** from `startDate` to `endDate` (inclusive)
- Linear interpolation: `step = totalPoints / totalDays` (calendar days)
- **No awareness of weekends or holidays** — ideal line drops on Sat/Sun too
- The `totalDays` divisor is `(endMs - startMs) / 86400000` — calendar math only

### `SprintSetupForm` (`src/ui/pages/BurndownPage.tsx`)
- Two date pickers: `startDate` + `endDate`
- Validates `startDate < endDate`
- Default `endDate = today + 13 days`
- **No working-days mode** — only calendar date range

### `useBurndown` application hook (`src/application/useBurndown.ts`)
- Calls `calculateIdealLine(sprint)` on mount and on every `persistAndUpdate`
- Sprint is stored as-is via `localStorageAdapter` (JSON) and `urlStateAdapter` (Base64url JSON)

### Serialization (`src/domain/usecases/serializeState.ts`)
- `serialize/deserialize` does `JSON.stringify/parse` of the full `Sprint` object
- Structural validation in `deserialize` checks exactly 5 fields: `name`, `totalPoints`, `startDate`, `endDate`, `entries`
- **Any new optional field on `Sprint` will round-trip fine** (JSON is additive)
- But old shared URLs won't have the new fields — backward compat needed

---

## Affected Areas

| File | Why affected |
|------|-------------|
| `src/domain/entities/Sprint.ts` | Add `holidays?: string[]` and optionally `workingDaysMode?: boolean` |
| `src/domain/usecases/calculateIdealLine.ts` | Must skip non-working days when computing ideal line |
| `src/domain/usecases/workingDays.ts` (**new**) | Pure utility: enumerate working days between two dates given a holiday list |
| `src/ui/pages/BurndownPage.tsx` — `SprintSetupForm` | Add holiday input and optional working-days mode toggle |
| `src/ui/components/DayForm/DayForm.tsx` | May want to warn if user logs on a non-working day (low priority) |
| `src/domain/usecases/serializeState.ts` | `deserialize` validation must tolerate new optional fields (already additive) |
| `src/application/useBurndown.ts` | No change needed — it just calls `calculateIdealLine` |

---

## Key Questions Answered

### 1. Changes to `Sprint` entity for holidays

Minimal, additive change:

```ts
export interface Sprint {
  name: string;
  totalPoints: number;
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  entries: DayEntry[];
  holidays?: string[];  // NEW: YYYY-MM-DD list of public holidays to skip
}
```

`holidays` is optional → fully backward compatible.  
No `workingDaysMode` flag needed — if `holidays` is present (even `[]`), the ideal line uses working-days logic. OR we can use an explicit `useWorkingDays?: boolean` flag for clarity.

**Recommendation**: add both `holidays?: string[]` and `useWorkingDays?: boolean`. The flag makes intent explicit; the holidays list is the data.

### 2. `calculateIdealLine` changes

Current: iterates every `i` from 0 to `totalDays`, one point per calendar day.

New approach:
1. Build the list of **working days** between `startDate` and `endDate` using a new `getWorkingDays(start, end, holidays)` utility
2. `totalWorkingDays = workingDays.length - 1` (fencepost: start day counts as day 0)
3. `step = totalPoints / totalWorkingDays`
4. Emit one `IdealPoint` per working day (skip weekends + holidays)

The function signature stays the same — `calculateIdealLine(sprint): IdealPoint[]` — so the hook and chart need zero changes.

**Guard**: if `sprint.useWorkingDays` is falsy, fall back to current calendar-day logic (backward compat).

### 3. `SprintSetupForm` minimal change for working-days mode

Two additions:
1. A **checkbox/toggle** `"Use working days only"` that sets `useWorkingDays: true`
2. A **holiday input** — freeform list of dates (e.g. comma-separated or a date picker multi-select)

The simplest UX: a `<textarea>` for holiday dates, one per line, YYYY-MM-DD format. Parse on submit.

No change to the date pickers — user still picks `startDate` + `endDate` as calendar dates. The working-days calculation happens inside the domain.

**Alternative UX**: instead of `endDate`, let the user input `durationInWorkingDays: number` and compute `endDate` from it. This is more intuitive but requires a `computeEndDate(start, workingDays, holidays)` utility and changes the form's validation flow significantly. **Higher risk, higher effort.**

### 4. Risky cascading changes

| Risk | Severity | Notes |
|------|----------|-------|
| **Share URL backward compat** | Medium | Old URLs won't have `holidays`/`useWorkingDays` → `deserialize` treats them as `undefined` → falls back to calendar mode. OK as long as `useWorkingDays` defaults to `false`. |
| **`deserialize` validation** | Low | Current validation only checks 5 required fields. New fields are optional → no change needed. |
| **Ideal line chart rendering** | Low | `BurndownChart` receives `IdealPoint[]` — same type, different values. No chart changes needed. |
| **DayForm validation** | Low | Currently only checks date is within `[startDate, endDate]`. Could optionally warn on non-working days, but not required for MVP. |
| **LocalStorage migration** | Low | Old sprint data loads fine — new fields default to `undefined` (falsy). |
| **Holiday list UX complexity** | High | If we expose a per-sprint holiday list, UX can get messy. Consider a single country-level preset instead. |

### 5. Right place for working-day logic

**`src/domain/usecases/workingDays.ts`** — a pure domain utility, no framework imports.

Exports:
```ts
// Returns all working day strings (YYYY-MM-DD) between start and end (inclusive)
export function getWorkingDays(start: string, end: string, holidays?: string[]): string[]

// Returns whether a given date is a working day
export function isWorkingDay(date: string, holidays?: string[]): boolean
```

`calculateIdealLine` imports and uses these. Nothing else in the call chain needs to change.

---

## Approaches

### Approach A — Additive: `holidays[]` + `useWorkingDays` flag on Sprint (Recommended)
- Keep `startDate`/`endDate` as calendar dates  
- Add optional `holidays?: string[]` and `useWorkingDays?: boolean`  
- New `workingDays.ts` domain utility  
- `calculateIdealLine` branches on the flag  
- **Pros**: backward compat, minimal surface area, no form redesign, pure domain logic  
- **Cons**: holiday list per sprint is verbose for recurring holidays  
- **Effort**: Low–Medium

### Approach B — Duration-first: replace `endDate` with `durationWorkingDays`
- User inputs start date + duration in working days; `endDate` is derived  
- **Pros**: directly maps to how teams think ("10-working-day sprint")  
- **Cons**: breaking change to `Sprint` entity, share URL format changes, form needs rewrite, can't mix modes easily  
- **Effort**: High

### Approach C — Hybrid: keep both `endDate` AND `durationWorkingDays` (computed display)
- Always store `startDate`/`endDate`; show derived working-day count as read-only info  
- User can optionally input duration to auto-compute `endDate`  
- **Pros**: flexible, non-breaking  
- **Cons**: two sources of truth risk, UX clarity issues  
- **Effort**: Medium

---

## Recommendation

**Approach A** — additive changes only.

1. Extend `Sprint` with `holidays?: string[]` + `useWorkingDays?: boolean`
2. Create `src/domain/usecases/workingDays.ts` with `getWorkingDays` + `isWorkingDay`
3. Update `calculateIdealLine` to branch on `sprint.useWorkingDays`
4. Add minimal form fields to `SprintSetupForm` (toggle + textarea for holidays)
5. No changes needed to: `useBurndown`, `DayForm`, `BurndownChart`, serialization adapters

---

## Risks Summary

- **Holiday list UX**: verbose per-sprint. Consider a "common holidays" preset or a country selector in a future phase.
- **Share URL**: old URLs work fine (fields default to falsy). New URLs are longer if holidays list is large.
- **Working-day count edge case**: if `startDate` itself is a holiday, it must still be day-0 of the sprint (no burndown point for it, or point exists but ideal doesn't drop). Needs a clear spec decision.
- **Friday start + holidays**: if sprint starts Friday and next Monday is a holiday, ideal line must stay flat Sat-Sun-Mon and drop on Tuesday. The `getWorkingDays` utility must handle this correctly.

---

## Ready for Proposal

**Yes** — Approach A is well-scoped, low-risk, and backward compatible. Ready to move to proposal → spec → design → tasks → apply.
