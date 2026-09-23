import { isRecipeInCategory, type MealCategory, type MealSlot } from '@/constants/mealCategories'
import { isPerishable, ingredientKey, isPantryStaple } from '@/utils/ingredients'

export interface PlannerContext {
  recipes: any[]
  favorites: Set<string>
  ratings: Map<string, number>
  hasWarning: (recipe: any) => boolean
  missingEquipment: (recipe: any) => string[]
}

// Auto-suggestions only propose real meals (no coffee, jam or cocktail alone)
const AUTO_CATEGORY: Record<MealSlot, MealCategory> = {
  breakfast: 'breakfast',
  lunch: 'main',
  snack: 'snack',
  dinner: 'main',
}
const NOT_A_MEAL_TAGS = ['boisson', 'cocktail', 'conserve']

// Max total time (prep + cooking), in minutes: weekdays are busier than weekends
const MAX_MINUTES: Record<'weekday' | 'weekend', Record<MealSlot, number>> = {
  weekday: { breakfast: 20, lunch: 45, snack: 35, dinner: 60 },
  weekend: { breakfast: 60, lunch: 180, snack: 90, dinner: 120 },
}

function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

/** Recipes that fit a slot on a given day, with their weight for the random pick. */
export function slotCandidates(slot: MealSlot, date: Date, ctx: PlannerContext, excludeIds: Set<string>) {
  const maxMinutes = MAX_MINUTES[isWeekend(date) ? 'weekend' : 'weekday'][slot]
  return ctx.recipes
    .filter((r) => {
      if (excludeIds.has(r.id)) return false
      if (!isRecipeInCategory(r, AUTO_CATEGORY[slot])) return false
      const tags: string[] = Array.isArray(r.tags) ? r.tags : []
      if (tags.some((tag) => NOT_A_MEAL_TAGS.includes(tag))) return false
      if ((r.prep_time_mins ?? 0) + (r.cook_time_mins ?? 0) > maxMinutes) return false
      if ((ctx.ratings.get(r.id) ?? 3) <= 2) return false
      if (ctx.hasWarning(r) || ctx.missingEquipment(r).length > 0) return false
      return true
    })
    .map((r) => {
      const rating = ctx.ratings.get(r.id)
      let weight = 1
      if (ctx.favorites.has(r.id)) weight *= 3
      if (rating === 5) weight *= 4
      else if (rating === 4) weight *= 3
      return { recipe: r, weight }
    })
}

/** Weighted random pick among the candidates (favorites and well-rated recipes come up more often). */
export function pickForSlot(slot: MealSlot, date: Date, ctx: PlannerContext, excludeIds: Set<string>): any | null {
  const candidates = slotCandidates(slot, date, ctx, excludeIds)
  const total = candidates.reduce((sum, c) => sum + c.weight, 0)
  if (total === 0) return null
  let roll = Math.random() * total
  for (const c of candidates) {
    roll -= c.weight
    if (roll <= 0) return c.recipe
  }
  return candidates[candidates.length - 1].recipe
}

export interface AntiWasteSuggestion {
  recipe: any
  /** Display names of the leftover ingredients this recipe reuses. */
  reuses: string[]
}

/**
 * Anti-waste: fresh ingredients bought for a single planned recipe usually leave
 * leftovers (half a pot of cream, a bunch of coriander...). Suggest up to 2 other
 * recipes that reuse at least 2 of them.
 */
export function antiWasteSuggestions(plannedRecipes: any[], ctx: PlannerContext, max = 2): AntiWasteSuggestion[] {
  const usage = new Map<string, { name: string; recipes: Set<string> }>()
  for (const recipe of plannedRecipes) {
    for (const ing of recipe?.recipe_ingredients || []) {
      const name = ing.ingredient_name || ''
      if (!name || isPantryStaple(name) || !isPerishable(name)) continue
      const key = ingredientKey(name)
      const entry = usage.get(key) ?? { name, recipes: new Set<string>() }
      entry.recipes.add(recipe.id)
      usage.set(key, entry)
    }
  }
  const leftovers = new Map([...usage].filter(([, u]) => u.recipes.size === 1).map(([key, u]) => [key, u.name]))
  if (leftovers.size < 2) return []

  const planned = new Set(plannedRecipes.map((r) => r.id))
  const scored = ctx.recipes
    .filter((r) => !planned.has(r.id) && !ctx.hasWarning(r) && ctx.missingEquipment(r).length === 0)
    .filter((r) => !(Array.isArray(r.tags) && r.tags.some((tag: string) => NOT_A_MEAL_TAGS.includes(tag))))
    .map((r) => {
      const reuses = new Map<string, string>()
      for (const ing of r.recipe_ingredients || []) {
        const key = ingredientKey(ing.ingredient_name || '')
        if (leftovers.has(key)) reuses.set(key, leftovers.get(key) as string)
      }
      const bonus = (ctx.favorites.has(r.id) ? 0.5 : 0) + (ctx.ratings.get(r.id) ?? 0) / 10
      return { recipe: r, reuses: [...reuses.values()], score: reuses.size + bonus }
    })
    .filter((s) => s.reuses.length >= 2)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, max).map(({ recipe, reuses }) => ({ recipe, reuses }))
}
