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
  
  // Get the host from the request headers (works in any environment)
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  
  const redirectUri = `${baseUrl}/api/v1/auth/github/callback`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo`;
  
  return NextResponse.redirect(githubAuthUrl);
}
