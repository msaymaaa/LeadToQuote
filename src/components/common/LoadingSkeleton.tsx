import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  type?: 'card' | 'table' | 'metric';
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  type = 'table',
  className = '',
}) => {
  if (type === 'metric') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#12141c] border border-[#222636] animate-pulse space-y-3"
          >
            <div className="h-3 w-20 bg-[#1c202d] rounded" />
            <div className="h-8 w-32 bg-[#252b3d] rounded" />
            <div className="h-2.5 w-24 bg-[#1c202d] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#12141c] border border-[#222636] animate-pulse space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-[#252b3d] rounded" />
              <div className="h-5 w-16 bg-[#1c202d] rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#1c202d] rounded" />
              <div className="h-3 w-4/5 bg-[#1c202d] rounded" />
            </div>
            <div className="pt-3 border-t border-[#1c202d] flex justify-between">
              <div className="h-3 w-20 bg-[#1c202d] rounded" />
              <div className="h-3 w-16 bg-[#252b3d] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default Table Skeleton
  return (
    <div className={`rounded-2xl bg-[#12141c] border border-[#222636] overflow-hidden ${className}`}>
      <div className="p-4 border-b border-[#222636] flex justify-between items-center bg-[#0e1017]">
        <div className="h-4 w-32 bg-[#252b3d] rounded animate-pulse" />
        <div className="h-8 w-24 bg-[#1c202d] rounded animate-pulse" />
      </div>
      <div className="divide-y divide-[#1e2230]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#1c202d]" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-40 bg-[#252b3d] rounded" />
                <div className="h-2.5 w-24 bg-[#1a1d28] rounded" />
              </div>
            </div>
            <div className="h-5 w-20 bg-[#1c202d] rounded-full" />
            <div className="h-4 w-16 bg-[#252b3d] rounded hidden sm:block" />
            <div className="h-4 w-8 bg-[#1c202d] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
