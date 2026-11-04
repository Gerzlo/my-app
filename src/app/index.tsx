import { useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemEditor, RoundButton } from '@/components/item-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatQuantity, groupBySection, pluralItems, type ShoppingItem } from '@/data/shopping';
import { useShopping } from '@/data/shopping-store';
import { useTheme } from '@/hooks/use-theme';

// Что сейчас открыто в форме: новый товар или существующий.
type EditorState = { mode: 'new' } | { mode: 'edit'; item: ShoppingItem } | null;

// Главный экран: список «Что купить», разбитый по разделам магазина.
export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { items, addItem, updateItem, removeItem, changeQuantity } = useShopping();
  const [editor, setEditor] = useState<EditorState>(null);

  const groups = groupBySection(items).map((group) => ({ ...group, key: group.section.id }));

  // Кнопка «−» на единице: спрашиваем, удалить ли товар.
  function decrease(item: ShoppingItem) {
    if (item.quantity > 1) {
      changeQuantity(item.id, -1);
      return;
    }
    Alert.alert('Удалить товар?', `«${item.name}» исчезнет из списка.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeItem(item.id) },
    ]);
  }

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
            <Pressable
              onPress={() => setEditor({ mode: 'new' })}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <ThemedText style={styles.addButtonText}>＋  Добавить товар</ThemedText>
            </Pressable>
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
            buttonColor={theme.backgroundSelected}
            dividerColor={theme.backgroundSelected}
            onPress={() => setEditor({ mode: 'edit', item })}
            onIncrease={() => changeQuantity(item.id, 1)}
            onDecrease={() => decrease(item)}
          />
        )}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Список пуст.{'\n'}Нажмите «Добавить товар».
          </ThemedText>
        }
      />

      {editor && (
        <ItemEditor
          item={editor.mode === 'edit' ? editor.item : null}
          onClose={() => setEditor(null)}
          onSave={(draft) => {
            if (editor.mode === 'edit') {
              updateItem(editor.item.id, draft);
            } else {
              addItem(draft);
            }
            setEditor(null);
          }}
          onDelete={
            editor.mode === 'edit'
              ? () => {
                  removeItem(editor.item.id);
                  setEditor(null);
                }
              : undefined
          }
        />
      )}
    </ThemedView>
  );
}

type ItemRowProps = {
  item: ShoppingItem;
  isFirst: boolean;
  isLast: boolean;
  cardColor: string;
  buttonColor: string;
  dividerColor: string;
  onPress: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

// Одна строка с товаром. Нажатие на строку — открыть форму, кнопки − и + меняют количество.
function ItemRow({
  item,
  isFirst,
  isLast,
  cardColor,
  buttonColor,
  dividerColor,
  onPress,
  onIncrease,
  onDecrease,
}: ItemRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: cardColor },
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.rowText}>
        <ThemedText>{item.name}</ThemedText>
        {item.note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {item.note}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.stepper}>
        <RoundButton label="−" onPress={onDecrease} color={buttonColor} size={32} />
        <ThemedText type="smallBold" style={styles.quantity}>
          {formatQuantity(item.quantity)} {item.unit}
        </ThemedText>
        <RoundButton label="+" onPress={onIncrease} color={buttonColor} size={32} />
      </View>

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
  addButton: {
    marginTop: Spacing.three,
    backgroundColor: AccentColor,
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
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
    gap: Spacing.two,
    paddingVertical: Spacing.three - Spacing.one,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two + Spacing.one,
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
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  quantity: {
    minWidth: 52,
    textAlign: 'center',
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
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
