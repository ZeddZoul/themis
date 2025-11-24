import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  user?: {
    id: string;
    githubId: string;
    githubUsername?: string; // GitHub login username
    email: string;
    name: string;
    accessToken?: string;
    // Cached GitHub App installation data
    installationId?: string;
    totalRepositories?: number;
    installationCachedAt?: number; // Timestamp for cache invalidation
  };
  isLoggedIn: boolean;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(await cookies(), {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
    cookieName: 'themis_session',
    cookieOptions: {
      // secure: process.env.NODE_ENV === 'production', // Disabled for debugging Cloud Run SSL termination
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    },
  });

  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }

  return session;
}
