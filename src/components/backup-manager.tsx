// Окно «Резервная копия» (шестерёнка во вкладке «Частые»).
// Сохранить: весь список, «Частые» и разделы отправляются текстом — в Заметки, Telegram и т. п.
// Восстановить: вставить этот текст обратно.

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
import { AccentColor, Spacing } from '@/constants/theme';
import { useShopping } from '@/data/shopping-store';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { shareText } from '@/utils/share';

export function BackupManager({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { makeBackup, restoreBackup } = useShopping();
  const [pasted, setPasted] = useState('');

  function save() {
    shareText(
      makeBackup(),
      'Копия скопирована',
      'Вставьте её в Заметки или отправьте себе в Telegram.'
    );
  }

  function restore() {
    confirmAction(
      'Восстановить из копии?',
      'Текущий список, «Частые» и разделы заменятся данными из копии.',
      'Восстановить',
      () => {
        if (restoreBackup(pasted)) {
          setPasted('');
          showMessage('Готово', 'Данные восстановлены.');
          onClose();
        } else {
          showMessage('Не получилось', 'Это не похоже на копию. Вставьте текст целиком.');
        }
      }
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.sheet}>
        <View style={styles.topBar}>
          <View style={styles.topSide} />
          <ThemedText type="smallBold" style={styles.topTitle}>
            Резервная копия
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12} style={styles.topSide}>
            <ThemedText style={[styles.doneText, { color: AccentColor }]}>Готово</ThemedText>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.block}>
              <Pressable
                onPress={save}
                style={({ pressed }) => [styles.mainButton, pressed && styles.pressed]}>
                <ThemedText style={styles.mainButtonText}>↗  Сохранить копию</ThemedText>
              </Pressable>
            </View>

            <View style={styles.block}>
              <TextInput
                value={pasted}
                onChangeText={setPasted}
                placeholder="Вставьте сюда текст копии"
                placeholderTextColor={theme.textSecondary}
                multiline
                autoCorrect={false}
                autoCapitalize="none"
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
              />
              <Pressable
                onPress={restore}
                disabled={pasted.trim().length === 0}
                style={({ pressed }) => [
                  styles.secondButton,
                  { backgroundColor: theme.backgroundElement },
                  pasted.trim().length === 0 && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={[styles.secondButtonText, { color: AccentColor }]}>
                  Восстановить из копии
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  topSide: {
    width: 80,
    alignItems: 'flex-end',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
  },
  doneText: {
    fontWeight: 600,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  block: {
    gap: Spacing.two,
  },
  label: {
    marginLeft: Spacing.two,
  },
  hint: {
    paddingHorizontal: Spacing.two,
  },
  mainButton: {
    backgroundColor: AccentColor,
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  input: {
    minHeight: 100,
    maxHeight: 180,
    fontSize: 15,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    borderRadius: 12,
    textAlignVertical: 'top',
  },
  secondButton: {
    borderRadius: 14,
    paddingVertical: Spacing.three - Spacing.one,
    alignItems: 'center',
  },
  secondButtonText: {
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
