// Общее хранилище приложения: список «Что купить» и «Частые товары».
// Любой экран получает данные и функции для их изменения через useShopping().

import Storage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  DEFAULT_SECTIONS,
  FALLBACK_SECTION_ID,
  SAMPLE_ITEMS,
  newId,
  normalizeName,
  type CatalogItem,
  type ItemDraft,
  type Section,
  type ShoppingItem,
} from '@/data/shopping';

// Под этими именами данные хранятся в памяти телефона.
const ITEMS_KEY = 'shopping-items-v1';
const CATALOG_KEY = 'catalog-v1';
const SECTIONS_KEY = 'sections-v1';

// Читает сохранённый массив. Если его ещё нет (первый запуск) — возвращает null.
function loadArray<T>(key: string): T[] | null {
  try {
    const saved = Storage.getItemSync(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch (error) {
    console.warn(`Не удалось прочитать «${key}»`, error);
  }
  return null;
}

function saveArray(key: string, value: unknown[]) {
  try {
    Storage.setItemSync(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Не удалось сохранить «${key}»`, error);
  }
}

// Разделы. «Прочее» должно быть всегда — если его вдруг нет, добавляем в конец.
function loadSections(): Section[] {
  const saved = loadArray<Section>(SECTIONS_KEY) ?? DEFAULT_SECTIONS;
  if (saved.some((s) => s.id === FALLBACK_SECTION_ID)) return saved;
  return [...saved, DEFAULT_SECTIONS.find((s) => s.id === FALLBACK_SECTION_ID)!];
}

function loadItems(): ShoppingItem[] {
  return loadArray<ShoppingItem>(ITEMS_KEY) ?? SAMPLE_ITEMS;
}

// При первом запуске «Частые» заполняем тем, что уже есть в списке.
function loadCatalog(): CatalogItem[] {
  const saved = loadArray<CatalogItem>(CATALOG_KEY);
  if (saved) return saved;
  return loadItems().reduce<CatalogItem[]>((catalog, item) => remember(catalog, item), []);
}

// Запомнить товар в «Частых». Если такой уже есть — обновить раздел, единицу и количество.
function remember(catalog: CatalogItem[], draft: ItemDraft): CatalogItem[] {
  const key = normalizeName(draft.name);
  const entry = {
    name: draft.name,
    sectionId: draft.sectionId,
    quantity: draft.quantity,
    unit: draft.unit,
    note: draft.note,
  };
  const existing = catalog.find((c) => normalizeName(c.name) === key);
  if (existing) {
    return catalog.map((c) => (c.id === existing.id ? { ...entry, id: c.id } : c));
  }
  return [...catalog, { ...entry, id: newId() }];
}

// Что произошло при добавлении из «Частых».
export type AddFromCatalogResult = 'added' | 'restored' | 'already';

type ShoppingStore = {
  sections: Section[];
  addSection: (name: string, emoji: string) => void;
  updateSection: (id: string, name: string, emoji: string) => void;
  moveSection: (id: string, direction: -1 | 1) => void;
  removeSection: (id: string) => void;
  items: ShoppingItem[];
  catalog: CatalogItem[];
  addItem: (draft: ItemDraft) => void;
  updateItem: (id: string, draft: ItemDraft) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, delta: number) => void;
  toggleBought: (id: string) => void;
  clearBought: () => void;
  isInList: (name: string) => boolean;
  addFromCatalog: (entry: CatalogItem) => AddFromCatalogResult;
  removeFromCatalog: (id: string) => void;
};

const ShoppingContext = createContext<ShoppingStore | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  // При запуске загружаем данные из памяти телефона.
  const [items, setItems] = useState<ShoppingItem[]>(loadItems);
  const [catalog, setCatalog] = useState<CatalogItem[]>(loadCatalog);
  const [sections, setSections] = useState<Section[]>(loadSections);

  // Любое изменение сразу сохраняем.
  useEffect(() => {
    saveArray(ITEMS_KEY, items);
  }, [items]);
  useEffect(() => {
    saveArray(CATALOG_KEY, catalog);
  }, [catalog]);
  useEffect(() => {
    saveArray(SECTIONS_KEY, sections);
  }, [sections]);

  // Товар с таким названием есть в списке и ещё не куплен?
  const isInList = (name: string) => {
    const key = normalizeName(name);
    return items.some((item) => !item.bought && normalizeName(item.name) === key);
  };

  const store: ShoppingStore = {
    sections,

    addSection: (name, emoji) =>
      setSections((prev) => {
        // Новый раздел ставим перед «Прочим».
        const fallbackIndex = prev.findIndex((s) => s.id === FALLBACK_SECTION_ID);
        const section = { id: newId(), name: name.trim(), emoji };
        const next = [...prev];
        next.splice(fallbackIndex === -1 ? next.length : fallbackIndex, 0, section);
        return next;
      }),

    updateSection: (id, name, emoji) =>
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: name.trim(), emoji } : s))
      ),

    moveSection: (id, direction) =>
      setSections((prev) => {
        const index = prev.findIndex((s) => s.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      }),

    // Удаляем раздел, а его товары переносим в «Прочее».
    removeSection: (id) => {
      if (id === FALLBACK_SECTION_ID) return;
      setSections((prev) => prev.filter((s) => s.id !== id));
      setItems((prev) =>
        prev.map((item) =>
          item.sectionId === id ? { ...item, sectionId: FALLBACK_SECTION_ID } : item
        )
      );
      setCatalog((prev) =>
        prev.map((c) => (c.sectionId === id ? { ...c, sectionId: FALLBACK_SECTION_ID } : c))
      );
    },

    items,
    catalog,
    isInList,

    addItem: (draft) => {
      setItems((prev) => [...prev, { ...draft, id: newId() }]);
      setCatalog((prev) => remember(prev, draft));
    },

    // При изменении сохраняем отметку «куплено».
    updateItem: (id, draft) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...draft, id, bought: item.bought } : item))
      );
      setCatalog((prev) => remember(prev, draft));
    },

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

    // Добавить товар из «Частых» в список.
    // Если он уже в списке — ничего не делаем. Если был отмечен купленным — возвращаем в список.
    addFromCatalog: (entry) => {
      const key = normalizeName(entry.name);
      const existing = items.find((item) => normalizeName(item.name) === key);
      if (existing && !existing.bought) return 'already';
      if (existing) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === existing.id ? { ...item, bought: false, quantity: entry.quantity } : item
          )
        );
        return 'restored';
      }
      setItems((prev) => [...prev, { ...entry, id: newId() }]);
      return 'added';
    },

    removeFromCatalog: (id) => setCatalog((prev) => prev.filter((c) => c.id !== id)),
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
