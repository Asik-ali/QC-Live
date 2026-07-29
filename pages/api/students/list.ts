import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/database';
import { requireAdmin } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAdmin(req, res, async (req, res) => {
    try {
      const db = await getDb();
      const students = await db.all(`
        SELECT s.id, s.username, s.name, s.created_at,
          (SELECT COUNT(*) FROM student_courses WHERE student_id = s.id) as course_count
        FROM students s
        ORDER BY s.created_at DESC
      `);
      res.json({ students });
    } catch (error) {
      console.error('Failed to list students:', error);
      res.status(500).json({ error: 'Failed to list students' });
    }
  });
}
