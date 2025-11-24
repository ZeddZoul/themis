import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  // Get proper base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXTAUTH_URL || 
                 `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${baseUrl}/login?error=token_error`);
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const githubUser = await userResponse.json();

    // Create or update user in database
    let user = await prisma.user.findUnique({
      where: { githubId: String(githubUser.id) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: String(githubUser.id),
          email: githubUser.email || `${githubUser.login}@github.com`,
          name: githubUser.name || githubUser.login,
        },
      });
    }

    // Set session
    const session = await getSession();
    session.user = {
      id: user.id,
      githubId: user.githubId,
      githubUsername: githubUser.login, // Store the GitHub username
      email: user.email,
      name: user.name || '',
      accessToken: tokenData.access_token,
    };
    session.isLoggedIn = true;

    // Check if GitHub App is installed and cache installation data
    try {
      const { getGithubClient } = await import('@/lib/github');
      const { fetchInstallationData, updateSessionCache } = await import('@/lib/session-cache');
      
      console.log(`Checking installation for user: ${githubUser.login}`);
      
      // Fetch installation data (includes repo count)
      const installationCache = await fetchInstallationData(githubUser.login);
      
      if (installationCache) {
        // Cache installation data in session
        updateSessionCache(session, installationCache);
        console.log('Installation found and cached:', {
          installationId: installationCache.installationId,
          totalRepositories: installationCache.totalRepositories,
        });
        
        await session.save();
        return NextResponse.redirect(`${baseUrl}/dashboard`);
      } else {
        // No installation found
        console.log('No installation found (404)');
        await session.save();
        return NextResponse.redirect(`${baseUrl}/install-app`);
      }
    } catch (error) {
      console.error('Error checking installation status:', error);
      // App not installed or error checking, redirect to installation page
      await session.save();
      return NextResponse.redirect(`${baseUrl}/install-app`);
    }
  } catch (error) {
    console.error('GitHub auth failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Get proper base URL
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
  }
}
