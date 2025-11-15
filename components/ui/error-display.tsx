'use client';

import React from 'react';
import { colors } from '@/lib/design-system';
import { UserFriendlyError } from '@/lib/error-messages';

interface ErrorDisplayProps {
  error: UserFriendlyError;
  className?: string;
}

/**
 * ErrorDisplay component - Shows detailed error messages with actionable guidance
 * Used to display compliance check errors in a user-friendly format
 */
export function ErrorDisplay({ error, className = '' }: ErrorDisplayProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        borderColor: colors.status.error,
        backgroundColor: colors.status.error + '10',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: colors.status.error }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <div className="flex-1 min-w-0">
          {/* Error Title */}
          <h3
            className="font-semibold text-sm sm:text-base mb-1"
            style={{ color: colors.status.error }}
          >
            {error.title}
          </h3>

          {/* Error Message */}
          <p
            className="text-sm mb-2"
            style={{ color: colors.text.primary }}
          >
            {error.message}
          </p>

          {/* Actionable Guidance */}
          {error.actionableGuidance && (
            <p
              className="text-sm"
              style={{ color: colors.text.secondary }}
            >
              {error.actionableGuidance}
            </p>
          )}

          {/* Retry Info (for rate limits) */}
          {error.retryInfo && (
            <div
              className="mt-2 p-2 rounded text-sm"
              style={{
                backgroundColor: colors.background.subtle,
                color: colors.text.primary,
              }}
            >
              <strong>⏱️ {error.retryInfo}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InlineErrorProps {
  error: UserFriendlyError;
  compact?: boolean;
}

/**
 * InlineError component - Compact error display for tables and cards
 */
export function InlineError({ error, compact = false }: InlineErrorProps) {
  if (compact) {
    return (
      <span
        className="text-xs sm:text-sm font-medium"
        style={{ color: colors.status.error }}
        title={`${error.title}: ${error.message}`}
      >
        {error.title}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <svg
        className="w-4 h-4 flex-shrink-0"
        style={{ color: colors.status.error }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span
        className="text-sm"
        style={{ color: colors.status.error }}
        title={error.message}
      >
        {error.title}
      </span>
    </div>
  );
}
