// Хранение данных на телефоне (iOS / Android): SQLite-хранилище Expo.
// Для браузера есть отдельный файл storage.web.ts — Expo сам выбирает нужный.

import Storage from 'expo-sqlite/kv-store';

export function getItem(key: string): string | null {
  return Storage.getItemSync(key);
}

export function setItem(key: string, value: string) {
  Storage.setItemSync(key, value);
}
