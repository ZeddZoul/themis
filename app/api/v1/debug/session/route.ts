import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';

export async function GET() {
  try {
    const session = await getSession();
    
    const debugInfo: any = {
      isLoggedIn: session.isLoggedIn,
      hasUser: !!session.user,
      hasAccessToken: !!session.user?.accessToken,
      accessTokenLength: session.user?.accessToken?.length || 0,
      userId: session.user?.id,
      githubId: session.user?.githubId,
      userName: session.user?.name,
    };

    // Test GitHub API with access token
    if (session.user?.accessToken) {
      try {
        const userOctokit = getGithubClient(session.user.accessToken);
        const { data: user } = await userOctokit.request('GET /user');
        debugInfo.githubApiTest = {
          success: true,
          login: user.login,
          id: user.id,
        };
      } catch (error: any) {
        debugInfo.githubApiTest = {
          success: false,
          error: error.message,
          status: error.status,
        };
      }
    }

    // Test App authentication
    try {
      const appOctokit = getGithubClient();
      const { data: app } = await appOctokit.request('GET /app');
      debugInfo.appAuth = {
        success: true,
        appName: app?.name || 'unknown',
        appId: app?.id || 'unknown',
      };
    } catch (error: any) {
      debugInfo.appAuth = {
        success: false,
        error: error.message,
      };
    }

    // Test installation lookup
    if (session.user?.githubId) {
      try {
        const appOctokit = getGithubClient();
        let username = session.user.githubId;
        
        // Try to resolve numeric ID to username
        if (/^\d+$/.test(username)) {
          try {
            const { data: githubUser } = await appOctokit.request('GET /user/{id}', {
              id: username
            });
            username = githubUser.login;
          } catch (e) {
            // Ignore
          }
        }
        
        const { data: installation } = await appOctokit.request('GET /users/{username}/installation', {
          username: username,
        });
        
        debugInfo.installation = {
          success: true,
          installationId: installation.id,
          username: username,
        };
      } catch (error: any) {
        debugInfo.installation = {
          success: false,
          error: error.message,
          status: error.status,
        };
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
