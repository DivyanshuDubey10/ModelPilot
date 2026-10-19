import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flask,
  Clock,
  ArrowRight,
  Trophy,
  CheckCircle,
  XCircle,
  ChartBar,
} from '@phosphor-icons/react';
import type { OptimizationRun, OptimizeExperiment } from '../api/types';
import { getOptimizationRun } from '../api/endpoints';
import SkeletonCard from '../components/shared/SkeletonCard';
import ErrorState from '../components/shared/ErrorState';
import '../styles/experiment.css';

function MetricBar({ label, value, max = 1, accent = false }: {
  label: string;
  value: number;
  max?: number;
  accent?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div className="flex items-center justify-between mb-xs">
        <span className="text-xs text-muted font-medium">{label}</span>
        <span className="font-mono text-xs font-semibold" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text)' }}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: accent ? 'var(--color-accent)' : 'var(--color-border-strong)',
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function ExperimentCard({ exp, index, isBest, objective }: {
  exp: OptimizeExperiment;
  index: number;
  isBest: boolean;
  objective: string;
}) {
  const [open, setOpen] = useState(isBest);
  const satisfies = exp.metrics.precision >= exp.min_precision;

  return (
    <div
      className={`timeline-item ${isBest ? 'best' : ''}`}
      style={{
        border: isBest ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 'var(--space-md)',
      }}
    >
      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          width: '100%',
          padding: 'var(--space-lg)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isBest ? 'var(--color-accent)' : 'var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isBest
            ? <Trophy size={14} weight="fill" style={{ color: 'white' }} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>#{index + 1}</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-md flex-wrap">
            <span className="font-semibold text-sm">{exp.model_name.replace('_', ' ')}</span>
            <span className="font-mono text-xs text-muted">{exp.n_estimators} trees</span>
            {isBest && <span className="badge badge-primary">Best</span>}
            {satisfies
              ? <CheckCircle size={14} weight="fill" style={{ color: 'var(--color-success)' }} aria-label="Precision satisfied" />
              : <XCircle size={14} weight="fill" style={{ color: 'var(--color-destructive)' }} aria-label="Precision not satisfied" />
            }
          </div>
          <div className="flex items-center gap-lg mt-xs flex-wrap">
            {Object.entries(exp.metrics).slice(0, 4).map(([k, v]) => (
              <span key={k} className="text-xs text-muted">
                {k}: <span className="font-mono font-semibold" style={{ color: 'var(--color-text)' }}>{(v * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>

        <ChartBar size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden="true" />
      </button>

      {open && (
        <div style={{ padding: 'var(--space-lg)', paddingTop: 0, borderTop: '1px solid var(--color-border)' }}>
          {Object.entries(exp.metrics).map(([k, v]) => (
            <MetricBar key={k} label={k} value={v} accent={k === objective} />
          ))}
          <div className="flex items-center gap-sm mt-md text-xs text-muted">
            <span>Precision constraint: ≥ {(exp.min_precision * 100).toFixed(0)}%</span>
            <span>→</span>
            <span style={{ color: satisfies ? 'var(--color-success)' : 'var(--color-destructive)', fontWeight: 600 }}>
              {(exp.metrics.precision * 100).toFixed(1)}% — {satisfies ? 'Satisfied ✓' : 'Not met ✗'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getOptimizationRun(id)
      .then(data => { setRun(data); setLoading(false); })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Experiment not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="skeleton skeleton-title" style={{ width: 300, height: 28 }} />
        </div>
        <div className="flex flex-col gap-xl">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={6} />
        </div>
      </>
    );
  }

  if (error || !run) {
    return (
      <ErrorState
        title="Experiment not found"
        message={error || 'Run data could not be loaded.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const meta = run.metadata;
  const experiments = run.experiments;

  // Find best: highest objective metric that also satisfies min_precision
  const satisfying = experiments.filter(e => e.metrics.precision >= meta.min_precision);
  const best = satisfying.length > 0
    ? satisfying.reduce((a, b) => (b.metrics[meta.objective] ?? 0) > (a.metrics[meta.objective] ?? 0) ? b : a)
    : null;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <div className="flex items-center gap-lg mb-sm flex-wrap">
              <h1 className="page-title" style={{ marginBottom: 0 }}>
                Experiment{' '}
                <span className="text-primary font-mono" style={{ fontSize: '0.75em' }}>
                  {id?.slice(0, 8)}
                </span>
              </h1>
              <span className="badge badge-success">Completed</span>
            </div>
            <p className="page-subtitle">
              {experiments.length} configurations tested · Dataset: <span className="font-mono">{meta.dataset_path.split('/').pop()}</span>
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/experiments/${id}/report`)}
            type="button"
          >
            View Report
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Meta card */}
      <div className="experiment-header-card">
        <div className="experiment-meta">
          <div className="experiment-meta-item">
            <Flask size={13} aria-hidden="true" />
            <span>{experiments.length} experiments</span>
          </div>
          <div className="experiment-meta-item">
            <Clock size={13} aria-hidden="true" />
            <span>{new Date(run.created_at).toLocaleString()}</span>
          </div>
          <span className="badge badge-primary font-mono">
            objective: {meta.objective}
          </span>
          <span className="badge badge-primary font-mono">
            precision ≥ {(meta.min_precision * 100).toFixed(0)}%
          </span>
        </div>

        <div className="experiment-objective">
          Maximize <strong>{meta.objective}</strong> on <span className="font-mono">{meta.target}</span> with precision ≥ {(meta.min_precision * 100).toFixed(0)}%
        </div>

        {best && (
          <div style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md) var(--space-lg)',
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
          }}>
            <span className="text-muted">Best result: </span>
            <span className="font-semibold">{best.model_name}</span>
            {' — '}
            {Object.entries(best.metrics).map(([k, v]) => (
              <span key={k} className="font-mono mr-md">
                {k}: <strong>{(v * 100).toFixed(1)}%</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Experiment timeline */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div className="text-sm font-semibold" style={{ marginBottom: 'var(--space-xl)', color: 'var(--color-text)' }}>
          Experiment timeline
        </div>
        <div>
          {experiments.map((exp, idx) => (
            <ExperimentCard
              key={idx}
              exp={exp}
              index={idx}
              isBest={best === exp}
              objective={meta.objective}
            />
          ))}
        </div>
      </div>
    </>
  );
}

