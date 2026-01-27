interface EffortChartProps {
  data: { date: string; effort: number }[];
}

// Helper to create smooth bezier curve path
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Calculate control points using Catmull-Rom to Bezier conversion
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

export function EffortChart({ data }: EffortChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
        Complete workouts with effort ratings to see trends
      </div>
    );
  }

  const width = 300;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 25, left: 28 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minEffort = 1;
  const maxEffort = 10;

  const xScale = (index: number) =>
    padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;

  const yScale = (effort: number) =>
    padding.top + chartHeight - ((effort - minEffort) / (maxEffort - minEffort)) * chartHeight;

  // Build points array for smooth curve
  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.effort) }));

  // Build the curved line path
  const linePath = createSmoothPath(points);

  // Build the area path (for gradient fill) - need to close the path
  const areaPath = data.length > 1
    ? `${linePath} L ${xScale(data.length - 1)} ${padding.top + chartHeight} L ${xScale(0)} ${padding.top + chartHeight} Z`
    : '';

  // Y-axis labels - show 1 through 10
  const yLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Get effort color
  const getEffortColor = (effort: number) => {
    if (effort <= 3) return '#10b981'; // emerald-500
    if (effort <= 5) return '#22c55e'; // green-500
    if (effort <= 7) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const latestEffort = data[data.length - 1]?.effort || 5;
  const avgEffort = data.reduce((sum, d) => sum + d.effort, 0) / data.length;
  const trend = data.length >= 2 ? data[data.length - 1].effort - data[0].effort : 0;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="effortGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={getEffortColor(latestEffort)} stopOpacity="0.3" />
            <stop offset="100%" stopColor={getEffortColor(latestEffort)} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines (only at 1, 5, 10) */}
        {[1, 5, 10].map(label => (
          <line
            key={`grid-${label}`}
            x1={padding.left}
            y1={yScale(label)}
            x2={width - padding.right}
            y2={yScale(label)}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="1"
            strokeDasharray={label === 5 ? '4 2' : '0'}
            strokeOpacity={label === 5 ? 0.5 : 0.3}
          />
        ))}

        {/* Y-axis labels (1-10) */}
        {yLabels.map(label => (
          <text
            key={label}
            x={padding.left - 6}
            y={yScale(label)}
            className="fill-slate-400 dark:fill-slate-500 text-[9px]"
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {label}
          </text>
        ))}

        {/* Area fill */}
        {data.length > 1 && (
          <path d={areaPath} fill="url(#effortGradient)" />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={getEffortColor(latestEffort)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.effort)}
            r="4"
            fill={getEffortColor(d.effort)}
            className="stroke-white dark:stroke-slate-800"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels (show first and last only) */}
        {data.length > 0 && (
          <>
            <text
              x={xScale(0)}
              y={height - 5}
              className="fill-slate-400 dark:fill-slate-500 text-[9px]"
              textAnchor="start"
            >
              {data[0].date}
            </text>
            {data.length > 1 && (
              <text
                x={xScale(data.length - 1)}
                y={height - 5}
                className="fill-slate-400 dark:fill-slate-500 text-[9px]"
                textAnchor="end"
              >
                {data[data.length - 1].date}
              </text>
            )}
          </>
        )}
      </svg>

      {/* Stats row */}
      <div className="flex justify-between text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          Avg: <span className="font-medium text-slate-700 dark:text-slate-300">{avgEffort.toFixed(1)}</span>
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          Latest: <span className="font-medium text-slate-700 dark:text-slate-300">{latestEffort}</span>
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          Trend:{' '}
          <span className={`font-medium ${trend > 0 ? 'text-amber-500' : trend < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
