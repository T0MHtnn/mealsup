import { GROCERY_SECTIONS, FOOD_CATEGORIES } from '@/constants/groceryCatalog'

/**
 * Families of foods, so that a search or an excluded food also covers the products
 * whose name doesn't say it: "pâtes" -> Spaghetti, Penne... ; "fromage" -> Comté, Brie... ;
 * "banane" -> "Banane mûre", "Bananes très mûres"...
 */

// Family of every product of a catalog group (the first one is shown next to the name)
const GROUP_FAMILIES: Record<string, string[]> = {
  'Pâtes': ['pâtes'],
  'Fromages': ['fromage'],
  'Bœuf': ['bœuf', 'viande'],
  'Veau': ['veau', 'viande'],
  'Porc': ['porc', 'viande'],
  'Agneau & mouton': ['agneau', 'viande'],
  'Volaille': ['volaille', 'viande'],
  'Lapin & gibier': ['gibier', 'viande'],
  'Abats': ['abats', 'viande'],
  'Charcuterie': ['charcuterie', 'viande'],
  'Poissons': ['poisson'],
  'Fruits de mer': ['fruits de mer'],
  'Fruits': ['fruit'],
  'Légumes': ['légume'],
  'Herbes fraîches & aromates': ['herbes aromatiques'],
  'Herbes séchées': ['herbes aromatiques'],
  'Épices': ['épice'],
  'Fruits secs & à coque': ['fruits secs'],
  'Bières, vins & spiritueux': ['alcool'],
}

// Products of a group that belong to a more precise family
const ITEM_FAMILIES: [RegExp, string[]][] = [
  [/^(salade|laitue|mache|roquette|jeune pousse|mesclun|frisee|scarole|cresson)\b/, ['salade', 'légume']],
  [/^(lentille|pois chiche|pois casse|haricot .*sec|flageolet|feve seche)\b/, ['légumineuses']],
]

// Families written next to the product name in lists ("Penne (pâtes)"); the others only help searching
const SHOWN = new Set([
  'pâtes', 'fromage', 'salade', 'bœuf', 'veau', 'porc', 'agneau', 'volaille', 'gibier', 'abats',
  'poisson', 'fruits de mer', 'légumineuses',
])

// Words that only mean something together: "pommes de terre" are not "pommes",
// "lait de coco" is not "lait", "pâte feuilletée" is not "pâtes"
const COMPOUNDS = [
  'pomme de terre', 'patate douce', 'lait de coco', 'creme de coco', 'noix de coco', 'noix de muscade',
  'beurre de cacahuete', 'creme de marron', 'lait d amande', 'lait d avoine', 'lait de soja', 'lait de riz',
  'pate a tartiner', 'pate feuilletee', 'pate brisee', 'pate sablee', 'pate a pizza', 'pate filo',
  'pate a crepe', 'pate de curry', 'pate d achiote', 'pate de fruit', 'pate de piment', 'pate de sesame',
  'pate miso', 'feuille de brick', 'fruit de la passion', 'pain d epice', 'oeuf de lump',
]

const singular = (word: string) => (word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word)

const COMPOUND_RES = COMPOUNDS.map((phrase) => ({
  re: new RegExp(`(^| )${phrase.split(' ').map((w) => `${w}[sx]?`).join(' ')}( |$)`, 'g'),
  glued: phrase.replace(/ /g, ''),
}))

const tokenCache = new Map<string, string[]>()

/** Comparable words of a food name: no accents, no plural, compound names kept whole. */
export function foodTokens(name: string): string[] {
  const cached = tokenCache.get(name)
  if (cached) return cached
  let text = name
    .toLowerCase()
    // "pâté" (charcuterie) is not "pâte"
    .replace(/pâtés?(?![a-zà-ÿ])/g, 'pateterrine')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  for (const { re, glued } of COMPOUND_RES) text = text.replace(re, ` ${glued} `).replace(/\s+/g, ' ').trim()
  const tokens = text.split(' ').filter(Boolean).map(singular)
  tokenCache.set(name, tokens)
  return tokens
}

// ---- Families of the catalog products ----

const PRODUCT_FAMILIES = new Map<string, string[]>()
for (const category of FOOD_CATEGORIES) {
  for (const section of GROCERY_SECTIONS[category]) {
    for (const item of section.items) {
      const key = foodTokens(item).join(' ')
      const special = ITEM_FAMILIES.find(([re]) => re.test(key))
      const families = special?.[1] ?? GROUP_FAMILIES[section.title]
      if (families) PRODUCT_FAMILIES.set(key, families)
    }
  }
}
const PRODUCT_KEYS = [...PRODUCT_FAMILIES.keys()].map((key) => ({ key, tokens: key.split(' ') }))

const containsRun = (tokens: string[], run: string[]) => {
  for (let i = 0; i + run.length <= tokens.length; i++) {
    if (run.every((word, j) => tokens[i + j] === word)) return true
  }
  return false
}

const familyCache = new Map<string, string[]>()

/** Families of any food name: its catalog product's, or the one of the longest product it contains ("Comté râpé" -> fromage). */
export function foodFamilies(name: string): string[] {
  const cached = familyCache.get(name)
  if (cached) return cached
  const tokens = foodTokens(name)
  let families = PRODUCT_FAMILIES.get(tokens.join(' '))
  if (!families) {
    let best = 0
    for (const { key, tokens: run } of PRODUCT_KEYS) {
      if (run.length > best && containsRun(tokens, run)) {
        best = run.length
        families = PRODUCT_FAMILIES.get(key)
      }
    }
  }
  // A shorter, generic name of a product ("Lardons" -> "Lardons fumés")
  if (!families && tokens.length) {
    const product = PRODUCT_KEYS.find(({ tokens: run }) => tokens.every((word, i) => run[i] === word))
    if (product) families = PRODUCT_FAMILIES.get(product.key)
  }
  const result = families ?? []
  familyCache.set(name, result)
  return result
}

/** Family written next to a product in lists ("pâtes" for Penne), unless the name already says it. */
export function shownFamily(name: string): string | null {
  const family = foodFamilies(name).find((f) => SHOWN.has(f))
  if (!family) return null
  const tokens = foodTokens(name)
  return containsRun(tokens, foodTokens(family)) ? null : family
}

/** Text a product can be found with: its name and its families. */
export function searchableFoodText(name: string): string {
  return [name, ...foodFamilies(name)].join(' ')
}

/**
 * Does a food match an excluded food? Every word of the excluded food must be in its name
 * ("Bananes" -> "Banane mûre"), or the excluded food is one of its families ("Fromage" -> "Comté").
 */
export function matchesFood(name: string, excluded: string): boolean {
  const wanted = foodTokens(excluded)
  if (wanted.length === 0) return false
  if (containsRun(foodTokens(name), wanted)) return true
  const key = wanted.join(' ')
  return foodFamilies(name).some((family) => foodTokens(family).join(' ') === key)
}
