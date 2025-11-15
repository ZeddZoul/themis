'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { IssueSummary } from '@/components/results/IssueSummary';
import { IssueGroup } from '@/components/results/IssueGroup';
import { IssueCard } from '@/components/results/IssueCard';
import { colors } from '@/lib/design-system';
import { getCheckRunErrorMessage } from '@/lib/error-messages';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { FaChevronLeft, FaCodeBranch } from 'react-icons/fa';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

interface CheckResults {
  status: string;
  repoName?: string;
  branchName?: string;
  summary: {
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  issues: Issue[];
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
}

export default function CheckResultsPage() {
  const router = useRouter();
  const params = useParams();
  const isMobile = useIsMobile();
  const [results, setResults] = useState<CheckResults | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Effect: Load check results from sessionStorage or fetch from API
   * Purpose: Retrieve stored check results or fetch from database
   * Dependencies: [params.repoId]
   */
  useEffect(() => {
    const loadResults = async () => {
      // Check if we're in loading state (check is running)
      const loadingInfo = sessionStorage.getItem('check_loading');
      if (loadingInfo) {
        // Keep loading state active
        return;
      }
      
      // Check for results in sessionStorage first
      const storedResults = sessionStorage.getItem('check_results');
      if (storedResults) {
        setResults(JSON.parse(storedResults));
        sessionStorage.removeItem('check_results'); // Clean up
        setLoading(false);
        return;
      }
      
      // If no sessionStorage, try to fetch from API using the ID as checkRunId
      try {
        const response = await fetch(`/api/v1/checks/${params.repoId}`);
        if (response.ok) {
          const data = await response.json();
          setResults({
            status: data.status,
            repoName: `${data.owner}/${data.repo}`,
            branchName: data.branchName,
            summary: {
              totalIssues: data.issues?.length || 0,
              highSeverity: data.issues?.filter((i: any) => i.severity === 'high').length || 0,
              mediumSeverity: data.issues?.filter((i: any) => i.severity === 'medium').length || 0,
              lowSeverity: data.issues?.filter((i: any) => i.severity === 'low').length || 0,
            },
            issues: data.issues || [],
            errorType: data.errorType,
            errorMessage: data.errorMessage,
            errorDetails: data.errorDetails,
          });
        }
      } catch (error) {
        console.error('Failed to fetch check results:', error);
      }
      
      setLoading(false);
    };
    
    loadResults();
  }, [params.repoId]);

  // Group issues by severity - memoized to avoid re-filtering on every render
  const groupedIssues = useMemo(() => ({
    high: results?.issues.filter(issue => issue.severity === 'high') || [],
    medium: results?.issues.filter(issue => issue.severity === 'medium') || [],
    low: results?.issues.filter(issue => issue.severity === 'low') || [],
  }), [results?.issues]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg font-medium" style={{ color: colors.text.secondary }}>
          Running compliance check...
        </p>
        <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
          This may take a few moments
        </p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="max-w-md w-full p-8 rounded-lg border text-center"
          style={{ 
            borderColor: colors.text.secondary + '40',
            backgroundColor: colors.background.subtle,
          }}
        >
          <svg
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.text.secondary }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: colors.text.primary }}
          >
            No Results Found
          </h3>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            The check results could not be loaded. Please run a new compliance check.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const repoName = results?.repoName || `Repository ${params.repoId}`;

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Check Results for {repoName}
          </h1>
          {results.branchName && (
            <p className="text-sm mt-1 flex items-center gap-2" style={{ color: colors.text.secondary }}>
              <FaCodeBranch size={12} />
              Branch: {results.branchName}
            </p>
          )}
        </div>
        <Button 
          variant="secondary" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          {isMobile ? (
            <FaChevronLeft size={16} />
          ) : (
            <>
              <FaChevronLeft size={14} />
              <span>Back</span>
            </>
          )}
        </Button>
      </div>

      {/* Error Display - Show if check failed */}
      {results.status === 'FAILED' && results.errorType && results.errorMessage && (
        <div className="mb-6">
          <ErrorDisplay 
            error={getCheckRunErrorMessage(
              results.errorType,
              results.errorMessage,
              results.errorDetails
            )!}
          />
        </div>
      )}

      {/* Issue Summary Cards - Only show if check succeeded */}
      {results.status !== 'FAILED' && (
        <IssueSummary
          totalIssues={results.summary.totalIssues}
          highSeverity={results.summary.highSeverity}
          mediumSeverity={results.summary.mediumSeverity}
          lowSeverity={results.summary.lowSeverity}
        />
      )}

      {/* Issues Grouped by Severity - Only show if check succeeded */}
      {results.status !== 'FAILED' && results.issues.length === 0 ? (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm text-center border" style={{ borderColor: colors.text.secondary + '30' }}>
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✅</div>
          <h3 
            className="text-xl sm:text-2xl font-bold mb-2"
            style={{ color: colors.status.success }}
          >
            All Clear!
          </h3>
          <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
            No compliance issues found in this repository.
          </p>
        </div>
      ) : results.status !== 'FAILED' ? (
        <div className="space-y-6">
          <h2 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Issues Found
          </h2>

          {/* High Severity Issues */}
          <IssueGroup severity="high" issues={groupedIssues.high}>
            {groupedIssues.high.map((issue, index) => (
              <IssueCard key={`high-${index}`} issue={issue} />
            ))}
          </IssueGroup>

          {/* Medium Severity Issues */}
          <IssueGroup severity="medium" issues={groupedIssues.medium}>
            {groupedIssues.medium.map((issue, index) => (
              <IssueCard key={`medium-${index}`} issue={issue} />
            ))}
          </IssueGroup>

          {/* Low Severity Issues */}
          <IssueGroup severity="low" issues={groupedIssues.low}>
            {groupedIssues.low.map((issue, index) => (
              <IssueCard key={`low-${index}`} issue={issue} />
            ))}
          </IssueGroup>
        </div>
      ) : null}
    </div>
  );
}
