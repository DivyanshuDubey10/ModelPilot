import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ClockCounterClockwise,
  ArrowRight,
  Database,
} from '@phosphor-icons/react';
import type { RunSummary } from '../api/types';
import { listRuns } from '../api/endpoints';
import EmptyState from '../components/shared/EmptyState';
import SkeletonCard from '../components/shared/SkeletonCard';
import ErrorState from '../components/shared/ErrorState';

function formatAge(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function datasetName(path: string): string {
  return path ? path.split('/').pop() || path : 'Unknown dataset';
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRuns()
      .then(data => { setRuns(data); setLoading(false); })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load history');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <h1 className="page-title">History</h1>
            <p className="page-subtitle">Browse and revisit past optimization runs</p>
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

      {!loading && !error && runs.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<ClockCounterClockwise size={32} weight="light" />}
            title="No experiments yet"
            description="Your completed optimization runs will appear here once you run your first experiment."
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

      {!loading && !error && runs.length > 0 && (
        <div
          className="card"
          style={{ padding: 0, overflow: 'hidden' }}
          role="list"
          aria-label="Optimization run list"
        >
          {runs.map((run) => (
            <div
              key={run.run_id}
              role="listitem"
              tabIndex={0}
              className="history-item"
              aria-label={`Run ${run.run_id?.slice(0, 8)}: ${run.objective} on ${datasetName(run.dataset_path)}`}
              onClick={() => navigate(`/experiments/${run.run_id}`)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/experiments/${run.run_id}`)}
            >
              {/* ID + Dataset */}
              <div className="history-item-main">
                <div
                  className="flex items-center gap-md flex-wrap"
                  style={{ marginBottom: 'var(--space-xs)' }}
                >
                  <span
                    className="font-mono text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    #{run.run_id?.slice(0, 8)}
                  </span>
                  <span className="badge badge-success">Completed</span>
                  <span className="text-xs text-muted flex items-center gap-xs">
                    <Database size={11} aria-hidden="true" />
                    {datasetName(run.dataset_path)}
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}
                >
                  Maximize <strong>{run.objective}</strong> on <span className="font-mono">{run.target}</span>
                  {run.min_precision != null && ` with precision ≥ ${(run.min_precision * 100).toFixed(0)}%`}
                </p>
                <span className="text-xs text-muted">
                  {run.created_at ? formatAge(run.created_at) : '—'} · {run.total_experiments} experiment{run.total_experiments !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Best metrics */}
              {run.best_metrics && (
                <div className="history-item-metrics">
                  <div className="flex items-center gap-lg">
                    {Object.entries(run.best_metrics).slice(0, 3).map(([k, v]) => (
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
                  </div>
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

