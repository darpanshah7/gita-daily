import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('gita_daily.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      chapter    INTEGER NOT NULL,
      verse      INTEGER NOT NULL,
      created_at TEXT    NOT NULL,
      PRIMARY KEY (chapter, verse)
    );

    CREATE TABLE IF NOT EXISTS notes (
      chapter    INTEGER NOT NULL,
      verse      INTEGER NOT NULL,
      body       TEXT    NOT NULL,
      updated_at TEXT    NOT NULL,
      PRIMARY KEY (chapter, verse)
    );

    CREATE TABLE IF NOT EXISTS history (
      shown_date TEXT    PRIMARY KEY,
      chapter    INTEGER NOT NULL,
      verse      INTEGER NOT NULL
    );
  `);
}
