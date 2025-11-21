'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { colors } from '@/lib/design-system';

interface Issue {
  ruleId?: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
  aiPinpointLocation?: {
    filePath: string;
    lineNumbers: number[];
  };
  aiSuggestedFix?: {
    explanation: string;
    codeSnippet: string;
  };
}

interface IssueCardProps {
  issue: Issue;
}

export const IssueCard = React.memo<IssueCardProps>(function IssueCard({ issue }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityVariant = {
    high: 'error' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  const toggleExpanded = React.useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: colors.text.secondary + '30' }}>
      {/* Card Header - Always Visible */}
      <button
        onClick={toggleExpanded}
        className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <Badge variant={severityVariant[issue.severity]} size="sm" showIcon>
                {issue.severity.toUpperCase()}
              </Badge>
              {issue.ruleId && (
                <span 
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: colors.primary.accent + '10',
                    color: colors.primary.accent,
                  }}
                >
                  {issue.ruleId}
                </span>
              )}
              <span 
                className="text-xs sm:text-sm font-semibold"
                style={{ color: colors.text.secondary }}
              >
                {issue.category}
              </span>
            </div>
            
            {issue.file && (
              <div 
                className="text-xs sm:text-sm mb-2 flex items-center gap-1"
                style={{ color: colors.text.secondary }}
              >
                <svg 
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <span className="truncate">{issue.file}</span>
              </div>
            )}

            <p 
              className="text-xs sm:text-sm"
              style={{ color: colors.text.primary }}
            >
              {issue.description}
            </p>
          </div>

          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform mt-1"
            style={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: colors.text.secondary,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4 animate-fadeIn">
          {/* Themis Pinpoint Location - First (only for existing files with line numbers) */}
          {issue.aiPinpointLocation && issue.aiPinpointLocation.lineNumbers && issue.aiPinpointLocation.lineNumbers.length > 0 && (
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{ 
                backgroundColor: '#FEF3C7',
                borderColor: '#F59E0B',
              }}
            >
              <div className="flex items-start gap-2">
                <svg 
                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                  style={{ color: '#F59E0B' }}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1" style={{ color: '#92400E' }}>
                    Themis-Detected Location
                  </h4>
                  <p className="text-xs" style={{ color: '#78350F' }}>
                    {issue.aiPinpointLocation.filePath} - Lines: {issue.aiPinpointLocation.lineNumbers.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Solution - Second */}
          <div 
            className="p-3 sm:p-4 rounded-lg border-l-4"
            style={{ 
              backgroundColor: '#EFF6FF',
              borderLeftColor: colors.primary.accent,
            }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" 
                style={{ color: colors.primary.accent }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              
              <div className="flex-1 min-w-0">
                <h3 
                  className="font-semibold mb-2 text-xs sm:text-sm"
                  style={{ color: colors.primary.accent }}
                >
                  General Solution
                </h3>
                <p 
                  className="text-xs sm:text-sm"
                  style={{ color: colors.text.primary }}
                >
                  {issue.solution}
                </p>
              </div>
            </div>
          </div>

          {/* Themis Suggested Fix - Third (shows for both existing and missing files) */}
          {issue.aiSuggestedFix && (issue.aiSuggestedFix.codeSnippet || issue.aiSuggestedFix.explanation) && (
            <div 
              className="p-3 sm:p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: '#F0FDF4',
                borderLeftColor: '#10B981',
              }}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" 
                  style={{ color: '#10B981' }}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M13 7H7v6h6V7z" />
                  <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                </svg>
                
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold mb-2 text-xs sm:text-sm"
                    style={{ color: '#065F46' }}
                  >
                    Themis-Suggested Fix
                  </h3>
                  {issue.aiSuggestedFix.explanation && (
                    <p 
                      className="text-xs sm:text-sm mb-2"
                      style={{ color: '#064E3B' }}
                    >
                      {issue.aiSuggestedFix.explanation}
                    </p>
                  )}
                  {issue.aiSuggestedFix.codeSnippet && (
                    <div className="relative group">
                      <pre 
                        className="text-xs p-2 rounded overflow-x-auto"
                        style={{ 
                          backgroundColor: '#ECFDF5',
                          color: '#064E3B',
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        <code>{issue.aiSuggestedFix.codeSnippet}</code>
                      </pre>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(issue.aiSuggestedFix!.codeSnippet);
                          // Could add a toast here or change icon temporarily
                        }}
                        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-gray-200 hover:bg-gray-50"
                        title="Copy code"
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
