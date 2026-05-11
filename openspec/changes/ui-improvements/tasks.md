# Tasks: UI Improvements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 40–70 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | N/A |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All three UI patches | PR 1 | Independent fixes; reviewable as one small unit |

---

## Phase 1: Readonly Field Styling

- [ ] 1.1 `BurndownPage.css` — add `cursor: default; user-select: none; border-color: transparent;` to `.field__preview` rule (line ~622)
- [ ] 1.2 `BurndownPage.tsx` — add `tabIndex={-1}` to the `.field__preview` div (line ~450)

## Phase 2: Chart Day 1 Implicit Point

- [ ] 2.1 `BurndownChart.tsx` — after existing `sortedEntries` / `actualPairs` build, inject implicit Day 1 guard: `implicitDay1` constant using `sortedEntries.length > 0 && !sortedEntries.find(e => e.date === sprint.startDate)`
- [ ] 2.2 `BurndownChart.tsx` — replace `actualPairs` with `allActualPairs` in polyline / area fill only; keep `actualPairs` for dot + hover rendering

## Phase 3: Note Textarea in DayForm

- [ ] 3.1 `DayForm.tsx` — replace `<input type="text">` with `<textarea rows={3}>` at note field (line ~89); update `className` to `field__input field__textarea`
- [ ] 3.2 `DayForm.css` — add `.field__textarea { resize: vertical; min-height: unset; }` rule

## Phase 4: Testing & Verification

- [ ] 4.1 Unit — render `BurndownChart` with `entries=[]` → verify no actual line rendered (spec scenario 3)
- [ ] 4.2 Unit — render `BurndownChart` with entries where none match `startDate` → verify actual line starts at `{ date: startDate, remaining: totalPoints }` (spec scenario 1)
- [ ] 4.3 Unit — render `BurndownChart` with an entry matching `startDate` → verify no duplicate implicit point (spec scenario 2)
- [ ] 4.4 Manual — tab through sprint form; verify `.field__preview` is skipped (spec: readonly not focusable)
- [ ] 4.5 Manual — open `DayForm`, type multiline note; verify textarea expands and counter updates (spec: textarea scenarios)
- [ ] 4.6 Manual — open `DayForm` for existing entry; verify textarea is pre-filled with saved note
