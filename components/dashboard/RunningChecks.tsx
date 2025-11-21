'use client';

import React from 'react';
import { colors } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { useRunningChecks } from '@/lib/hooks/useRunningChecks';
import { FaClock, FaCodeBranch } from 'react-icons/fa';
import { DynamicIcon } from '@/lib/icons';

interface CheckProgressProps {
  id: string;
  repo: string;
  owner: string;
  checkType: string;
  startTime: string;
}

function CheckProgress({ repo, owner, checkType, startTime }: CheckProgressProps) {
  const [elapsed, setElapsed] = React.useState('');

  React.useEffect(() => {
    const updateElapsed = () => {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      if (diffMinutes > 0) {
        setElapsed(`${diffMinutes}m ${diffSeconds}s`);
      } else {
        setElapsed(`${diffSeconds}s`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatCheckType = (type: string) => {
    switch (type) {
      case 'APPLE_APP_STORE': return 'App Store';
      case 'GOOGLE_PLAY_STORE': return 'Play Store';
      case 'CHROME_WEB_STORE': return 'Chrome Store';
      case 'MOBILE_PLATFORMS': return 'Mobile';
      default: return type;
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border"
      style={{ 
        backgroundColor: colors.background.main,
        borderColor: colors.primary.accent + '20'
      }}
    >
      <div className="flex items-center space-x-3">
        <DynamicIcon
          icon={FaCodeBranch}
          state="active"
          size={20}
          decorative
        />
        <div>
          <p className="font-medium" style={{ color: colors.text.primary }}>
            {owner}/{repo}
          </p>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {formatCheckType(checkType)} compliance check
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-sm" style={{ color: colors.text.secondary }}>
          <FaClock size={12} />
          <span>{elapsed}</span>
        </div>
        <Badge variant="processing" size="sm">
          Running
        </Badge>
      </div>
    </div>
  );
}

export function RunningChecks() {
  const { data: runningChecks = [], isLoading } = useRunningChecks();

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
          Running Analyses
        </h2>
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (runningChecks.length === 0) {
    return null; // Don't show section if no running checks
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
        Running Analyses ({runningChecks.length})
      </h2>
      <div className="space-y-3">
        {runningChecks.map((check) => (
          <CheckProgress
            key={check.id}
            id={check.id}
            repo={check.repo}
            owner={check.owner}
            checkType={check.checkType}
            startTime={check.createdAt}
          />
        ))}
      </div>
    </div>
  );
}