import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { ExperimentIteration } from '../../api/types';

interface MetricComparisonBarProps {
  iterations: ExperimentIteration[];
  bestIteration?: number;
}

const METRIC_COLORS: Record<string, string> = {
  recall:    '#3B82F6',
  precision: '#D97706',
  f1:        '#10B981',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: 'var(--text-xs)',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ marginBottom: 6, color: 'var(--color-muted-foreground)' }}>#{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill, marginBottom: 2 }}>
          {p.dataKey}: {(p.value * 100).toFixed(2)}%
        </div>
      ))}
    </div>
  );
};

export default function MetricComparisonBar({ iterations, bestIteration }: MetricComparisonBarProps) {
  if (iterations.length === 0) return null;

  const data = iterations.map(it => ({
    name: it.iteration,
    recall: it.metrics.recall ?? 0,
    precision: it.metrics.precision ?? 0,
    f1: it.metrics.f1 ?? 0,
    isBest: it.iteration === bestIteration,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickFormatter={v => `#${v}`}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={v => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 8 }} />
        {Object.keys(METRIC_COLORS).map(metric => (
          <Bar key={metric} dataKey={metric} fill={METRIC_COLORS[metric]} radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={METRIC_COLORS[metric]}
                opacity={entry.isBest ? 1 : 0.6}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
