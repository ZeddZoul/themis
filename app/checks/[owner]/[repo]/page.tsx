'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { colors } from '@/lib/design-system';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FaChevronLeft, FaCodeBranch } from 'react-icons/fa';

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
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="error" size="sm">Failed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" size="sm">In Progress</Badge>;
      default:
        return <Badge variant="info" size="sm">{status}</Badge>;
    }
  };

  const getPlatformLabel = (checkType: string) => {
    switch (checkType) {
      case 'APPLE_APP_STORE':
        return 'Apple App Store';
      case 'GOOGLE_PLAY_STORE':
        return 'Google Play Store';
      case 'BOTH':
        return 'Both Platforms';
      default:
        return checkType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="max-w-md w-full p-8 rounded-lg border text-center"
          style={{ 
            borderColor: colors.status.error,
            backgroundColor: colors.status.error + '10',
          }}
        >
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.status.error }}>
            Error Loading History
          </h3>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            {error}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            Check History
          </h1>
          <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
            {repoFullName}
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => router.push('/dashboard/repos')}
          className="flex items-center gap-2"
        >
          <FaChevronLeft size={14} />
          <span>Back to Repos</span>
        </Button>
      </div>

      {/* Check List */}
      {checks.length === 0 ? (
        <div 
          className="p-8 rounded-lg border text-center"
          style={{ 
            borderColor: colors.text.secondary + '40',
            backgroundColor: colors.background.subtle,
          }}
        >
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
            No Checks Found
          </h3>
          <p style={{ color: colors.text.secondary }}>
            No compliance checks have been run on this repository yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {checks.map((check) => (
            <button
              key={check.id}
              onClick={() => router.push(`/check/${check.id}`)}
              className="w-full p-4 sm:p-6 rounded-lg border transition-all duration-200 text-left hover:shadow-md"
              style={{
                borderColor: colors.text.secondary + '30',
                backgroundColor: colors.background.main,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left side - Date and Branch */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                      {formatDate(check.createdAt)}
                    </span>
                    {getStatusBadge(check.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: colors.text.secondary }}>
                    <span className="flex items-center gap-1">
                      <FaCodeBranch size={12} />
                      {check.branchName}
                    </span>
                    <span>•</span>
                    <span>{getPlatformLabel(check.checkType)}</span>
                    {check.issues && (
                      <>
                        <span>•</span>
                        <span>{check.issues.length} {check.issues.length === 1 ? 'issue' : 'issues'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side - Issue count badge */}
                {check.status === 'COMPLETED' && check.issues && (
                  <div className="flex-shrink-0">
                    <div
                      className="px-4 py-2 rounded-lg font-semibold"
                      style={{
                        backgroundColor: check.issues.length === 0 
                          ? colors.status.success + '20'
                          : colors.status.error + '20',
                        color: check.issues.length === 0 
                          ? colors.status.success
                          : colors.status.error,
                      }}
                    >
                      {check.issues.length === 0 ? 'All Clear' : `${check.issues.length} Issues`}
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
