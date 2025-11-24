'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { colors } from '@/lib/design-system';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/lib/icons';
import { FaChevronLeft, FaCodeBranch, FaHistory, FaExclamationTriangle, FaCheckCircle, FaClock, FaPlay, FaTimes } from 'react-icons/fa';
import { MdDescription } from 'react-icons/md';

interface CheckRun {
  id: string;
  branchName: string;
  checkType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  issues?: any[];
}

export default function CheckHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const [checks, setChecks] = useState<CheckRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('MOBILE_PLATFORMS');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [showEnhancedLoading, setShowEnhancedLoading] = useState(false);

  const owner = params.owner as string;
  const repo = params.repo as string;
  const repoFullName = `${owner}/${repo}`;

  useEffect(() => {
    const fetchCheckHistory = async () => {
      try {
        const response = await fetch(`/api/v1/checks/history/${owner}/${repo}`);
        if (!response.ok) {
          throw new Error('Failed to fetch check history');
        }
        const data = await response.json();
        setChecks(data.checks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load check history');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckHistory();
  }, [owner, repo]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FAILED':
        return <Badge variant="error" size="sm">Failed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" size="sm">In Progress</Badge>;
      default:
        return null; // Don't show badge for completed checks since they're all completed
    }
  };

  const getPlatformLabel = (checkType: string) => {
    switch (checkType) {
      case 'APPLE_APP_STORE':
        return 'Apple App Store';
      case 'GOOGLE_PLAY_STORE':
        return 'Google Play Store';
      case 'MOBILE_PLATFORMS':
        return 'Mobile Platforms';
      case 'CHROME_WEB_STORE':
        return 'Chrome Web Store';
      default:
        return checkType;
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch(`/api/v1/branches/${owner}/${repo}`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
        setSelectedBranch(data.branches?.[0] || 'main');
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches(['main']);
      setSelectedBranch('main');
    }
  };

  const handleRunCheck = async () => {
    if (!selectedBranch) return;
    
    setIsRunningCheck(true);
    setShowCheckDialog(false);
    setShowEnhancedLoading(true);
    
    try {
      const response = await fetch('/api/v1/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          branch: selectedBranch,
          checkType: selectedPlatform,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Let the enhanced loading complete its sequence
        // The loading component will handle navigation
        setTimeout(() => {
          router.push(`/check/results/${data.checkRunId}`);
        }, 100); // Small delay to let loading complete
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start check');
      }
    } catch (error) {
      console.error('Failed to run check:', error);
      setShowEnhancedLoading(false);
      alert(error instanceof Error ? error.message : 'Failed to start check');
    } finally {
      setIsRunningCheck(false);
    }
  };

  const openCheckDialog = async () => {
    await fetchBranches();
    setShowCheckDialog(true);
  };

  if (loading) {
    return (
      <div>
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 w-48 rounded mb-2" style={{ backgroundColor: colors.background.subtle }} />
              <div className="h-5 w-32 rounded" style={{ backgroundColor: colors.background.subtle }} />
            </div>
            <div className="h-10 w-32 rounded" style={{ backgroundColor: colors.background.subtle }} />
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg" style={{ color: colors.text.secondary }}>
            Loading check history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div 
          className="max-w-md w-full p-8 rounded-xl border text-center shadow-lg"
          style={{ 
            borderColor: colors.status.error + '40',
            backgroundColor: colors.background.subtle,
          }}
        >
          <div className="flex justify-center mb-4">
            <DynamicIcon
              icon={FaExclamationTriangle}
              state="error"
              size={48}
              ariaLabel="Error"
              decorative
            />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.status.error }}>
            Error Loading History
          </h3>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard/repos')}>
              Back to Repos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show enhanced loading when running a check
  if (showEnhancedLoading) {
    return (
      <EnhancedLoading
        title="Running Compliance Check"
        subtitle={`Analyzing ${repoFullName} for compliance issues`}
        platform={getPlatformLabel(selectedPlatform).toLowerCase()}
        fileCount={Math.floor(Math.random() * 20) + 5}
        onComplete={() => {
          // This will be called when the loading sequence completes
          // The navigation is handled in handleRunCheck
        }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.primary.accent + '20' }}
            >
              <DynamicIcon
                icon={FaHistory}
                state="active"
                size={24}
                ariaLabel="Check History"
                decorative
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: colors.text.primary }}>
                Check History
              </h1>
              <p className="text-base sm:text-lg" style={{ color: colors.text.secondary }}>
                {repoFullName}
              </p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => router.push('/dashboard/repos')}
            className="flex items-center gap-2"
          >
            <FaChevronLeft size={14} />
            <span className="hidden sm:inline">Back to Repos</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Stats Summary */}
        {checks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div 
              className="p-4 rounded-xl border"
              style={{ 
                borderColor: colors.text.secondary + '20',
                backgroundColor: colors.background.subtle 
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: colors.primary.accent + '20' }}
                >
                  <FaHistory size={16} style={{ color: colors.primary.accent }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {checks.length}
                  </p>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Total Checks
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="p-4 rounded-xl border"
              style={{ 
                borderColor: colors.text.secondary + '20',
                backgroundColor: colors.background.subtle 
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: colors.status.warning + '20' }}
                >
                  <FaExclamationTriangle size={16} style={{ color: colors.status.warning }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {checks.reduce((total, check) => total + (check.issues?.length || 0), 0)}
                  </p>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Total Issues
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Check List */}
      {checks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div 
            className="max-w-md w-full p-8 rounded-xl border text-center"
            style={{ 
              borderColor: colors.text.secondary + '20',
              backgroundColor: colors.background.subtle,
            }}
          >
            <div className="flex justify-center mb-6">
              <DynamicIcon
                icon={MdDescription}
                state="inactive"
                size={64}
                ariaLabel="No checks found"
                decorative
              />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: colors.text.primary }}>
              No Checks Found
            </h3>
            <p style={{ color: colors.text.secondary }}>
              No compliance checks have been run on this repository yet.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {checks.map((check, index) => (
              <button
                key={check.id}
                onClick={() => router.push(`/check/results/${check.id}`)}
                className="w-full p-6 rounded-xl border transition-all duration-200 text-left hover:shadow-lg hover:scale-[1.01] group"
                style={{
                  borderColor: colors.text.secondary + '20',
                  backgroundColor: colors.background.subtle,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary.accent + '40';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.text.secondary + '20';
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left side - Main info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ 
                          backgroundColor: check.status === 'COMPLETED' 
                            ? colors.status.success + '20' 
                            : check.status === 'FAILED'
                            ? colors.status.error + '20'
                            : colors.status.info + '20'
                        }}
                      >
                        {check.status === 'COMPLETED' ? (
                          <FaCheckCircle size={16} style={{ color: colors.status.success }} />
                        ) : check.status === 'FAILED' ? (
                          <FaExclamationTriangle size={16} style={{ color: colors.status.error }} />
                        ) : (
                          <FaClock size={16} style={{ color: colors.status.info }} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                          {formatDate(check.createdAt)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(check.status)}
                          <span className="text-sm" style={{ color: colors.text.secondary }}>
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: colors.text.secondary }}>
                      <span className="flex items-center gap-2">
                        <FaCodeBranch size={12} />
                        <span className="font-medium">{check.branchName}</span>
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{getPlatformLabel(check.checkType)}</span>
                      {check.issues && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-medium">
                            {check.issues.length} {check.issues.length === 1 ? 'issue' : 'issues'} found
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side - Issue count and arrow */}
                  <div className="flex items-center gap-4">
                    {check.status === 'COMPLETED' && check.issues && (
                      <div
                        className="px-4 py-2 rounded-lg font-semibold text-sm"
                        style={{
                          backgroundColor: check.issues.length === 0 
                            ? colors.status.success + '20'
                            : colors.status.error + '20',
                          color: check.issues.length === 0 
                            ? colors.status.success
                            : colors.status.error,
                        }}
                      >
                        {check.issues.length === 0 ? '✓ All Clear' : `${check.issues.length} Issues`}
                      </div>
                    )}
                    <FaChevronLeft 
                      size={16} 
                      className="rotate-180 transition-transform group-hover:translate-x-1"
                      style={{ color: colors.text.secondary }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>


        </>
      )}

      {/* Check Configuration Dialog */}
      {showCheckDialog && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div 
            className="max-w-md w-full mx-4 p-6 rounded-xl border shadow-2xl"
            style={{ 
              backgroundColor: colors.background.main,
              borderColor: colors.text.secondary + '20'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                Run Compliance Check
              </h3>
              <button
                onClick={() => setShowCheckDialog(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: colors.text.secondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.subtle;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Repository Info */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Repository
                </label>
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    borderColor: colors.text.secondary + '30',
                    backgroundColor: colors.background.subtle,
                    color: colors.text.secondary
                  }}
                >
                  {repoFullName}
                </div>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: colors.text.secondary + '30',
                    backgroundColor: colors.background.main,
                    color: colors.text.primary,
                    '--tw-ring-color': colors.primary.accent,
                  } as React.CSSProperties}
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Platform
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'MOBILE_PLATFORMS', label: 'Both Platforms (Recommended)' },
                    { value: 'APPLE_APP_STORE', label: 'Apple App Store Only' },
                    { value: 'GOOGLE_PLAY_STORE', label: 'Google Play Store Only' },
                  ].map((platform) => (
                    <label key={platform.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="platform"
                        value={platform.value}
                        checked={selectedPlatform === platform.value}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: colors.primary.accent }}
                      />
                      <span style={{ color: colors.text.primary }}>{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowCheckDialog(false)}
                className="flex-1"
                disabled={isRunningCheck}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRunCheck}
                className="flex-1 flex items-center justify-center gap-2"
                disabled={isRunningCheck || !selectedBranch}
              >
                {isRunningCheck ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Starting...
                  </>
                ) : (
                  <>
                    <FaPlay size={14} />
                    Run Check
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}