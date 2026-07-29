import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { config } from './config';

export async function generateThumbnail(videoPath: string, thumbnailName: string): Promise<string> {
  const thumbnailDir = path.join(config.storage.uploadDir, 'thumbnails');
  
  // Ensure thumbnail directory exists
  try {
    await fs.mkdir(thumbnailDir, { recursive: true });
  } catch (error) {
    console.error('Error creating thumbnail directory:', error);
  }

  const thumbnailPath = path.join(thumbnailDir, thumbnailName);

  // Check if thumbnail already exists
  try {
    await fs.access(thumbnailPath);
    return thumbnailPath;
  } catch {
    // Thumbnail doesn't exist, generate it
  }

  return new Promise((resolve, reject) => {
    // Try to find ffmpeg in common locations
    let ffmpegPath = 'ffmpeg';
    const possiblePaths = [
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
      path.join(process.cwd(), 'ffmpeg', 'bin', 'ffmpeg.exe'),
      path.join(process.cwd(), 'ffmpeg', 'ffmpeg.exe'),
    ];
    
    // Check winget installation path
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const wingetDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
      if (require('fs').existsSync(wingetDir)) {
        try {
          const gyanDirs = require('fs').readdirSync(wingetDir).filter(d => d.startsWith('Gyan.FFmpeg'));
          for (const dir of gyanDirs) {
            const binDir = path.join(wingetDir, dir);
            const versionDirs = require('fs').readdirSync(binDir).filter(d => d.startsWith('ffmpeg-'));
            for (const vDir of versionDirs) {
              const exePath = path.join(binDir, vDir, 'bin', 'ffmpeg.exe');
              if (require('fs').existsSync(exePath)) {
                possiblePaths.push(exePath);
              }
            }
          }
        } catch {}
      }
    }
    
    for (const p of possiblePaths) {
      if (require('fs').existsSync(p)) {
        ffmpegPath = p;
        break;
      }
    }

    const args = [
      '-i', videoPath,
      '-ss', '00:00:01.000', // Take thumbnail at 1 second
      '-vframes', '1',
      '-vf', 'scale=640:360',
      '-y', // Overwrite output files
      thumbnailPath
    ];

    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg error:', error);
      reject(error);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(thumbnailPath);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.stderr.on('data', (data) => {
      console.log('FFmpeg:', data.toString());
    });
  });
}