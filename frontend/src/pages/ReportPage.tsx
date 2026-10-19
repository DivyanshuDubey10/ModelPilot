import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import type { OptimizationRun, OptimizeExperiment } from '../api/types';
import { getOptimizationRun } from '../api/endpoints';
import SkeletonCard from '../components/shared/SkeletonCard';
import ErrorState from '../components/shared/ErrorState';
import '../styles/report.css';

export default function ReportPage() {
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
        setError(err instanceof Error ? err.message : 'Report not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="skeleton skeleton-title" style={{ width: 280, height: 28 }} />
        </div>
        <div className="flex flex-col gap-xl">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      </>
    );
  }

  if (error || !run) {
    return <ErrorState message={error || 'Report not found'} onRetry={() => window.location.reload()} />;
  }

  const meta = run.metadata;
  const experiments = run.experiments;

  // Find best: highest objective score among precision-satisfying models
  const satisfying = experiments.filter(e => e.metrics.precision >= meta.min_precision);
  const best: OptimizeExperiment | null = satisfying.length > 0
    ? satisfying.reduce((a, b) => (b.metrics[meta.objective] ?? 0) > (a.metrics[meta.objective] ?? 0) ? b : a)
    : (experiments.length > 0
      ? experiments.reduce((a, b) => (b.metrics[meta.objective] ?? 0) > (a.metrics[meta.objective] ?? 0) ? b : a)
      : null);

  const constraintSatisfied = best ? best.metrics.precision >= meta.min_precision : false;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <h1 className="page-title">Final Report</h1>
            <p className="page-subtitle">
              Experiment <span className="font-mono text-primary">{id?.slice(0, 8)}</span> — {experiments.length} configurations tested
            </p>
          </div>
          <div className="flex gap-md">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/experiments/${id}`)}
              type="button"
            >
              <ArrowLeft size={15} weight="bold" aria-hidden="true" />
              Detail View
            </button>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `modelpilot-report-${id?.slice(0, 8)}.json`;
                a.click();
              }}
            >
              <Download size={15} weight="bold" aria-hidden="true" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Hero card */}
      {best && (
        <div className="report-hero">
          <div className="report-hero-label">
            <Trophy size={11} weight="fill" style={{ marginRight: 4, verticalAlign: 'middle' }} aria-hidden="true" />
            Best Result — {best.model_name} ({best.n_estimators} trees)
          </div>
          <div className="report-hero-objective">
            Maximize <strong>{meta.objective}</strong> on <span className="font-mono">{meta.target}</span> with precision ≥ {(meta.min_precision * 100).toFixed(0)}%
          </div>
          <div className="report-metrics-banner">
            {Object.entries(best.metrics).map(([key, val], i) => (
              <div key={key} className="report-metric">
                <span className="report-metric-label">{key}</span>
                <span className={`report-metric-value ${i === 0 ? 'primary' : i === 1 ? 'secondary' : 'accent'}`}>
                  {(val * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraint satisfaction */}
      <div className="report-section">
        <div className="report-section-title">Precision Constraint</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
          {constraintSatisfied
            ? <CheckCircle size={16} weight="fill" style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true" />
            : <XCircle size={16} weight="fill" style={{ color: 'var(--color-destructive)', flexShrink: 0 }} aria-hidden="true" />
          }
          <span className="font-mono">precision ≥ {(meta.min_precision * 100).toFixed(0)}%</span>
          <span className="text-muted">→</span>
          <span style={{ color: constraintSatisfied ? 'var(--color-success)' : 'var(--color-destructive)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {best ? `${(best.metrics.precision * 100).toFixed(2)}%` : 'N/A'}
          </span>
          <span className={`badge ${constraintSatisfied ? 'badge-success' : 'badge-destructive'}`}>
            {constraintSatisfied ? 'Satisfied' : 'Not Met'}
          </span>
        </div>
      </div>

      {/* Dataset info */}
      <div className="report-section">
        <div className="report-section-title">Dataset Configuration</div>
        <div className="best-model-params">
          {JSON.stringify({
            dataset: meta.dataset_path,
            target: meta.target,
            objective: meta.objective,
            min_precision: meta.min_precision,
            max_experiments: meta.max_experiments,
          }, null, 2)}
        </div>
      </div>

      {/* All iterations table */}
      <div className="report-section">
        <div className="report-section-title">All Experiments</div>
        <div className="report-table-scroll">
          <div className="report-iteration-row header">
            <span>#</span>
            <span>Model</span>
            <span>Trees</span>
            <span style={{ textAlign: 'right' }}>{meta.objective}</span>
            <span style={{ textAlign: 'right' }}>Precision</span>
            <span style={{ textAlign: 'right' }}>F1</span>
            <span style={{ textAlign: 'right' }}>Constraint</span>
          </div>
          {experiments.map((exp, idx) => {
            const isBestRow = exp === best;
            const sat = exp.metrics.precision >= meta.min_precision;
            return (
              <div
                key={idx}
                className={`report-iteration-row ${isBestRow ? 'best-row' : ''}`}
              >
                <span className="font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
                  {isBestRow
                    ? <Trophy size={12} weight="fill" style={{ color: 'var(--color-accent)', verticalAlign: 'middle' }} aria-hidden="true" />
                    : `#${idx + 1}`
                  }
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>{exp.model_name.replace('_', ' ')}</span>
                <span className="font-mono text-xs text-muted">{exp.n_estimators}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  {((exp.metrics[meta.objective] ?? 0) * 100).toFixed(1)}%
                </span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: sat ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {((exp.metrics.precision ?? 0) * 100).toFixed(1)}%
                </span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {((exp.metrics.f1 ?? 0) * 100).toFixed(1)}%
                </span>
                <span style={{ textAlign: 'right' }}>
                  {sat
                    ? <CheckCircle size={14} weight="fill" style={{ color: 'var(--color-success)' }} aria-label="Passed" />
                    : <XCircle size={14} weight="fill" style={{ color: 'var(--color-destructive)' }} aria-label="Failed" />
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

