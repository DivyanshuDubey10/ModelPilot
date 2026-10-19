import { useParams, useNavigate } from 'react-router-dom';
import {
  Brain,
  Flask,
  Clock,
  ArrowRight,
  WifiHigh,
  WifiSlash,
} from '@phosphor-icons/react';
import { useExperimentSSE } from '../hooks/useExperimentSSE';
import IterationCard from '../components/experiment/IterationCard';
import MetricProgressChart from '../components/charts/MetricProgressChart';
import MetricComparisonBar from '../components/charts/MetricComparisonBar';
import ConfusionMatrix from '../components/charts/ConfusionMatrix';
import ProgressBar from '../components/shared/ProgressBar';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonCard from '../components/shared/SkeletonCard';
import ErrorState from '../components/shared/ErrorState';
import '../styles/experiment.css';

export default function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { status, loading, error, isStreaming } = useExperimentSSE({
    experimentId: id,
    enabled: true,
  });

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

  if (error && !status) {
    return (
      <ErrorState
        title="Experiment not found"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!status) return null;

  const isTerminal = status.status === 'completed' || status.status === 'failed';

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
              <StatusBadge status={status.status} />
              {isStreaming && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
                  <WifiHigh size={13} weight="fill" aria-hidden="true" />
                  Live
                </span>
              )}
              {!isStreaming && !isTerminal && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  <WifiSlash size={13} aria-hidden="true" />
                  Polling
                </span>
              )}
            </div>
            <p className="page-subtitle">{status.current_step}</p>
          </div>
          {isTerminal && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/experiments/${id}/report`)}
              type="button"
            >
              View Report
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Header card: objective + progress */}
      <div className="experiment-header-card">
        {/* Meta row */}
        <div className="experiment-meta">
          <div className="experiment-meta-item">
            <Flask size={13} aria-hidden="true" />
            <span>{status.iterations.length} iterations run</span>
          </div>
          <div className="experiment-meta-item">
            <Clock size={13} aria-hidden="true" />
            <span>{new Date(status.created_at).toLocaleTimeString()}</span>
          </div>
          {status.constraints.map((c, i) => (
            <span key={i} className="badge badge-primary font-mono">
              {c.metric} {c.operator} {(c.value * 100).toFixed(0)}%
            </span>
          ))}
        </div>

        {/* Objective */}
        <div className="experiment-objective">{status.objective}</div>

        {/* Progress bar */}
        <ProgressBar
          value={status.current_iteration}
          max={status.total_iterations}
          label="Experiment progress"
          showText
          variant={isTerminal ? 'accent' : 'default'}
        />
      </div>

      {/* Agent Reasoning */}
      {status.agent_reasoning && (
        <div className="reasoning-card">
          <div className="reasoning-header">
            <Brain size={14} weight="fill" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <span className="reasoning-label">Agent reasoning</span>
            {!isTerminal && <span className="reasoning-dot pulse" aria-hidden="true" />}
          </div>
          <p className="reasoning-text" aria-live="polite">{status.agent_reasoning}</p>
        </div>
      )}

      {/* Charts (show when ≥ 2 iterations) */}
      {status.iterations.length >= 2 && (
        <div className="charts-grid mb-xl">
          <div className="chart-card">
            <div className="chart-title">Metric Progression</div>
            <MetricProgressChart
              iterations={status.iterations}
              constraints={status.constraints}
            />
          </div>
          <div className="chart-card">
            <div className="chart-title">Iteration Comparison</div>
            <MetricComparisonBar
              iterations={status.iterations}
              bestIteration={status.best_result?.iteration}
            />
          </div>
          {status.best_result?.confusion_matrix && (
            <div className="chart-card">
              <div className="chart-title">
                Best Model — Confusion Matrix (#{status.best_result.iteration})
              </div>
              <ConfusionMatrix matrix={status.best_result.confusion_matrix} />
            </div>
          )}
        </div>
      )}

      {/* Iteration Timeline */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div className="text-sm font-semibold" style={{ marginBottom: 'var(--space-xl)', color: 'var(--color-text)' }}>
          Experiment timeline
        </div>
        <div className="timeline">
          {[...status.iterations].reverse().map(iteration => (
            <IterationCard
              key={iteration.iteration}
              iteration={iteration}
              isBest={status.best_result?.iteration === iteration.iteration}
              defaultOpen={iteration.iteration === status.iterations.length}
            />
          ))}
          {status.iterations.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Experiment is starting up…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
