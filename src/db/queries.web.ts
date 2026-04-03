/**
 * Web implementation of the DB layer using localStorage.
 * Metro resolves this file on web instead of queries.ts (expo-sqlite).
 * Identical function signatures — all callers are unaware of the platform.
 */
import type { AppSettings, Favorite, Note } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const KEYS = {
  settings:  'gita:settings',
  favorites: 'gita:favorites',
  notes:     'gita:notes',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(s: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

function readFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(KEYS.favorites);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favs: Favorite[]): void {
  localStorage.setItem(KEYS.favorites, JSON.stringify(favs));
}

function readNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEYS.notes);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]): void {
  localStorage.setItem(KEYS.notes, JSON.stringify(notes));
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  return readSettings()[key];
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  const s = readSettings();
  s[key] = value;
  writeSettings(s);
}

export async function getAllSettings(): Promise<AppSettings> {
  return readSettings();
}

// ─── Favorites ──────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<Favorite[]> {
  return readFavorites().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function isFavorite(chapter: number, verse: number): Promise<boolean> {
  return readFavorites().some(f => f.chapter === chapter && f.verse === verse);
}

export async function addFavorite(chapter: number, verse: number): Promise<void> {
  const favs = readFavorites();
  if (!favs.some(f => f.chapter === chapter && f.verse === verse)) {
    favs.push({ chapter, verse, created_at: new Date().toISOString() });
    writeFavorites(favs);
  }
}

export async function removeFavorite(chapter: number, verse: number): Promise<void> {
  writeFavorites(readFavorites().filter(f => !(f.chapter === chapter && f.verse === verse)));
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function getNote(chapter: number, verse: number): Promise<Note | null> {
  return readNotes().find(n => n.chapter === chapter && n.verse === verse) ?? null;
}

export async function getAllNotes(): Promise<Note[]> {
  return readNotes().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function upsertNote(chapter: number, verse: number, body: string): Promise<void> {
  const notes = readNotes().filter(n => !(n.chapter === chapter && n.verse === verse));
  if (body.trim()) {
    notes.push({ chapter, verse, body, updated_at: new Date().toISOString() });
  }
  writeNotes(notes);
}

// ─── Import / Export ────────────────────────────────────────────────────────

export async function clearUserData(): Promise<void> {
  localStorage.removeItem(KEYS.favorites);
  localStorage.removeItem(KEYS.notes);
}

export async function bulkInsertFavorites(favorites: Favorite[]): Promise<void> {
  const existing = readFavorites();
  for (const f of favorites) {
    if (!existing.some(e => e.chapter === f.chapter && e.verse === f.verse)) {
      existing.push(f);
    }
  }
  writeFavorites(existing);
}

export async function bulkInsertNotes(notes: Note[]): Promise<void> {
  const existing = readNotes().filter(
    e => !notes.some(n => n.chapter === e.chapter && n.verse === e.verse)
  );
  writeNotes([...existing, ...notes]);
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  shown_date: string;
  chapter: number;
  verse: number;
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem('gita:history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(chapter: number, verse: number, date: string): Promise<void> {
  const history = readHistory().filter(h => h.shown_date !== date);
  history.unshift({ shown_date: date, chapter, verse });
  localStorage.setItem('gita:history', JSON.stringify(history.slice(0, 365)));
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return readHistory();
}
