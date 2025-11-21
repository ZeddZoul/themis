import { colors } from '@/lib/design-system';

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{
        backgroundColor: colors.background.subtle,
        ...style,
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-32">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Trends Chart */}
      <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[300px]">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-full w-full" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-40 rounded-lg" />
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 h-24">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full rounded bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
