import { recipeNutritionPerServing, type Nutrition } from '@/utils/nutrition'
import { ingredientKey, isPantryStaple } from '@/utils/ingredients'
import { amountToKg } from '@/utils/prices'
import { toISODate } from '@/utils/date'

export interface DayRecap {
  date: Date
  meals: number
  kcal: number
}

export interface WeekRecap {
  days: DayRecap[]
  meals: number
  /** Days with at least one planned meal (the daily average is computed on them). */
  activeDays: number
  total: Nutrition
  avgKcal: number
  distinctRecipes: number
  topRecipe: { recipe: any; count: number } | null
  topIngredient: { name: string; meals: number; grams: number } | null
  distinctIngredients: number
  /** Estimated cost of the week (all planned servings), before the store factor. */
  cost: number
}

/** Portions planned for a meal: its own number, otherwise the recipe's. */
export const plannedServings = (entry: any) => entry.servings ?? entry.recipes?.servings ?? 1

/**
 * Recap of a planned week, for ONE person: each planned meal counts as one
 * portion (1/n of the recipe). It describes what was planned, not what was
 * really eaten, and every value is an estimate.
 */
export function computeWeekRecap(
  weekDates: Date[],
  entries: any[],
  recipeCost: (recipe: any) => { total: number; perServing: number }
): WeekRecap {
  const total: Nutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  const byDay = new Map(weekDates.map((d) => [toISODate(d), { date: d, meals: 0, kcal: 0 }]))
  const recipeCount = new Map<string, { recipe: any; count: number; first: string }>()
  const ingredients = new Map<string, { names: Map<string, number>; meals: number; grams: number }>()
  let meals = 0
  let cost = 0

  const sorted = [...entries].sort((a, b) =>
    `${a.meal_date}${a.meal_type}`.localeCompare(`${b.meal_date}${b.meal_type}`)
  )
  for (const entry of sorted) {
    const recipe = entry.recipes
    const day = byDay.get(entry.meal_date)
    if (!recipe || !day) continue
    meals += 1
    day.meals += 1

    const n = recipeNutritionPerServing(recipe)
    day.kcal += n.kcal
    total.kcal += n.kcal
    total.protein += n.protein
    total.carbs += n.carbs
    total.fat += n.fat
    cost += recipeCost(recipe).perServing * plannedServings(entry)

    const seen = recipeCount.get(recipe.id)
    if (seen) seen.count += 1
    else recipeCount.set(recipe.id, { recipe, count: 1, first: entry.meal_date })

    // Ingredients of one portion; salt, oil, spices… are not interesting here
    const servings = Number(recipe.servings) > 0 ? Number(recipe.servings) : 1
    const inMeal = new Set<string>()
    for (const ing of recipe.recipe_ingredients || []) {
      const name: string = (ing.ingredient_name || '').trim()
      if (!name || isPantryStaple(name)) continue
      const key = ingredientKey(name)
      const stat = ingredients.get(key) ?? { names: new Map(), meals: 0, grams: 0 }
      stat.names.set(name, (stat.names.get(name) ?? 0) + 1)
      stat.grams += (amountToKg(name, Number(ing.quantity), ing.unit) * 1000) / servings
      if (!inMeal.has(key)) {
        inMeal.add(key)
        stat.meals += 1
      }
      ingredients.set(key, stat)
    }
  }

  const days = [...byDay.values()]
  const activeDays = days.filter((d) => d.meals > 0).length

  // Most planned dish (first planned wins a tie)
  let topRecipe: WeekRecap['topRecipe'] = null
  for (const r of recipeCount.values()) {
    if (!topRecipe || r.count > topRecipe.count) topRecipe = { recipe: r.recipe, count: r.count }
  }

  // Ingredient found in the most meals, then the heaviest
  let topIngredient: WeekRecap['topIngredient'] = null
  for (const stat of ingredients.values()) {
    if (
      !topIngredient ||
      stat.meals > topIngredient.meals ||
      (stat.meals === topIngredient.meals && stat.grams > topIngredient.grams)
    ) {
      // Shown under its most used name, the shortest one on a tie ("Oignon" rather than "Oignon rouge émincé")
      const name = [...stat.names.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0]
      topIngredient = { name, meals: stat.meals, grams: stat.grams }
    }
  }

  return {
    days,
    meals,
    activeDays,
    total,
    avgKcal: activeDays > 0 ? total.kcal / activeDays : 0,
    distinctRecipes: recipeCount.size,
    topRecipe,
    topIngredient,
    distinctIngredients: ingredients.size,
    cost,
  }
}
