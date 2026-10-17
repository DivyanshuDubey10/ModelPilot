import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Flask,
  ChartLineUp,
  Lightning,
} from '@phosphor-icons/react';
import EmptyState from '../components/shared/EmptyState';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Autonomous ML experimentation at a glance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-xl mb-2xl">
        <div className="card">
          <div className="flex items-center gap-md mb-md">
            <Flask size={18} weight="duotone" style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
            <span className="text-xs text-muted font-medium">Total Experiments</span>
          </div>
          <div className="text-2xl font-bold">0</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-md mb-md">
            <Lightning size={18} weight="duotone" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <span className="text-xs text-muted font-medium">Running</span>
          </div>
          <div className="text-2xl font-bold">0</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-md mb-md">
            <ChartLineUp size={18} weight="duotone" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
            <span className="text-xs text-muted font-medium">Completed</span>
          </div>
          <div className="text-2xl font-bold">0</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-md mb-md">
            <ChartLineUp size={18} weight="duotone" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
            <span className="text-xs text-muted font-medium">Best Recall</span>
          </div>
          <div className="text-2xl font-bold">—</div>
        </div>
      </div>

      {/* Recent Experiments */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-xl)' }}>Recent Experiments</h3>
        <EmptyState
          icon={<Flask size={40} weight="light" />}
          title="No experiments yet"
          description="Upload a dataset and define your ML objective to start your first experiment."
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
    </>
  );
}
