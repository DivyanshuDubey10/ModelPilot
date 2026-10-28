import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Flask,
  RocketLaunch,
  ArrowLeft,
  ArrowRight,
  Spinner,
  WarningCircle,
} from '@phosphor-icons/react';
import type { WizardDataset } from '../api/types';
import { runOptimization } from '../api/endpoints';
import DatasetUpload from '../components/dataset/DatasetUpload';
import DatasetProfileView from '../components/dataset/DatasetProfile';
import '../styles/wizard.css';

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1, label: 'Upload Dataset' },
  { n: 2, label: 'Review Profile' },
  { n: 3, label: 'Set Objective' },
];

// Backend accepts: 'recall' | 'f1' | 'accuracy'
const OBJECTIVE_OPTIONS = [
  { value: 'recall' as const, label: 'Maximize Recall', description: 'Minimize false negatives — good for fraud/disease detection' },
  { value: 'f1' as const, label: 'Maximize F1 Score', description: 'Balance between precision and recall' },
  { value: 'accuracy' as const, label: 'Maximize Accuracy', description: 'Overall correctness across all classes' },
];

const LAUNCH_STAGES = [
  'Connecting to backend & initializing experiment session…',
  'AI Planner analyzing constraints & selecting model candidates…',
  'Training candidate Random Forest models on dataset…',
  'Evaluating precision & recall trade-offs across configurations…',
  'Selecting optimal configuration & compiling experiment report…',
];

