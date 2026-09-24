// Estimation nutritionnelle À TITRE INDICATIF — voir l'avertissement dans constants/nutrition.ts
import { NUTRITION, NUTRITION_FALLBACK, type Macros } from '@/constants/nutrition'
import { classifyGroceryItem } from '@/utils/groceryCategory'
import { amountToKg, entryFor } from '@/utils/prices'

export interface Nutrition {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

const EMPTY: Nutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

/**
 * Share of an ingredient's raw weight that ends up on the plate, for the
 * portion weight: bones, shells, coffee grounds or tea leaves are not eaten,
 * and only ~10 % of the frying oil is absorbed. (Their nutrition values in
 * constants/nutrition.ts are already given per gross weight.)
 */
const EDIBLE_SHARE: Record<string, number> = {
  'os a moelle': 0,
  'carcasses de poulet': 0,
  kombu: 0,
  cafe: 0,
  the: 0,
  'bouquet garni': 0,
  'huile de friture': 0.1,
  moules: 0.25,
  poulet: 0.7,
  'cuisses de poulet': 0.75,
}

function macrosFor(name: string): Macros {
  const rowKey = entryFor(name).keywords[0]
  return (rowKey && NUTRITION[rowKey]) || NUTRITION_FALLBACK[classifyGroceryItem(name)] || [0, 0, 0, 0]
}

export interface RecipeNutrition {
  total: Nutrition
  perServing: Nutrition
  /** Per 100 g of edible raw ingredients (null when the weight is unknown). */
  per100g: Nutrition | null
  servings: number
  /** Edible raw weight of the whole recipe / of one serving, in grams. */
  totalGrams: number
  gramsPerServing: number
}

const scaleNutrition = (n: Nutrition, factor: number): Nutrition => ({
  kcal: n.kcal * factor,
  protein: n.protein * factor,
  carbs: n.carbs * factor,
  fat: n.fat * factor,
})

/**
 * Estimated nutrition of a recipe: whole recipe, one serving (= the recipe
 * divided by its number of servings) and per 100 g of raw ingredients.
 */
export function estimateRecipeNutrition(recipe: any): RecipeNutrition {
  const total = { ...EMPTY }
  let totalGrams = 0
  for (const ing of recipe?.recipe_ingredients || []) {
    const name = ing.ingredient_name || ''
    const grams = amountToKg(name, Number(ing.quantity), ing.unit) * 1000
    if (!grams) continue
    const [kcal, protein, carbs, fat] = macrosFor(name)
    total.kcal += (kcal * grams) / 100
    total.protein += (protein * grams) / 100
    total.carbs += (carbs * grams) / 100
    total.fat += (fat * grams) / 100
    totalGrams += grams * (EDIBLE_SHARE[entryFor(name).keywords[0]] ?? 1)
  }
  const servings = Number(recipe?.servings) > 0 ? Number(recipe.servings) : 1
  return {
    total,
    perServing: scaleNutrition(total, 1 / servings),
    per100g: totalGrams > 0 ? scaleNutrition(total, 100 / totalGrams) : null,
    servings,
    totalGrams,
    gramsPerServing: totalGrams / servings,
  }
}

const cache = new WeakMap<object, Nutrition>()

/** Per-serving nutrition, memoized per recipe object (lists re-render often). */
export function recipeNutritionPerServing(recipe: any): Nutrition {
  if (recipe && typeof recipe === 'object') {
    const cached = cache.get(recipe)
    if (cached) return cached
    const value = estimateRecipeNutrition(recipe).perServing
    cache.set(recipe, value)
    return value
  }
  return EMPTY
}
