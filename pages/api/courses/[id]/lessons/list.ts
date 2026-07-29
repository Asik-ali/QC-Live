import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const db = await getDb();
      const lessons = await db.all(
        'SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC, id ASC',
        [id]
      );
      res.json({ lessons });
    } catch (error) {
      console.error('Failed to list lessons:', error);
      res.status(500).json({ error: 'Failed to list lessons' });
    }
  });
}
