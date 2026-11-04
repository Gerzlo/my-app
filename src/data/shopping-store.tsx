// Общее хранилище списка «Что купить».
// Любой экран может получить список и функции для его изменения через useShopping().

import Storage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { SAMPLE_ITEMS, newId, type ItemDraft, type ShoppingItem } from '@/data/shopping';

// Под этим именем список хранится в памяти телефона.
const STORAGE_KEY = 'shopping-items-v1';

// Читаем сохранённый список. Если его ещё нет (первый запуск) — показываем тестовые товары.
function loadItems(): ShoppingItem[] {
  try {
    const saved = Storage.getItemSync(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('Не удалось прочитать сохранённый список', error);
  }
  return SAMPLE_ITEMS;
}

function saveItems(items: ShoppingItem[]) {
  try {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Не удалось сохранить список', error);
  }
}

type ShoppingStore = {
  items: ShoppingItem[];
  addItem: (draft: ItemDraft) => void;
  updateItem: (id: string, draft: ItemDraft) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, delta: number) => void;
  toggleBought: (id: string) => void;
  clearBought: () => void;
};

const ShoppingContext = createContext<ShoppingStore | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  // При запуске загружаем список из памяти телефона.
  const [items, setItems] = useState<ShoppingItem[]>(loadItems);

  // Любое изменение списка сразу сохраняем.
  useEffect(() => {
    saveItems(items);
  }, [items]);

  const store: ShoppingStore = {
    items,
    addItem: (draft) => setItems((prev) => [...prev, { ...draft, id: newId() }]),
    // При изменении сохраняем отметку «куплено».
    updateItem: (id, draft) =>
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...draft, id, bought: item.bought } : item))
      ),
    removeItem: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
    changeQuantity: (id, delta) =>
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          // Не даём уйти ниже 1 и убираем хвосты вроде 1.0000001.
          const next = Math.max(1, Math.round((item.quantity + delta) * 100) / 100);
          return { ...item, quantity: next };
        })
      ),
    toggleBought: (id) =>
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, bought: !item.bought } : item))
      ),
    clearBought: () => setItems((prev) => prev.filter((item) => !item.bought)),
  };

  return <ShoppingContext value={store}>{children}</ShoppingContext>;
}

export function useShopping() {
  const store = useContext(ShoppingContext);
  if (!store) {
    throw new Error('useShopping нужно вызывать внутри <ShoppingProvider>');
  }
  return store;
}
