interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'default' | 'accent';
  label?: string;
  showText?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  variant = 'default',
  label,
  showText = false,
  className = '',
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className={className}>
      {(label || showText) && (
        <div className="flex justify-between items-center mb-sm">
          {label && <span className="text-xs text-muted">{label}</span>}
          {showText && (
            <span className="text-xs font-mono text-muted">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`progress-bar ${variant === 'accent' ? 'progress-bar-accent' : ''}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
