import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAdmin } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAdmin(req, res, async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const db = await getDb();

      const student = await db.get('SELECT * FROM students WHERE id = ?', [id]);
      if (!student) return res.status(404).json({ error: 'Student not found' });

      await db.run('DELETE FROM student_courses WHERE student_id = ?', [id]);
      await db.run('DELETE FROM students WHERE id = ?', [id]);

      await logActivity('student_deleted', `Student "${student.name}" deleted`);
      res.json({ message: 'Student deleted' });
    } catch (error) {
      console.error('Failed to delete student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });
}
