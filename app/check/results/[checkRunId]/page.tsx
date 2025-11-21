'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { useToast } from '@/lib/hooks/useToast';
import { FaChevronLeft, FaCodeBranch } from 'react-icons/fa';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { ResultsSkeleton } from '@/components/ui/skeletons';
import { ExportDropdown, ExportFormat } from '@/components/ui/ExportDropdown';

interface Issue {
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

interface CheckResults {
  status: string;
  repoName?: string;
  branchName?: string;
  checkType?: string;
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
  const { showToast } = useToast();
  const [results, setResults] = useState<CheckResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  /**
   * Effect: Load check results from API
   * Purpose: Fetch check results from database using checkRunId
   * Dependencies: [params.checkRunId]
   */
  useEffect(() => {
    const loadResults = async () => {
      if (!params.checkRunId) return;
      
      try {
        const response = await fetch(`/api/v1/checks/${params.checkRunId}`);
        if (response.ok) {
          const data = await response.json();
          setResults({
            status: data.status,
            repoName: `${data.owner}/${data.repo}`,
            branchName: data.branchName,
            checkType: data.checkType,
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
        } else {
          console.error('Failed to fetch check results:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch check results:', error);
      }
      
      setLoading(false);
    };
    
    loadResults();
  }, [params.checkRunId]);

  // Group issues by severity - memoized to avoid re-filtering on every render
  const groupedIssues = useMemo(() => ({
    high: results?.issues.filter(issue => issue.severity === 'high') || [],
    medium: results?.issues.filter(issue => issue.severity === 'medium') || [],
    low: results?.issues.filter(issue => issue.severity === 'low') || [],
  }), [results?.issues]);



  // Unified export handler for all formats
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!params.checkRunId || !results) return;

    setExporting(true);
    
    try {
      let endpoint = '';
      let contentType = '';
      let fileExtension = '';

      switch (format) {
        case 'pdf':
          endpoint = '/api/v1/reports/export/pdf';
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        case 'md':
          endpoint = '/api/v1/reports/export';
          contentType = 'application/json';
          fileExtension = 'md';
          break;
        case 'yaml':
          endpoint = '/api/v1/reports/export/yaml';
          contentType = 'application/x-yaml';
          fileExtension = 'yaml';
          break;
        case 'txt':
          endpoint = '/api/v1/reports/export/txt';
          contentType = 'text/plain';
          fileExtension = 'txt';
          break;
      }

      // Send the full data for all formats - more efficient than database lookups
      const requestBody = {
        repoName: results.repoName,
        branchName: results.branchName,
        checkType: results.checkType,
        summary: results.summary,
        issues: results.issues,
        checkRunId: params.checkRunId, // Keep this for filename generation
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate ${format.toUpperCase()}`);
      }

      // Handle markdown differently (returns JSON)
      if (format === 'md') {
        const reportData = await response.json();
        const blob = new Blob([reportData.markdown], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const checkRunIdStr = Array.isArray(params.checkRunId) ? params.checkRunId[0] : params.checkRunId;
        link.download = `themis-report-${checkRunIdStr.substring(0, 8)}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Handle binary formats (PDF, YAML, TXT)
        const blob = await response.blob();
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `report.${fileExtension}`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      showToast({
        type: 'success',
        message: `${format.toUpperCase()} Report exported successfully!`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to export report',
      });
    } finally {
      setExporting(false);
    }
  }, [params.checkRunId, results, showToast]);

  if (loading) {
    return <ResultsSkeleton />;
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

  const repoName = results?.repoName || `Repository ${params.checkRunId}`;

  return (
    <div className="relative">
      {/* Export Loading Overlay */}
      {exporting && (
        <EnhancedLoading 
          title="Generating Report"
          subtitle="Themis is preparing your comprehensive compliance report..."
          enableRealTimeSync={false}
        />
      )}



      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
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
        
        <div className="flex items-center gap-3">
          {/* Export Report Button - Only show if check succeeded */}
          {results.status !== 'FAILED' && (
            <ExportDropdown 
              onExport={handleExport}
              disabled={false}
              isExporting={exporting}
            />
          )}
          
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
      </div>

      {/* Error Display - Show if check failed */}
      {results.status === 'FAILED' && results.errorType && results.errorMessage && (
        <div className="mb-6">
          <ErrorDisplay 
            error={getCheckRunErrorMessage(
              results.errorType,
              results.errorMessage,
              results.errorDetails || null
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