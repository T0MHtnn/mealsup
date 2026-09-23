// Estimation de prix À TITRE INDICATIF — voir l'avertissement dans constants/prices.ts
import { CATEGORY_FALLBACK_PRICE, PRICE_TABLE, type PriceEntry } from '@/constants/prices'
import { classifyGroceryItem, simplify } from '@/utils/groceryCategory'
import { formatAmount, isToTaste } from '@/utils/quantity'

interface Amount {
  kg?: number
  L?: number
  count?: number
}

const COUNT_UNITS = new Set(['', 'pièce', 'pièces', 'unité', 'unités'])

// Poids / volume approximatif des mesures de cuisine
const MEASURES: Record<string, { kg?: number; L?: number; counted?: boolean }> = {
  g: { kg: 0.001 },
  kg: { kg: 1 },
  ml: { L: 0.001 },
  cl: { L: 0.01 },
  l: { L: 1 },
  'c.à.s': { kg: 0.015, L: 0.015 },
  'c.à.c': { kg: 0.005, L: 0.005 },
  pincée: { kg: 0.0005, counted: true },
  gousse: { kg: 0.005, counted: true },
  branche: { kg: 0.002, counted: true },
  feuille: { kg: 0.0005, counted: true },
  tranche: { kg: 0.035, counted: true },
  bouquet: { kg: 0.03, counted: true },
  botte: { kg: 0.2, counted: true },
  sachet: { kg: 0.01, counted: true },
  rouleau: { kg: 0.23, counted: true },
  verre: { L: 0.2, counted: true },
  dose: { kg: 0.03, counted: true },
}

function toAmount(quantity: number, unit: string): Amount {
  const u = unit.trim()
  if (COUNT_UNITS.has(u)) return { count: quantity }
  const m = MEASURES[u] ?? MEASURES[u.toLowerCase()]
  if (!m) return { count: quantity }
  return {
    kg: m.kg !== undefined ? m.kg * quantity : undefined,
    L: m.L !== undefined ? m.L * quantity : undefined,
    count: m.counted ? quantity : undefined,
  }
}

function costOf(entry: PriceEntry, amount: Amount): number {
  const weight = amount.kg ?? amount.L
  if (entry.per === 'unit') {
    // "10 feuilles de basilic" = a fraction of a bunch, not 10 bunches: use the weight when we know it
    if (weight !== undefined && entry.unitKg) return (weight / entry.unitKg) * entry.price
    if (amount.count !== undefined) return amount.count * entry.price
    return entry.price
  }
  // prix au kg ou au litre (densité ~1 entre les deux)
  if (weight !== undefined) return weight * entry.price
  if (amount.count !== undefined) return amount.count * (entry.unitKg ?? 0.1) * entry.price
  return 0
}

const PATTERNS = PRICE_TABLE.map((entry) => ({
  entry,
  patterns: entry.keywords.map((kw) => new RegExp(`(^| )${kw}(s|x)?( |$)`)),
}))

const entryCache = new Map<string, PriceEntry>()

/** Price entry for a product or ingredient name (falls back to an average for its aisle). */
function entryFor(name: string): PriceEntry {
  const cached = entryCache.get(name)
  if (cached) return cached
  const simple = simplify(name)
  let found = PATTERNS.find(({ patterns }) => patterns.some((re) => re.test(simple)))?.entry
  if (!found) {
    const fallback = CATEGORY_FALLBACK_PRICE[classifyGroceryItem(name)]
    found = fallback ? { keywords: [], price: fallback, per: 'kg' } : { keywords: [], price: 4, per: 'unit' }
  }
  entryCache.set(name, found)
  return found
}

/** Usual pack when an item is added to the list "per unit" (no measure). */
function packOf(entry: PriceEntry): { qty: number; unit: string } {
  if (entry.pack) return entry.pack
  if (entry.per === 'unit' || entry.unitKg) return { qty: 1, unit: 'unité' }
  return { qty: 1, unit: entry.per === 'L' ? 'L' : 'kg' }
}

/** Estimated cost of an ingredient amount, in euros, before the store factor. */
export function estimateIngredientCost(name: string, quantity: number | null | undefined, unit?: string | null): number {
  if (isToTaste(unit) || !quantity || quantity <= 0) return 0
  return costOf(entryFor(name), toAmount(quantity, unit || ''))
}

/** Estimated cost of a shopping list line (a measured amount, or N usual packs). */
export function estimateShoppingItemCost(name: string, quantity: number | null | undefined, unit?: string | null): number {
  const u = (unit || '').trim()
  if (u && !COUNT_UNITS.has(u)) return estimateIngredientCost(name, quantity, u)
  const entry = entryFor(name)
  const pack = packOf(entry)
  const count = Number(quantity) > 0 ? Number(quantity) : 1
  return count * costOf(entry, toAmount(pack.qty, pack.unit))
}

/** "≈ 2,50 € · 250 g" : price of the usual pack of a catalog product. */
export function catalogPackLabel(name: string, factor: number): string {
  const entry = entryFor(name)
  const pack = packOf(entry)
  const price = costOf(entry, toAmount(pack.qty, pack.unit)) * factor
  return `≈ ${formatEuros(price)} · ${formatAmount(pack.qty, pack.unit)}`
}

/** Estimated cost of a whole recipe and per serving. */
export function estimateRecipeCost(recipe: any, factor: number): { total: number; perServing: number } {
  const ingredients: any[] = recipe?.recipe_ingredients || []
  const total = ingredients.reduce(
    (sum, ing) => sum + estimateIngredientCost(ing.ingredient_name || '', Number(ing.quantity), ing.unit),
    0
  ) * factor
  const servings = Number(recipe?.servings) > 0 ? Number(recipe.servings) : 1
  return { total, perServing: total / servings }
}

export function formatEuros(value: number): string {
  if (value > 0 && value < 0.1) return '< 0,10 €'
  return `${value.toFixed(2).replace('.', ',')} €`
}
