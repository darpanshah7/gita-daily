import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack, right }: Props) {
  const c = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: c.surface, paddingTop: insets.top, borderBottomColor: c.border }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={c.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        {showBack ? (
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text> : null}
          </View>
        ) : (
          // flex spacer pushes rightWrap to the end; absolute overlay centers the title on screen
          <>
            <View style={{ flex: 1 }} />
            <View style={styles.titleAbsolute} pointerEvents="none">
              <Text style={[styles.title, { color: c.text }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text> : null}
            </View>
          </>
        )}
        <View style={styles.rightWrap}>{right ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backBtn: { width: 36 },
  titleWrap: { flex: 1, alignItems: 'flex-start' },
  titleAbsolute: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  rightWrap: { alignItems: 'flex-end', flexShrink: 0 },
  title: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { fontSize: 12, marginTop: 1 },
});
