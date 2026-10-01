// Estimation de prix À TITRE INDICATIF — voir l'avertissement dans constants/prices.ts
import { PRICE_TABLE, type PriceEntry } from '@/constants/prices'
import { CATALOG_PRICES } from '@/constants/catalogPrices'
import { simplify } from '@/utils/groceryCategory'
import { formatAmount, isToTaste } from '@/utils/quantity'

export interface Amount {
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

export function toAmount(quantity: number, unit: string): Amount {
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

/** Price of an exact product of the catalog ("Ingrédients" tab), with its usual pack. */
function catalogEntry(simple: string): PriceEntry | undefined {
  const catalog = CATALOG_PRICES[simple]
  if (!catalog) return undefined
  const [price, per, packQty, packUnit, unitKg] = catalog
  return { keywords: [simple], price, per, pack: { qty: packQty, unit: packUnit }, unitKg }
}

/** For a shopping line picked in the catalog: the product's own price, else the general estimate. */
function shoppingEntry(name: string): PriceEntry {
  return catalogEntry(simplify(name)) ?? entryFor(name)
}

const UNKNOWN: PriceEntry = { keywords: [], price: 0, per: 'unit' }

const matchCache = new Map<string, { entry: PriceEntry; keyword: string | null }>()

function match(name: string) {
  const cached = matchCache.get(name)
  if (cached) return cached
  const simple = simplify(name)
  let result: { entry: PriceEntry; keyword: string | null } | null = null
  for (const { entry, patterns } of PATTERNS) {
    const index = patterns.findIndex((re) => re.test(simple))
    if (index >= 0) {
      result = { entry, keyword: entry.keywords[index] }
      break
    }
  }
  // Not in the table: a product of the catalog has its own price
  const catalog = result ? undefined : catalogEntry(simple)
  if (catalog) result = { entry: catalog, keyword: simple }
  // Unknown product: no invented price, it is left out of the estimates
  if (!result) result = { entry: UNKNOWN, keyword: null }
  matchCache.set(name, result)
  return result
}

/** Price entry for a product or ingredient name (price 0 when the product is unknown). */
export function entryFor(name: string): PriceEntry {
  return match(name).entry
}

/** The exact keyword of the table recognised in a name ("Tomates bien mûres" -> "tomate"), if any. */
export function matchedKeyword(name: string): string | null {
  return match(name).keyword
}

/** True when the name matches a product of the price table or of the catalog. */
export function isKnownIngredient(name: string): boolean {
  return match(name).entry !== UNKNOWN
}

/** Ingredients of a recipe that the estimates cannot recognise (left out of price and nutrition). */
export function unknownIngredients(recipe: any): string[] {
  const names = (recipe?.recipe_ingredients || [])
    .filter((ing: any) => !isToTaste(ing.unit) && Number(ing.quantity) > 0)
    .map((ing: any) => (ing.ingredient_name || '').trim())
    .filter((name: string) => name && !isKnownIngredient(name))
  return [...new Set<string>(names)]
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
  // A line coming from a recipe has a unit ("200 g", "2 pièces"): price that amount.
  // Only lines without unit (added from the catalog) are counted in usual packs.
  if (u) return estimateIngredientCost(name, quantity, u)
  const entry = shoppingEntry(name)
  const pack = packOf(entry)
  const count = Number(quantity) > 0 ? Number(quantity) : 1
  return count * costOf(entry, toAmount(pack.qty, pack.unit))
}

/** "≈ 2,50 € · 250 g" : price of the usual pack of a catalog product. */
export function catalogPackLabel(name: string, factor: number): string {
  const entry = shoppingEntry(name)
  const pack = packOf(entry)
  const amount = toAmount(pack.qty, pack.unit)
  const price = costOf(entry, amount) * factor
  // Sold by the piece: the usual weight too ("1 unité (≈ 800 g)")
  const grams = amount.count !== undefined && entry.unitKg ? amount.count * entry.unitKg * 1000 : 0
  const weight = grams >= 1000 ? ` (≈ ${formatAmount(Math.round(grams / 100) * 100, 'g')})` : grams > 0 ? ` (≈ ${Math.round(grams / 10) * 10 || Math.round(grams)} g)` : ''
  return `${formatEstimate(price)} · ${formatAmount(pack.qty, pack.unit)}${weight}`
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

/** "≈ 2,50 €", "< 0,10 €" for tiny amounts, "" when there is nothing to pay (salt "à goût"). */
export function formatEstimate(value: number): string {
  if (!value || value <= 0) return ''
  if (value < 0.1) return '< 0,10 €'
  return `≈ ${formatEuros(value)}`
}

export function formatEuros(value: number): string {
  if (value > 0 && value < 0.1) return '< 0,10 €'
  return `${value.toFixed(2).replace('.', ',')} €`
}

/** Weight in kg of an ingredient amount (liquids ~1 kg/L), using the average weight of one piece. */
export function amountToKg(name: string, quantity: number | null | undefined, unit?: string | null): number {
  if (isToTaste(unit) || !quantity || quantity <= 0 || !isKnownIngredient(name)) return 0
  const amount = toAmount(quantity, unit || '')
  const weight = amount.kg ?? amount.L
  if (weight !== undefined) return weight
  const entry = entryFor(name)
  return (amount.count ?? 0) * (entry.unitKg ?? 0.1)
}
