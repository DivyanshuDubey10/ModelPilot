import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Flask,
  RocketLaunch,
  ArrowLeft,
  ArrowRight,
  Spinner,
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
  const [maxExperiments, setMaxExperiments] = useState(5);

  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

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
                <label htmlFor="max-exp-input">Max Experiments (1–5)</label>
                <input
                  id="max-exp-input"
                  className="input"
                  type="number"
                  min="1"
                  max="5"
                  value={maxExperiments}
                  onChange={e => setMaxExperiments(parseInt(e.target.value))}
                  style={{ maxWidth: 120 }}
                  aria-describedby="max-exp-hint"
                />
                <p className="form-helper mt-sm" id="max-exp-hint">
                  The agent will try up to this many Random Forest configurations.
                </p>
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

              {launchError && (
                <p className="form-error mt-lg" role="alert">{launchError}</p>
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
