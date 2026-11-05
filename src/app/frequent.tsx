import { useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoundButton } from '@/components/item-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  formatQuantity,
  groupBySection,
  normalizeName,
  pluralItems,
  type CatalogItem,
} from '@/data/shopping';
import { useShopping } from '@/data/shopping-store';
import { useTheme } from '@/hooks/use-theme';

// Вкладка «Частые»: все товары, которые когда-либо добавляли.
// Нажатие добавляет товар в список «Что купить».
export default function FrequentItemsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { sections, catalog, isInList, addFromCatalog, removeFromCatalog } = useShopping();
  const [search, setSearch] = useState('');

  // Поиск по названию.
  const query = normalizeName(search);
  const visible = query
    ? catalog.filter((c) => normalizeName(c.name).includes(query))
    : catalog;
  // Внутри раздела — по алфавиту, чтобы было легко найти.
  const sorted = [...visible].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const groups = groupBySection(sorted, sections).map((group) => ({ ...group, key: group.section.id }));

  function confirmRemove(entry: CatalogItem) {
    Alert.alert(
      'Убрать из частых?',
      `«${entry.name}» больше не будет во вкладке «Частые». Список покупок не изменится.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Убрать', style: 'destructive', onPress: () => removeFromCatalog(entry.id) },
      ]
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SectionList
        sections={groups}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>Частые товары</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {pluralItems(catalog.length)} · нажмите, чтобы добавить в список
            </ThemedText>
            {catalog.length > 0 && (
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="🔍  Поиск"
                placeholderTextColor={theme.textSecondary}
                clearButtonMode="while-editing"
                returnKeyType="search"
                style={[
                  styles.search,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
              />
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            {section.section.emoji}  {section.section.name.toUpperCase()}
          </ThemedText>
        )}
        renderItem={({ item, index, section }) => (
          <CatalogRow
            entry={item}
            inList={isInList(item.name)}
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
            cardColor={theme.backgroundElement}
            dividerColor={theme.backgroundSelected}
            onAdd={() => addFromCatalog(item)}
            onRemove={() => confirmRemove(item)}
          />
        )}
        ListFooterComponent={
          catalog.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
              Удержите товар, чтобы убрать его из частых.
            </ThemedText>
          ) : null
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {catalog.length === 0
              ? 'Пока пусто.\nТовары появятся здесь сами, когда вы добавите их в список.'
              : 'Ничего не найдено.'}
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

type CatalogRowProps = {
  entry: CatalogItem;
  inList: boolean;
  isFirst: boolean;
  isLast: boolean;
  cardColor: string;
  dividerColor: string;
  onAdd: () => void;
  onRemove: () => void;
};

// Строка частого товара: справа «+» или отметка «В списке».
function CatalogRow({
  entry,
  inList,
  isFirst,
  isLast,
  cardColor,
  dividerColor,
  onAdd,
  onRemove,
}: CatalogRowProps) {
  return (
    <Pressable
      onPress={inList ? undefined : onAdd}
      onLongPress={onRemove}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: cardColor },
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        pressed && !inList && styles.pressed,
      ]}>
      <View style={styles.rowText}>
        <ThemedText>{entry.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatQuantity(entry.quantity)} {entry.unit}
          {entry.note ? ` · ${entry.note}` : ''}
        </ThemedText>
      </View>

      {inList ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          ✓ В списке
        </ThemedText>
      ) : (
        <RoundButton label="+" onPress={onAdd} color={AccentColor} size={34} textColor="#ffffff" />
      )}

      {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: 700,
  },
  search: {
    marginTop: Spacing.three,
    fontSize: 17,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 12,
  },
  sectionHeader: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    marginLeft: Spacing.two,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
    minHeight: 56,
  },
  rowFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  rowLast: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  rowText: {
    flex: 1,
  },
  divider: {
    position: 'absolute',
    left: Spacing.three,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
});
