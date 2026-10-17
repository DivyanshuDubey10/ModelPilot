// ============================================================
// ModelPilot API Types
// Proposed contracts for Divyanshu's FastAPI backend
// ============================================================

// ── Dataset ──────────────────────────────────────────────────

export interface DatasetProfile {
  id: string;
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  data_types: Record<string, string>;
  missing_values: Record<string, number>;
  duplicates: number;
  problem_type: 'classification' | 'regression';
  imbalanced: boolean;
  target_column: string;
}

// ── Constraints & Objectives ─────────────────────────────────

export interface Constraint {
  metric: string;
  operator: '>=' | '<=' | '>' | '<';
  value: number;
}

export interface CreateExperimentRequest {
  dataset_id: string;
  target_column: string;
  objective: string;
  constraints: Constraint[];
  max_iterations: number;
}

// ── Experiment ───────────────────────────────────────────────

export type ExperimentStatusType =
  | 'analyzing'
  | 'planning'
  | 'running'
  | 'evaluating'
  | 'optimizing'
  | 'completed'
  | 'failed';

export interface ExperimentIteration {
  iteration: number;
  model_type: string;
  parameters: Record<string, unknown>;
  metrics: Record<string, number>;
  confusion_matrix?: number[][];
  roc_curve?: {
    fpr: number[];
    tpr: number[];
    auc: number;
  };
  pr_curve?: {
    precision: number[];
    recall: number[];
    auc: number;
  };
  constraints_met: boolean;
  observations: string[];
  duration_seconds: number;
}

export interface ExperimentStatus {
  id: string;
  status: ExperimentStatusType;
  current_iteration: number;
  total_iterations: number;
  current_step: string;
  iterations: ExperimentIteration[];
  best_result?: ExperimentIteration;
  agent_reasoning?: string;
  objective: string;
  constraints: Constraint[];
  dataset_id: string;
  created_at: string;
}

// ── Final Report ─────────────────────────────────────────────

export interface FinalReport {
  experiment_id: string;
  objective: string;
  constraints: Constraint[];
  total_iterations: number;
  best_iteration: ExperimentIteration;
  all_iterations: ExperimentIteration[];
  recommendation: string;
  explanation: string;
  dataset_summary: DatasetProfile;
}

// ── API Responses ────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// ── SSE Event Types ──────────────────────────────────────────

export type SSEEventType =
  | 'status_update'
  | 'iteration_complete'
  | 'experiment_complete'
  | 'experiment_failed'
  | 'agent_reasoning';

export interface SSEEvent {
  type: SSEEventType;
  data: ExperimentStatus;
}

// ── Experiment Summary (for listing) ─────────────────────────

export interface ExperimentSummary {
  id: string;
  status: ExperimentStatusType;
  objective: string;
  dataset_filename: string;
  total_iterations: number;
  best_metric?: Record<string, number>;
  created_at: string;
  completed_at?: string;
}
