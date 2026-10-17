import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ClockCounterClockwise,
  ArrowRight,
  Flask,
} from '@phosphor-icons/react';
import type { ExperimentSummary } from '../api/types';
import { listExperiments } from '../api/endpoints';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import SkeletonCard from '../components/shared/SkeletonCard';
import ErrorState from '../components/shared/ErrorState';

// ── Mock history for demo ─────────────────────────────────
const MOCK_HISTORY: ExperimentSummary[] = [
  {
    id: 'mock-exp-001',
    status: 'running',
    objective: 'Maximize recall while keeping precision above 70%',
    dataset_filename: 'creditcard.csv',
    total_iterations: 10,
    best_metric: { recall: 0.89, precision: 0.78, f1: 0.832 },
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

function formatAge(createdAt: string, completedAt?: string): string {
  const end = completedAt ? new Date(completedAt) : new Date();
  const diff = Math.floor((end.getTime() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExperiments()
      .then(data => { setExperiments(data); setLoading(false); })
      .catch(err => {
        setExperiments(MOCK_HISTORY);
        setError(null);
        if (!MOCK_HISTORY.length) {
          setError(err instanceof Error ? err.message : 'Failed to load experiments');
        }
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <h1 className="page-title">History</h1>
            <p className="page-subtitle">Browse, compare, and revisit past experiments</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/experiments/new')}
            type="button"
          >
            <PlusCircle size={16} weight="bold" aria-hidden="true" />
            New experiment
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col gap-md">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} showTitle />)}
        </div>
      )}

      {error && !loading && (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      )}

      {!loading && !error && experiments.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<ClockCounterClockwise size={32} weight="light" />}
            title="No experiments yet"
            description="Your completed and in-progress experiments will appear here."
            action={
              <button
                className="btn btn-primary"
                onClick={() => navigate('/experiments/new')}
                type="button"
              >
                <PlusCircle size={16} weight="bold" aria-hidden="true" />
                New experiment
              </button>
            }
          />
        </div>
      )}

      {!loading && experiments.length > 0 && (
        <div
          className="card"
          style={{ padding: 0, overflow: 'hidden' }}
          role="list"
          aria-label="Experiment list"
        >
          {experiments.map((exp, idx) => (
            <div
              key={exp.id}
              role="listitem"
              tabIndex={0}
              aria-label={`Experiment ${exp.id.slice(0, 8)}: ${exp.objective}`}
              onClick={() => navigate(`/experiments/${exp.id}`)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/experiments/${exp.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xl)',
                padding: 'var(--space-lg) var(--space-xl)',
                cursor: 'pointer',
                borderBottom: idx < experiments.length - 1 ? '1px solid var(--color-border)' : 'none',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              {/* ID + Dataset */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="flex items-center gap-md"
                  style={{ marginBottom: 'var(--space-xs)' }}
                >
                  <span
                    className="font-mono text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    #{exp.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={exp.status} />
                  <span className="text-xs text-muted flex items-center gap-xs">
                    <Flask size={11} aria-hidden="true" />
                    {exp.dataset_filename}
                  </span>
                </div>
                <p
                  className="text-sm truncate"
                  style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}
                >
                  {exp.objective}
                </p>
                <span className="text-xs text-muted">
                  {formatAge(exp.created_at, exp.completed_at)} · {exp.total_iterations} iterations
                </span>
              </div>

              {/* Best metrics */}
              {exp.best_metric && (
                <div
                  className="flex items-center gap-xl flex-shrink-0"
                  style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-xl)' }}
                >
                  {Object.entries(exp.best_metric).map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'right' }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>{k}</div>
                      <div
                        className="font-mono text-sm font-semibold"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {(v * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  <ArrowRight size={14} style={{ color: 'var(--color-border-strong)' }} aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
