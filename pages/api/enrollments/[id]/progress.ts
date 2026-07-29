import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const { lessonId, completed } = req.body;
      const db = await getDb();

      const enrollment = await db.get('SELECT * FROM enrollments WHERE id = ?', [id]);
      if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

      const completedLessons: number[] = JSON.parse(enrollment.completed_lessons || '[]');

      if (completed) {
        if (!completedLessons.includes(lessonId)) {
          completedLessons.push(lessonId);
        }
      } else {
        const idx = completedLessons.indexOf(lessonId);
        if (idx > -1) completedLessons.splice(idx, 1);
      }

      const lessonCount = await db.get('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?', [enrollment.course_id]);
      const totalLessons = lessonCount.count;
      const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
      const isComplete = completedLessons.length >= totalLessons && totalLessons > 0;

      await db.run(
        'UPDATE enrollments SET progress = ?, completed_lessons = ?, completed = ? WHERE id = ?',
        [progress, JSON.stringify(completedLessons), isComplete ? 1 : 0, id]
      );

      res.json({ progress, completedLessons, completed: isComplete });
    } catch (error) {
      console.error('Failed to update progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });
}
