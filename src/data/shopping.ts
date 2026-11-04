// Данные приложения «Что купить»: разделы магазина и товары.

// Разделы магазина. Порядок здесь = порядок на экране.
export const SECTIONS = [
  { id: 'drinks', name: 'Напитки', emoji: '🥤' },
  { id: 'dairy', name: 'Молочка', emoji: '🥛' },
  { id: 'grocery', name: 'Бакалея', emoji: '🍚' },
  { id: 'canned', name: 'Консервы и соусы', emoji: '🥫' },
  { id: 'sweets', name: 'Сладости', emoji: '🍬' },
  { id: 'household', name: 'Химия', emoji: '🧴' },
  { id: 'other', name: 'Прочее', emoji: '📦' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

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
// Пустые разделы не показываем.
export function groupBySection(items: ShoppingItem[]) {
  return SECTIONS.map((section) => ({
    section,
    data: items.filter((item) => item.sectionId === section.id),
  })).filter((group) => group.data.length > 0);
}

// «1 товар», «3 товара», «11 товаров».
export function pluralItems(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}
