// Окно «Разделы»: добавить, переименовать, сменить значок, поменять порядок, удалить.

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, DangerColor, Spacing } from '@/constants/theme';
import { FALLBACK_SECTION_ID, SECTION_EMOJIS, type Section } from '@/data/shopping';
import { useShopping } from '@/data/shopping-store';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/utils/dialogs';

// Что открыто в форме раздела: новый или существующий.
type FormState = { mode: 'new' } | { mode: 'edit'; section: Section } | null;

export function SectionsManager({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { sections, items, addSection, updateSection, moveSection, removeSection } = useShopping();
  const [form, setForm] = useState<FormState>(null);

  function confirmRemove(section: Section) {
    const count = items.filter((item) => item.sectionId === section.id).length;
    const fallback = sections.find((s) => s.id === FALLBACK_SECTION_ID)?.name ?? 'Прочее';
    const message =
      count > 0
        ? `Товары из этого раздела (${count}) перейдут в «${fallback}».`
        : 'Раздел будет удалён.';
    confirmAction(`Удалить «${section.name}»?`, message, 'Удалить', () =>
      removeSection(section.id)
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.sheet}>
        <View style={styles.topBar}>
          <View style={styles.topSide} />
          <ThemedText type="smallBold" style={styles.topTitle}>
            Разделы
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12} style={styles.topSide}>
            <ThemedText style={[styles.doneText, { color: AccentColor }]}>Готово</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            {sections.map((section, index) => (
              <View key={section.id}>
                <View style={styles.row}>
                  <Pressable
                    onPress={() => setForm({ mode: 'edit', section })}
                    style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
                    <ThemedText style={styles.emoji}>{section.emoji}</ThemedText>
                    <ThemedText style={styles.rowName}>{section.name}</ThemedText>
                  </Pressable>

                  <SmallButton
                    label="↑"
                    disabled={index === 0}
                    onPress={() => moveSection(section.id, -1)}
                    color={theme.backgroundSelected}
                  />
                  <SmallButton
                    label="↓"
                    disabled={index === sections.length - 1}
                    onPress={() => moveSection(section.id, 1)}
                    color={theme.backgroundSelected}
                  />
                  {section.id !== FALLBACK_SECTION_ID ? (
                    <SmallButton
                      label="✕"
                      onPress={() => confirmRemove(section)}
                      color={theme.backgroundSelected}
                      textColor={DangerColor}
                    />
                  ) : (
                    <View style={styles.smallButtonSpacer} />
                  )}
                </View>
                {index < sections.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
                )}
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => setForm({ mode: 'new' })}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <ThemedText style={styles.addButtonText}>＋  Новый раздел</ThemedText>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Нажмите на раздел, чтобы переименовать или сменить значок. Стрелки меняют порядок.
          </ThemedText>
        </ScrollView>
      </ThemedView>

      {form && (
        <SectionForm
          section={form.mode === 'edit' ? form.section : null}
          onClose={() => setForm(null)}
          onSave={(name, emoji) => {
            if (form.mode === 'edit') {
              updateSection(form.section.id, name, emoji);
            } else {
              addSection(name, emoji);
            }
            setForm(null);
          }}
        />
      )}
    </Modal>
  );
}

// Форма одного раздела: название и значок.
function SectionForm({
  section,
  onSave,
  onClose,
}: {
  section: Section | null;
  onSave: (name: string, emoji: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState(section?.name ?? '');
  const [emoji, setEmoji] = useState(section?.emoji ?? '📦');
  const canSave = name.trim().length > 0;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.sheet}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topBar}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.topSide}>
              <ThemedText style={{ color: AccentColor }}>Отмена</ThemedText>
            </Pressable>
            <ThemedText type="smallBold" style={styles.topTitle}>
              {section ? 'Изменить раздел' : 'Новый раздел'}
            </ThemedText>
            <Pressable
              onPress={() => canSave && onSave(name, emoji)}
              disabled={!canSave}
              hitSlop={12}
              style={[styles.topSide, styles.topSideRight]}>
              <ThemedText
                style={[styles.doneText, { color: canSave ? AccentColor : theme.textSecondary }]}>
                Готово
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Название
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Например, Хлеб"
                placeholderTextColor={theme.textSecondary}
                autoFocus={!section}
                returnKeyType="done"
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Значок
              </ThemedText>
              <View style={styles.emojiGrid}>
                {SECTION_EMOJIS.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[
                      styles.emojiCell,
                      { backgroundColor: e === emoji ? AccentColor : theme.backgroundElement },
                    ]}>
                    <ThemedText style={styles.emojiCellText}>{e}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

function SmallButton({
  label,
  onPress,
  color,
  disabled,
  textColor,
}: {
  label: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
  textColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.smallButton,
        { backgroundColor: color },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={textColor ? { color: textColor } : undefined}>
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
  topSide: {
    minWidth: 70,
  },
  topSideRight: {
    alignItems: 'flex-end',
  },
  topTitle: {
    fontSize: 17,
  },
  doneText: {
    fontWeight: 700,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    minHeight: 52,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  rowName: {
    flex: 1,
  },
  smallButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonSpacer: {
    width: 34,
  },
  divider: {
    marginLeft: Spacing.three + 22 + Spacing.three,
    height: StyleSheet.hairlineWidth,
  },
  addButton: {
    backgroundColor: AccentColor,
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  hint: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  field: {
    gap: Spacing.two,
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
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emojiCell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellText: {
    fontSize: 26,
    lineHeight: 32,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.3,
  },
});
