import { useState } from 'react';
import { CaretDown, CaretUp, Trophy } from '@phosphor-icons/react';
import type { ExperimentIteration } from '../../api/types';
import StatusBadge from '../shared/StatusBadge';

interface IterationCardProps {
  iteration: ExperimentIteration;
  isBest: boolean;
  defaultOpen?: boolean;
}

function metricColor(metric: string, value: number): string {
  if (['recall', 'f1', 'roc_auc', 'pr_auc', 'accuracy'].includes(metric)) {
    return value >= 0.85 ? 'var(--color-success)'
      : value >= 0.7 ? 'var(--color-warning)'
      : 'var(--color-destructive)';
  }
  if (metric === 'precision') {
    return value >= 0.7 ? 'var(--color-success)' : 'var(--color-warning)';
  }
  return 'var(--color-foreground)';
}

export default function IterationCard({ iteration, isBest, defaultOpen = false }: IterationCardProps) {
  const [open, setOpen] = useState(defaultOpen || isBest);

  const keyMetrics = ['recall', 'precision', 'f1', 'accuracy'];
  const displayMetrics = keyMetrics.filter(m => m in iteration.metrics);

  return (
    <div className={`iteration-card ${isBest ? 'best' : ''} ${iteration.constraints_met ? 'constraints-met' : ''}`}>
      {/* Header — always visible */}
      <div
        className="iteration-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`Iteration ${iteration.iteration}: ${iteration.model_type}`}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <div className="iteration-number">
          <div className="iteration-num-badge">#{iteration.iteration}</div>
          <div>
            <div className="iteration-model">{iteration.model_type}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: 2 }}>
              {iteration.duration_seconds.toFixed(1)}s
            </div>
          </div>
        </div>

        <div className="iteration-right">
          {/* Key metrics peek */}
          <div className="iteration-metrics-peek">
            {displayMetrics.slice(0, 3).map(m => (
              <div key={m} className="metric-peek">
                <div className="metric-peek-label">{m}</div>
                <div className="metric-peek-value" style={{ color: metricColor(m, iteration.metrics[m]) }}>
                  {(iteration.metrics[m] * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-md">
            {isBest && (
              <span className="best-banner">
                <Trophy size={11} weight="fill" aria-hidden="true" />
                Best
              </span>
            )}
            <StatusBadge
              status={iteration.constraints_met ? 'completed' : 'failed'}
              showDot={false}
            />
            {open
              ? <CaretUp size={14} weight="bold" style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true" />
              : <CaretDown size={14} weight="bold" style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true" />
            }
          </div>
        </div>
      </div>

      {/* Body — expanded */}
      {open && (
        <div className="iteration-body">
          {/* Params */}
          <div className="iteration-params">
            {JSON.stringify(iteration.parameters, null, 2)}
          </div>

          {/* All metrics */}
          <div className="iteration-metrics-grid">
            {Object.entries(iteration.metrics).map(([key, val]) => (
              <div key={key} className="metric-cell">
                <div className="metric-cell-label">{key}</div>
                <div className="metric-cell-value" style={{ color: metricColor(key, val) }}>
                  {(val * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          {/* Observations */}
          {iteration.observations.length > 0 && (
            <div className="iteration-observations">
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Agent observations
              </div>
              {iteration.observations.map((obs, i) => (
                <div key={i} className="observation-item">
                  <div className="observation-dot" aria-hidden="true" />
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
