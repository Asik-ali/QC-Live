import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from './auth';

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  const session = await getSession(req, res);
  
  if (!session.user?.isLoggedIn) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  (req as any).session = session;
  
  return handler(req, res);
}

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  const session = await getSession(req, res);

  if (!session.user?.isLoggedIn) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  (req as any).session = session;

  return handler(req, res);
}