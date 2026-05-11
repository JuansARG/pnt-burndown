# Proposal: Chart Axis Toggle

## Intent

Users reading the burndown chart in date-dense sprints lose track of "which sprint day am I on". A toggle lets them switch the X axis from calendar dates (`5/8`) to sprint day numbers (`Day 1`, `Day 2`, …), making sprint progress easier to reason about without changing any persisted state.

## Scope

### In Scope
- Toggle UI control on the chart (local React state, not persisted)
- X axis labels switch between date mode and day mode
- Tooltip content updates to show day number when in day mode
- Day number = calendar days from `startDate` (Day 1 = startDate, no working-days logic)

### Out of Scope
- Persisting the toggle preference (URL, localStorage, sprint entity)
- Working-days or holiday exclusions
- Any changes to domain entities or serialization

## Capabilities

### New Capabilities
- `chart-axis-toggle`: UI toggle on the burndown chart to switch X axis label mode between `date` and `day`

### Modified Capabilities
- `burndown-chart`: X axis label rendering and tooltip content now vary based on the selected axis mode

## Approach

Add a `axisMode: 'date' | 'day'` local state to the chart React component (or its container). Extract a pure helper `dateToDay(date, startDate): number` in the domain layer (no React import). Pass `axisMode` down to the SVG rendering logic; replace `format(date)` with `Day N` when mode is `day`. Update tooltip to match. Toggle is a single `<button>` or `<select>` rendered above the chart.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/ui/components/BurndownChart` (or equivalent) | Modified | Add toggle state, pass axisMode to label/tooltip render |
| `src/domain/` (chart helpers) | New | `dateToDay()` pure function — no React |
| `openspec/specs/burndown-chart/` | New delta spec | X axis label scenarios for both modes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SVG label overlap in long sprints on day mode | Low | Labels already overlap risk exists; no new cause introduced |
| Tooltip content coupling — tooltip reads label format directly | Low | Pass derived label string explicitly rather than re-deriving in tooltip |

## Rollback Plan

Remove the toggle state and restore the unconditional date-label path. No domain entities, persistence, or URL shape change — revert is a UI-only change.

## Dependencies

- None. Chart already knows `startDate` from sprint props.

## Success Criteria

- [ ] Toggle renders on the chart view with two modes: Date / Day
- [ ] Switching to Day mode replaces all X axis labels with `Day N` format
- [ ] Tooltip shows `Day N` when axis is in day mode
- [ ] Switching back to Date mode restores calendar date labels
- [ ] `dateToDay()` has no React import and is unit-testable in isolation
- [ ] Toggle state is NOT persisted (refreshing the page resets to date mode)
