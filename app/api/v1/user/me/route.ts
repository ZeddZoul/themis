import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Optionally refresh installation cache if stale
  // This ensures the user object always has relatively fresh data
  try {
    const { getOrRefreshInstallationCache, updateSessionCache, isCacheValid } = await import('@/lib/session-cache');
    
    // Only refresh if cache is stale
    if (!isCacheValid(session.user.installationCachedAt)) {
      const installationCache = await getOrRefreshInstallationCache(session, session.user.githubUsername);
      if (installationCache) {
        updateSessionCache(session, installationCache);
        await session.save();
      }
    }
  } catch (error) {
    // Don't fail the request if cache refresh fails
    console.error('Error refreshing installation cache:', error);
  }

  // Cache user data for 5 minutes
  // User data changes infrequently, so longer cache is safe
  return NextResponse.json(session.user, {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
    },
  });
}
