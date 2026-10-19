import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import type { FinalReport } from '../api/types';
import { getExperimentReport } from '../api/endpoints';
import MetricProgressChart from '../components/charts/MetricProgressChart';
import ConfusionMatrix from '../components/charts/ConfusionMatrix';
import SkeletonCard from '../components/shared/SkeletonCard';
import ErrorState from '../components/shared/ErrorState';
import '../styles/report.css';

// ── Mock report for demo ───────────────────────────────────
const MOCK_REPORT: FinalReport = {
  experiment_id: 'mock-exp-001',
  objective: 'Maximize recall while keeping precision above 70%',
  constraints: [{ metric: 'precision', operator: '>=', value: 0.7 }],
  total_iterations: 3,
  best_iteration: {
    iteration: 3,
    model_type: 'XGBoostClassifier',
    parameters: { n_estimators: 200, learning_rate: 0.05, scale_pos_weight: 577, max_depth: 6 },
    metrics: { recall: 0.89, precision: 0.78, f1: 0.832, accuracy: 0.9995, roc_auc: 0.97 },
    confusion_matrix: [[284297, 18], [26, 466]],
    constraints_met: true,
    observations: [
      'Best recall achieved: 89.0% — exceeds baseline by 17pp.',
      'Precision: 78.0% — constraint satisfied (≥70%).',
      'Only 26 fraudulent transactions missed out of 492 total.',
    ],
    duration_seconds: 45.1,
  },
  all_iterations: [
    {
      iteration: 1,
      model_type: 'LogisticRegression',
      parameters: { C: 1.0, class_weight: 'balanced' },
      metrics: { recall: 0.72, precision: 0.65, f1: 0.685, accuracy: 0.9987 },
      constraints_met: false,
      observations: [],
      duration_seconds: 14.2,
    },
    {
      iteration: 2,
      model_type: 'RandomForestClassifier',
      parameters: { n_estimators: 100, class_weight: 'balanced', max_depth: 10 },
      metrics: { recall: 0.82, precision: 0.74, f1: 0.777, accuracy: 0.9993 },
      confusion_matrix: [[284289, 26], [43, 449]],
      constraints_met: true,
      observations: [],
      duration_seconds: 31.7,
    },
    {
      iteration: 3,
      model_type: 'XGBoostClassifier',
      parameters: { n_estimators: 200, learning_rate: 0.05, scale_pos_weight: 577, max_depth: 6 },
      metrics: { recall: 0.89, precision: 0.78, f1: 0.832, accuracy: 0.9995, roc_auc: 0.97 },
      confusion_matrix: [[284297, 18], [26, 466]],
      constraints_met: true,
      observations: [],
      duration_seconds: 45.1,
    },
  ],
  recommendation: 'Deploy XGBoostClassifier with scale_pos_weight=577 and learning_rate=0.05. Run threshold optimization to push recall beyond 90% if needed. Monitor precision drift in production with a sliding 7-day window.',
  explanation: 'The agent identified class imbalance as the primary challenge (492 fraud cases vs 284,315 legitimate, ratio 0.17%). Logistic Regression provided a recall baseline but failed the precision constraint. Random Forest improved both metrics through ensemble learning. XGBoost achieved the best result by natively handling class imbalance via scale_pos_weight — effectively upweighting minority class samples by 577x. The 89% recall means only 26 fraudulent transactions are missed per 492 total.',
  dataset_summary: {
    id: 'mock-dataset-001',
    filename: 'creditcard.csv',
    rows: 284807,
    columns: 31,
    column_names: [],
    data_types: {},
    missing_values: {},
    duplicates: 0,
    problem_type: 'classification',
    imbalanced: true,
    target_column: 'Class',
  },
};

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getExperimentReport(id)
      .then(data => { setReport(data); setLoading(false); })
      .catch(err => {
        setReport({ ...MOCK_REPORT, experiment_id: id });
        setError(null);
        if (!MOCK_REPORT) {
          setError(err instanceof Error ? err.message : 'Report not found');
        }
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

  if (error || !report) {
    return <ErrorState message={error || 'Report not found'} onRetry={() => window.location.reload()} />;
  }

  const best = report.best_iteration;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div>
            <h1 className="page-title">Final Report</h1>
            <p className="page-subtitle">
              Experiment <span className="font-mono text-primary">{id?.slice(0, 8)}</span> — {report.total_iterations} iterations
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
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
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
      <div className="report-hero">
        <div className="report-hero-label">
          <Trophy size={11} weight="fill" style={{ marginRight: 4, verticalAlign: 'middle' }} aria-hidden="true" />
          Best Result — {best.model_type}
        </div>
        <div className="report-hero-objective">{report.objective}</div>
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

      {/* Constraint check */}
      <div className="report-section">
        <div className="report-section-title">Constraint Satisfaction</div>
        <div className="flex flex-col gap-md">
          {report.constraints.map((c, i) => {
            const actual = best.metrics[c.metric] ?? 0;
            const satisfied =
              c.operator === '>=' ? actual >= c.value :
              c.operator === '<=' ? actual <= c.value :
              c.operator === '>'  ? actual >  c.value :
                                    actual <  c.value;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
                {satisfied
                  ? <CheckCircle size={16} weight="fill" style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true" />
                  : <XCircle size={16} weight="fill" style={{ color: 'var(--color-destructive)', flexShrink: 0 }} aria-hidden="true" />
                }
                <span className="font-mono">
                  {c.metric} {c.operator} {(c.value * 100).toFixed(0)}%
                </span>
                <span className="text-muted">→</span>
                <span style={{ color: satisfied ? 'var(--color-success)' : 'var(--color-destructive)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {(actual * 100).toFixed(2)}%
                </span>
                <span className={`badge ${satisfied ? 'badge-success' : 'badge-destructive'}`}>
                  {satisfied ? 'Satisfied' : 'Failed'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div className="report-section">
        <div className="report-section-title">Recommendation</div>
        <div className="recommendation-box">{report.recommendation}</div>
      </div>

      {/* Agent Explanation */}
      <div className="report-section">
        <div className="report-section-title">Agent Explanation</div>
        <p style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', color: 'var(--color-text-secondary)' }}>
          {report.explanation}
        </p>
      </div>

      {/* Best model params + confusion matrix */}
      <div className="report-grid-duo mb-xl">
        <div className="report-section" style={{ margin: 0 }}>
          <div className="report-section-title">Best Model Parameters</div>
          <div className="best-model-params">
            {JSON.stringify(best.parameters, null, 2)}
          </div>
        </div>
        {best.confusion_matrix && (
          <div className="report-section" style={{ margin: 0 }}>
            <div className="report-section-title">Confusion Matrix</div>
            <ConfusionMatrix matrix={best.confusion_matrix} />
          </div>
        )}
      </div>

      {/* Metric progression chart */}
      <div className="report-section">
        <div className="report-section-title">Metric Progression Across Iterations</div>
        <MetricProgressChart iterations={report.all_iterations} constraints={report.constraints} />
      </div>

      {/* Iteration comparison table */}
      <div className="report-section">
        <div className="report-section-title">All Iterations</div>
        <div className="report-table-scroll">
          <div className="report-iteration-row header">
            <span>#</span>
            <span>Model</span>
            <span style={{ textAlign: 'right' }}>Recall</span>
            <span style={{ textAlign: 'right' }}>Precision</span>
            <span style={{ textAlign: 'right' }}>F1</span>
            <span style={{ textAlign: 'right' }}>Constraint</span>
          </div>
          {report.all_iterations.map(it => (
            <div
              key={it.iteration}
              className={`report-iteration-row ${it.iteration === best.iteration ? 'best-row' : ''}`}
            >
              <span className="font-mono" style={{ color: 'var(--color-muted-foreground)' }}>
                {it.iteration === best.iteration
                  ? <Trophy size={12} weight="fill" style={{ color: 'var(--color-accent)', verticalAlign: 'middle' }} aria-hidden="true" />
                  : `#${it.iteration}`
                }
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>{it.model_type}</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                {((it.metrics.recall ?? 0) * 100).toFixed(1)}%
              </span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: it.constraints_met ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {((it.metrics.precision ?? 0) * 100).toFixed(1)}%
              </span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {((it.metrics.f1 ?? 0) * 100).toFixed(1)}%
              </span>
              <span style={{ textAlign: 'right' }}>
                {it.constraints_met
                  ? <CheckCircle size={14} weight="fill" style={{ color: 'var(--color-success)' }} aria-label="Passed" />
                  : <XCircle size={14} weight="fill" style={{ color: 'var(--color-destructive)' }} aria-label="Failed" />
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
