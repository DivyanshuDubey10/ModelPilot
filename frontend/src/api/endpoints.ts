// ============================================================
// ModelPilot API Endpoints
// All backend communication goes through these functions
// ============================================================

import { api } from './client';
import type {
  DatasetProfile,
  CreateExperimentRequest,
  ExperimentStatus,
  ExperimentSummary,
  FinalReport,
} from './types';

// ── Dataset ──────────────────────────────────────────────────

export async function uploadDataset(file: File): Promise<DatasetProfile> {
  const formData = new FormData();
  formData.append('file', file);
  return api.postForm<DatasetProfile>('/api/datasets/upload', formData);
}

export async function getDatasetProfile(id: string): Promise<DatasetProfile> {
  return api.get<DatasetProfile>(`/api/datasets/${id}`);
}

// ── Experiments ──────────────────────────────────────────────

export async function createExperiment(
  data: CreateExperimentRequest
): Promise<ExperimentStatus> {
  return api.post<ExperimentStatus>('/api/experiments', data);
}

export async function getExperiment(id: string): Promise<ExperimentStatus> {
  return api.get<ExperimentStatus>(`/api/experiments/${id}`);
}

export async function listExperiments(): Promise<ExperimentSummary[]> {
  return api.get<ExperimentSummary[]>('/api/experiments');
}

// ── Report ───────────────────────────────────────────────────

export async function getExperimentReport(id: string): Promise<FinalReport> {
  return api.get<FinalReport>(`/api/experiments/${id}/report`);
}
