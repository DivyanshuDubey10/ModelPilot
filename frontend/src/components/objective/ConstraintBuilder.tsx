import { useState } from 'react';
import { Plus, X } from '@phosphor-icons/react';

// Constraint is a wizard-local UI concept (not a backend type)
export interface Constraint {
  metric: string;
  operator: '>=' | '<=' | '>' | '<';
  value: number;
}


const METRICS = ['recall', 'precision', 'f1', 'accuracy', 'roc_auc', 'pr_auc'];
const OPERATORS = [
  { value: '>=', label: '≥' },
  { value: '<=', label: '≤' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
];

interface ConstraintBuilderProps {
  objective: string;
  onObjectiveChange: (v: string) => void;
  constraints: Constraint[];
  onConstraintsChange: (c: Constraint[]) => void;
  maxIterations: number;
  onMaxIterationsChange: (n: number) => void;
}

export default function ConstraintBuilder({
  objective,
  onObjectiveChange,
  constraints,
  onConstraintsChange,
  maxIterations,
  onMaxIterationsChange,
}: ConstraintBuilderProps) {
  const [objectiveFocused, setObjectiveFocused] = useState(false);

  const EXAMPLES = [
    'Maximize recall while keeping precision above 70%',
    'Maximize F1 score',
    'Maximize accuracy with recall ≥ 0.85',
  ];

  function addConstraint() {
    onConstraintsChange([
      ...constraints,
      { metric: 'precision', operator: '>=', value: 0.7 },
    ]);
  }

  function removeConstraint(i: number) {
    onConstraintsChange(constraints.filter((_, idx) => idx !== i));
  }

  function updateConstraint(i: number, patch: Partial<Constraint>) {
    onConstraintsChange(
      constraints.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    );
  }

  return (
    <div>
      {/* Objective */}
      <div className="form-group mb-2xl">
        <label htmlFor="objective-input">
          ML Objective
          <span style={{ color: 'var(--color-destructive)', marginLeft: 2 }} aria-hidden="true">*</span>
        </label>
        <textarea
          id="objective-input"
          className="input"
          style={{ minHeight: 80, resize: 'vertical', lineHeight: '1.6' }}
          placeholder="e.g. Maximize recall while keeping precision above 70%"
          value={objective}
          onChange={e => onObjectiveChange(e.target.value)}
          onFocus={() => setObjectiveFocused(true)}
          onBlur={() => setObjectiveFocused(false)}
          required
          aria-required="true"
          aria-describedby="objective-hint"
        />
        <p className="form-helper" id="objective-hint">
          Describe what you want to optimize. Be specific about your priorities.
        </p>

        {/* Example prompts */}
        {objectiveFocused && !objective && (
          <div className="flex flex-col gap-sm mt-md">
            <span className="text-xs text-muted">Examples:</span>
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                className="btn btn-ghost btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  textAlign: 'left',
                  border: '1px solid var(--color-border)',
                }}
                type="button"
                onClick={() => onObjectiveChange(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Constraints */}
      <div className="form-group mb-2xl">
        <label>Performance Constraints</label>
        <p className="form-helper mb-md">
          Optional hard limits ModelPilot must satisfy to accept a result.
        </p>

        {constraints.length > 0 && (
          <div className="constraint-list">
            {constraints.map((c, i) => (
              <div key={i} className="constraint-row">
                <select
                  className="select"
                  value={c.metric}
                  onChange={e => updateConstraint(i, { metric: e.target.value })}
                  aria-label={`Constraint ${i + 1} metric`}
                >
                  {METRICS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  className="select"
                  value={c.operator}
                  onChange={e => updateConstraint(i, { operator: e.target.value as Constraint['operator'] })}
                  aria-label={`Constraint ${i + 1} operator`}
                >
                  {OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                <input
                  className="input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={c.value}
                  onChange={e => updateConstraint(i, { value: parseFloat(e.target.value) })}
                  aria-label={`Constraint ${i + 1} value`}
                />

                <button
                  className="remove-btn"
                  onClick={() => removeConstraint(i)}
                  type="button"
                  aria-label={`Remove constraint ${i + 1}`}
                >
                  <X size={16} weight="bold" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="add-constraint-btn"
          onClick={addConstraint}
          type="button"
        >
          <Plus size={16} weight="bold" aria-hidden="true" />
          Add constraint
        </button>
      </div>

      {/* Max iterations */}
      <div className="form-group">
        <label htmlFor="max-iter-input">
          Max iterations
        </label>
        <input
          id="max-iter-input"
          className="input"
          type="number"
          min="1"
          max="30"
          value={maxIterations}
          onChange={e => onMaxIterationsChange(parseInt(e.target.value))}
          style={{ maxWidth: 160 }}
          aria-describedby="max-iter-hint"
        />
        <p className="form-helper" id="max-iter-hint">
          ModelPilot will stop experimenting after this many iterations (or when the objective is satisfied).
        </p>
      </div>
    </div>
  );
}
