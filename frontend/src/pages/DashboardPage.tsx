import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Flask, ArrowRight } from '@phosphor-icons/react';
import type { RunSummary } from '../api/types';
import { listRuns } from '../api/endpoints';
import EmptyState from '../components/shared/EmptyState';
import SkeletonCard from '../components/shared/SkeletonCard';

function datasetName(path: string): string {
  return path ? path.split('/').pop() || path : '—';
}

function formatAge(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRuns()
      .then(data => { setRuns(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Compute stats
  const totalRuns = runs.length;
  const bestRecall = runs.reduce((max, r) => {
    const recall = r.best_metrics?.recall ?? 0;
    return recall > max ? recall : max;
  }, 0);
  const bestF1 = runs.reduce((max, r) => {
    const f1 = r.best_metrics?.f1 ?? 0;
    return f1 > max ? f1 : max;
  }, 0);

  const stats = [
    { label: 'Total runs', value: loading ? '…' : String(totalRuns) },
    { label: 'Best recall', value: loading ? '…' : bestRecall > 0 ? `${(bestRecall * 100).toFixed(1)}%` : '—' },
    { label: 'Best F1', value: loading ? '…' : bestF1 > 0 ? `${(bestF1 * 100).toFixed(1)}%` : '—' },
    { label: 'Datasets used', value: loading ? '…' : String(new Set(runs.map(r => r.dataset_path)).size) },
  ];

  const recentRuns = runs.slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Autonomous ML experimentation at a glance
            </p>
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

      {/* KPI row */}
      <div
        className="grid grid-cols-4 gap-xl mb-2xl"
        role="region"
        aria-label="Summary statistics"
      >
        {stats.map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: 'var(--space-xl)' }}>
            <div
              className="text-xs text-muted font-medium"
              style={{ marginBottom: 'var(--space-sm)' }}
            >
              {label}
            </div>
            <div
              className="font-mono font-semibold"
              style={{ fontSize: 'var(--text-2xl)', letterSpacing: '-0.02em', color: 'var(--color-text)' }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent runs */}
      <div className="card">
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Recent experiments
          </div>
          {runs.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/history')}
              type="button"
            >
              View all
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex flex-col gap-md">
            {[1, 2].map(i => <SkeletonCard key={i} lines={2} />)}
          </div>
        )}

        {!loading && runs.length === 0 && (
          <EmptyState
            icon={<Flask size={32} weight="light" />}
            title="No experiments yet"
            description="Upload a dataset and define your ML objective to start your first experiment."
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
        )}

        {!loading && recentRuns.length > 0 && (
          <div style={{ margin: '0 calc(-1 * var(--space-xl))' }}>
            {recentRuns.map(run => (
              <div
                key={run.run_id}
                className="history-item"
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/experiments/${run.run_id}`)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/experiments/${run.run_id}`)}
                style={{ padding: 'var(--space-lg) var(--space-xl)', cursor: 'pointer' }}
              >
                <div className="history-item-main">
                  <div className="flex items-center gap-md flex-wrap" style={{ marginBottom: 'var(--space-xs)' }}>
                    <span className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      #{run.run_id?.slice(0, 8)}
                    </span>
                    <span className="badge badge-success">Completed</span>
                    <span className="text-xs text-muted">
                      <Flask size={11} aria-hidden="true" style={{ display: 'inline', marginRight: 3 }} />
                      {datasetName(run.dataset_path)}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>
                    Maximize <strong>{run.objective}</strong> on <span className="font-mono">{run.target}</span>
                    {run.min_precision != null && ` · precision ≥ ${(run.min_precision * 100).toFixed(0)}%`}
                  </p>
                  <span className="text-xs text-muted">
                    {run.created_at ? formatAge(run.created_at) : '—'} · {run.total_experiments} experiments
                  </span>
                </div>
                {run.best_metrics && (
                  <div className="history-item-metrics">
                    <div className="flex items-center gap-lg">
                      {Object.entries(run.best_metrics).slice(0, 3).map(([k, v]) => (
                        <div key={k} style={{ textAlign: 'right' }}>
                          <div className="text-xs text-muted" style={{ marginBottom: 2 }}>{k}</div>
                          <div className="font-mono text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
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
      </div>
    </>
  );
}


