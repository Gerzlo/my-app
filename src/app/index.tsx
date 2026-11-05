import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemEditor, RoundButton } from '@/components/item-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  buildShareText,
  displayName,
  formatQuantity,
  groupBySection,
  pluralItems,
  type ItemDraft,
  type ShoppingItem,
} from '@/data/shopping';
import { useShopping } from '@/data/shopping-store';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { shareText } from '@/utils/share';

// Что сейчас открыто в форме: новый товар или существующий.
// preset — заранее заполненные поля (например, «тот же товар другого объёма»).
type EditorState =
  | { mode: 'new'; preset?: Partial<ItemDraft> }
  | { mode: 'edit'; item: ShoppingItem }
  | null;

// Главный экран: список «Что купить», разбитый по разделам магазина.
export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { sections, items, addItem, updateItem, removeItem, changeQuantity, toggleBought, clearBought } =
    useShopping();
  const [editor, setEditor] = useState<EditorState>(null);

  const groups = groupBySection(items, sections).map((group) => ({ ...group, key: group.section.id }));
  const boughtCount = items.filter((item) => item.bought).length;

  // Открыть меню «Поделиться» iPhone со списком текстом (WhatsApp, Telegram, Сообщения…).
  async function shareList() {
    const text = buildShareText(items, sections);
    if (!text) {
      showMessage('Нечего отправлять', 'Всё уже куплено или список пуст.');
      return;
    }
    await shareText(text);
  }

  // Убрать из списка всё, что уже куплено.
  function confirmClearBought() {
    confirmAction(
      'Очистить купленные?',
      `Из списка уберётся: ${pluralItems(boughtCount)}.`,
      'Очистить',
      clearBought
    );
  }

  // Кнопка «−» на единице: спрашиваем, удалить ли товар.
  function decrease(item: ShoppingItem) {
    if (item.quantity > 1) {
      changeQuantity(item.id, -1);
      return;
    }
    confirmAction('Удалить товар?', `«${displayName(item)}» исчезнет из списка.`, 'Удалить', () =>
      removeItem(item.id)
    );
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
              {pluralItems(items.length)}
              {boughtCount > 0 ? ` · куплено ${boughtCount} из ${items.length}` : ''}
            </ThemedText>
            <View style={styles.actions}>
              <Pressable
                onPress={shareList}
                style={({ pressed }) => [
                  styles.shareButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.shareButtonText}>↗  Отправить</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setEditor({ mode: 'new' })}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <ThemedText style={styles.addButtonText}>＋  Добавить</ThemedText>
              </Pressable>
            </View>
            {boughtCount > 0 && (
              <Pressable
                onPress={confirmClearBought}
                style={({ pressed }) => [
                  styles.clearButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.clearButtonText}>
                  Очистить купленные ({boughtCount})
                </ThemedText>
              </Pressable>
            )}
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
            onToggleBought={() => toggleBought(item.id)}
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
          key={editor.mode === 'edit' ? editor.item.id : `new-${editor.preset?.name ?? ''}`}
          item={editor.mode === 'edit' ? editor.item : null}
          preset={editor.mode === 'new' ? editor.preset : undefined}
          onAddVariant={
            editor.mode === 'edit'
              ? () => {
                  const { name, sectionId, unit } = editor.item;
                  setEditor({ mode: 'new', preset: { name, sectionId, unit } });
                }
              : undefined
          }
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
  onToggleBought: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

// Одна строка с товаром.
// Кружок слева — отметить «куплено». Нажатие на строку — открыть форму. Кнопки − и + меняют количество.
function ItemRow({
  item,
  isFirst,
  isLast,
  cardColor,
  buttonColor,
  dividerColor,
  onPress,
  onToggleBought,
  onIncrease,
  onDecrease,
}: ItemRowProps) {
  const bought = item.bought === true;

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
      <Pressable
        onPress={onToggleBought}
        hitSlop={10}
        style={[styles.check, bought ? styles.checkOn : { borderColor: buttonColor }]}>
        {bought && <ThemedText style={styles.checkMark}>✓</ThemedText>}
      </Pressable>

      <View style={[styles.rowText, bought && styles.dimmed]}>
        <ThemedText style={bought && styles.strike}>
          {item.name}
          {item.size ? <ThemedText style={styles.size}> {item.size}</ThemedText> : null}
        </ThemedText>
      </View>

      {bought ? (
        // У купленного товара кнопки − и + не нужны, просто показываем количество.
        <ThemedText type="smallBold" style={[styles.quantity, styles.dimmed]}>
          {formatQuantity(item.quantity)} {item.unit}
        </ThemedText>
      ) : (
        <View style={styles.stepper}>
          <RoundButton label="−" onPress={onDecrease} color={buttonColor} size={32} />
          <ThemedText type="smallBold" style={styles.quantity}>
            {formatQuantity(item.quantity)} {item.unit}
          </ThemedText>
          <RoundButton label="+" onPress={onIncrease} color={buttonColor} size={32} />
        </View>
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  addButton: {
    flex: 1,
    backgroundColor: AccentColor,
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  shareButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  shareButtonText: {
    color: AccentColor,
    fontWeight: 700,
  },
  clearButton: {
    marginTop: Spacing.two,
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  clearButtonText: {
    color: AccentColor,
    fontWeight: 600,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: AccentColor,
    borderColor: AccentColor,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: 800,
  },
  dimmed: {
    opacity: 0.45,
  },
  size: {
    fontWeight: 700,
  },
  strike: {
    textDecorationLine: 'line-through',
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
    paddingLeft: Spacing.three - Spacing.one,
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
    left: Spacing.three + 26 + Spacing.two,
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
