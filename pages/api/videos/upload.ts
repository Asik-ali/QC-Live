import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { requireAuth } from '@/lib/authMiddleware';
import { getDb, logActivity } from '@/lib/database';
import { saveFile, generateFileName, isVideoFile, MAX_FILE_SIZE } from '@/lib/storage';
import { generateThumbnail } from '@/lib/thumbnail';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const runtime = 'nodejs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireAuth(req, res, async (req, res) => {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    maxFileSize: MAX_FILE_SIZE,
  });

  try {
    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!isVideoFile(file.originalFilename || '')) {
      return res.status(400).json({ error: 'Invalid file type. Only video files are allowed.' });
    }

    const filename = generateFileName(file.originalFilename || 'video.mp4');
    const buffer = await fs.readFile(file.filepath);
    const filePath = await saveFile(buffer, filename);

    // Generate thumbnail
    let thumbnailPath = null;
    try {
      const thumbnailName = filename.replace(/\.[^/.]+$/, '') + '_thumb.jpg';
      thumbnailPath = await generateThumbnail(filePath, thumbnailName);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      // Continue without thumbnail
    }

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO videos (filename, original_name, file_path, thumbnail_path, file_size) VALUES (?, ?, ?, ?, ?)',
      [filename, file.originalFilename, filePath, thumbnailPath, file.size]
    );

    await logActivity('video_uploaded', `Video "${file.originalFilename}" uploaded`);

    res.status(200).json({
      id: result.lastID,
      filename,
      originalName: file.originalFilename,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
  });
}