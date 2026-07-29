import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const { title, content, videoUrl, duration } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

      const db = await getDb();

      const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const maxSort = await db.get('SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM lessons WHERE course_id = ?', [id]);

      const result = await db.run(
        `INSERT INTO lessons (course_id, title, content, video_url, duration, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, title.trim(), content || null, videoUrl || null, duration || null, maxSort.max_sort + 1]
      );

      await logActivity('lesson_created', `Lesson "${title}" added to course "${course.title}"`);
      res.json({ id: result.lastID, message: 'Lesson created' });
    } catch (error) {
      console.error('Failed to create lesson:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create lesson';
      res.status(500).json({ error: msg });
    }
  });
}
