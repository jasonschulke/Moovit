import type { ExerciseLog } from '../types';

interface SparklineProps {
  history: ExerciseLog[];
  metric: 'weight' | 'reps';
  className?: string;
}

export function Sparkline({ history, metric, className = '' }: SparklineProps) {
  // Need at least 2 data points
  if (history.length < 2) return null;

  // Extract values and reverse (history is newest first)
  const values = history
    .slice()
    .reverse()
    .map(log => (metric === 'weight' ? log.weight : log.reps))
    .filter((v): v is number => v !== undefined && v > 0);

  if (values.length < 2) return null;

  const width = 60;
  const height = 20;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xScale = (index: number) => padding + (index / (values.length - 1)) * chartWidth;
  const yScale = (value: number) => padding + chartHeight - ((value - min) / range) * chartHeight;

  // Build path
  const pathData = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
    .join(' ');

  // Trend: compare first and last values
  const trend = values[values.length - 1] - values[0];
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#f59e0b' : '#94a3b8'; // emerald for up, amber for down

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`inline-block ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={xScale(values.length - 1)}
        cy={yScale(values[values.length - 1])}
        r="2"
        fill={trendColor}
      />
    </svg>
  );
}
