import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import bcrypt from 'bcryptjs';
import { config } from './config';

export interface SessionData {
  user?: {
    isLoggedIn: boolean;
    username: string;
    role: 'admin' | 'student';
    studentId?: number;
  };
}

export const sessionOptions: SessionOptions = {
  password: config.session.secret,
  cookieName: 'streaming-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res: NextApiResponse | GetServerSidePropsContext['res']
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export function withSessionRoute(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);
    (req as any).session = session;
    return handler(req, res);
  };
}

export function withSessionSsr<
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
  handler: (
    context: GetServerSidePropsContext,
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
) {
  return async (context: GetServerSidePropsContext) => {
    const session = await getSession(context.req, context.res);
    (context.req as any).session = session;
    return handler(context);
  };
}

export async function validateCredentials(username: string, password: string): Promise<{ valid: boolean; role?: 'admin' | 'student'; studentId?: number }> {
  const validUsername = config.auth.username;
  const hashedPassword = config.auth.password;

  if (username === validUsername) {
    try {
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) return { valid: true, role: 'admin' };
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return { valid: false };
    }
  }

  try {
    const { getDb } = await import('./database');
    const db = await getDb();
    const student = await db.get('SELECT * FROM students WHERE username = ?', [username]);
    if (student) {
      const match = await bcrypt.compare(password, student.password_hash);
      if (match) return { valid: true, role: 'student', studentId: student.id };
    }
  } catch (error) {
    console.error('Error validating student:', error);
  }

  return { valid: false };
}