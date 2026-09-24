import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Utensils,
  Cookie,
  Moon,
  Plus,
  Minus,
  X,
  Check,
  AlertTriangle,
  Wrench,
  Sparkles,
  RefreshCw,
  Users,
  Leaf,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { mealPlanService, shoppingService, userService, recipeService, favoriteService, ratingService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { getWeekDates, toISODate, isSameDay, formatDuration } from '@/utils/date'
import { normalizeText } from '@/utils/text'
import { isToTaste } from '@/utils/quantity'
import { classifyGroceryItem } from '@/utils/groceryCategory'
import { antiWasteSuggestions, pickForSlot, type PlannerContext } from '@/utils/mealPlanner'
import type { TranslationKey } from '@/i18n/translations'
import type { MealSlot } from '@/constants/mealCategories'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RecipePickerModal from '@/components/RecipePickerModal'
import NotificationPrompt from '@/components/NotificationPrompt'
import Logo from '@/components/common/Logo'

const MEAL_SLOTS: { key: MealSlot; icon: typeof Clock; tint: string }[] = [
  { key: 'breakfast', icon: Clock, tint: 'bg-tint-sand' },
  { key: 'lunch', icon: Utensils, tint: 'bg-tint-sage' },
  { key: 'snack', icon: Cookie, tint: 'bg-tint-sand' },
  { key: 'dinner', icon: Moon, tint: 'bg-tint-clay' },
]

// Tap water used in recipes is not something to buy
const PANTRY_WATER = /^eau( (tiede|glacee|froide|chaude|bouillante))?$/

/** Portions planned for a meal: its own number, otherwise the recipe's. */
const plannedServings = (entry: any) => entry.servings ?? entry.recipes?.servings ?? 1

export default function DashboardPage() {
  const { t, language } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { recipeHasWarning, missingEquipment } = useFoodWarnings()
  const [username, setUsername] = useState('')
  const [weekPlan, setWeekPlan] = useState<any[]>([])
  const [recipes, setRecipes] = useState<any[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [ratings, setRatings] = useState<Map<string, number>>(new Map())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [isPlanning, setIsPlanning] = useState(false)
  const [planMessage, setPlanMessage] = useState<string | null>(null)

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])

  const loadWeek = (userId: string, anchor: Date) => {
    const dates = getWeekDates(anchor)
    return mealPlanService.getWeekPlan(userId, toISODate(dates[0]), toISODate(dates[6]))
  }

  useEffect(() => {
    if (!userId) return
    Promise.all([
      userService.getUserPreferences(userId),
      loadWeek(userId, new Date()),
      recipeService.getRecipes().catch(() => []),
      favoriteService.getFavoriteIds(userId).catch(() => []),
      ratingService.getMine(userId).catch(() => []),
    ])
      .then(([prefs, plan, allRecipes, favIds, myRatings]) => {
        setUsername(prefs?.username || '')
        setWeekPlan(plan)
        setRecipes(allRecipes)
        setFavorites(new Set(favIds))
        setRatings(new Map(myRatings.filter((r) => r.rating).map((r) => [r.recipe_id, r.rating as number])))
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId])

  const plannerContext: PlannerContext = useMemo(
    () => ({ recipes, favorites, ratings, hasWarning: recipeHasWarning, missingEquipment }),
    [recipes, favorites, ratings, recipeHasWarning, missingEquipment]
  )

  const entriesForSelectedDay = useMemo(() => {
    const iso = toISODate(selectedDate)
    const map = new Map<string, any>()
    for (const entry of weekPlan) {
      if (entry.meal_date === iso) map.set(entry.meal_type, entry)
    }
    return map
  }, [weekPlan, selectedDate])

  const antiWaste = useMemo(
    () => antiWasteSuggestions(weekPlan.map((e) => e.recipes).filter(Boolean), plannerContext),
    [weekPlan, plannerContext]
  )

  const replaceEntry = (entry: any) => setWeekPlan((prev) => [...prev.filter((e) => e.id !== entry.id), entry])

  const handleSelectRecipe = async (recipe: any) => {
    if (!userId || !pickerSlot) return
    try {
      replaceEntry(await mealPlanService.setMeal(userId, toISODate(selectedDate), pickerSlot, recipe.id))
    } catch (err) {
      console.error('Set meal error:', err)
    } finally {
      setPickerSlot(null)
    }
  }

  const handleRemoveMeal = async (entry: any) => {
    setWeekPlan((prev) => prev.filter((e) => e.id !== entry.id))
    await mealPlanService.removeMeal(entry.id).catch((err) => console.error('Remove meal error:', err))
  }

  const handleServings = async (entry: any, delta: number) => {
    const next = Math.min(50, Math.max(1, plannedServings(entry) + delta))
    setWeekPlan((prev) => prev.map((e) => (e.id === entry.id ? { ...e, servings: next } : e)))
    await mealPlanService.updateServings(entry.id, next).catch((err) => console.error('Update servings error:', err))
  }

  /** Fill the empty slots of the week (from today on) with suggestions. */
  const handleSuggestWeek = async () => {
    if (!userId) return
    setIsPlanning(true)
    setPlanMessage(null)
    try {
      const todayIso = toISODate(new Date())
      const used = new Set(weekPlan.map((e) => e.recipe_id))
      const taken = new Set(weekPlan.map((e) => `${e.meal_date}|${e.meal_type}`))
      const meals: { meal_date: string; meal_type: string; recipe_id: string }[] = []
      for (const date of weekDates) {
        const iso = toISODate(date)
        if (iso < todayIso) continue
        for (const { key } of MEAL_SLOTS) {
          if (taken.has(`${iso}|${key}`)) continue
          const recipe = pickForSlot(key, date, plannerContext, used)
          if (!recipe) continue
          used.add(recipe.id)
          meals.push({ meal_date: iso, meal_type: key, recipe_id: recipe.id })
        }
      }
      const saved = await mealPlanService.setMeals(userId, meals)
      setWeekPlan((prev) => [...prev, ...saved])
      setPlanMessage(meals.length > 0 ? t('planner.added', { n: meals.length }) : t('planner.nothingToAdd'))
    } catch (err) {
      console.error('Suggest week error:', err)
      setPlanMessage(t('planner.error'))
    } finally {
      setIsPlanning(false)
    }
  }

  /** Swap one planned meal for another suggestion. */
  const handleReroll = async (entry: any) => {
    if (!userId) return
    const used = new Set(weekPlan.map((e) => e.recipe_id))
    const recipe = pickForSlot(entry.meal_type, new Date(`${entry.meal_date}T12:00:00`), plannerContext, used)
    if (!recipe) return
    try {
      replaceEntry(await mealPlanService.setMeal(userId, entry.meal_date, entry.meal_type, recipe.id))
    } catch (err) {
      console.error('Reroll error:', err)
    }
  }

  const handleGenerateList = async () => {
    if (!userId || weekPlan.length === 0) return
    setIsGenerating(true)
    setGenerated(false)
    try {
      const list = await shoppingService.getOrCreateActiveList(userId)
      const existingItems = await shoppingService.getListItems(list.id)
      // Same ingredient + same unit are summed; different units stay separate lines
      const keyOf = (name: string, unit: string | null | undefined) => `${normalizeText(name)}|${(unit || '').trim()}`
      const existingByKey = new Map(existingItems.map((i: any) => [keyOf(i.food_name, i.unit), i]))

      const aggregated = new Map<string, { name: string; unit: string; qty: number | null }>()
      for (const entry of weekPlan) {
        const recipe = entry.recipes
        if (!recipe) continue
        // Quantities follow the number of portions planned for this meal
        const scale = plannedServings(entry) / (recipe.servings || 1)
        for (const ing of recipe.recipe_ingredients || []) {
          if (PANTRY_WATER.test(normalizeText(ing.ingredient_name))) continue
          const key = keyOf(ing.ingredient_name, ing.unit)
          const qty = isToTaste(ing.unit) ? null : Math.round((Number(ing.quantity) || 0) * scale * 100) / 100
          const prev = aggregated.get(key)
          if (prev) {
            if (prev.qty !== null && qty !== null) prev.qty += qty
          } else {
            aggregated.set(key, { name: ing.ingredient_name, unit: (ing.unit || '').trim(), qty })
          }
        }
      }

      // Regenerating is idempotent: an existing line is raised to the needed amount, never added twice
      for (const [key, ing] of aggregated) {
        const existing = existingByKey.get(key)
        if (existing) {
          const current = Number(existing.quantity) || 0
          if (ing.qty !== null && ing.qty > current) {
            await shoppingService.updateItemQuantity(existing.id, ing.qty)
          }
        } else {
          await shoppingService.addItemToList(list.id, {
            food_name: ing.name,
            category: classifyGroceryItem(ing.name),
            quantity: ing.qty,
            unit: ing.unit || null,
          })
        }
      }
      setGenerated(true)
    } catch (err) {
      console.error('Generate list error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 pb-8">
      <NotificationPrompt />

      <div className="flex items-center gap-3 mb-4">
        <Logo iconOnly size={56} />
        <div>
          <p className="text-sm text-ink-muted">
            {t('dashboard.greeting')} {username}
          </p>
          <h1 className="font-display text-3xl font-extrabold text-ink leading-tight">{t('dashboard.week')}</h1>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDates.map((d) => {
          const isSelected = isSameDay(d, selectedDate)
          return (
            <button
              key={toISODate(d)}
              onClick={() => setSelectedDate(d)}
              className={`flex flex-col items-center gap-1 py-2 rounded-md ${
                isSelected ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-200'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold opacity-80">
                {d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }).slice(0, 2)}
              </span>
              <span className="text-sm font-display font-bold">{d.getDate()}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleSuggestWeek}
        disabled={isPlanning || recipes.length === 0}
        className="w-full mb-2 py-2.5 border border-primary text-primary rounded-full font-display font-semibold flex items-center justify-center gap-2 hover:bg-tint-sage disabled:opacity-50"
      >
        <Sparkles size={17} />
        {isPlanning ? t('planner.working') : t('planner.suggestWeek')}
      </button>
      <p className="text-xs text-ink-muted text-center mb-4">{planMessage ?? t('planner.hint')}</p>

      <div className="space-y-3">
        {MEAL_SLOTS.map(({ key, icon: Icon, tint }) => {
          const entry = entriesForSelectedDay.get(key)
          const recipe = entry?.recipes

          if (recipe) {
            const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
            return (
              <div key={key} className="bg-surface-200 border border-border rounded-md">
                <div className="p-3 flex items-center gap-3">
                  <Link to={`/recipes/${recipe.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-sm flex items-center justify-center shrink-0 ${tint}`}>
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-ink-muted">{t(`dashboard.mealType.${key}` as TranslationKey)}</p>
                      <p className="font-display font-semibold text-ink truncate">{recipe.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-ink-muted flex items-center gap-1">
                          <Clock size={11} />
                          {formatDuration(totalTime)}
                        </span>
                        {recipeHasWarning(recipe) && (
                          <span title={t('warning.recipe')} className="text-xs text-danger flex items-center gap-1">
                            <AlertTriangle size={11} />
                            {t('warning.recipe')}
                          </span>
                        )}
                        {missingEquipment(recipe).length > 0 && (
                          <span title={t('warning.equipment')} className="text-xs text-accent flex items-center gap-1">
                            <Wrench size={11} />
                            {t('warning.equipment')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveMeal(entry)}
                    aria-label={t('planner.remove')}
                    className="p-1.5 text-ink-muted hover:text-danger shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <Users size={14} className="text-ink-muted" />
                    <button
                      onClick={() => handleServings(entry, -1)}
                      disabled={plannedServings(entry) <= 1}
                      aria-label={t('planner.lessServings')}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="min-w-[3.5rem] text-center font-display font-semibold">
                      {plannedServings(entry)} {t('recipes.servings')}
                    </span>
                    <button
                      onClick={() => handleServings(entry, 1)}
                      aria-label={t('planner.moreServings')}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleReroll(entry)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary px-2 py-1"
                  >
                    <RefreshCw size={13} />
                    {t('planner.another')}
                  </button>
                </div>
              </div>
            )
          }

          return (
            <button
              key={key}
              onClick={() => setPickerSlot(key)}
              className="w-full flex items-center gap-3 p-3 rounded-md border-2 border-dashed border-border hover:border-primary text-ink-muted"
            >
              <div className="w-11 h-11 rounded-sm border-2 border-dashed border-border flex items-center justify-center shrink-0">
                <Plus size={18} />
              </div>
              <span className="text-sm font-medium">{t(`dashboard.mealType.${key}` as TranslationKey)}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleGenerateList}
        disabled={isGenerating || weekPlan.length === 0}
        className="w-full mt-6 py-3 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Check size={18} />
        {generated ? t('dashboard.listGenerated') : t('dashboard.generateList')}
      </button>

      <Link
        to="/recap"
        className="mt-6 flex items-center gap-3 bg-surface-200 border border-border rounded-md px-3 py-3"
      >
        <span className="w-9 h-9 rounded-sm bg-tint-clay flex items-center justify-center shrink-0">
          <BarChart3 size={18} className="text-accent" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display font-semibold text-ink">{t('recap.cardTitle')}</span>
          <span className="block text-xs text-ink-muted">{t('recap.cardHint')}</span>
        </span>
        <ChevronRight size={18} className="text-ink-muted shrink-0" />
      </Link>

      {antiWaste.length > 0 && (
        <section className="mt-6 bg-tint-sage rounded-md p-3 space-y-2">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <Leaf size={17} className="text-primary" />
            {t('antiWaste.title')}
          </h2>
          <p className="text-xs text-ink-muted">{t('antiWaste.hint')}</p>
          {antiWaste.map(({ recipe, reuses }) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="block bg-surface-200 border border-border rounded-sm px-3 py-2"
            >
              <p className="font-display font-semibold text-sm text-ink">{recipe.title}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {t('antiWaste.reuses')} {reuses.join(', ')}
              </p>
            </Link>
          ))}
        </section>
      )}

      {pickerSlot && (
        <RecipePickerModal
          title={t(`dashboard.mealType.${pickerSlot}` as TranslationKey)}
          slot={pickerSlot}
          onClose={() => setPickerSlot(null)}
          onSelect={handleSelectRecipe}
        />
      )}
    </div>
  )
}
