import { useEffect, useState, useCallback } from 'react';
import type { OptimizationRun } from '../api/types';
import { getOptimizationRun } from '../api/endpoints';

interface UseOptimizationRunOptions {
  runId?: string;
  experimentId?: string; // alias for backwards compatibility
  enabled?: boolean;
}

interface UseOptimizationRunResult {
  run: OptimizationRun | null;
  loading: boolean;
  error: string | null;
  isStreaming: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for retrieving optimization runs.
 *
 * Architecture Note:
 * ModelPilot's ML engine operates via HTTP endpoints (/api/optimize and /api/optimize/{run_id}).
 * Rather than simulating synthetic or fake SSE streaming progress, this hook retrieves
 * real execution data and results directly from the backend.
 */
export function useOptimizationRun({
  runId,
  experimentId,
  enabled = true,
}: UseOptimizationRunOptions): UseOptimizationRunResult {
  const targetId = runId || experimentId;
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(targetId && enabled));
  const [error, setError] = useState<string | null>(null);

  const fetchRun = useCallback(async () => {
    if (!targetId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOptimizationRun(targetId);
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load optimization run');
    } finally {
      setLoading(false);
    }
  }, [targetId, enabled]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  return {
    run,
    loading,
    error,
    isStreaming: false,
    refetch: fetchRun,
  };
}

// Alias for backwards-compatibility
export const useExperimentSSE = useOptimizationRun;
