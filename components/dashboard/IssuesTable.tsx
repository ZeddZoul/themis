'use client';

import { useRef, useEffect, useCallback } from 'react';
import { colors } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/lib/icons';
import { MdDescription } from 'react-icons/md';
import { getCheckRunErrorMessage } from '@/lib/error-messages';
import { InlineError } from '@/components/ui/error-display';

type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE';
type Severity = 'high' | 'medium' | 'low' | 'none';

export interface CheckRun {
  id: string;
  repositoryName: string;
  platforms: Platform[];
  checkDate: Date;
  highestSeverity: Severity;
  totalIssues: number;
  status?: string;
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
}

interface IssuesTableProps {
  checkRuns: CheckRun[];
  onRowClick: (checkRun: CheckRun) => void;
}

const severityConfig = {
  high: {
    label: 'High',
    variant: 'error' as const,
  },
  medium: {
    label: 'Medium',
    variant: 'warning' as const,
  },
  low: {
    label: 'Low',
    variant: 'info' as const,
  },
  none: {
    label: 'None',
    variant: 'success' as const,
  },
};

const platformLabels: Record<Platform, string> = {
  APPLE_APP_STORE: 'Apple App Store',
  GOOGLE_PLAY_STORE: 'Google Play Store',
};

export function IssuesTable({ checkRuns, onRowClick }: IssuesTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);

  const formatDate = useCallback((date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatPlatforms = useCallback((platforms: Platform[]) => {
    if (platforms.length === 0) return 'N/A';
    if (platforms.length === 2) return 'Both';
    return platformLabels[platforms[0]];
  }, []);

  /**
   * Effect: Handle arrow key navigation in table
   * Purpose: Enable keyboard navigation between table rows for accessibility
   * Dependencies: [checkRuns] - Re-attach listener when rows change
   * Note: Cleanup function removes event listener to prevent memory leaks
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current) return;
      
      const activeElement = document.activeElement as HTMLElement;
      const rows = Array.from(tableRef.current.querySelectorAll('tbody tr[role="button"]'));
      const currentIndex = rows.indexOf(activeElement);

      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = rows[currentIndex + 1] as HTMLElement;
        if (nextRow) nextRow.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRow = rows[currentIndex - 1] as HTMLElement;
        if (prevRow) prevRow.focus();
      }
    };

    const table = tableRef.current;
    if (table) {
      table.addEventListener('keydown', handleKeyDown);
      return () => table.removeEventListener('keydown', handleKeyDown);
    }
  }, [checkRuns]);

  if (checkRuns.length === 0) {
    return (
      <div 
        className="p-12 rounded-lg border text-center"
        style={{ 
          borderColor: colors.text.secondary + '40',
          backgroundColor: colors.background.subtle,
        }}
      >
        <div className="flex justify-center mb-4">
          <DynamicIcon
            icon={MdDescription}
            state="inactive"
            size={64}
            ariaLabel="No check runs"
            decorative
          />
        </div>
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ color: colors.text.primary }}
        >
          No check runs found
        </h3>
        <p style={{ color: colors.text.secondary }}>
          Try adjusting your filters or run a compliance check on your repositories
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table ref={tableRef} className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: colors.background.subtle }}>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Check Run ID
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Repository
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Platforms
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Date
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Severity
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Issues
              </th>
            </tr>
          </thead>
          <tbody>
            {checkRuns.map((checkRun) => {
              const severityInfo = severityConfig[checkRun.highestSeverity];
              const isFailed = checkRun.status === 'FAILED';
              const errorMessage = isFailed 
                ? getCheckRunErrorMessage(checkRun.errorType, checkRun.errorMessage, checkRun.errorDetails)
                : null;
              
              return (
                <tr
                  key={checkRun.id}
                  onClick={() => onRowClick(checkRun)}
                  className="cursor-pointer transition-colors border-b hover:bg-opacity-50"
                  style={{ 
                    borderColor: colors.text.secondary + '20',
                    backgroundColor: colors.background.main,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.subtle;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.main;
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for check run ${checkRun.id}. Use arrow keys to navigate, Enter or Space to select.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(checkRun);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <span 
                      className="font-mono text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      {checkRun.id.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {checkRun.repositoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: colors.text.secondary }}>
                      {formatPlatforms(checkRun.platforms)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: colors.text.secondary }}>
                      {formatDate(checkRun.checkDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isFailed && errorMessage ? (
                      <InlineError error={errorMessage} compact />
                    ) : (
                      <Badge variant={severityInfo.variant} size="sm" showIcon>
                        {severityInfo.label}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isFailed ? (
                      <span 
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        N/A
                      </span>
                    ) : (
                      <span 
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {checkRun.totalIssues}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-3">
        {checkRuns.map((checkRun) => {
          const severityInfo = severityConfig[checkRun.highestSeverity];
          const isFailed = checkRun.status === 'FAILED';
          const errorMessage = isFailed 
            ? getCheckRunErrorMessage(checkRun.errorType, checkRun.errorMessage, checkRun.errorDetails)
            : null;
          
          return (
            <button
              key={checkRun.id}
              onClick={() => onRowClick(checkRun)}
              className="w-full text-left p-4 rounded-lg border transition-all duration-200 active:scale-[0.98] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: colors.text.secondary + '40',
                backgroundColor: colors.background.main,
                '--tw-ring-color': colors.primary.accent,
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.subtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.main;
              }}
              aria-label={`View details for check run ${checkRun.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-base mb-1 truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {checkRun.repositoryName}
                  </h3>
                  <p 
                    className="font-mono text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {checkRun.id.substring(0, 12)}...
                  </p>
                </div>
                {isFailed && errorMessage ? (
                  <InlineError error={errorMessage} compact />
                ) : (
                  <Badge variant={severityInfo.variant} size="sm" showIcon>
                    {severityInfo.label}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Platform:</span>
                  <span style={{ color: colors.text.primary }}>
                    {formatPlatforms(checkRun.platforms)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Issues:</span>
                  {isFailed ? (
                    <span style={{ color: colors.text.secondary }}>N/A</span>
                  ) : (
                    <span 
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {checkRun.totalIssues}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Date:</span>
                  <span style={{ color: colors.text.primary }}>
                    {formatDate(checkRun.checkDate)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
