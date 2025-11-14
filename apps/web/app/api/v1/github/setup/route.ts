import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // GitHub redirects here after app installation
  // The installation_id is in the query params
  const searchParams = request.nextUrl.searchParams;
  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');

  if (setupAction === 'install' && installationId) {
    // App was successfully installed
    return NextResponse.redirect(new URL('/dashboard?installed=true', request.url));
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
