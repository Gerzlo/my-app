import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SAMPLE_ITEMS, groupBySection, pluralItems, type ShoppingItem } from '@/data/shopping';
import { useTheme } from '@/hooks/use-theme';

// Главный экран: список «Что купить», разбитый по разделам магазина.
export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const items = SAMPLE_ITEMS;
  const groups = groupBySection(items).map((group) => ({ ...group, key: group.section.id }));

  return (
    <ThemedView style={styles.screen}>
      <SectionList
        sections={groups}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>Что купить</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {pluralItems(items.length)} · разделов: {groups.length}
            </ThemedText>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            {section.section.emoji}  {section.section.name.toUpperCase()}
          </ThemedText>
        )}
        renderItem={({ item, index, section }) => (
          <ItemRow
            item={item}
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
            cardColor={theme.backgroundElement}
            pillColor={theme.backgroundSelected}
            dividerColor={theme.backgroundSelected}
          />
        )}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Список пуст
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

type ItemRowProps = {
  item: ShoppingItem;
  isFirst: boolean;
  isLast: boolean;
  cardColor: string;
  pillColor: string;
  dividerColor: string;
};

// Одна строка с товаром. Строки одного раздела складываются в общую карточку.
function ItemRow({ item, isFirst, isLast, cardColor, pillColor, dividerColor }: ItemRowProps) {
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: cardColor },
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
      ]}>
      <View style={styles.rowText}>
        <ThemedText>{item.name}</ThemedText>
        {item.note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {item.note}
          </ThemedText>
        ) : null}
      </View>

      <View style={[styles.pill, { backgroundColor: pillColor }]}>
        <ThemedText type="smallBold">
          {item.quantity} {item.unit}
        </ThemedText>
      </View>

      {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </View>
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
    paddingHorizontal: Spacing.three,
    minHeight: 52,
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
  pill: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    minWidth: 56,
    alignItems: 'center',
  },
  divider: {
    position: 'absolute',
    left: Spacing.three,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
