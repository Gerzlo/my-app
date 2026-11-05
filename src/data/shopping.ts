// Данные приложения «Что купить»: разделы магазина и товары.

// Раздел магазина. Пользователь может добавлять, переименовывать и удалять разделы.
export type Section = { id: string; name: string; emoji: string };
export type SectionId = string;

// Раздел «Прочее» удалить нельзя: туда переезжают товары из удалённых разделов.
export const FALLBACK_SECTION_ID = 'other';

// Значки на выбор для разделов.
export const SECTION_EMOJIS = [
  '🥤', '🥛', '🍚', '🥫', '🍬', '🧴', '📦', '🍞', '🥩', '🐟', '🍗', '🥚',
  '🧀', '🍎', '🥕', '🥔', '🍝', '🧂', '☕', '🍵', '🧃', '🍺', '🚬', '🧻',
  '🧼', '🧽', '🐾', '👶', '🧊', '🍦', '🍪', '🥜',
];

// Разделы по умолчанию (при первом запуске). Порядок здесь = порядок на экране.
export const DEFAULT_SECTIONS: Section[] = [
  { id: 'drinks', name: 'Напитки', emoji: '🥤' },
  { id: 'dairy', name: 'Молочка', emoji: '🥛' },
  { id: 'grocery', name: 'Бакалея', emoji: '🍚' },
  { id: 'canned', name: 'Консервы и соусы', emoji: '🥫' },
  { id: 'sweets', name: 'Сладости', emoji: '🍬' },
  { id: 'household', name: 'Химия', emoji: '🧴' },
  { id: 'other', name: 'Прочее', emoji: '📦' },
];

// Единицы измерения.
export type Unit = 'шт' | 'уп' | 'ящ' | 'кг' | 'л';

// Один товар в списке «Что купить».
export type ShoppingItem = {
  id: string;
  name: string;
  sectionId: SectionId;
  quantity: number;
  unit: Unit;
  note?: string; // например «только 2,5 л»
  bought?: boolean; // отмечен как купленный
};

// Тестовые товары, чтобы было что показать на экране.
// На следующих шагах их заменит настоящий список, который можно менять.
export const SAMPLE_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Кока-кола', sectionId: 'drinks', quantity: 2, unit: 'ящ', note: 'бутылки 1,5 л' },
  { id: '2', name: 'Вода без газа', sectionId: 'drinks', quantity: 3, unit: 'ящ' },
  { id: '3', name: 'Молоко 3,2%', sectionId: 'dairy', quantity: 20, unit: 'шт' },
  { id: '4', name: 'Кефир', sectionId: 'dairy', quantity: 10, unit: 'шт' },
  { id: '5', name: 'Сметана 20%', sectionId: 'dairy', quantity: 8, unit: 'шт' },
  { id: '6', name: 'Гречка', sectionId: 'grocery', quantity: 10, unit: 'уп' },
  { id: '7', name: 'Масло подсолнечное', sectionId: 'grocery', quantity: 6, unit: 'шт', note: '1 л' },
  { id: '8', name: 'Майонез', sectionId: 'canned', quantity: 12, unit: 'шт' },
  { id: '9', name: 'Тушёнка', sectionId: 'canned', quantity: 1, unit: 'ящ' },
  { id: '10', name: 'Шоколад', sectionId: 'sweets', quantity: 20, unit: 'шт' },
  { id: '11', name: 'Порошок стиральный', sectionId: 'household', quantity: 4, unit: 'уп' },
];

// Собирает товары по разделам для показа на экране.
// Купленные опускаются вниз своего раздела. Пустые разделы не показываем.
// Товары из несуществующего раздела показываются в «Прочем».
export function groupBySection<T extends { sectionId: SectionId; bought?: boolean }>(
  items: T[],
  sections: Section[]
) {
  const known = new Set(sections.map((s) => s.id));
  const sectionOf = (item: T) => (known.has(item.sectionId) ? item.sectionId : FALLBACK_SECTION_ID);
  return sections.map((section) => {
    const inSection = items.filter((item) => sectionOf(item) === section.id);
    return {
      section,
      data: [
        ...inSection.filter((item) => !item.bought),
        ...inSection.filter((item) => item.bought),
      ],
    };
  }).filter((group) => group.data.length > 0);
}

// «1 товар», «3 товара», «11 товаров».
export function pluralItems(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}

export const UNITS: Unit[] = ['шт', 'уп', 'ящ', 'кг', 'л'];

// Товар без id — то, что заполняется в форме.
export type ItemDraft = Omit<ShoppingItem, 'id' | 'bought'>;

// Запомненный товар во вкладке «Частые»: название, раздел, обычное количество.
export type CatalogItem = Omit<ShoppingItem, 'bought'>;

// Для сравнения названий: «  Молоко » и «молоко» — один и тот же товар.
export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

// Показывает количество по-русски: 2 → «2», 1.5 → «1,5».
export function formatQuantity(quantity: number) {
  return String(quantity).replace('.', ',');
}

// Новый уникальный id для товара.
export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Текст для отправки в WhatsApp / Telegram: только то, что ещё не куплено, по разделам.
// Возвращает null, если отправлять нечего.
export function buildShareText(items: ShoppingItem[], sections: Section[]): string | null {
  const groups = groupBySection(
    items.filter((item) => !item.bought),
    sections
  );
  if (groups.length === 0) return null;

  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lines = [`🛒 Что купить (${date})`];
  for (const { section, data } of groups) {
    lines.push('', `${section.emoji} ${section.name}`);
    for (const item of data) {
      const note = item.note ? ` (${item.note})` : '';
      lines.push(`• ${item.name} — ${formatQuantity(item.quantity)} ${item.unit}${note}`);
    }
  }
  return lines.join('\n');
}
