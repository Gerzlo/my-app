// Форма товара: открывается снизу листом.
// Используется и для нового товара, и для изменения существующего.

import { useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { SectionsManager } from '@/components/sections-manager';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, DangerColor, Spacing } from '@/constants/theme';
import {
  FALLBACK_SECTION_ID,
  UNITS,
  formatQuantity,
  SIZE_UNITS,
  formatSize,
  parseSize,
  type ItemDraft,
  type SectionId,
  type ShoppingItem,
  type Unit,
} from '@/data/shopping';
import { useShopping } from '@/data/shopping-store';
import { useTheme } from '@/hooks/use-theme';

type ItemEditorProps = {
  item: ShoppingItem | null; // null — новый товар
  preset?: Partial<ItemDraft>; // заранее заполненные поля для нового товара
  defaultSectionId?: SectionId;
  onAddVariant?: () => void; // «тот же товар другого объёма»
  onSave: (draft: ItemDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function ItemEditor({
  item,
  preset,
  defaultSectionId,
  onAddVariant,
  onSave,
  onDelete,
  onClose,
}: ItemEditorProps) {
  const theme = useTheme();
  const { sections } = useShopping();
  const [managingSections, setManagingSections] = useState(false);
  const isNew = item === null;

  const start = item ?? preset;
  const [name, setName] = useState(start?.name ?? '');
  const initialSize = parseSize(start?.size);
  const [sizeAmount, setSizeAmount] = useState(initialSize.amount);
  const [sizeUnit, setSizeUnit] = useState(initialSize.unit);
  const [quantityText, setQuantityText] = useState(
    start?.quantity ? formatQuantity(start.quantity) : '1'
  );
  // Старые товары могли быть в «кг» или «л» — показываем эту единицу, пока её не сменят.
  const [unit, setUnit] = useState<Unit>(start?.unit ?? 'шт');
  const unitOptions: Unit[] = UNITS.includes(unit) ? UNITS : [...UNITS, unit];
  const [sectionId, setSectionId] = useState<SectionId>(
    start?.sectionId ?? defaultSectionId ?? FALLBACK_SECTION_ID
  );
  // Если выбранный раздел удалили — товар окажется в «Прочем».
  const selectedSectionId = sections.some((s) => s.id === sectionId)
    ? sectionId
    : FALLBACK_SECTION_ID;

  // «1,5» → 1.5. Если ввели ерунду — считаем, что 0.
  const quantity = Number(quantityText.replace(',', '.')) || 0;
  const canSave = name.trim().length > 0 && quantity > 0;


  function stepQuantity(delta: number) {
    const next = Math.max(1, Math.round((quantity + delta) * 100) / 100);
    setQuantityText(formatQuantity(next));
  }

  function save() {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      size: formatSize(sizeAmount, sizeUnit),
      quantity,
      unit,
      sectionId: selectedSectionId,
    });
  }

  function confirmDelete() {
    const title = [name.trim() || item?.name, formatSize(sizeAmount, sizeUnit)]
      .filter(Boolean)
      .join(' ');
    Alert.alert('Удалить товар?', `«${title}» исчезнет из списка.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: onDelete },
    ]);
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ThemedView style={styles.sheet}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Верхняя панель: Отмена — заголовок — Готово */}
          <View style={styles.topBar}>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText style={{ color: AccentColor }}>Отмена</ThemedText>
            </Pressable>
            <ThemedText type="smallBold" style={styles.topTitle}>
              {isNew ? 'Новый товар' : 'Изменить товар'}
            </ThemedText>
            <Pressable onPress={save} disabled={!canSave} hitSlop={12}>
              <ThemedText
                style={[styles.doneText, { color: canSave ? AccentColor : theme.textSecondary }]}>
                Готово
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled">
            <Field label="Название">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Например, Молоко 3,2%"
                placeholderTextColor={theme.textSecondary}
                autoFocus={isNew && !preset}
                returnKeyType="done"
                style={inputStyle}
              />
            </Field>

            <Field label="Объём (необязательно)">
              <View style={styles.sizeRow}>
                <TextInput
                  value={sizeAmount}
                  onChangeText={setSizeAmount}
                  placeholder="Например, 0,5"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  autoFocus={isNew && !!preset}
                  style={[inputStyle, styles.sizeInput]}
                />
                {SIZE_UNITS.map((u) => (
                  <Chip
                    key={u}
                    label={u}
                    selected={sizeUnit === u}
                    onPress={() => setSizeUnit(u)}
                    color={theme.backgroundElement}
                  />
                ))}
              </View>
            </Field>

            <Field label="Количество">
              <View style={styles.sizeRow}>
                {/* − число + в одном поле */}
                <View style={[styles.qtyBox, { backgroundColor: theme.backgroundElement }]}>
                  <RoundButton
                    label="−"
                    onPress={() => stepQuantity(-1)}
                    color={theme.backgroundSelected}
                    size={36}
                  />
                  <TextInput
                    value={quantityText}
                    onChangeText={setQuantityText}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    style={[styles.qtyInput, { color: theme.text }]}
                  />
                  <RoundButton
                    label="+"
                    onPress={() => stepQuantity(1)}
                    color={theme.backgroundSelected}
                    size={36}
                  />
                </View>
                {unitOptions.map((u) => (
                  <Chip
                    key={u}
                    label={u}
                    selected={unit === u}
                    onPress={() => setUnit(u)}
                    color={theme.backgroundElement}
                  />
                ))}
              </View>
            </Field>

            <Field
              label="Раздел"
              action={
                <Pressable onPress={() => setManagingSections(true)} hitSlop={10}>
                  <ThemedText type="small" style={styles.fieldAction}>
                    ✎ Изменить разделы
                  </ThemedText>
                </Pressable>
              }>
              <View style={styles.chips}>
                {sections.map((s) => (
                  <Chip
                    key={s.id}
                    label={`${s.emoji} ${s.name}`}
                    selected={selectedSectionId === s.id}
                    onPress={() => setSectionId(s.id)}
                    color={theme.backgroundElement}
                  />
                ))}
              </View>
            </Field>

            {!isNew && onAddVariant ? (
              <Pressable
                onPress={onAddVariant}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={{ color: AccentColor, fontWeight: 600 }}>
                  ＋ Этот же товар другого объёма
                </ThemedText>
              </Pressable>
            ) : null}

            {!isNew && onDelete ? (
              <Pressable
                onPress={confirmDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={{ color: DangerColor }}>Удалить товар</ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>

      {managingSections && <SectionsManager onClose={() => setManagingSections(false)} />}
    </Modal>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
          {label}
        </ThemedText>
        {action}
      </View>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? AccentColor : color },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function RoundButton({
  label,
  onPress,
  color,
  size = 44,
  textColor,
}: {
  label: string;
  onPress: () => void;
  color: string;
  size?: number;
  textColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        style={[
          styles.roundButtonText,
          { fontSize: size * 0.5, lineHeight: size * 0.6 },
          textColor ? { color: textColor } : null,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  topTitle: {
    fontSize: 17,
  },
  doneText: {
    fontWeight: 700,
  },
  form: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: Spacing.two,
  },
  fieldAction: {
    color: AccentColor,
    fontWeight: 600,
  },
  fieldLabel: {
    marginLeft: Spacing.two,
  },
  input: {
    fontSize: 17,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    borderRadius: 12,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sizeInput: {
    flex: 1,
  },
  qtyBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.one + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 600,
    paddingVertical: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: 700,
  },
  roundButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    fontWeight: 500,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
