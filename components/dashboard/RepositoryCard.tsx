'use client';

import React from 'react';
import { colors } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { getCheckRunErrorMessage } from '@/lib/error-messages';
import { InlineError } from '@/components/ui/error-display';
import { DynamicIcon } from '@/lib/icons';
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaClock, FaCodeBranch } from 'react-icons/fa';
import { PlatformSelector, Platform } from '@/components/ui/platform-selector';
import { BranchSelector, Branch } from '@/components/ui/branch-selector';

type RepositoryStatus = 'success' | 'warning' | 'error' | 'none' | 'failed';

interface RepositoryCardProps {
  id: number;
  name: string;
  fullName: string;
  description?: string | null;
  status: RepositoryStatus;
  lastCheckDate?: Date;
  issueCount?: number;
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
  onClick: () => void;
  onStartCheck: (platform: Platform, branch: string) => void;
}

const statusConfig = {
  success: {
    label: 'No Issues',
    variant: 'success' as const,
    dotColor: colors.status.success,
    icon: FaCheckCircle,
  },
  warning: {
    label: 'Warnings',
    variant: 'warning' as const,
    dotColor: colors.status.warning,
    icon: FaExclamationTriangle,
  },
  error: {
    label: 'Critical',
    variant: 'error' as const,
    dotColor: colors.status.error,
    icon: FaExclamationCircle,
  },
  none: {
    label: 'Not Checked',
    variant: 'info' as const,
    dotColor: colors.text.secondary,
    icon: FaClock,
  },
  failed: {
    label: 'Check Failed',
    variant: 'error' as const,
    dotColor: colors.status.error,
    icon: FaExclamationCircle,
  },
};

export const RepositoryCard = React.memo<RepositoryCardProps>(function RepositoryCard({
  name,
  fullName,
  description,
  status,
  lastCheckDate,
  issueCount,
  errorType,
  errorMessage,
  errorDetails,
  onClick,
  onStartCheck,
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isButtonHovered, setIsButtonHovered] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform>('BOTH');
  const [selectedBranch, setSelectedBranch] = React.useState<string>('');
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = React.useState(true);
  const [isChecking, setIsChecking] = React.useState(false);
  
  const config = statusConfig[status];
  const isFailed = status === 'failed';
  const errorInfo = isFailed 
    ? getCheckRunErrorMessage(errorType || null, errorMessage || null, errorDetails || null)
    : null;

  // Fetch branches on mount
  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const [owner, repo] = fullName.split('/');
        const response = await fetch(`/api/v1/branches/${owner}/${repo}`);
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
          setSelectedBranch(data.defaultBranch || 'main');
        } else {
          // Fallback to main if API fails
          console.warn(`Failed to fetch branches for ${fullName}, using default`);
          setBranches([{ name: 'main', protected: false }]);
          setSelectedBranch('main');
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        // Fallback to main
        setBranches([{ name: 'main', protected: false }]);
        setSelectedBranch('main');
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, [fullName]);

  const handleStartCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecking(true);
    try {
      await onStartCheck(selectedPlatform, selectedBranch);
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = React.useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-lg border p-4 sm:p-6 transition-all duration-200 w-full"
      style={{
        borderColor: isHovered ? colors.primary.accent : colors.text.secondary + '30',
        backgroundColor: colors.background.main,
        boxShadow: isHovered ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
      }}
    >
      {/* Clickable header area */}
      <button
        onClick={onClick}
        className="w-full text-left mb-3"
        aria-label={`View issues for ${fullName} repository`}
      >
        {/* Icon */}
        <div className="mb-3 sm:mb-4">
          <DynamicIcon
            icon={FaCodeBranch}
            state={isHovered ? 'hover' : 'active'}
            size={48}
            ariaLabel="Repository"
            decorative
          />
        </div>

        {/* Repository Name and Owner */}
        <div className="mb-2">
          <h3 
            className="text-xl sm:text-2xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {name}
          </h3>
          <p 
            className="text-sm sm:text-base font-medium"
            style={{ color: colors.text.secondary }}
          >
            {fullName}
          </p>
        </div>
      </button>

      {/* Description */}
      {description && (
        <p 
          className="text-sm line-clamp-2 mb-3"
          style={{ color: colors.text.secondary }}
        >
          {description}
        </p>
      )}

      {/* Status Badge and Branch Selector Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex-shrink-0">
          {isFailed && errorInfo ? (
            <InlineError error={errorInfo} />
          ) : (
            <Badge variant={config.variant} size="sm" showIcon>
              {config.label}
            </Badge>
          )}
        </div>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <BranchSelector
            branches={branches}
            value={selectedBranch}
            onChange={setSelectedBranch}
            disabled={isChecking}
            loading={branchesLoading}
          />
        </div>
      </div>

      {/* Last Check Info */}
      {lastCheckDate && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm mb-4">
          <span style={{ color: colors.text.secondary }}>
            Last checked: {formatDate(lastCheckDate)}
          </span>
          {issueCount !== undefined && issueCount > 0 && (
            <>
              <span className="hidden sm:inline" style={{ color: colors.text.secondary }}>•</span>
              <span style={{ color: colors.text.secondary }}>
                {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Platform Selector and Start Check Button */}
      <div className="space-y-3 pt-3 border-t" style={{ borderColor: colors.text.secondary + '20' }}>
        <div>
          <label 
            className="block text-xs font-medium mb-2"
            style={{ color: colors.text.secondary }}
          >
            Select Platform
          </label>
          <PlatformSelector
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            disabled={isChecking}
          />
        </div>
        
        <button
          onClick={handleStartCheck}
          disabled={isChecking}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className="w-full rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 min-h-[44px] font-medium"
          style={{
            backgroundColor: isButtonHovered && !isChecking 
              ? colors.primary.accent 
              : colors.primary.accent + '10',
            color: isButtonHovered && !isChecking 
              ? 'white' 
              : colors.primary.accent,
            '--tw-ring-color': colors.primary.accent,
            cursor: isChecking ? 'not-allowed' : 'pointer',
            opacity: isChecking ? 0.6 : 1,
          } as React.CSSProperties}
          aria-label={isChecking ? 'Starting compliance check' : 'Start compliance check'}
        >
          {isChecking ? 'Starting Check...' : 'Start Check'}
        </button>
      </div>
    </div>
  );
});
