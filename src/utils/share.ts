// Отправка текста через меню «Поделиться» телефона.
import { Share } from 'react-native';

import { showMessage } from '@/utils/dialogs';

export async function shareText(text: string) {
  try {
    await Share.share({ message: text });
  } catch (error) {
    showMessage('Не удалось отправить', String(error));
  }
}
