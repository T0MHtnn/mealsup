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

function macrosFor(name: string): Macros {
  const rowKey = entryFor(name).keywords[0]
  return (rowKey && NUTRITION[rowKey]) || NUTRITION_FALLBACK[classifyGroceryItem(name)] || [0, 0, 0, 0]
}

/** Estimated nutrition of a whole recipe, then per serving. */
export function estimateRecipeNutrition(recipe: any): { total: Nutrition; perServing: Nutrition } {
  const total = { ...EMPTY }
  for (const ing of recipe?.recipe_ingredients || []) {
    const name = ing.ingredient_name || ''
    const grams = amountToKg(name, Number(ing.quantity), ing.unit) * 1000
    if (!grams) continue
    const [kcal, protein, carbs, fat] = macrosFor(name)
    total.kcal += (kcal * grams) / 100
    total.protein += (protein * grams) / 100
    total.carbs += (carbs * grams) / 100
    total.fat += (fat * grams) / 100
  }
  const servings = Number(recipe?.servings) > 0 ? Number(recipe.servings) : 1
  return {
    total,
    perServing: {
      kcal: total.kcal / servings,
      protein: total.protein / servings,
      carbs: total.carbs / servings,
      fat: total.fat / servings,
    },
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
