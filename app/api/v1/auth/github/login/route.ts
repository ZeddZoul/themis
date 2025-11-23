import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  // Debug logging
  console.log('Environment check:', {
    hasClientId: !!clientId,
    clientId: clientId ? `${clientId.substring(0, 4)}...` : 'undefined',
    nodeEnv: process.env.NODE_ENV,
  });
  
  if (!clientId) {
    console.error('GITHUB_CLIENT_ID is not set!');
    return NextResponse.json({ error: 'GitHub Client ID not configured' }, { status: 500 });
  }
  
  // Get the host from environment variables (preferred) or request headers
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXTAUTH_URL || 
                 `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
  
  const redirectUri = `${baseUrl}/api/v1/auth/github/callback`;
  
  // Request necessary OAuth scopes
  // - repo: Access to private repositories
  // - read:user: Read user profile data
  // - user:email: Access to user email addresses
  const scope = 'repo read:user user:email';
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&prompt=consent&t=${Date.now()}`;
  
  console.log('Redirecting to GitHub OAuth with scopes:', scope);
  
  return NextResponse.redirect(githubAuthUrl);
}
