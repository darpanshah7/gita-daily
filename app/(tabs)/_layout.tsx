import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const c = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'sunny' : 'sunny-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'My Notes',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
