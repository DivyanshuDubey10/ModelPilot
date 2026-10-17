import { CircleNotch } from '@phosphor-icons/react';

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
}

export default function LoadingSpinner({ size = 24, label }: LoadingSpinnerProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-lg"
      role="status"
      aria-label={label || 'Loading'}
    >
      <CircleNotch
        size={size}
        weight="bold"
        className="spinner-icon"
        aria-hidden="true"
      />
      {label && <span className="text-sm text-muted">{label}</span>}
      <style>{`
        .spinner-icon {
          animation: spin 0.8s linear infinite;
          color: var(--color-accent);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spinner-icon { animation: none; }
        }
      `}</style>
    </div>
  );
}
