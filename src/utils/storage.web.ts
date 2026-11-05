// Хранение данных в браузере: localStorage.
// Данные живут в этом браузере на этом устройстве.

export function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Например, в приватном режиме Safari хранилище может быть недоступно.
  }
}
