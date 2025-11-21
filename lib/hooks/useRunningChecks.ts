import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface RunningCheck {
  id: string;
  repositoryId: string;
  owner: string;
  repo: string;
  checkType: string;
  createdAt: string;
  status: 'IN_PROGRESS';
}

export function useRunningChecks() {
  return useQuery({
    queryKey: queryKeys.checks.running,
    queryFn: async (): Promise<RunningCheck[]> => {
      const response = await fetch('/api/v1/checks/running');
      if (!response.ok) {
        throw new Error('Failed to fetch running checks');
      }
      return response.json();
    },
    refetchInterval: 5000, // Check every 5 seconds
    staleTime: 0, // Always refetch
  });
}

export function useRepositoryRunningCheck(repoFullName: string) {
  const { data: runningChecks = [] } = useRunningChecks();
  
  return runningChecks.find(check => 
    `${check.owner}/${check.repo}` === repoFullName
  );
}