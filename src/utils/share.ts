// Отправка текста через меню «Поделиться» телефона.
import { Share } from 'react-native';

import { showMessage } from '@/utils/dialogs';

// Последние два параметра нужны только в браузере (когда текст копируется).
export async function shareText(text: string, _copiedTitle?: string, _copiedMessage?: string) {
  try {
    await Share.share({ message: text });
  } catch (error) {
    showMessage('Не удалось отправить', String(error));
  }
}
