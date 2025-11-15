/**
 * TanStack Query hooks for data fetching
 * Export all custom hooks for easy importing
 */

export { useRepositories } from './useRepositories';
export { useDashboardStats } from './useDashboardStats';
export { useCheckHistory } from './useCheckHistory';
export { useUser } from './useUser';
export { useToast } from './useToast';
export { 
  useMediaQuery, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop 
} from './useMediaQuery';

export type { Repository, RepositoriesResponse } from './useRepositories';
export type { DashboardStats } from './useDashboardStats';
export type { CheckRun, CheckHistoryResponse } from './useCheckHistory';
export type { User } from './useUser';
