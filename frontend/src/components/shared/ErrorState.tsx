import { WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-3xl gap-xl"
      role="alert"
      style={{ minHeight: 300 }}
    >
      <WarningCircle
        size={48}
        weight="light"
        style={{ color: 'var(--color-destructive)', opacity: 0.7 }}
        aria-hidden="true"
      />
      <div>
        <h3 style={{ marginBottom: 'var(--space-sm)' }}>{title}</h3>
        <p className="text-sm text-muted" style={{ maxWidth: 400 }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} type="button">
          <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />
          Try Again
        </button>
      )}
    </div>
  );
}
