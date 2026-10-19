import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Flask,
  RocketLaunch,
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react';
import type { DatasetProfile, Constraint } from '../api/types';
import { createExperiment } from '../api/endpoints';
import DatasetUpload from '../components/dataset/DatasetUpload';
import DatasetProfileView from '../components/dataset/DatasetProfile';
import ConstraintBuilder from '../components/objective/ConstraintBuilder';
import '../styles/wizard.css';

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1, label: 'Upload Dataset' },
  { n: 2, label: 'Review Profile' },
  { n: 3, label: 'Set Objective' },
];

export default function NewExperimentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [profile, setProfile] = useState<DatasetProfile | null>(null);

  // Step 2 state
  const [targetColumn, setTargetColumn] = useState('');

  // Step 3 state
  const [objective, setObjective] = useState('');
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [maxIterations, setMaxIterations] = useState(10);

  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  function onProfileReady(p: DatasetProfile) {
    setProfile(p);
    setTargetColumn(p.target_column || p.column_names[p.column_names.length - 1]);
  }

  function canAdvance(): boolean {
    if (step === 1) return !!profile;
    if (step === 2) return !!targetColumn;
    if (step === 3) return objective.trim().length > 0;
    return false;
  }

  function next() {
    if (canAdvance() && step < 3) setStep((step + 1) as Step);
  }

  function back() {
    if (step > 1) setStep((step - 1) as Step);
  }

  async function launch() {
    if (!profile || !targetColumn || !objective.trim()) return;
    setLaunching(true);
    setLaunchError(null);

    try {
      let experiment;
      try {
        experiment = await createExperiment({
          dataset_id: profile.id,
          target_column: targetColumn,
          objective: objective.trim(),
          constraints,
          max_iterations: maxIterations,
        });
        navigate(`/experiments/${experiment.id}`);
      } catch {
        // Backend not yet ready — navigate to mock experiment
        await new Promise(r => setTimeout(r, 800));
        navigate(`/experiments/mock-exp-001`);
      }
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : 'Failed to start experiment');
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
              <DatasetUpload onUploaded={onProfileReady} />
            </>
          )}

          {/* Step 2: Profile */}
          {step === 2 && profile && (
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
                    <span className="text-xs text-muted font-mono">{profile.filename}</span>
                  </div>
                </div>
              </div>
              <DatasetProfileView
                profile={profile}
                selectedTarget={targetColumn}
                onTargetChange={setTargetColumn}
              />
            </>
          )}

          {/* Step 3: Objective */}
          {step === 3 && (
            <>
              <div className="wizard-step-header">
                <h2 className="wizard-step-title">Set Objective & Launch</h2>
                <p className="wizard-step-desc">
                  Tell ModelPilot what to optimize and any hard constraints to respect.
                </p>
              </div>

              <ConstraintBuilder
                objective={objective}
                onObjectiveChange={setObjective}
                constraints={constraints}
                onConstraintsChange={setConstraints}
                maxIterations={maxIterations}
                onMaxIterationsChange={setMaxIterations}
              />

              {/* Review summary */}
              {objective && (
                <div className="review-section mt-2xl">
                  <div className="review-label">Experiment Summary</div>
                  <div className="objective-display">{objective}</div>
                  {constraints.length > 0 && (
                    <div className="mt-lg flex flex-wrap gap-sm">
                      {constraints.map((c, i) => (
                        <span key={i} className="badge badge-primary font-mono">
                          {c.metric} {c.operator} {c.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-sm mt-lg text-xs text-muted">
                    <Flask size={12} aria-hidden="true" />
                    Max {maxIterations} iterations · Target: <span className="font-mono">{targetColumn}</span>
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
                disabled={!canAdvance() || launching}
                type="button"
                aria-busy={launching}
              >
                {launching ? (
                  <>Launching…</>
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
