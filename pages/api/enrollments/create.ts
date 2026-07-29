import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { courseId, studentName } = req.body;
      if (!courseId || !studentName) return res.status(400).json({ error: 'courseId and studentName required' });

      const db = await getDb();

      const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const existing = await db.get(
        'SELECT * FROM enrollments WHERE course_id = ? AND student_name = ?',
        [courseId, studentName]
      );
      if (existing) return res.status(400).json({ error: 'Already enrolled' });

      const result = await db.run(
        'INSERT INTO enrollments (course_id, student_name) VALUES (?, ?)',
        [courseId, studentName]
      );

      await logActivity('enrollment_created', `"${studentName}" enrolled in "${course.title}"`);
      res.json({ id: result.lastID, message: 'Enrolled successfully' });
    } catch (error) {
      console.error('Failed to enroll:', error);
      res.status(500).json({ error: 'Failed to enroll' });
    }
  });
}
