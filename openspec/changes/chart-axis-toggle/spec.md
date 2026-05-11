# Spec: Chart Axis Toggle

## Capabilities

### 1. chart-axis-toggle (new)

**Summary**: UI toggle that lets users switch the burndown chart X axis between date mode (`5/8`) and day mode (`Day 1`, `Day 2`, …). State is local (not persisted).

**Scenarios**

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| CAT-01 | Default is date mode | Chart renders for the first time | — | X axis shows calendar labels (M/D format) |
| CAT-02 | Switch to day mode | User is in date mode | Clicks "Day" toggle button | X axis labels change to `Day 1`, `Day 2`, … |
| CAT-03 | Tooltip in day mode | axisMode is `day` | User hovers a data point | Tooltip date field shows `Day N` instead of M/D |
| CAT-04 | Toggle back to date | User is in day mode | Clicks "Date" toggle button | X axis restores calendar labels; tooltip shows M/D |

**Invariants**
- Toggle state resets to `date` on page refresh (no persistence)
- Toggle only affects label rendering — chart data, positions, and ideal line are unchanged

---

### 2. burndown-chart (delta)

**Summary**: X axis labels and tooltip date field now reflect the active `axisMode` prop (`'date' | 'day'`). No change to data shape, ideal line calculation, or any other chart behavior.

**Delta Scenarios**

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| BC-01 | Date mode labels (existing) | `axisMode='date'` | Chart renders | X axis labels show M/D (unchanged behavior) |
| BC-02 | Day mode labels | `axisMode='day'` | Chart renders | X axis labels show `Day N` (1-indexed calendar diff from startDate) |
| BC-03 | Tooltip in date mode (existing) | `axisMode='date'` | User hovers point | Tooltip shows M/D date label |
| BC-04 | Tooltip in day mode | `axisMode='day'` | User hovers point | Tooltip shows `Day N` label matching X axis |

**Constraints**
- `axisMode` prop is required — callers must pass it
- Day N = `differenceInCalendarDays(date, startDate) + 1` (no working-days logic)
- All other chart props (`sprint`, `idealLine`) are unchanged
