// ============================================================
// ModelPilot API Endpoints — aligned to FastAPI backend
// ============================================================

import { api } from './client';
import type {
  UploadResponse,
  ProfileResponse,
  OptimizeRequest,
  OptimizeResponse,
  OptimizationRun,
  RunSummary,
  HistoryRecord,
} from './types';

// ── Health ────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return api.get('/api/health');
}

// ── Dataset Upload ────────────────────────────────────────────

/**
 * Upload a CSV file. The backend saves it to backend/datasets/ and
 * returns a profile + the server-side path used in subsequent calls.
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return api.postForm<UploadResponse>('/api/upload', formData);
}

// ── Dataset Profile (by path) ─────────────────────────────────

export async function profileDataset(
  dataset_path: string,
  target: string
): Promise<ProfileResponse> {
  return api.post<ProfileResponse>('/api/profile', { dataset_path, target });
}

// ── Problem Analysis ──────────────────────────────────────────

export async function analyzeDataset(
  dataset_path: string,
  target: string
): Promise<{ dataset_path: string; target: string; analysis: ProfileResponse['problem_type'] }> {
  return api.post('/api/analyze', { dataset_path, target });
}

// ── Autonomous Optimization ───────────────────────────────────

/**
 * Run the autonomous optimization loop.
 * The backend tries up to max_experiments Random Forest configurations,
 * selects the best by objective, and returns all results synchronously.
 */
export async function runOptimization(
  data: OptimizeRequest
): Promise<OptimizeResponse> {
  return api.post<OptimizeResponse>('/api/optimize', data);
}

// ── Retrieve a Saved Optimization Run ────────────────────────

export async function getOptimizationRun(runId: string): Promise<OptimizationRun> {
  return api.get<OptimizationRun>(`/api/optimize/${runId}`);
}

// ── List All Optimization Runs ────────────────────────────────

export async function listRuns(): Promise<RunSummary[]> {
  return api.get<RunSummary[]>('/api/runs');
}

// ── Flat Experiment History ───────────────────────────────────

export async function getHistory(): Promise<HistoryRecord[]> {
  return api.get<HistoryRecord[]>('/api/history');
}
