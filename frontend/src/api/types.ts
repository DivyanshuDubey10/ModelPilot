// ============================================================
// ModelPilot API Types — aligned to FastAPI backend
// ============================================================

// ── Dataset Upload Response (/api/upload) ─────────────────────

export interface UploadResponse {
  dataset_path: string;  // absolute server-side path for subsequent API calls
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  data_types: Record<string, string>;
  missing_values: Record<string, number>;
  duplicates: number;
}

// ── Profile Response (/api/profile) ──────────────────────────

export interface ProfileResponse {
  filename: string;
  profile: {
    rows: number;
    columns: number;
    column_names: string[];
    data_types: Record<string, string>;
    missing_values: Record<string, number>;
    duplicates: number;
  };
  problem_type: {
    problem_type: string;
    num_classes?: number;
    class_distribution?: Record<string, number>;
    is_imbalanced?: boolean;
  };
}

// ── Single Experiment Result (/api/experiment) ────────────────

export interface SingleExperimentResult {
  model_name: string;
  n_estimators: number;
  metrics: Record<string, number>;
}

// ── Optimization Request & Response (/api/optimize) ──────────

export interface OptimizeRequest {
  dataset_path: string;
  target: string;
  objective: 'recall' | 'f1' | 'accuracy';
  min_precision: number;
  max_experiments: number;
}

export interface OptimizeExperiment {
  dataset_path: string;
  target: string;
  objective: string;
  min_precision: number;
  model_name: string;
  n_estimators: number;
  metrics: Record<string, number>;
}

export interface OptimizeSummary {
  decision: string;
  reason: string;
  configurations_tested?: number;
  alternatives_with_lower_objective_score?: number;
  precision_constraint_satisfied?: boolean;
  next_step: string;
}

export interface OptimizeResponse {
  run_id: string;
  experiments_run: number;
  experiments: OptimizeExperiment[];
  best_experiment: OptimizeExperiment | null;
  constraint_satisfied: boolean;
  optimization_summary: OptimizeSummary;
}

// ── Optimization Run Detail (/api/optimize/{run_id}) ──────────

export interface OptimizationRun {
  run_id: string;
  created_at: string;
  metadata: {
    dataset_path: string;
    target: string;
    objective: string;
    min_precision: number;
    max_experiments: number;
  };
  experiments: OptimizeExperiment[];
}

// ── Run Summary (/api/runs) ───────────────────────────────────

export interface RunSummary {
  run_id: string;
  created_at: string;
  dataset_path: string;
  target: string;
  objective: string;
  min_precision: number | null;
  total_experiments: number;
  best_metrics: Record<string, number> | null;
}

// ── History Record (/api/history) ────────────────────────────

export interface HistoryRecord {
  dataset_path?: string;
  target?: string;
  objective?: string;
  min_precision?: number;
  model_name: string;
  n_estimators: number;
  metrics: Record<string, number>;
}

// ── Wizard state (client-only) ────────────────────────────────

/** Held in React state while user goes through the 3-step wizard. */
export interface WizardDataset {
  dataset_path: string;  // server-side path sent back from /api/upload
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  data_types: Record<string, string>;
  missing_values: Record<string, number>;
  duplicates: number;
  problem_type?: string;
  is_imbalanced?: boolean;
}


