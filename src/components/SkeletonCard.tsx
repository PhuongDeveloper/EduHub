import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-card flex items-center justify-between gap-4">
      {/* Left Area */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Squircle Icon Skeleton */}
        <div className="w-13 h-13 rounded-2xl animate-shimmer shrink-0" />

        {/* Text Lines Skeleton */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded-md animate-shimmer" />
            <div className="w-2/5 h-4.5 rounded-md animate-shimmer" />
            <div className="w-12 h-3.5 rounded-md animate-shimmer" />
          </div>
          <div className="w-4/5 h-3.5 rounded-md animate-shimmer" />
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-20 h-3 rounded-md animate-shimmer" />
            <div className="w-28 h-3 rounded-md animate-shimmer" />
            <div className="w-16 h-4 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Upvote Button Skeleton */}
      <div className="w-[54px] sm:w-[58px] h-[58px] sm:h-[62px] rounded-2xl animate-shimmer shrink-0" />
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};
