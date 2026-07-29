import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const db = await getDb();

      const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      await db.run('DELETE FROM lessons WHERE course_id = ?', [id]);
      await db.run('DELETE FROM enrollments WHERE course_id = ?', [id]);
      await db.run('DELETE FROM courses WHERE id = ?', [id]);

      await logActivity('course_deleted', `Course "${course.title}" deleted`);
      res.json({ message: 'Course deleted' });
    } catch (error) {
      console.error('Failed to delete course:', error);
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });
}
