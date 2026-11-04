export function SkeletonCard({ className = "w-[128px] sm:w-[150px] md:w-[168px]" }) {
  return (
    <div className={`${className} flex-none`} data-testid="skeleton-card">
      <div className="shimmer aspect-[2/3] rounded-md border border-white/[0.05]" />
      <div className="shimmer mt-2 h-3 w-3/4 rounded" />
      <div className="shimmer mt-1.5 h-2.5 w-1/2 rounded" />
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" data-testid="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="shimmer aspect-[2/3] rounded-md border border-white/[0.05]" />
          <div className="shimmer mt-2 h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}
