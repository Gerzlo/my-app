// Сообщения и подтверждения на телефоне: системные окна Alert.
// Для браузера есть dialogs.web.ts — там Alert не работает, используем confirm/alert.

import { Alert } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
) {
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

export function showMessage(title: string, message: string) {
  Alert.alert(title, message);
}
