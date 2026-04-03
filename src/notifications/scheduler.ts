import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Verse } from '../types';

// Configure how notifications are presented when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  // PermissionResponse.status is 'granted' | 'denied' | 'undetermined'
  if ((existing as any).status === 'granted' || (existing as any).granted === true) return true;
  const result = await Notifications.requestPermissionsAsync();
  return (result as any).status === 'granted' || (result as any).granted === true;
}

export async function scheduleDailyNotification(
  timeStr: string,   // "HH:MM"
  verse?: Verse,
  preferredTranslation?: string
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel any existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return;

  let body = 'Your daily Bhagavad Gita shlok is ready.';
  if (verse) {
    const transKey = (preferredTranslation ?? 'siva') as keyof typeof verse.translations;
    const transText = verse.translations[transKey]?.text ?? '';
    if (transText) {
      body = transText.slice(0, 120) + (transText.length > 120 ? '…' : '');
    }
  }

  const title = verse
    ? `BG ${verse.chapter}.${verse.verse} — Today's Shlok`
    : "Pocket Gita \u2014 Today's Shlok";

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
