// Catégories de repas, portées par les tags des recettes (voir supabase/seed.sql)
export const MEAL_CATEGORIES = ['breakfast', 'main', 'snack', 'aperitif'] as const

export type MealCategory = (typeof MEAL_CATEGORIES)[number]

export const MEAL_CATEGORY_TAG: Record<MealCategory, string> = {
  breakfast: 'petit-déjeuner',
  main: 'plat',
  snack: 'goûter',
  aperitif: 'apéro',
}

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

/** Catégories de recettes proposées pour chaque créneau du planning. */
export const SLOT_CATEGORIES: Record<MealSlot, MealCategory[]> = {
  breakfast: ['breakfast'],
  lunch: ['main'],
  snack: ['snack', 'aperitif'],
  dinner: ['main'],
}

export function isRecipeInCategory(recipe: any, category: MealCategory): boolean {
  const tags: string[] = Array.isArray(recipe?.tags) ? recipe.tags : []
  return tags.includes(MEAL_CATEGORY_TAG[category])
}
