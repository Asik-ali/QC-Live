import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAuth } from '@/lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { title, description, instructor, category, difficulty } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

      const db = await getDb();
      const result = await db.run(
        `INSERT INTO courses (title, description, instructor, category, difficulty)
         VALUES (?, ?, ?, ?, ?)`,
        [title.trim(), description || null, instructor || 'Instructor', category || 'General', difficulty || 'beginner']
      );

      await logActivity('course_created', `Course "${title}" created`);
      res.json({ id: result.lastID, message: 'Course created' });
    } catch (error) {
      console.error('Failed to create course:', error);
      res.status(500).json({ error: 'Failed to create course' });
    }
  });
}
