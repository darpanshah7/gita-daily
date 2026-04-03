import { getDb } from './schema';
import type { AppSettings, Favorite, Note } from '../types';
import { DEFAULT_SETTINGS } from '../types';

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSetting<K extends keyof AppSettings>(
  key: K
): Promise<AppSettings[K]> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  if (!row) return DEFAULT_SETTINGS[key];
  const raw = row.value;
  // Parse numbers and booleans stored as strings
  if (raw === 'true') return true as AppSettings[K];
  if (raw === 'false') return false as AppSettings[K];
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return num as AppSettings[K];
  return raw as AppSettings[K];
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value)]
  );
}

export async function getAllSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings'
  );
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

  const parse = (raw: string | undefined, def: unknown): unknown => {
    if (raw === undefined) return def;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    const num = Number(raw);
    if (!isNaN(num) && raw !== '') return num;
    return raw;
  };

  return {
    notification_time:    (parse(map.notification_time,    DEFAULT_SETTINGS.notification_time)    as string),
    verse_order:          (parse(map.verse_order,          DEFAULT_SETTINGS.verse_order)          as 'sequential' | 'random'),
    preferred_translation:(parse(map.preferred_translation,DEFAULT_SETTINGS.preferred_translation) as AppSettings['preferred_translation']),
    preferred_language:   (parse(map.preferred_language,   DEFAULT_SETTINGS.preferred_language)   as AppSettings['preferred_language']),
    browse_scroll_mode:   (parse(map.browse_scroll_mode,   DEFAULT_SETTINGS.browse_scroll_mode)   as AppSettings['browse_scroll_mode']),
    text_size:            (parse(map.text_size,            DEFAULT_SETTINGS.text_size)            as number),
    last_verse_index:     (parse(map.last_verse_index,     DEFAULT_SETTINGS.last_verse_index)     as number),
    last_verse_date:      (parse(map.last_verse_date,      DEFAULT_SETTINGS.last_verse_date)      as string),
    notifications_enabled:(parse(map.notifications_enabled,DEFAULT_SETTINGS.notifications_enabled)as boolean),
    theme:                (parse(map.theme,                DEFAULT_SETTINGS.theme)                as AppSettings['theme']),
  };
}

// ─── Favorites ──────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<Favorite[]> {
  const db = await getDb();
  return db.getAllAsync<Favorite>(
    'SELECT chapter, verse, created_at FROM favorites ORDER BY created_at DESC'
  );
}

export async function isFavorite(chapter: number, verse: number): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE chapter = ? AND verse = ?',
    [chapter, verse]
  );
  return (row?.count ?? 0) > 0;
}

export async function addFavorite(chapter: number, verse: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO favorites (chapter, verse, created_at) VALUES (?, ?, ?)',
    [chapter, verse, new Date().toISOString()]
  );
}

export async function removeFavorite(chapter: number, verse: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM favorites WHERE chapter = ? AND verse = ?',
    [chapter, verse]
  );
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function getNote(chapter: number, verse: number): Promise<Note | null> {
  const db = await getDb();
  return db.getFirstAsync<Note>(
    'SELECT chapter, verse, body, updated_at FROM notes WHERE chapter = ? AND verse = ?',
    [chapter, verse]
  );
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    'SELECT chapter, verse, body, updated_at FROM notes ORDER BY updated_at DESC'
  );
}

export async function upsertNote(chapter: number, verse: number, body: string): Promise<void> {
  const db = await getDb();
  if (!body.trim()) {
    await db.runAsync('DELETE FROM notes WHERE chapter = ? AND verse = ?', [chapter, verse]);
    return;
  }
  await db.runAsync(
    `INSERT INTO notes (chapter, verse, body, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(chapter, verse) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
    [chapter, verse, body, new Date().toISOString()]
  );
}

// ─── Import / Export helpers ─────────────────────────────────────────────────

export async function clearUserData(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM favorites; DELETE FROM notes;');
}

export async function bulkInsertFavorites(favorites: Favorite[]): Promise<void> {
  const db = await getDb();
  for (const f of favorites) {
    await db.runAsync(
      'INSERT OR IGNORE INTO favorites (chapter, verse, created_at) VALUES (?, ?, ?)',
      [f.chapter, f.verse, f.created_at]
    );
  }
}

export async function bulkInsertNotes(notes: Note[]): Promise<void> {
  const db = await getDb();
  for (const n of notes) {
    await db.runAsync(
      `INSERT INTO notes (chapter, verse, body, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(chapter, verse) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
      [n.chapter, n.verse, n.body, n.updated_at]
    );
  }
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  shown_date: string;
  chapter: number;
  verse: number;
}

export async function addToHistory(chapter: number, verse: number, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO history (shown_date, chapter, verse) VALUES (?, ?, ?)',
    [date, chapter, verse]
  );
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const db = await getDb();
  return db.getAllAsync<HistoryEntry>(
    'SELECT shown_date, chapter, verse FROM history ORDER BY shown_date DESC LIMIT 365'
  );
}
