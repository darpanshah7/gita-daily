import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, SectionList,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFavorites, getAllNotes } from '@/src/db/queries';
import { useGitaData } from '@/src/hooks/useGitaData';
import { useSettings } from '@/src/hooks/useSettings';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useTheme } from '@/src/theme';
import type { Favorite, Note } from '@/src/types';

interface NoteItem {
  chapter: number;
  verse: number;
  isFavorite: boolean;
  note?: string;
  snippet?: string;
}

function buildItems(
  favs: Favorite[],
  notes: Note[],
  getVerse: (ch: number, v: number) => ReturnType<ReturnType<typeof useGitaData>['getVerse']>,
  preferredTranslation: string,
): { favorites: NoteItem[]; withNotes: NoteItem[] } {
  const noteMap = new Map(notes.map(n => [`${n.chapter}-${n.verse}`, n]));
  const favSet = new Set(favs.map(f => `${f.chapter}-${f.verse}`));

  const snippet = (ch: number, v: number) => {
    const t = (getVerse(ch, v)?.translations as any)?.[preferredTranslation]?.text ?? '';
    return t.slice(0, 110) + (t.length > 110 ? '…' : '');
  };

  // Favorites section: all favorited verses (with note if they have one)
  const favorites: NoteItem[] = favs.map(f => ({
    chapter: f.chapter,
    verse: f.verse,
    isFavorite: true,
    note: noteMap.get(`${f.chapter}-${f.verse}`)?.body,
    snippet: snippet(f.chapter, f.verse),
  }));

  // Notes section: verses with notes that are NOT already in favorites
  const withNotes: NoteItem[] = notes
    .filter(n => !favSet.has(`${n.chapter}-${n.verse}`))
    .map(n => ({
      chapter: n.chapter,
      verse: n.verse,
      isFavorite: false,
      note: n.body,
      snippet: snippet(n.chapter, n.verse),
    }));

  return { favorites, withNotes };
}

export default function MyNotesScreen() {
  const c = useTheme();
  const { getVerse } = useGitaData();
  const { settings } = useSettings();
  const [favorites, setFavorites] = useState<NoteItem[]>([]);
  const [withNotes, setWithNotes] = useState<NoteItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Single load: 2 parallel queries instead of N+1
  const load = useCallback(async () => {
    const [favs, notes] = await Promise.all([getFavorites(), getAllNotes()]);
    const built = buildItems(favs, notes, getVerse, settings.preferred_translation);
    setFavorites(built.favorites);
    setWithNotes(built.withNotes);
  }, [getVerse, settings.preferred_translation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const total = favorites.length + withNotes.length;

  const sections = [
    ...(favorites.length > 0 ? [{ title: `Favorites (${favorites.length})`, data: favorites, icon: 'heart' as const }] : []),
    ...(withNotes.length > 0 ? [{ title: `Notes (${withNotes.length})`, data: withNotes, icon: 'create' as const }] : []),
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="My Notes" subtitle={total > 0 ? `${total} saved` : undefined} />

      {total === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={56} color={c.border} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>Nothing saved yet</Text>
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>
            Tap the heart to favorite a shlok, or the pencil icon to add a note.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => `${item.chapter}-${item.verse}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={13} color={c.accent} />
              <Text style={[styles.sectionTitle, { color: c.accent }]}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/verse/${item.chapter}/${item.verse}`)}
              style={[styles.row, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              activeOpacity={0.7}
            >
              <View style={styles.rowTop}>
                <Text style={[styles.verseRef, { color: c.accent }]}>
                  BG {item.chapter}.{item.verse}
                </Text>
                {item.isFavorite && (
                  <Ionicons name="heart" size={13} color={c.heartActive} />
                )}
              </View>
              {item.snippet ? (
                <Text style={[styles.snippet, { color: c.text }]} numberOfLines={2}>
                  {item.snippet}
                </Text>
              ) : null}
              {item.note ? (
                <View style={[styles.noteChip, { backgroundColor: c.surfaceAlt }]}>
                  <Ionicons name="create-outline" size={12} color={c.accent} />
                  <Text style={[styles.noteText, { color: c.textSecondary }]} numberOfLines={2}>
                    {item.note}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginBottom: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verseRef: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  snippet: { fontSize: 14, lineHeight: 20 },
  noteChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  noteText: { fontSize: 13, lineHeight: 18, flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
