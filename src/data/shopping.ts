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
  size?: string; // объём или размер: «0,5 л», «900 г»
  sectionId: SectionId;
  quantity: number;
  unit: Unit;
  bought?: boolean; // отмечен как купленный
};

// Сравнение по алфавиту: «Кола 0,25 л» раньше «Кола 1,5 л», «Вода» раньше «Кола».
function byName(a: { name: string; size?: string }, b: { name: string; size?: string }) {
  return displayName(a).localeCompare(displayName(b), 'ru', { numeric: true, sensitivity: 'base' });
}

// Собирает товары по разделам для показа на экране. Внутри раздела — по алфавиту.
// Купленные опускаются вниз своего раздела. Пустые разделы не показываем.
// Товары из несуществующего раздела показываются в «Прочем».
export function groupBySection<
  T extends { sectionId: SectionId; bought?: boolean; name: string; size?: string },
>(
  items: T[],
  sections: Section[]
) {
  const known = new Set(sections.map((s) => s.id));
  const sectionOf = (item: T) => (known.has(item.sectionId) ? item.sectionId : FALLBACK_SECTION_ID);
  return sections.map((section) => {
    const inSection = items.filter((item) => sectionOf(item) === section.id).sort(byName);
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

// Единицы количества. «кг» и «л» убраны из выбора — они теперь в поле «Объём».
// В типе Unit они остались, чтобы старые товары не сломались.
export const UNITS: Unit[] = ['шт', 'уп', 'ящ'];

// Товар без id — то, что заполняется в форме.
export type ItemDraft = Omit<ShoppingItem, 'id' | 'bought'>;

// Запомненный товар во вкладке «Частые»: название, раздел, обычное количество.
export type CatalogItem = Omit<ShoppingItem, 'bought'>;

// Для сравнения названий: «  Молоко » и «молоко» — один и тот же товар.
export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

// Название вместе с объёмом: «Миринда 0,5 л».
export function displayName(item: { name: string; size?: string }) {
  return item.size ? `${item.name} ${item.size}` : item.name;
}

// Единицы объёма.
export const SIZE_UNITS = ['л', 'кг', 'г', '%'] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number];

// «0,5 л» → { amount: '0,5', unit: 'л' }. Старые свободные записи кладём целиком в amount.
export function parseSize(size?: string): { amount: string; unit: SizeUnit } {
  const match = (size ?? '').trim().match(/^([\d.,]+)\s*(л|кг|г|%)$/);
  if (match) return { amount: match[1], unit: match[2] as SizeUnit };
  return { amount: (size ?? '').trim(), unit: 'л' };
}

// { amount: '0.5', unit: 'л' } → «0,5 л», { amount: '3,2', unit: '%' } → «3,2%». Пусто — объёма нет.
export function formatSize(amount: string, unit: SizeUnit): string | undefined {
  const clean = amount.trim().replace('.', ',');
  if (!clean) return undefined;
  if (!/^[\d,]+$/.test(clean)) return clean;
  // Процент пишется слитно: «3,2%», остальное через пробел: «0,5 л».
  return unit === '%' ? `${clean}%` : `${clean} ${unit}`;
}

// Ключ товара: «Миринда 0,5 л» и «Миринда 1,5 л» — разные товары.
export function itemKey(item: { name: string; size?: string }) {
  return `${normalizeName(item.name)}|${normalizeName((item.size ?? '').replace('.', ','))}`;
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
      lines.push(`• ${displayName(item)} — ${formatQuantity(item.quantity)} ${item.unit}`);
    }
  }
  return lines.join('\n');
}
