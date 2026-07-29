import { NextApiRequest, NextApiResponse } from 'next';
import { getDb, logActivity } from '@/lib/database';
import { requireAdmin } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAdmin(req, res, async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { username, password, name } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ error: 'Username, password, and name are required' });
      }

      const db = await getDb();

      const existing = await db.get('SELECT id FROM students WHERE username = ?', [username]);
      if (existing) return res.status(400).json({ error: 'Username already exists' });

      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO students (username, password_hash, name) VALUES (?, ?, ?)',
        [username, password_hash, name]
      );

      await logActivity('student_created', `Student "${name}" (${username}) created`);
      res.json({ id: result.lastID, message: 'Student created' });
    } catch (error) {
      console.error('Failed to create student:', error);
      res.status(500).json({ error: 'Failed to create student' });
    }
  });
}
