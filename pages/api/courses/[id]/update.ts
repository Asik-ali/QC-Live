import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const { title, description, instructor, category, difficulty, status } = req.body;
      const db = await getDb();

      const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      await db.run(
        `UPDATE courses SET title = ?, description = ?, instructor = ?, category = ?, difficulty = ?, status = ?
         WHERE id = ?`,
        [
          title || course.title,
          description !== undefined ? description : course.description,
          instructor || course.instructor,
          category || course.category,
          difficulty || course.difficulty,
          status || course.status,
          id,
        ]
      );

      await logActivity('course_updated', `Course "${course.title}" updated`);
      res.json({ message: 'Course updated' });
    } catch (error) {
      console.error('Failed to update course:', error);
      res.status(500).json({ error: 'Failed to update course' });
    }
  });
}
