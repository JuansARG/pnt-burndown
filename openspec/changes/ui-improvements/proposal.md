# Proposal: UI Improvements

## Intent

Three user-facing pain points degrade usability: readonly fields are visually indistinguishable from editable ones, the burndown chart misses Day 1 context because no entry is ever logged on `startDate`, and note input in `DayForm` forces horizontal scrolling. All three are isolated UI fixes with no domain-layer changes.

## Scope

### In Scope
- Visual distinction for readonly `Ends on (calculated)` preview field
- Inject implicit Day 1 chart point `{ date: startDate, remaining: totalPoints }` in rendering only
- Migrate `DayForm` note field from `<input type="text">` to `<textarea>`, matching `NoteModal` pattern

### Out of Scope
- Domain entity changes (no changes to `Sprint`, `ProgressEntry`, or persistence logic)
- Note length validation changes (280-char rule unchanged)
- Chart axis or scale refactoring beyond the implicit point injection

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `burndown-chart`: Actual line now starts from an implicit Day 1 point when no entry exists for `startDate`
- `progress-tracking`: Note input UX changes from single-line to multi-line textarea in `DayForm`

## Approach

Pure UI layer changes. No new dependencies.

1. **Readonly styling** — add a CSS rule or utility class (e.g. `.field__preview`) with `background: var(--muted)`, `border: none`, `cursor: default`, `user-select: none`. No JS changes.
2. **Implicit Day 1 point** — in the chart rendering function, prepend `{ date: startDate, remaining: totalPoints }` to the `actualPoints` array IFF no entry exists for `startDate`. Guard: only when `entries.length > 0` or chart is active.
3. **Textarea migration** — replace `<input type="text">` in `DayForm.tsx` with `<textarea>`. Unify `rows`, `maxLength`, and `onChange` to match `NoteModal.tsx` pattern.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/SprintForm.tsx` or shared CSS | Modified | Readonly field visual styling |
| `src/components/BurndownChart.tsx` (or chart util) | Modified | Implicit Day 1 point injection |
| `src/components/DayForm.tsx` | Modified | Note field → textarea |
| `src/styles/` or CSS modules | Modified | `.field__preview` muted style |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Implicit point duplicates if user logs entry for `startDate` | Low | Guard with `!entries.find(e => e.date === startDate)` |
| Textarea height causes layout shift in `DayForm` | Low | Set explicit `rows={3}` and `resize: vertical` |

## Rollback Plan

All changes are isolated to UI components and CSS. Revert is a single commit. No migrations, no data shape changes, no API contracts touched.

## Dependencies

None.

## Success Criteria

- [ ] `Ends on (calculated)` field is visually distinct from editable inputs (muted background, no border, default cursor)
- [ ] Burndown chart actual line starts from Day 1 (`totalPoints`) when no entry exists for `startDate`
- [ ] `DayForm` note field renders as `<textarea>`, matching `NoteModal` UX
- [ ] No regressions in chart rendering when an entry for `startDate` already exists
