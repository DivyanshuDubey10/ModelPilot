import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ClockCounterClockwise,
  Trophy,
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

function formatDuration(createdAt: string, completedAt?: string): string {
  const end = completedAt ? new Date(completedAt) : new Date();
  const diff = Math.floor((end.getTime() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExperiments()
      .then(data => { setExperiments(data); setLoading(false); })
      .catch(() => {
        // Use mock data for demo
        setExperiments(MOCK_HISTORY);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <h1 className="page-title">Experiment History</h1>
            <p className="page-subtitle">Browse, compare, and revisit past experiments</p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/experiments/new')}
            type="button"
          >
            <PlusCircle size={16} weight="bold" aria-hidden="true" />
            New Experiment
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col gap-md">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} showTitle />)}
        </div>
      )}

      {error && !loading && (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      )}

      {!loading && !error && experiments.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<ClockCounterClockwise size={40} weight="light" />}
            title="No experiments yet"
            description="Your completed and in-progress experiments will appear here."
            action={
              <button
                className="btn btn-primary"
                onClick={() => navigate('/experiments/new')}
                type="button"
              >
                <PlusCircle size={18} weight="bold" aria-hidden="true" />
                New Experiment
              </button>
            }
          />
        </div>
      )}

      {!loading && experiments.length > 0 && (
        <div className="flex flex-col gap-md" role="list" aria-label="Experiment list">
          {experiments.map(exp => (
            <div
              key={exp.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'border-color var(--transition-fast)' }}
              onClick={() => navigate(`/experiments/${exp.id}`)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
              role="listitem"
              tabIndex={0}
              aria-label={`Experiment ${exp.id.slice(0, 8)}: ${exp.objective}`}
              onKeyDown={e => e.key === 'Enter' && navigate(`/experiments/${exp.id}`)}
            >
              <div className="flex items-start justify-between gap-lg flex-wrap">
                {/* Left */}
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-lg mb-md flex-wrap">
                    <span className="font-mono text-sm" style={{ color: 'var(--color-secondary)' }}>
                      #{exp.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={exp.status} />
                    <span className="text-xs text-muted flex items-center gap-sm">
                      <Flask size={11} aria-hidden="true" />
                      {exp.dataset_filename}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDuration(exp.created_at, exp.completed_at)} ago
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-sm)' }}>
                    {exp.objective}
                  </p>
                  <div className="text-xs text-muted">
                    {exp.total_iterations} max iterations
                  </div>
                </div>

                {/* Right: best metrics */}
                {exp.best_metric && (
                  <div className="flex items-center gap-xl">
                    <div className="flex items-center gap-sm text-xs text-muted mb-xs">
                      <Trophy size={11} weight="fill" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                      Best
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '0 var(--space-xl)' }}>
                      {Object.entries(exp.best_metric).map(([k, v]) => (
                        <div key={k} style={{ textAlign: 'right' }}>
                          <div className="text-xs text-muted">{k}</div>
                          <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-success)' }}>
                            {(v * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
