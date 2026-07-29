import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const db = await getDb();
      const enrollments = await db.all(`
        SELECT e.*, c.title as course_title, c.instructor as course_instructor
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        ORDER BY e.enrolled_at DESC
      `);
      res.json({ enrollments });
    } catch (error) {
      console.error('Failed to list enrollments:', error);
      res.status(500).json({ error: 'Failed to list enrollments' });
    }
  });
}
