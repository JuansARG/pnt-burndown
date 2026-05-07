import { useState } from 'react';
import type { Sprint } from '../../../domain/entities/Sprint';
import type { IdealPoint } from '../../../domain/usecases/calculateIdealLine';
import './BurndownChart.css';

export interface BurndownChartProps {
  sprint: Sprint;
  idealLine: IdealPoint[];
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  value: number;
  note?: string;
  type: 'actual' | 'ideal';
}

const W = 800;
const H = 400;
const PAD = { top: 24, right: 24, bottom: 52, left: 56 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function dateToLabel(date: string): string {
  const [, m, d] = date.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

export function BurndownChart({ sprint, idealLine }: BurndownChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const totalDays = idealLine.length > 1 ? idealLine.length - 1 : 1;
  const totalPoints = sprint.totalPoints;

  // Map date → x index in idealLine
  const dateIndexMap = new Map(idealLine.map((p, i) => [p.date, i]));

  function xCoord(dayIndex: number): number {
    return PAD.left + (dayIndex / totalDays) * CHART_W;
  }

  function yCoord(value: number): number {
    return PAD.top + ((totalPoints - value) / totalPoints) * CHART_H;
  }

  // Build ideal polyline points
  const idealPoints = idealLine.map((p, i) => `${xCoord(i)},${yCoord(p.value)}`).join(' ');

  // Build actual polyline points (sorted by date, only entries with known index)
  const sortedEntries = [...sprint.entries].sort((a, b) => a.date.localeCompare(b.date));
  const actualPairs = sortedEntries
    .map(e => {
      const i = dateIndexMap.get(e.date);
      if (i === undefined) return null;
      return { e, i };
    })
    .filter(Boolean) as Array<{ e: (typeof sortedEntries)[0]; i: number }>;

  const actualPoints = actualPairs.map(({ e, i }) => `${xCoord(i)},${yCoord(e.remaining)}`).join(' ');

  // Grid lines — horizontal, every 25% of totalPoints
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * totalPoints));

  // X axis labels — show first, last, and every ~4 days
  const xLabels = idealLine.filter((_, i) => {
    if (totalDays <= 10) return true;
    return i === 0 || i === totalDays || i % Math.max(1, Math.floor(totalDays / 7)) === 0;
  });

  return (
    <div className="burndown-chart-wrap">
      <svg
        className="burndown-chart"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        aria-label={`Burndown chart for ${sprint.name}`}
        role="img"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        <g className="chart-grid">
          {gridValues.map(v => (
            <line
              key={v}
              x1={PAD.left}
              x2={PAD.left + CHART_W}
              y1={yCoord(v)}
              y2={yCoord(v)}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Y axis labels */}
        <g className="chart-y-labels" fontFamily="var(--font-mono)" fontSize="11" fill="var(--chart-axis-text)">
          {gridValues.map(v => (
            <text key={v} x={PAD.left - 8} y={yCoord(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
        </g>

        {/* X axis labels */}
        <g className="chart-x-labels" fontFamily="var(--font-mono)" fontSize="10" fill="var(--chart-axis-text)">
          {xLabels.map((p, i) => {
            const idx = idealLine.indexOf(p);
            return (
              <text
                key={i}
                x={xCoord(idx)}
                y={PAD.top + CHART_H + 20}
                textAnchor="middle"
              >
                {dateToLabel(p.date)}
              </text>
            );
          })}
        </g>

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + CHART_H} stroke="var(--color-border)" strokeWidth="1" />
        <line x1={PAD.left} x2={PAD.left + CHART_W} y1={PAD.top + CHART_H} y2={PAD.top + CHART_H} stroke="var(--color-border)" strokeWidth="1" />

        {/* Ideal line (dashed, teal) */}
        {idealLine.length > 1 && (
          <polyline
            className="line-ideal"
            points={idealPoints}
            fill="none"
            stroke="var(--color-ideal)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}

        {/* Actual area fill (subtle) */}
        {actualPairs.length > 1 && (
          <polygon
            points={`${xCoord(actualPairs[0].i)},${PAD.top + CHART_H} ${actualPoints} ${xCoord(actualPairs[actualPairs.length - 1].i)},${PAD.top + CHART_H}`}
            fill="var(--color-signal-dim)"
          />
        )}

        {/* Actual line (solid, amber) */}
        {actualPairs.length > 1 && (
          <polyline
            className="line-actual"
            points={actualPoints}
            fill="none"
            stroke="var(--color-signal)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Ideal hover targets */}
        {idealLine.map((p, i) => (
          <circle
            key={`ideal-${i}`}
            cx={xCoord(i)}
            cy={yCoord(p.value)}
            r={8}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseEnter={evt => {
              const svg = (evt.target as SVGElement).closest('svg')!;
              const rect = svg.getBoundingClientRect();
              const scaleX = W / rect.width;
              const scaleY = H / rect.height;
              setTooltip({
                x: (evt.clientX - rect.left) * scaleX,
                y: (evt.clientY - rect.top) * scaleY,
                date: p.date,
                value: p.value,
                type: 'ideal',
              });
            }}
          />
        ))}

        {/* Actual dots + hover targets */}
        {actualPairs.map(({ e, i }) => (
          <g key={`dot-${e.date}`}>
            <circle
              cx={xCoord(i)}
              cy={yCoord(e.remaining)}
              r={5}
              fill="var(--color-signal)"
              stroke="var(--color-bg)"
              strokeWidth="2"
              className="chart-dot"
            />
            <circle
              cx={xCoord(i)}
              cy={yCoord(e.remaining)}
              r={12}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={evt => {
                const svg = (evt.target as SVGElement).closest('svg')!;
                const rect = svg.getBoundingClientRect();
                const scaleX = W / rect.width;
                const scaleY = H / rect.height;
                setTooltip({
                  x: (evt.clientX - rect.left) * scaleX,
                  y: (evt.clientY - rect.top) * scaleY,
                  date: e.date,
                  value: e.remaining,
                  note: e.note,
                  type: 'actual',
                });
              }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (() => {
          const pw = tooltip.note ? Math.max(170, tooltip.note.length * 7 + 24) : 160;
          const ph = tooltip.note ? 66 : 46;
          const cx = pw / 2;
          return (
            <g transform={`translate(${tooltip.x + 12}, ${tooltip.y - 10})`}>
              <rect
                x={0}
                y={0}
                width={pw}
                height={ph}
                rx={6}
                fill="var(--color-surface-2)"
                stroke="var(--color-border-focus)"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={18}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="11"
                fill="var(--color-text-secondary)"
              >
                {tooltip.date}
                <tspan dx="8" fill={tooltip.type === 'actual' ? 'var(--color-signal)' : 'var(--color-ideal)'}>
                  {tooltip.type === 'actual' ? '● actual' : '◌ ideal'}
                </tspan>
              </text>
              <text
                x={cx}
                y={36}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="13"
                fontWeight="600"
                fill="var(--color-text-primary)"
              >
                {tooltip.value} pts
              </text>
              {tooltip.note && (
                <text
                  x={cx}
                  y={54}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="var(--color-text-secondary)"
                >
                  {tooltip.note.length > 28 ? tooltip.note.slice(0, 28) + '…' : tooltip.note}
                </text>
              )}
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="chart-legend">
        <span className="legend-item legend-ideal">
          <svg width="20" height="2" style={{ marginRight: 6 }}>
            <line x1="0" y1="1" x2="20" y2="1" stroke="var(--color-ideal)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          ideal
        </span>
        <span className="legend-item legend-actual">
          <span className="legend-dot" />
          actual
        </span>
      </div>
    </div>
  );
}
