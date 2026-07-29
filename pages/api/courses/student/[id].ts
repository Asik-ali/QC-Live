import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const db = await getDb();
      const courses = await db.all(`
        SELECT c.*, sc.assigned_at
        FROM courses c
        JOIN student_courses sc ON c.id = sc.course_id
        WHERE sc.student_id = ?
        ORDER BY c.title ASC
      `, [id]);
      res.json({ courses });
    } catch (error) {
      console.error('Failed to get student courses:', error);
      res.status(500).json({ error: 'Failed to get courses' });
    }
  });
}
