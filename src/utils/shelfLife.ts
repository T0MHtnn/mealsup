import { FOOD_CATEGORIES, type GroceryCategory } from '@/constants/groceryCatalog'
import { classifyGroceryItem, simplify } from '@/utils/groceryCategory'
import { toISODate } from '@/utils/date'

/*
 * Durées de conservation INDICATIVES (en jours, au réfrigérateur ou au placard),
 * pour proposer une date de péremption quand les courses passent au frigo.
 * L'utilisateur peut toujours la modifier : la date sur l'emballage fait foi.
 */
const BY_KEYWORD: [RegExp, number][] = [
  [/\b(steak hache|boeuf hache|viande hachee|hache)\b/, 1],
  [/\b(poisson|saumon|cabillaud|crevettes?|moules|thon frais|lotte|colin)\b/, 2],
  [/\b(poulet|dinde|volaille|escalope)\b/, 2],
  [/\bbaguette\b/, 1],
  [/\b(fraises?|framboises?|myrtilles?|cerises?|fruits rouges)\b/, 3],
  [/\b(salade|laitue|roquette|epinards|herbes|persil|coriandre|basilic|menthe|ciboulette|aneth)\b/, 4],
  [/\b(champignons?|avocats?|bananes?)\b/, 5],
  [/\b(pain de mie|brioche|pains? au lait)\b/, 7],
  [/\b(lait)\b/, 7],
  [/\b(yaourts?|fromage blanc|fromage frais|creme)\b/, 14],
  [/\b(oeufs?)\b/, 21],
  [/\b(beurre)\b/, 30],
  [/\b(pommes de terre|oignons?|ail|echalotes?|potiron|courge)\b/, 30],
  [/\b(pommes?|oranges?|citrons?|carottes?)\b/, 21],
  [/\b(fromages?|comte|emmental|parmesan|gruyere|mozzarella|feta)\b/, 14],
]

const BY_AISLE: Partial<Record<GroceryCategory, number>> = {
  'Fruits & Légumes': 7,
  'Boucherie & Poissonnerie': 3,
  'Frais & Traiteur': 7,
  'Crèmerie & Œufs': 10,
  Boulangerie: 3,
  Surgelés: 90,
  // Épicerie, boissons, épices : pas de date proposée (longue conservation)
}

/** Only food goes to the fridge (not detergent or shampoo). */
export function isFridgeFood(name: string): boolean {
  return FOOD_CATEGORIES.includes(classifyGroceryItem(name))
}

/** Typical number of days a product keeps, or null for long-life products. */
export function shelfLifeDays(name: string): number | null {
  const simple = simplify(name).replace(/œ/g, 'oe')
  return BY_KEYWORD.find(([re]) => re.test(simple))?.[1] ?? BY_AISLE[classifyGroceryItem(name)] ?? null
}

/** Suggested expiry date (YYYY-MM-DD) for a product bought today, or null for long-life products. */
export function suggestedExpiry(name: string, from = new Date()): string | null {
  const days = shelfLifeDays(name)
  if (days === null) return null
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}
