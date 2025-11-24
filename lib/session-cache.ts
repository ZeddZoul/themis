/**
 * Session cache utilities for GitHub installation data
 * Caches installation ID and repository count to avoid repeated API calls
 */

import { getGithubClient } from '@/lib/github';
import { SessionData } from '@/lib/session';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface InstallationCache {
  installationId: string;
  totalRepositories: number;
  cachedAt: number;
}

/**
 * Check if cached installation data is still valid
 */
export function isCacheValid(cachedAt?: number): boolean {
  if (!cachedAt) return false;
  return Date.now() - cachedAt < CACHE_TTL;
}

/**
 * Fetch installation data from GitHub and return cache object
 */
export async function fetchInstallationData(
  githubUsername: string
): Promise<InstallationCache | null> {
  try {
    // Get App-authenticated client
    const appOctokit = getGithubClient();
    
    // Find installation for this user
    const { data: installation } = await appOctokit.request('GET /users/{username}/installation', {
      username: githubUsername,
    });
    
    if (!installation?.id) {
      return null;
    }
    
    const installationId = String(installation.id);
    
    // Get installation-authenticated client to fetch repo count
    const installationOctokit = getGithubClient(undefined, installationId);
    const { data: repos } = await installationOctokit.request('GET /installation/repositories', {
      per_page: 1, // We only need the total_count
    });
    
    return {
      installationId,
      totalRepositories: repos.total_count || 0,
      cachedAt: Date.now(),
    };
  } catch (error: any) {
    // If 404, app not installed
    if (error.status === 404) {
      return null;
    }
    console.error('Error fetching installation data:', error);
    throw error;
  }
}

/**
 * Update session with installation cache data
 */
export function updateSessionCache(
  session: { user?: SessionData['user'] },
  cache: InstallationCache
): void {
  if (session.user) {
    session.user.installationId = cache.installationId;
    session.user.totalRepositories = cache.totalRepositories;
    session.user.installationCachedAt = cache.cachedAt;
  }
}

/**
 * Get cached installation data from session, or fetch if stale
 */
export async function getOrRefreshInstallationCache(
  session: { user?: SessionData['user'] },
  githubUsername?: string
): Promise<InstallationCache | null> {
  // Check if cache is valid
  if (
    session.user?.installationId &&
    session.user?.totalRepositories !== undefined &&
    isCacheValid(session.user?.installationCachedAt)
  ) {
    return {
      installationId: session.user.installationId,
      totalRepositories: session.user.totalRepositories,
      cachedAt: session.user.installationCachedAt!,
    };
  }
  
  // Cache is stale or missing, fetch new data
  if (!githubUsername) {
    githubUsername = session.user?.githubUsername;
  }
  
  if (!githubUsername) {
    return null;
  }
  
  return await fetchInstallationData(githubUsername);
}
