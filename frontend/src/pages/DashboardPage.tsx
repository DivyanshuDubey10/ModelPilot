import { useNavigate } from 'react-router-dom';
import { PlusCircle, Flask } from '@phosphor-icons/react';
import EmptyState from '../components/shared/EmptyState';

export default function DashboardPage() {
  const navigate = useNavigate();

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

      {/* KPI row: four simple labeled stats, no icon-heavy colored cards */}
      <div
        className="grid grid-cols-4 gap-xl mb-2xl"
        role="region"
        aria-label="Summary statistics"
      >
        {[
          { label: 'Total experiments', value: '0' },
          { label: 'Running', value: '0' },
          { label: 'Completed', value: '0' },
          { label: 'Best recall', value: '—' },
        ].map(({ label, value }) => (
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

      {/* Recent experiments */}
      <div className="card">
        <div
          className="text-sm font-semibold"
          style={{ marginBottom: 'var(--space-xl)', color: 'var(--color-text)' }}
        >
          Recent experiments
        </div>
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
      </div>
    </>
  );
}
