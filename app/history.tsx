import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, type HistoryEntry } from '@/src/db/queries';
import { useGitaData } from '@/src/hooks/useGitaData';
import { useSettings } from '@/src/hooks/useSettings';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useTheme } from '@/src/theme';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryScreen() {
  const c = useTheme();
  const { getVerse } = useGitaData();
  const { settings } = useSettings();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    getHistory().then(h => { setEntries(h); setLoading(false); });
  }, []));

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader showBack title="Daily History" subtitle={entries.length > 0 ? `${entries.length} days` : undefined} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={52} color={c.border} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>No history yet</Text>
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>
            Your daily shlokas will appear here as you view them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.shown_date}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const verse = getVerse(item.chapter, item.verse);
            const snippet = verse?.translations[settings.preferred_translation]?.text?.slice(0, 100) ?? '';
            return (
              <TouchableOpacity
                onPress={() => router.push(`/verse/${item.chapter}/${item.verse}`)}
                style={[styles.row, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                activeOpacity={0.7}
              >
                <View style={styles.rowTop}>
                  <Text style={[styles.date, { color: c.textMuted }]}>{formatDate(item.shown_date)}</Text>
                  <Text style={[styles.verseRef, { color: c.accent }]}>
                    BG {item.chapter}.{item.verse}
                  </Text>
                </View>
                {snippet ? (
                  <Text style={[styles.snippet, { color: c.text }]} numberOfLines={2}>
                    {snippet}{snippet.length >= 100 ? '…' : ''}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  row: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12 },
  verseRef: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  snippet: { fontSize: 14, lineHeight: 20 },
});
