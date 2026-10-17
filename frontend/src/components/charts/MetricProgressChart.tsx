import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { ExperimentIteration, Constraint } from '../../api/types';

interface MetricProgressChartProps {
  iterations: ExperimentIteration[];
  constraints?: Constraint[];
}

const METRIC_COLORS: Record<string, string> = {
  recall:    '#3B82F6',  // blue
  precision: '#D97706',  // amber
  f1:        '#10B981',  // green
  accuracy:  '#8B5CF6',  // purple
  roc_auc:   '#EC4899',  // pink
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
      <div style={{ marginBottom: 6, color: 'var(--color-muted-foreground)' }}>Iteration #{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.dataKey}: {(p.value * 100).toFixed(2)}%
        </div>
      ))}
    </div>
  );
};

export default function MetricProgressChart({ iterations, constraints = [] }: MetricProgressChartProps) {
  if (iterations.length === 0) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)' }}>
      Waiting for first iteration…
    </div>
  );

  const data = iterations.map(it => ({
    iteration: it.iteration,
    ...it.metrics,
  }));

  const metricKeys = Object.keys(data[0]).filter(k => k !== 'iteration');
  const constraintLines = constraints.map(c => ({ metric: c.metric, value: c.value, operator: c.operator }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="iteration"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-border)' }}
          label={{ value: 'Iteration', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--color-muted-foreground)' }}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 8 }}
        />
        {metricKeys.map(key => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={METRIC_COLORS[key] || '#64748B'}
            strokeWidth={2}
            dot={{ r: 3, fill: METRIC_COLORS[key] || '#64748B' }}
            activeDot={{ r: 5 }}
          />
        ))}
        {/* Constraint reference lines */}
        {constraintLines.map(c => (
          c.metric in (data[0] || {}) && (
            <ReferenceLine
              key={c.metric}
              y={c.value}
              stroke={METRIC_COLORS[c.metric] || '#64748B'}
              strokeDasharray="6 3"
              strokeOpacity={0.5}
              label={{ value: `${c.metric} ${c.operator} ${(c.value * 100).toFixed(0)}%`, position: 'insideTopRight', fontSize: 9, fill: METRIC_COLORS[c.metric] || '#64748B' }}
            />
          )
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
