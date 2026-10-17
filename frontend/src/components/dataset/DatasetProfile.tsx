import {
  CheckCircle,
  Warning,
  Info,
  Table,
  Rows,
  Columns,
  Scales,
} from '@phosphor-icons/react';
import type { DatasetProfile } from '../../api/types';

interface DatasetProfileViewProps {
  profile: DatasetProfile;
  selectedTarget: string;
  onTargetChange: (col: string) => void;
}

export default function DatasetProfileView({
  profile,
  selectedTarget,
  onTargetChange,
}: DatasetProfileViewProps) {
  const missingTotal = Object.values(profile.missing_values).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Stats grid */}
      <div className="profile-grid">
        <div className="profile-stat">
          <div className="profile-stat-label flex items-center gap-sm">
            <Rows size={13} aria-hidden="true" />
            Rows
          </div>
          <div className="profile-stat-value">{profile.rows.toLocaleString()}</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-label flex items-center gap-sm">
            <Columns size={13} aria-hidden="true" />
            Columns
          </div>
          <div className="profile-stat-value">{profile.columns}</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-label flex items-center gap-sm">
            <Table size={13} aria-hidden="true" />
            Missing Values
          </div>
          <div className="profile-stat-value"
            style={{ color: missingTotal > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {missingTotal}
          </div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-label flex items-center gap-sm">
            <Scales size={13} aria-hidden="true" />
            Duplicates
          </div>
          <div className="profile-stat-value"
            style={{ color: profile.duplicates > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {profile.duplicates}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="flex flex-col gap-md mb-2xl">
        <div className={`profile-insight ${profile.problem_type === 'classification' ? 'info' : 'success'}`}>
          <Info size={16} weight="fill" style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <div>
            <span className="font-semibold">Problem type detected: </span>
            <span className="font-mono">{profile.problem_type}</span>
          </div>
        </div>

        {profile.imbalanced && (
          <div className="profile-insight warning">
            <Warning size={16} weight="fill" style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <div>
              <span className="font-semibold">Class imbalance detected.</span>
              {' '}ModelPilot will apply SMOTE / class-weighting strategies automatically.
            </div>
          </div>
        )}

        {missingTotal === 0 && (
          <div className="profile-insight success">
            <CheckCircle size={16} weight="fill" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <div>No missing values found — dataset is clean.</div>
          </div>
        )}
      </div>

      {/* Target column selector */}
      <div className="form-group">
        <label htmlFor="target-column-list">
          Select target column
          <span style={{ color: 'var(--color-destructive)', marginLeft: 2 }} aria-hidden="true">*</span>
        </label>
        <p className="form-helper mb-md">
          This is the column ModelPilot will learn to predict.
        </p>
        <div
          className="column-selector"
          id="target-column-list"
          role="listbox"
          aria-label="Select target column"
          aria-required="true"
        >
          {profile.column_names.map(col => (
            <div
              key={col}
              className={`column-option ${selectedTarget === col ? 'selected' : ''}`}
              role="option"
              aria-selected={selectedTarget === col}
              onClick={() => onTargetChange(col)}
              onKeyDown={e => e.key === 'Enter' && onTargetChange(col)}
              tabIndex={0}
            >
              <span className="flex-1 font-mono text-sm">{col}</span>
              <span className="column-type-badge">
                {profile.data_types[col] || 'unknown'}
              </span>
              {selectedTarget === col && (
                <CheckCircle
                  size={16}
                  weight="fill"
                  style={{ color: 'var(--color-accent)', flexShrink: 0 }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
