import { Tray } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-3xl gap-xl" style={{ minHeight: 300 }}>
      <div style={{ color: 'var(--color-muted-foreground)', opacity: 0.5 }}>
        {icon || <Tray size={48} weight="light" aria-hidden="true" />}
      </div>
      <div>
        <h3 style={{ marginBottom: 'var(--space-sm)' }}>{title}</h3>
        {description && (
          <p className="text-sm text-muted" style={{ maxWidth: 400 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-lg">{action}</div>}
    </div>
  );
}
