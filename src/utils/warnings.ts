import { DIETARY_RESTRICTIONS, type DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { normalizeText } from '@/utils/text'
import { matchesFood } from '@/utils/foodFamily'

export interface RecipeWarnings {
  hasWarning: boolean
  matchedIngredientIds: Set<string>
}

/** Why a food name is flagged: it matches an excluded food, a dietary restriction, or nothing. */
export type FoodFlag = 'excluded' | 'restriction' | null

/** Does a food name match one of the excluded foods ("Bananes" covers "Banane mûre", "Fromage" covers "Comté")? */
export function isExcludedFood(foodName: string, excludedFoods: string[]): boolean {
  return Boolean(foodName) && excludedFoods.some((excluded) => excluded && matchesFood(foodName, excluded))
}

/** Checks a single food / ingredient name against the user's excluded foods and dietary restrictions. */
export function getFoodFlag(
  foodName: string,
  excludedFoods: string[],
  restrictions: DietaryRestrictionKey[]
): FoodFlag {
  const name = normalizeText(foodName || '')
  if (!name) return null
  if (isExcludedFood(foodName, excludedFoods)) return 'excluded'
  const forbiddenKeywords = restrictions.flatMap(
    (key) => DIETARY_RESTRICTIONS.find((r) => r.key === key)?.keywords || []
  )
  if (forbiddenKeywords.some((kw) => name.includes(normalizeText(kw)))) return 'restriction'
  return null
}

/** Checks a recipe's ingredients against the user's excluded foods and dietary restrictions. */
export function getRecipeWarnings(
  recipe: any,
  excludedFoods: string[],
  restrictions: DietaryRestrictionKey[]
): RecipeWarnings {
  const ingredients: any[] = recipe?.recipe_ingredients || []
  const matchedIngredientIds = new Set<string>()

  for (const ing of ingredients) {
    if (getFoodFlag(ing.ingredient_name, excludedFoods, restrictions)) {
      matchedIngredientIds.add(ing.id)
    }
  }

  return { hasWarning: matchedIngredientIds.size > 0, matchedIngredientIds }
}

/** Equipment a recipe needs that the user said they don't have (none when "all equipment" is on). */
export function getMissingEquipment(recipe: any, equipmentAll: boolean, userEquipment: Iterable<string>): string[] {
  if (equipmentAll) return []
  const owned = new Set(userEquipment)
  const needed: string[] = Array.isArray(recipe?.equipment_needed) ? recipe.equipment_needed : []
  return needed.filter((key) => !owned.has(key))
}
