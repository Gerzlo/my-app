// Отправка текста из браузера.
// На iPhone и Android открывается меню «Поделиться». Где его нет (компьютер) — текст копируется.
import { showMessage } from '@/utils/dialogs';

export async function shareText(
  text: string,
  copiedTitle = 'Список скопирован',
  copiedMessage = 'Вставьте его в WhatsApp или Telegram.'
) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      // Пользователь закрыл меню — это не ошибка.
      if (error instanceof Error && error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showMessage(copiedTitle, copiedMessage);
  } catch {
    showMessage('Не удалось отправить', 'Скопируйте список вручную.');
  }
}
