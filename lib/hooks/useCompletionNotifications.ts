import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from './useToast';
import { queryKeys } from '@/lib/query-keys';

interface CompletedCheck {
  id: string;
  repositoryId: string;
  owner: string;
  repo: string;
  checkType: string;
  completedAt: string;
  issueCount: number;
}

const NOTIFIED_CHECKS_KEY = 'themis-notified-checks';

// Get notified checks from localStorage
const getNotifiedChecks = (): Map<string, number> => {
  if (typeof window === 'undefined') return new Map();
  
  try {
    const stored = localStorage.getItem(NOTIFIED_CHECKS_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data).map(([k, v]) => [k, v as number]));
    }
  } catch (error) {
    console.warn('Failed to parse notified checks from localStorage:', error);
  }
  return new Map();
};

// Save notified checks to localStorage
const saveNotifiedChecks = (checks: Map<string, number>) => {
  if (typeof window === 'undefined') return;
  
  try {
    const data = Object.fromEntries(checks.entries());
    localStorage.setItem(NOTIFIED_CHECKS_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save notified checks to localStorage:', error);
  }
};

// Clean up old notifications (older than 1 hour)
const cleanupOldNotifications = (checks: Map<string, number>): Map<string, number> => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const cleaned = new Map<string, number>();
  
  for (const [checkId, timestamp] of checks.entries()) {
    if (timestamp >= oneHourAgo) {
      cleaned.set(checkId, timestamp);
    }
  }
  
  return cleaned;
};

export function useCompletionNotifications() {
  const { showToast } = useToast();
  const notifiedChecks = useRef<Map<string, number>>(new Map());
  
  // Initialize and clean up old notifications
  useEffect(() => {
    const stored = getNotifiedChecks();
    const cleaned = cleanupOldNotifications(stored);
    notifiedChecks.current = cleaned;
    
    // Save cleaned data back to localStorage
    if (cleaned.size !== stored.size) {
      saveNotifiedChecks(cleaned);
    }
  }, []);

  // Query for recently completed checks (last 5 minutes)
  const { data: completedChecks = [] } = useQuery({
    queryKey: queryKeys.checks.recentlyCompleted,
    queryFn: async (): Promise<CompletedCheck[]> => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const response = await fetch(`/api/v1/checks/completed?since=${fiveMinutesAgo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch completed checks');
      }
      return response.json();
    },
    refetchInterval: 10000, // Check every 10 seconds
    staleTime: 0,
  });

  // Show notifications for newly completed checks
  useEffect(() => {
    completedChecks.forEach(check => {
      if (!notifiedChecks.current.has(check.id)) {
        const timestamp = Date.now();
        notifiedChecks.current.set(check.id, timestamp);
        
        // Save to localStorage
        saveNotifiedChecks(notifiedChecks.current);
        
        const formatCheckType = (type: string) => {
          switch (type) {
            case 'APPLE_APP_STORE': return 'App Store';
            case 'GOOGLE_PLAY_STORE': return 'Play Store';
            case 'CHROME_WEB_STORE': return 'Chrome Store';
            case 'MOBILE_PLATFORMS': return 'Mobile';
            default: return type;
          }
        };

        showToast({
          type: 'success',
          message: `${formatCheckType(check.checkType)} compliance check completed for ${check.owner}/${check.repo}!`,
          action: {
            label: 'View Results',
            onClick: () => {
              window.open(`/check/results/${check.id}`, '_blank');
            }
          },
          onDismiss: () => {
            // Mark as permanently dismissed when user dismisses the toast
            // (either by clicking X or the action button)
            notifiedChecks.current.set(check.id, Date.now());
            saveNotifiedChecks(notifiedChecks.current);
          }
        });     
 }
    });
  }, [completedChecks, showToast]);

  return { completedChecks };
}