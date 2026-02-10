import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let db: Database.Database | null = null;
let dbPath: string | null = null;

function getDataDir(): string {
  const home = os.homedir();
  const dir = path.join(home, '.watercooler');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { mode: 0o700 });
  }
  return dir;
}

function getDbPath(): string {
  const envPath = process.env.WATERCOOLER_DB_PATH;
  if (envPath) {
    const dir = path.dirname(envPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { mode: 0o700, recursive: true });
    }
    return envPath;
  }
  return path.join(getDataDir(), 'watercooler.sqlite');
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS nuggets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      up INTEGER NOT NULL DEFAULT 0,
      down INTEGER NOT NULL DEFAULT 0,
      bookmarks INTEGER NOT NULL DEFAULT 0,
      applied INTEGER NOT NULL DEFAULT 0
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS nuggets_fts USING fts5(
      body,
      tags,
      content='nuggets',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS nuggets_ai AFTER INSERT ON nuggets BEGIN
      INSERT INTO nuggets_fts(rowid, body, tags) VALUES (new.id, new.body, new.tags);
    END;
    CREATE TRIGGER IF NOT EXISTS nuggets_ad AFTER DELETE ON nuggets BEGIN
      INSERT INTO nuggets_fts(nuggets_fts, rowid, body, tags) VALUES('delete', old.id, old.body, old.tags);
    END;
    CREATE TRIGGER IF NOT EXISTS nuggets_au AFTER UPDATE ON nuggets BEGIN
      INSERT INTO nuggets_fts(nuggets_fts, rowid, body, tags) VALUES('delete', old.id, old.body, old.tags);
      INSERT INTO nuggets_fts(rowid, body, tags) VALUES (new.id, new.body, new.tags);
    END;

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      type TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT '',
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      payload TEXT
    );

    CREATE TABLE IF NOT EXISTS cursors (
      viewer_type TEXT NOT NULL,
      viewer_id TEXT NOT NULL,
      last_seen_event_id INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (viewer_type, viewer_id)
    );
  `);
}

export function getDb(): Database.Database {
  const resolvedPath = getDbPath();
  if (db === null || dbPath !== resolvedPath) {
    if (db !== null) {
      db.close();
      db = null;
    }
    dbPath = resolvedPath;
    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    runMigrations(db);
  }
  return db;
}

export function closeDb(): void {
  if (db !== null) {
    db.close();
    db = null;
    dbPath = null;
  }
}
