import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const db = await getDb();

      const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [id]);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      await db.run('DELETE FROM lessons WHERE id = ?', [id]);

      await logActivity('lesson_deleted', `Lesson "${lesson.title}" deleted`);
      res.json({ message: 'Lesson deleted' });
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      res.status(500).json({ error: 'Failed to delete lesson' });
    }
  });
}
