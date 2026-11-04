import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Экран «Частые товары». Пока заглушка — наполним на шаге 7.
export default function FrequentItemsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
      <ThemedText style={styles.title}>Частые товары</ThemedText>
      <View style={styles.placeholder}>
        <ThemedText themeColor="textSecondary" style={styles.placeholderText}>
          Здесь будут товары, которые заказывают постоянно.{'\n'}Их можно будет добавить в список одним нажатием.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: 700,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  placeholderText: {
    textAlign: 'center',
  },
});
