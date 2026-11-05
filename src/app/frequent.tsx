import { useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoundButton } from '@/components/item-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  displayName,
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
  // Открытые разделы. По умолчанию все свёрнуты, чтобы не листать длинный список.
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Поиск по названию.
  const query = normalizeName(search);
  const visible = query
    ? catalog.filter((c) => normalizeName(displayName(c)).includes(query))
    : catalog;
  // Внутри раздела — по алфавиту, чтобы было легко найти.
  const sorted = [...visible].sort((a, b) =>
    displayName(a).localeCompare(displayName(b), 'ru', { numeric: true })
  );
  // При поиске показываем все найденные товары, без сворачивания.
  const groups = groupBySection(sorted, sections).map((group) => {
    const isOpen = query.length > 0 || openSections.has(group.section.id);
    return {
      ...group,
      key: group.section.id,
      isOpen,
      total: group.data.length,
      data: isOpen ? group.data : [],
    };
  });

  function confirmRemove(entry: CatalogItem) {
    Alert.alert(
      'Убрать из частых?',
      `«${displayName(entry)}» больше не будет во вкладке «Частые». Список покупок не изменится.`,
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
          <Pressable
            onPress={() => toggleSection(section.section.id)}
            disabled={query.length > 0}
            style={({ pressed }) => [
              styles.sectionHeader,
              { backgroundColor: theme.backgroundElement },
              section.isOpen && [
                styles.sectionHeaderOpen,
                { borderBottomColor: theme.backgroundSelected },
              ],
              pressed && styles.pressed,
            ]}>
            <ThemedText style={styles.sectionEmoji}>{section.section.emoji}</ThemedText>
            <ThemedText style={styles.sectionName}>{section.section.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {section.total}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.chevron}>
              {section.isOpen ? '⌃' : '⌄'}
            </ThemedText>
          </Pressable>
        )}
        renderItem={({ item, index, section }) => (
          <CatalogRow
            entry={item}
            inList={isInList(item)}
            isFirst={false}
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
        <ThemedText>
          {entry.name}
          {entry.size ? <ThemedText style={styles.size}> {entry.size}</ThemedText> : null}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatQuantity(entry.quantity)} {entry.unit}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    borderRadius: 14,
  },
  sectionHeaderOpen: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sectionEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  sectionName: {
    flex: 1,
    fontWeight: 600,
  },
  chevron: {
    width: 18,
    textAlign: 'center',
    fontSize: 18,
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
  size: {
    fontWeight: 700,
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
