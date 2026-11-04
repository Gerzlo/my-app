// Общее хранилище списка «Что купить».
// Любой экран может получить список и функции для его изменения через useShopping().

import { createContext, useContext, useState, type ReactNode } from 'react';

import { SAMPLE_ITEMS, newId, type ItemDraft, type ShoppingItem } from '@/data/shopping';

type ShoppingStore = {
  items: ShoppingItem[];
  addItem: (draft: ItemDraft) => void;
  updateItem: (id: string, draft: ItemDraft) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, delta: number) => void;
};

const ShoppingContext = createContext<ShoppingStore | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  // Пока список живёт только в памяти: после перезапуска вернутся тестовые товары.
  // Сохранение в памяти телефона добавим на шаге 3.
  const [items, setItems] = useState<ShoppingItem[]>(SAMPLE_ITEMS);

  const store: ShoppingStore = {
    items,
    addItem: (draft) => setItems((prev) => [...prev, { ...draft, id: newId() }]),
    updateItem: (id, draft) =>
      setItems((prev) => prev.map((item) => (item.id === id ? { ...draft, id } : item))),
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
