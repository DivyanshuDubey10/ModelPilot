import { useEffect, useRef, useState } from 'react';
import type { ExperimentStatus, SSEEvent } from '../api/types';
import { getExperiment } from '../api/endpoints';
import { createSSEConnection } from '../api/client';

interface UseSSEOptions {
  experimentId: string | undefined;
  enabled: boolean;
}

interface UseSSEResult {
  status: ExperimentStatus | null;
  loading: boolean;
  error: string | null;
  isStreaming: boolean;
}

const TERMINAL_STATES = new Set(['completed', 'failed']);

export function useExperimentSSE({ experimentId, enabled }: UseSSEOptions): UseSSEResult {
  const [status, setStatus] = useState<ExperimentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!experimentId || !enabled) return;

    // Initial fetch
    getExperiment(experimentId)
      .then(data => {
        setStatus(data);
        setLoading(false);
        // If already terminal, don't open SSE
        if (TERMINAL_STATES.has(data.status)) return;
        openSSE();
      })
      .catch(() => {
        // Use mock data for UI dev when backend isn't running
        const mock = getMockStatus(experimentId);
        setStatus(mock);
        setLoading(false);
        if (!TERMINAL_STATES.has(mock.status)) {
          simulateMockProgress(experimentId, setStatus);
        }
      });

    function openSSE() {
      setIsStreaming(true);
      const es = createSSEConnection(
        `/api/experiments/${experimentId}/stream`,
        (event) => {
          try {
            const parsed: SSEEvent = JSON.parse(event.data);
            setStatus(parsed.data);
            if (TERMINAL_STATES.has(parsed.data.status)) {
              es.close();
              setIsStreaming(false);
            }
          } catch { /* ignore malformed events */ }
        },
        () => {
          setIsStreaming(false);
          setError('Stream disconnected');
        }
      );
      eventSourceRef.current = es;
    }

    return () => {
      eventSourceRef.current?.close();
      setIsStreaming(false);
    };
  }, [experimentId, enabled]);

  return { status, loading, error, isStreaming };
}

// ── Mock data for UI development ─────────────────────────────

function getMockStatus(id: string): ExperimentStatus {
  return {
    id,
    status: 'running',
    current_iteration: 2,
    total_iterations: 10,
    current_step: 'Training RandomForest with class_weight=balanced',
    objective: 'Maximize recall while keeping precision above 70%',
    constraints: [{ metric: 'precision', operator: '>=', value: 0.7 }],
    dataset_id: 'mock-dataset-001',
    created_at: new Date().toISOString(),
    agent_reasoning: 'Dataset shows significant class imbalance (0.17%). Starting with RandomForest + class weighting as baseline. Will try SMOTE preprocessing next if recall is below 0.80.',
    iterations: [
      {
        iteration: 1,
        model_type: 'LogisticRegression',
        parameters: { C: 1.0, class_weight: 'balanced', solver: 'lbfgs' },
        metrics: { recall: 0.72, precision: 0.65, f1: 0.685, accuracy: 0.9987 },
        confusion_matrix: [[284257, 58], [33, 459]],
        constraints_met: false,
        observations: [
          'Good recall baseline at 72%, but precision below threshold (65% < 70%).',
          'Class imbalance handled via class_weight=balanced.',
          'Next: try ensemble method for better precision-recall tradeoff.',
        ],
        duration_seconds: 14.2,
      },
      {
        iteration: 2,
        model_type: 'RandomForestClassifier',
        parameters: { n_estimators: 100, class_weight: 'balanced', max_depth: 10 },
        metrics: { recall: 0.82, precision: 0.74, f1: 0.777, accuracy: 0.9993 },
        confusion_matrix: [[284289, 26], [43, 449]],
        constraints_met: true,
        observations: [
          'Precision improved to 74% — constraint satisfied ✓',
          'Recall at 82% — above target baseline.',
          'Ensemble helps calibrate decision boundary better than linear model.',
          'Next: try XGBoost with threshold optimization.',
        ],
        duration_seconds: 31.7,
      },
    ],
    best_result: {
      iteration: 2,
      model_type: 'RandomForestClassifier',
      parameters: { n_estimators: 100, class_weight: 'balanced', max_depth: 10 },
      metrics: { recall: 0.82, precision: 0.74, f1: 0.777, accuracy: 0.9993 },
      confusion_matrix: [[284289, 26], [43, 449]],
      constraints_met: true,
      observations: [],
      duration_seconds: 31.7,
    },
  };
}

let mockTimer: ReturnType<typeof setTimeout> | null = null;

function simulateMockProgress(
  id: string,
  setStatus: (s: ExperimentStatus) => void
) {
  const newIteration = {
    iteration: 3,
    model_type: 'XGBoostClassifier',
    parameters: { n_estimators: 200, learning_rate: 0.05, scale_pos_weight: 577 },
    metrics: { recall: 0.89, precision: 0.78, f1: 0.832, accuracy: 0.9995 },
    confusion_matrix: [[284297, 18], [26, 466]],
    constraints_met: true,
    observations: [
      'Best result so far — recall 89%, precision 78% ✓',
      'scale_pos_weight handles imbalance natively in XGBoost.',
      'Trying threshold optimization next to push recall further.',
    ],
    duration_seconds: 45.1,
  };

  mockTimer = setTimeout(() => {
    setStatus({
      id,
      status: 'evaluating',
      current_iteration: 3,
      total_iterations: 10,
      current_step: 'Evaluating XGBoost with threshold optimization…',
      objective: 'Maximize recall while keeping precision above 70%',
      constraints: [{ metric: 'precision', operator: '>=', value: 0.7 }],
      dataset_id: 'mock-dataset-001',
      created_at: new Date().toISOString(),
      agent_reasoning: 'XGBoost with scale_pos_weight shows significant improvement. Recall jumped from 82% → 89% while maintaining precision at 78%. Now evaluating optimal classification threshold via cross-validation.',
      iterations: [
        getMockStatus(id).iterations[0],
        getMockStatus(id).iterations[1],
        newIteration,
      ],
      best_result: newIteration,
    });
  }, 4000);

  return () => { if (mockTimer) clearTimeout(mockTimer); };
}
