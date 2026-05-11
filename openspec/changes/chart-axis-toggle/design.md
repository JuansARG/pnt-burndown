# Design: Chart Axis Toggle

## Technical Approach

Add `axisMode: 'date' | 'day'` prop to `BurndownChart`. Extract a pure `dateToDay()` helper in the chart component file (no domain layer needed — it's display logic). Toggle lives in `BurndownPage` as `useState`, rendered using existing `.mode-toggle` CSS classes. Pass `axisMode` down to the chart.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Where to keep toggle state | `BurndownPage` (`useState`) | Inside `BurndownChart` | Chart stays presentational; page owns layout/config state — matches existing pattern |
| Where to put `dateToDay` | Same file as `BurndownChart` (module-level pure fn) | `src/domain/usecases/` | It's a display formatter, not domain logic; co-locating with `dateToLabel` keeps the pattern symmetric |
| `axisMode` prop required vs optional | Required (`axisMode: 'date' \| 'day'`) | Optional with default | Explicit contract — caller always decides. No hidden defaults that drift. |
| Label derivation in tooltip | Compute label inline using same helper | Store derived label in TooltipData | `TooltipData` already stores raw `date` string; derive display label at render time — no data duplication |

## Data Flow

```
BurndownPage
  useState axisMode ('date'|'day')
  │
  ├─ mode-toggle buttons ──onClik──► setAxisMode('date'|'day')
  │
  └─ <BurndownChart axisMode={axisMode} sprint={sprint} idealLine={idealLine} />
        │
        ├─ xLabels.map ──► dateToDay(p.date, sprint.startDate)  [if day]
        │                   dateToLabel(p.date)                  [if date]
        │
        └─ tooltip render ──► same switch on axisMode
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/ui/components/Chart/BurndownChart.tsx` | Modify | Add `axisMode` to props; add `dateToDay()` helper; update X label render and tooltip label |
| `src/ui/pages/BurndownPage.tsx` | Modify | Add `axisMode` state; render mode-toggle; pass `axisMode` to `<BurndownChart>` |

## Interfaces / Contracts

```ts
// BurndownChart.tsx — updated props
export interface BurndownChartProps {
  sprint: Sprint;
  idealLine: IdealPoint[];
  axisMode: 'date' | 'day';          // NEW — required
}

// New pure helper (module scope, same file)
function dateToDay(date: string, startDate: string): string {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [dy, dm, dd] = date.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const current = Date.UTC(dy, dm - 1, dd);
  const n = Math.round((current - start) / 86_400_000) + 1;
  return `Day ${n}`;
}
```

Tooltip label — derived at render (no `TooltipData` shape change):
```ts
const tooltipLabel =
  axisMode === 'day'
    ? dateToDay(tooltip.date, sprint.startDate)
    : dateToLabel(tooltip.date);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `dateToDay` edge cases: startDate itself → `Day 1`; last sprint day; negative diff (guard) | Pure fn — plain Jest, no React |
| Component | X axis renders `Day N` when `axisMode='day'`; reverts on `'date'` | RTL + SVG text query |
| Component | Tooltip label matches axisMode | RTL hover simulation |
| Integration | Toggle in `BurndownPage` updates chart labels | RTL render page, click toggle, assert label change |

## Migration / Rollout

No migration required. `axisMode` is a new required prop — the single call site (`BurndownPage`) is updated in the same PR. No persistence, no URL shape, no domain entity change.

## Open Questions

- None.
