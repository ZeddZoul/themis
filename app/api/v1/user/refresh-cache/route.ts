import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { fetchInstallationData, updateSessionCache } from '@/lib/session-cache';

/**
 * POST /api/v1/user/refresh-cache
 * Manually refresh the installation cache (installation ID and repo count)
 * Useful after installing/uninstalling the GitHub App
 */
export async function POST() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const githubUsername = session.user.githubUsername;
    
    if (!githubUsername) {
      return NextResponse.json({ error: 'GitHub username not found in session' }, { status: 400 });
    }

    // Fetch fresh installation data
    const installationCache = await fetchInstallationData(githubUsername);
    
    if (!installationCache) {
      // Clear cache if app is not installed
      if (session.user) {
        session.user.installationId = undefined;
        session.user.totalRepositories = undefined;
        session.user.installationCachedAt = undefined;
      }
      await session.save();
      
      return NextResponse.json({ 
        success: true,
        installed: false,
        message: 'GitHub App is not installed'
      });
    }

    // Update session with fresh data
    updateSessionCache(session, installationCache);
    await session.save();

    return NextResponse.json({
      success: true,
      installed: true,
      installationId: installationCache.installationId,
      totalRepositories: installationCache.totalRepositories,
      cachedAt: installationCache.cachedAt,
    });
  } catch (error) {
    console.error('Error refreshing installation cache:', error);
    return NextResponse.json(
      { error: 'Failed to refresh installation cache' },
      { status: 500 }
    );
  }
}
