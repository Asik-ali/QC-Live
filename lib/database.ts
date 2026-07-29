import path from 'path';
import fs from 'fs/promises';
import initSqlJs, { Database as SqlJsDb } from 'sql.js';

let db: SqlJsDb | null = null;
let dbPath: string = '';
let dbInit: Promise<void> | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

interface SqliteResult {
  lastID?: number;
  changes?: number;
}

function toArrayResult(stmt: any): any[] {
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function toSingleResult(stmt: any): any | undefined {
  const rows = toArrayResult(stmt);
  return rows.length > 0 ? rows[0] : undefined;
}

async function saveDb() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    await fs.writeFile(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => { saveDb(); saveTimeout = null; }, 300);
}

const dbApi = {
  async all(sql: string, params?: any[]): Promise<any[]> {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    return toArrayResult(stmt);
  },

  async get(sql: string, params?: any[]): Promise<any | undefined> {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    return toSingleResult(stmt);
  },

  async run(sql: string, params?: any[]): Promise<SqliteResult> {
    if (!db) throw new Error('Database not initialized');
    db.run(sql, params);
    scheduleSave();
    const lastId = db.exec("SELECT last_insert_rowid() as id");
    const changes = db.getRowsModified();
    return {
      lastID: lastId.length > 0 ? (lastId[0].values[0] ? Number(lastId[0].values[0][0]) : undefined) : undefined,
      changes,
    };
  },

  async exec(sql: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    db.exec(sql);
    scheduleSave();
  },
};

export async function getDb() {
  if (db) return dbApi;

  if (dbInit) {
    await dbInit;
    return dbApi;
  }

  dbInit = (async () => {
    const SQL = await initSqlJs();
    dbPath = path.resolve(process.env.DATABASE_PATH || './data/streams.db');
    const dbDir = path.dirname(dbPath);

    try {
      await fs.mkdir(dbDir, { recursive: true });
      const data = await fs.readFile(dbPath).catch(() => null);
      if (data) {
        db = new SQL.Database(new Uint8Array(data));
      } else {
        db = new SQL.Database();
      }
    } catch {
      db = new SQL.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        duration INTEGER,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS streams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        video_id INTEGER REFERENCES videos(id),
        rtmp_url TEXT NOT NULL,
        quality TEXT DEFAULT '720p',
        loop_enabled BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'stopped',
        pid INTEGER,
        started_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      db.run(`ALTER TABLE streams ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
    } catch (e) {}

    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, course_id)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        instructor TEXT DEFAULT 'Instructor',
        thumbnail TEXT,
        category TEXT DEFAULT 'General',
        difficulty TEXT DEFAULT 'beginner',
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        video_url TEXT,
        duration INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_name TEXT NOT NULL,
        progress REAL DEFAULT 0,
        completed_lessons TEXT DEFAULT '[]',
        completed INTEGER DEFAULT 0,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await saveDb();
  })();

  await dbInit;
  return dbApi;
}

export async function logActivity(action: string, details?: string) {
  const d = await getDb();
  await d.run(
    'INSERT INTO activity_logs (action, details) VALUES (?, ?)',
    [action, details]
  );
}
