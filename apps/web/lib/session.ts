import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  user?: {
    id: string;
    githubId: string;
    email: string;
    name: string;
  };
  isLoggedIn: boolean;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(await cookies(), {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
    cookieName: 'themis_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
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
