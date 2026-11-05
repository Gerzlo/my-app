// Нижние вкладки для веб-версии (в браузере на телефоне).
// На iPhone/Android используется app-tabs.tsx с системными вкладками.
//
// Важно: TabTrigger должны быть прямыми детьми TabList — иначе Expo Router
// не находит вкладки и переключение не работает.

import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AccentColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <BottomBar>
          <TabTrigger name="frequent" href="/frequent" asChild>
            <TabButton icon="★">Частые</TabButton>
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="☰">Список</TabButton>
          </TabTrigger>
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

// Плашка внизу экрана. Получает вкладки как children и просто оформляет их.
function BottomBar({ children, style: _style, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      {...props}
      style={StyleSheet.flatten([
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, Spacing.two) },
      ])}>
      <View style={StyleSheet.flatten([styles.inner, { backgroundColor: theme.backgroundElement }])}>
        {children}
      </View>
    </View>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  style: _style,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        isFocused && { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={[styles.icon, isFocused && { color: AccentColor }]}>{icon}</ThemedText>
      <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  inner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 360,
    padding: Spacing.one,
    borderRadius: 999,
    gap: Spacing.one,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 999,
  },
  icon: {
    fontSize: 16,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
