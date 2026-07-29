import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAdmin } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAdmin(req, res, async (req, res) => {
    const { id } = req.query;

    if (req.method === 'GET') {
      try {
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
      return;
    }

    if (req.method === 'POST') {
      try {
        const { courseIds } = req.body;
        if (!Array.isArray(courseIds)) return res.status(400).json({ error: 'courseIds array required' });

        const db = await getDb();

        const student = await db.get('SELECT * FROM students WHERE id = ?', [id]);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        await db.run('DELETE FROM student_courses WHERE student_id = ?', [id]);

        for (const courseId of courseIds) {
          await db.run(
            'INSERT OR IGNORE INTO student_courses (student_id, course_id) VALUES (?, ?)',
            [id, courseId]
          );
        }

        await logActivity('courses_assigned', `Courses assigned to student "${student.name}"`);
        res.json({ message: 'Courses updated' });
      } catch (error) {
        console.error('Failed to assign courses:', error);
        res.status(500).json({ error: 'Failed to assign courses' });
      }
      return;
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
