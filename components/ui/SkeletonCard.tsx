'use client';

import React from 'react';
import { colors } from '@/lib/design-system';

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export function SkeletonCard({ count = 1, className = '' }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg border p-4 sm:p-6 ${className}`}
          style={{
            borderColor: colors.text.secondary + '30',
            backgroundColor: colors.background.main,
          }}
          aria-label="Loading"
          aria-busy="true"
        >
          {/* Icon */}
          <div className="mb-3 sm:mb-4">
            <div
              className="w-12 h-12 rounded shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Repository Name */}
          <div className="mb-2">
            <div
              className="h-6 sm:h-8 w-3/4 rounded shimmer mb-2"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
            <div
              className="h-4 sm:h-5 w-full rounded shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Description */}
          <div className="mb-3 space-y-2">
            <div
              className="h-4 w-full rounded shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
            <div
              className="h-4 w-2/3 rounded shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Status Badge */}
          <div className="mb-3">
            <div
              className="h-6 w-24 rounded-full shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Last Check Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div
              className="h-3 sm:h-4 w-32 rounded shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
            <div
              className="h-3 sm:h-4 w-20 rounded shimmer"
              style={{
                background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          <style jsx>{`
            @keyframes shimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }

            .shimmer {
              animation: shimmer 2s infinite;
            }
          `}</style>
        </div>
      ))}
    </>
  );
}
