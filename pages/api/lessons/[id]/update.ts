import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id } = req.query;
      const { title, content, videoUrl, duration, sortOrder } = req.body;
      const db = await getDb();

      const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [id]);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      await db.run(
        `UPDATE lessons SET title = ?, content = ?, video_url = ?, duration = ?, sort_order = ? WHERE id = ?`,
        [
          title || lesson.title,
          content !== undefined ? content : lesson.content,
          videoUrl !== undefined ? videoUrl : lesson.video_url,
          duration !== undefined ? duration : lesson.duration,
          sortOrder !== undefined ? sortOrder : lesson.sort_order,
          id,
        ]
      );

      await logActivity('lesson_updated', `Lesson "${lesson.title}" updated`);
      res.json({ message: 'Lesson updated' });
    } catch (error) {
      console.error('Failed to update lesson:', error);
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });
}
