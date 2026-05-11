# Tasks: Chart Axis Toggle

**Change**: chart-axis-toggle
**Delivery strategy**: single-pr
**Review Workload Forecast**: ~30 changed lines — well within 400-line budget. No chaining needed.

---

## Phase 1: BurndownChart component

- [x] 1.1 Add `axisMode: 'date' | 'day'` to `BurndownChartProps` interface in `src/ui/components/Chart/BurndownChart.tsx`
- [x] 1.2 Add pure `dateToDay(date, startDate)` helper function (module scope, same file) in `src/ui/components/Chart/BurndownChart.tsx`
- [x] 1.3 Update X axis label render: replace `dateToLabel(p.date)` with conditional on `axisMode` in `src/ui/components/Chart/BurndownChart.tsx`
- [x] 1.4 Update tooltip date display: replace raw `tooltip.date` with conditional label based on `axisMode` in `src/ui/components/Chart/BurndownChart.tsx`

## Phase 2: BurndownPage wiring

- [x] 2.1 Add `axisMode` state (`useState<'date' | 'day'>('date')`) in `src/ui/pages/BurndownPage.tsx`
- [x] 2.2 Render mode-toggle buttons (Date / Day) near the chart legend using `.mode-toggle` / `.mode-toggle__btn` / `.mode-toggle__btn--active` classes in `src/ui/pages/BurndownPage.tsx`
- [x] 2.3 Pass `axisMode={axisMode}` prop to `<BurndownChart>` in `src/ui/pages/BurndownPage.tsx`