export default function NewExperimentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1: uploaded dataset
  const [dataset, setDataset] = useState<WizardDataset | null>(null);

  // Step 2: target column selection
  const [targetColumn, setTargetColumn] = useState('');

  // Step 3: optimization config
  const [objective, setObjective] = useState<'recall' | 'f1' | 'accuracy'>('recall');
  const [minPrecision, setMinPrecision] = useState(0.70);
  const [maxExperiments, setMaxExperiments] = useState(2);

  const [launching, setLaunching] = useState(false);
  const [launchStage, setLaunchStage] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!launching) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [launching]);

  useEffect(() => {
    if (!launching) {
      setLaunchStage(0);
      return;
    }
    // Stage timing calibrated to maxExperiments * ~12s per experiment + cold-start overhead
    const perExp = maxExperiments * 12_000;
    const t1 = setTimeout(() => setLaunchStage(1), 2_000);
    const t2 = setTimeout(() => setLaunchStage(2), 5_000);
    const t3 = setTimeout(() => setLaunchStage(3), 5_000 + perExp * 0.5);
    const t4 = setTimeout(() => setLaunchStage(4), 5_000 + perExp * 0.85);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [launching, maxExperiments]);

  function onDatasetReady(d: WizardDataset) {
    setDataset(d);
    // Auto-select last column as default target
    if (d.column_names.length > 0) {
      setTargetColumn(d.column_names[d.column_names.length - 1]);
    }
  }

  function canAdvance(): boolean {
    if (step === 1) return !!dataset;
    if (step === 2) return !!targetColumn;
    if (step === 3) return true;
    return false;
  }

  function next() {
    if (canAdvance() && step < 3) setStep((step + 1) as Step);
  }

  function back() {
    if (step > 1) setStep((step - 1) as Step);
  }

  async function launch() {
    if (!dataset || !targetColumn) return;
    setLaunching(true);
    setLaunchError(null);

    try {
      const result = await runOptimization({
        dataset_path: dataset.dataset_path,
        target: targetColumn,
        objective,
        min_precision: minPrecision,
        max_experiments: maxExperiments,
      });
      // Navigate to the run results page
      navigate(`/experiments/${result.run_id}`);
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : 'Failed to start optimization');
    } finally {
      setLaunching(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Experiment</h1>
        <p className="page-subtitle">
          Upload a dataset, review the profile, set your objective — then let ModelPilot optimize
        </p>
      </div>

      <div className="wizard-container">
        {/* Step Indicator */}
        <div className="step-indicator">
          {STEPS.map((s, idx) => (
            <div key={s.n} className="step-item">
              <div
                style={{ position: 'relative' }}
                aria-current={step === s.n ? 'step' : undefined}
              >
                <div
                  className={`step-circle ${
                    step === s.n ? 'active' : step > s.n ? 'completed' : ''
                  }`}
                >
                  {step > s.n ? (
                    <CheckCircle size={16} weight="fill" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{s.n}</span>
                  )}
                  <span className="step-label">{s.label}</span>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`step-connector ${step > s.n ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Wizard Card */}
        <div className="wizard-card">
          {/* Step 1: Upload */}
          {step === 1 && (
            <>
              <div className="wizard-step-header">
                <h2 className="wizard-step-title">Upload Dataset</h2>
                <p className="wizard-step-desc">
                  Drop a CSV file. ModelPilot will profile it automatically.
                </p>
              </div>
              <DatasetUpload onUploaded={onDatasetReady} />
            </>
          )}

          {/* Step 2: Profile */}
          {step === 2 && dataset && (
            <>
              <div className="wizard-step-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="wizard-step-title">Review Dataset Profile</h2>
                    <p className="wizard-step-desc">
                      Confirm the analysis and select your target column.
                    </p>
                  </div>
                  <div className="flex items-center gap-sm">
                    <Flask size={14} weight="regular" style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true" />
                    <span className="text-xs text-muted font-mono">{dataset.filename}</span>
                  </div>
                </div>
              </div>
              <DatasetProfileView
                profile={dataset}
                selectedTarget={targetColumn}
                onTargetChange={setTargetColumn}
              />
            </>
          )}

          {/* Step 3: Objective */}
          {step === 3 && (
            <>
              <div className="wizard-step-header">
                <h2 className="wizard-step-title">Set Objective &amp; Launch</h2>
                <p className="wizard-step-desc">
                  Choose what ModelPilot should optimize and configure constraints.
                </p>
              </div>

              {/* Objective selector */}
              <div className="form-group mb-2xl">
                <label>Optimization Objective <span style={{ color: 'var(--color-destructive)', marginLeft: 2 }}>*</span></label>
                <p className="form-helper mb-md">What metric should ModelPilot maximize?</p>
                <div className="flex flex-col gap-md">
                  {OBJECTIVE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`objective-option ${objective === opt.value ? 'selected' : ''}`}
                      onClick={() => setObjective(opt.value)}
                      aria-pressed={objective === opt.value}
                    >
                      <div className="flex items-center gap-md">
                        <div className={`objective-radio ${objective === opt.value ? 'checked' : ''}`} aria-hidden="true" />
                        <div>
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted mt-xs">{opt.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Precision */}
              <div className="form-group mb-2xl">
                <label htmlFor="min-precision-input">
                  Minimum Precision Constraint
                </label>
                <p className="form-helper mb-md">
                  ModelPilot will only accept models that meet this precision threshold (0.0–1.0).
                </p>
                <div className="flex items-center gap-md">
                  <input
                    id="min-precision-input"
                    className="input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={minPrecision}
                    onChange={e => setMinPrecision(parseFloat(e.target.value))}
                    style={{ maxWidth: 120 }}
                  />
                  <span className="text-sm text-muted">
                    ≥ <strong className="font-mono">{(minPrecision * 100).toFixed(0)}%</strong> precision required
                  </span>
                </div>
              </div>

              {/* Max Experiments */}
              <div className="form-group">
                <label htmlFor="max-exp-input">Number of Optimization Iterations</label>
                <div className="flex items-center gap-sm mt-xs mb-sm flex-wrap">
                  {[
                    { n: 1, label: '1 (Fast · ~2s)' },
                    { n: 2, label: '2 (Recommended · ~15s)' },
                    { n: 3, label: '3 (Thorough · ~30s)' },
                  ].map(preset => (
                    <button
                      key={preset.n}
                      type="button"
                      className={`btn btn-sm ${maxExperiments === preset.n ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setMaxExperiments(preset.n)}
                      disabled={launching}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-md">
                  <span className="text-xs text-muted">Custom:</span>
                  <input
                    id="max-exp-input"
                    className="input"
                    type="number"
                    min="1"
                    max="5"
                    value={maxExperiments}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) setMaxExperiments(Math.min(5, Math.max(1, v)));
                    }}
                    style={{ maxWidth: 80, padding: '4px 8px' }}
                    aria-describedby="max-exp-hint"
                    disabled={launching}
                  />
                  <span className="text-xs text-muted">(1–5 iterations)</span>
                </div>
                {maxExperiments >= 4 && (
                  <p className="text-xs mt-sm" style={{ color: 'var(--color-warning, #f59e0b)', margin: '8px 0 0 0' }}>
                    ⚠️ Running {maxExperiments} experiments with cloud LLM inference may take 60–90 seconds. Keep this tab open.
                  </p>
                )}
              </div>

              {/* Summary */}
              {dataset && targetColumn && (
                <div className="review-section mt-2xl">
                  <div className="review-label">Optimization Summary</div>
                  <div className="objective-display">
                    Maximize <strong>{objective}</strong> with precision ≥ {(minPrecision * 100).toFixed(0)}%
                  </div>
                  <div className="flex items-center gap-sm mt-lg text-xs text-muted">
                    <Flask size={12} aria-hidden="true" />
                    Up to {maxExperiments} experiments · Target: <span className="font-mono">{targetColumn}</span> · Dataset: <span className="font-mono">{dataset.filename}</span>
                  </div>
                </div>
              )}

              {/* Live Optimization Progress Indicator */}
              {launching && (
                <div
                  style={{
                    marginTop: 'var(--space-xl)',
                    padding: 'var(--space-lg)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-md">
                      <Spinner size={18} className="spin" style={{ color: 'var(--color-primary, #3b82f6)' }} aria-hidden="true" />
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        {LAUNCH_STAGES[launchStage]}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-muted" style={{ fontWeight: 600 }}>
                      {elapsedSeconds}s
                    </span>
                  </div>
                  <div style={{ height: 4, width: '100%', background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', margin: '8px 0' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(95, (launchStage + 1) * 20)}%`,
                        background: 'var(--color-primary, #3b82f6)',
                        borderRadius: 99,
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>
                    {elapsedSeconds > 40
                      ? 'Render cloud backend is cold-starting or training models. Almost ready, please keep this tab open…'
                      : `Running ${maxExperiments} experiment${maxExperiments > 1 ? 's' : ''} (calibrated for Render cloud). Keep this tab open.`}
                  </p>
                </div>
              )}

              {/* Optimization Launch Error Alert */}
              {launchError && (
                <div
                  style={{
                    marginTop: 'var(--space-xl)',
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-md)',
                  }}
                  role="alert"
                >
                  <WarningCircle size={20} weight="fill" style={{ color: 'var(--color-destructive, #ef4444)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-destructive, #ef4444)', marginBottom: 2 }}>
                      Optimization Failed
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                      {launchError}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer navigation */}
          <div className="wizard-footer">
            <button
              className="btn btn-secondary"
              onClick={back}
              disabled={step === 1}
              type="button"
            >
              <ArrowLeft size={16} weight="bold" aria-hidden="true" />
              Back
            </button>

            <span className="text-xs text-muted" aria-live="polite">
              Step {step} of {STEPS.length}
            </span>

            {step < 3 ? (
              <button
                className="btn btn-primary"
                onClick={next}
                disabled={!canAdvance()}
                type="button"
              >
                Next
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={launch}
                disabled={launching}
                type="button"
                aria-busy={launching}
              >
                {launching ? (
                  <>
                    <Spinner size={16} className="spin" aria-hidden="true" />
                    Running optimization…
                  </>
                ) : (
                  <>
                    <RocketLaunch size={16} weight="bold" aria-hidden="true" />
                    Launch Experiment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
