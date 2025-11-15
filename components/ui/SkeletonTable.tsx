'use client';

import React from 'react';
import { colors } from '@/lib/design-system';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 6, className = '' }: SkeletonTableProps) {
  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className={`hidden md:block overflow-x-auto ${className}`} aria-label="Loading" aria-busy="true">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: colors.background.subtle }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  scope="col"
                  className="text-left px-4 py-3 border-b"
                  style={{
                    borderColor: colors.text.secondary + '20',
                  }}
                >
                  <div
                    className="h-4 w-24 rounded shimmer"
                    style={{
                      background: `linear-gradient(90deg, #E8EAED 0%, #D1D5DB 50%, #E8EAED 100%)`,
                      backgroundSize: '200% 100%',
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b"
                style={{
                  borderColor: colors.text.secondary + '20',
                  backgroundColor: colors.background.main,
                }}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div
                      className="h-4 rounded shimmer"
                      style={{
                        width: colIndex === 0 ? '80px' : colIndex === columns - 1 ? '40px' : '120px',
                        background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className={`md:hidden space-y-3 ${className}`} aria-label="Loading" aria-busy="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="w-full p-4 rounded-lg border"
            style={{
              borderColor: colors.text.secondary + '40',
              backgroundColor: colors.background.main,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div
                  className="h-5 w-32 rounded shimmer"
                  style={{
                    background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                    backgroundSize: '200% 100%',
                  }}
                />
                <div
                  className="h-3 w-24 rounded shimmer"
                  style={{
                    background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
              <div
                className="h-6 w-20 rounded-full shimmer"
                style={{
                  background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                  backgroundSize: '200% 100%',
                }}
              />
            </div>

            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, lineIndex) => (
                <div key={lineIndex} className="flex justify-between">
                  <div
                    className="h-4 w-20 rounded shimmer"
                    style={{
                      background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                      backgroundSize: '200% 100%',
                    }}
                  />
                  <div
                    className="h-4 w-24 rounded shimmer"
                    style={{
                      background: `linear-gradient(90deg, ${colors.background.subtle} 0%, #E8EAED 50%, ${colors.background.subtle} 100%)`,
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
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
    </>
  );
}
