type StatusKey = 'analyzing' | 'planning' | 'running' | 'evaluating' | 'optimizing' | 'completed' | 'failed';

const statusConfig: Record<StatusKey, { label: string; className: string; dot: string }> = {
  analyzing: { label: 'Analyzing', className: 'badge-primary', dot: 'var(--color-accent)' },
  planning:  { label: 'Planning',  className: 'badge-primary', dot: 'var(--color-accent)' },
  running:   { label: 'Running',   className: 'badge-warning', dot: 'var(--color-warning)' },
  evaluating:{ label: 'Evaluating',className: 'badge-warning', dot: 'var(--color-warning)' },
  optimizing:{ label: 'Optimizing',className: 'badge-warning', dot: 'var(--color-warning)' },
  completed: { label: 'Completed', className: 'badge-success', dot: 'var(--color-success)' },
  failed:    { label: 'Failed',    className: 'badge-destructive', dot: 'var(--color-destructive)' },
};

const fallback = { label: 'Unknown', className: 'badge-primary', dot: 'var(--color-accent)' };

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status as StatusKey] ?? fallback;

  return (
    <span className={`badge ${config.className}`}>
      {showDot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: config.dot,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}
