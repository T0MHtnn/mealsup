import { classifyGroceryItem, simplify } from '@/utils/groceryCategory'
import { matchedKeyword } from '@/utils/prices'
import { shelfLifeDays } from '@/utils/shelfLife'

/**
 * Same ingredient under different names ("Courgettes" in the fridge,
 * "Courgettes moyennes" in a recipe) -> same key. Reuses the price table
 * matching; unknown names fall back to their simplified text.
 */
export function ingredientKey(name: string): string {
  return matchedKeyword(name) ?? simplify(name)
}

// Things almost everyone has at home: never counted as "missing" nor as "leftovers"
const STAPLE_KEYS = new Set([
  'huile d olive', 'huile de sesame', 'huile', 'eau', 'eau gazeuse', 'sucre', 'sucre de canne', 'farine',
  'gros sel', 'sel', 'bouillon', 'bouillon de poulet', 'vinaigre', 'glace pilee', 'glacons',
])

export function isPantryStaple(name: string): boolean {
  return STAPLE_KEYS.has(ingredientKey(name)) || classifyGroceryItem(name) === 'Épices & Condiments'
}

/** Fresh products that spoil within a week (carrots or onions keep much longer). */
export function isPerishable(name: string): boolean {
  const days = shelfLifeDays(name)
  return days !== null && days <= 7
}

/** Distinct, non-staple ingredient keys of a recipe. */
export function recipeIngredientKeys(recipe: any): Set<string> {
  const keys = new Set<string>()
  for (const ing of recipe?.recipe_ingredients || []) {
    const name = ing.ingredient_name || ''
    if (name && !isPantryStaple(name)) keys.add(ingredientKey(name))
  }
  return keys
}
