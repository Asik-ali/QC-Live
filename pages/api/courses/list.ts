import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const db = await getDb();
      const courses = await db.all(`
        SELECT c.*,
          (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
        FROM courses c
        ORDER BY c.created_at DESC
      `);
      res.json({ courses });
    } catch (error) {
      console.error('Failed to list courses:', error);
      res.status(500).json({ error: 'Failed to list courses' });
    }
  });
}
