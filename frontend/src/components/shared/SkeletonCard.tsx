interface SkeletonCardProps {
  lines?: number;
  showTitle?: boolean;
  className?: string;
}

export default function SkeletonCard({
  lines = 3,
  showTitle = true,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`card ${className}`}
      aria-busy="true"
      aria-label="Loading content"
    >
      {showTitle && (
        <div className="skeleton skeleton-title mb-lg" style={{ width: '50%' }} />
      )}
      <div className="flex flex-col gap-md">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton-text"
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    </div>
  );
}
