import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  getFavorites, getAllNotes, getAllSettings,
  bulkInsertFavorites, bulkInsertNotes, setSetting,
} from '../db/queries';
import type { AppSettings, Favorite, Note } from '../types';

interface ExportData {
  version: number;
  exported_at: string;
  favorites: Favorite[];
  notes: Note[];
  settings: AppSettings;
}

export async function exportUserData(): Promise<void> {
  const [favorites, notes, settings] = await Promise.all([
    getFavorites(),
    getAllNotes(),
    getAllSettings(),
  ]);

  const payload: ExportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    favorites,
    notes,
    settings,
  };

  const json = JSON.stringify(payload, null, 2);
  const fileName = `gita_daily_backup_${new Date().toISOString().slice(0, 10)}.json`;
  const fileUri = FileSystem.cacheDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Pocket Gita Backup',
    });
  }
}

export async function importUserData(): Promise<{ success: boolean; message: string }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { success: false, message: 'Import cancelled.' };
  }

  const fileUri = result.assets[0].uri;
  const raw = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });

  let data: ExportData;
  try {
    data = JSON.parse(raw);
  } catch {
    return { success: false, message: 'Invalid file: could not parse JSON.' };
  }

  if (!data.version || !Array.isArray(data.favorites) || !Array.isArray(data.notes)) {
    return { success: false, message: 'Invalid backup file format.' };
  }

  // Merge favorites and notes (upsert, don't wipe)
  if (data.favorites.length > 0) await bulkInsertFavorites(data.favorites);
  if (data.notes.length > 0) await bulkInsertNotes(data.notes);

  // Restore non-progress settings (don't overwrite daily tracking)
  if (data.settings) {
    const s = data.settings;
    if (s.notification_time) await setSetting('notification_time', s.notification_time);
    if (s.verse_order)       await setSetting('verse_order', s.verse_order);
    if (s.preferred_translation) await setSetting('preferred_translation', s.preferred_translation);
  }

  const count = data.favorites.length + data.notes.length;
  return { success: true, message: `Imported ${data.favorites.length} favorites and ${data.notes.length} notes.` };
}
