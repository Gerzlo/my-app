// Нижние вкладки для веб-версии (в браузере на телефоне).
// На iPhone/Android используется app-tabs.tsx с системными вкладками.

import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        {/* Внутрь TabList можно передать только один объект стилей, не массив */}
        <View
          style={StyleSheet.flatten([
            styles.bar,
            { paddingBottom: Math.max(insets.bottom, Spacing.two) },
          ])}>
          <ThemedView type="backgroundElement" style={styles.inner}>
            <TabTrigger name="frequent" href="/frequent" asChild>
              <TabButton icon="★">Частые</TabButton>
            </TabTrigger>
            <TabTrigger name="index" href="/" asChild>
              <TabButton icon="☰">Список</TabButton>
            </TabTrigger>
          </ThemedView>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.buttonInner}>
        <ThemedText style={[styles.icon, isFocused && { color: AccentColor }]}>{icon}</ThemedText>
        <ThemedText type="smallBold" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // TabList делает ряд — центрируем по горизонтали явно.
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
  },
  buttonInner: {
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
