# Design: UI Improvements

## Technical Approach

Three isolated, pure-UI patches — no domain, no persistence, no new dependencies. Each targets a single file (or its colocated CSS). Changes are additive or minimal replacements inside existing class/component patterns.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| `field__preview` styling location | Extend existing rule in `BurndownPage.css` (line 622) | New token, global CSS | Rule already exists — only augment it. Keeps styling colocated with the page that owns the element. |
| Readonly field non-focusability | `tabIndex={-1}` on the `<div>` | `pointer-events: none` only | `tabIndex=-1` satisfies the spec scenario ("skipped when tabbing") without hiding the element from click. `user-select: none` added in CSS for visual reinforcement. |
| Day 1 implicit point | Computed constant inside `BurndownChart.tsx` before `actualPairs` is built | New use-case / domain function | Proposal explicitly says "pure rendering layer, zero domain changes." A two-line guard before `actualPairs` is the minimal, reversible touch. |
| Textarea class naming | `field__textarea` (new modifier, matches `NoteModal` pattern with `modal__textarea`) | Reuse `field__input` + CSS reset | `field__input` has focus styles not appropriate for a textarea; a dedicated modifier keeps specificity clean and mirrors existing NoteModal conventions. |

## Data Flow

### readonly-field-styling
No data flow change. `BurndownPage.tsx` already computes `computedEndDate` and renders it inside `.field__preview`. CSS-only patch.

### chart-day1-implicit-point

```
sprint.entries (sorted) ──→ guard check ──→ [implicit, ...actualPairs]
sprint.startDate ──────────────────────────────↗
sprint.totalPoints ────────────────────────────↗
                                          actualPoints polyline
```

Guard: `!sortedEntries.find(e => e.date === sprint.startDate)` AND `sprint.entries.length > 0`.  
When entries is empty, chart renders ideal line only (unchanged per spec scenario 3).

### note-textarea in DayForm
```
note state  ──→  <textarea> value / onChange   (identical to current input pattern)
note.length ──→  char counter label span       (unchanged)
maxLength   ──→  attribute on textarea          (unchanged)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/ui/pages/BurndownPage.css` | Modify | Add `cursor: default; user-select: none; border-color: transparent;` to `.field__preview` |
| `src/ui/pages/BurndownPage.tsx` | Modify | Add `tabIndex={-1}` to the `.field__preview` div (line ~450) |
| `src/ui/components/Chart/BurndownChart.tsx` | Modify | Prepend implicit Day 1 point to `actualPairs` before polyline is built (after line 59) |
| `src/ui/components/DayForm/DayForm.tsx` | Modify | Replace `<input type="text">` with `<textarea rows={3}>` at line 89; update className to `field__input field__textarea` |
| `src/ui/components/DayForm/DayForm.css` | Modify | Add `.field__textarea` rule with `resize: vertical; min-height: unset;` |

## Interfaces / Contracts

No new types, props, or domain interfaces. All changes are within existing component signatures.

**Implicit point shape** (rendering only — not persisted):
```ts
// Inside BurndownChart.tsx, before actualPairs polyline
const implicitDay1 =
  sortedEntries.length > 0 && !sortedEntries.find(e => e.date === sprint.startDate)
    ? [{ e: { date: sprint.startDate, remaining: sprint.totalPoints, note: undefined }, i: 0 }]
    : [];
const allActualPairs = [...implicitDay1, ...actualPairs];
```
`allActualPairs` replaces `actualPairs` in polyline, area fill, and dot rendering.

> Note: the implicit point must NOT render a dot (it's synthetic). Use `allActualPairs` only for polyline/area; keep `actualPairs` for dot + hover target rendering.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `BurndownChart` implicit point injection | Render with `entries=[]` → no actual line; entries without startDate → line starts at totalPoints; entry on startDate → no duplicate |
| Visual/manual | `.field__preview` cursor and tab skip | Tab through sprint form, verify preview is skipped |
| Visual/manual | `DayForm` textarea multiline, counter | Type with newlines, verify counter updates |

No E2E automation added (project has none currently).

## Migration / Rollout

No migration required. All changes are rendering-only. Rollback is a single revert commit.

## Open Questions

- None — design is fully resolved.
