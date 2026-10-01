import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Heart,
  Clock,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  AlertTriangle,
  Plus,
  Wrench,
  PiggyBank,
  Refrigerator,
  Star,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { recipeService, favoriteService, userService, fridgeService, ratingService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import type { EquipmentKey } from '@/constants/equipment'
import type { DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { MEAL_CATEGORIES, isRecipeInCategory, type MealCategory } from '@/constants/mealCategories'
import type { TranslationKey } from '@/i18n/translations'
import { normalizeText } from '@/utils/text'
import { getMissingEquipment, getRecipeWarnings } from '@/utils/warnings'
import { formatDuration } from '@/utils/date'
import { formatEstimate, formatEuros, unknownIngredients } from '@/utils/prices'
import { usePrices } from '@/hooks/usePrices'
import { LOW_BUDGET_PER_SERVING } from '@/constants/prices'
import { HIGH_PROTEIN_PER_SERVING, LIGHT_KCAL_PER_SERVING } from '@/constants/nutrition'
import { recipeNutritionPerServing } from '@/utils/nutrition'
import { ingredientKey, recipeIngredientKeys } from '@/utils/ingredients'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SearchInput from '@/components/common/SearchInput'
import RecipeImage from '@/components/common/RecipeImage'
import { saveRecipesScroll, saveRecipesSearch, savedRecipesScroll } from '@/utils/recipesListState'

type SortKey = 'default' | 'time' | 'difficulty' | 'rating'
const SORT_OPTIONS: SortKey[] = ['default', 'time', 'difficulty', 'rating']

const chipClass = (active: boolean) =>
  `shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
    active ? 'bg-primary text-white border-primary' : 'bg-surface-200 text-ink-muted border-border'
  }`

export default function RecipesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { recipeCost } = usePrices()
  const userId = useAuthStore((state) => state.session?.user.id)
  const [recipes, setRecipes] = useState<any[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [ratings, setRatings] = useState<Map<string, number>>(new Map())
  const [fridgeKeys, setFridgeKeys] = useState<Set<string>>(new Set())
  const [excludedFoods, setExcludedFoods] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestrictionKey[]>([])
  const [equipmentAll, setEquipmentAll] = useState(true)
  const [userEquipment, setUserEquipment] = useState<Set<EquipmentKey>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Search, filters and sort live in the URL, so that going back from a recipe
  // restores the exact same filtered list.
  const search = searchParams.get('q') ?? ''
  const showFavoritesOnly = searchParams.get('favorites') === 'true'
  const lowBudgetOnly = searchParams.get('budget') === 'low'
  const fridgeMode = searchParams.get('fridge') === '1'
  const highProteinOnly = searchParams.get('protein') === '1'
  const lightOnly = searchParams.get('light') === '1'
  const categoryParam = searchParams.get('cat') as MealCategory | null
  const category = categoryParam && MEAL_CATEGORIES.includes(categoryParam) ? categoryParam : null
  const sortParam = searchParams.get('sort') as SortKey | null
  const sortBy: SortKey = sortParam && SORT_OPTIONS.includes(sortParam) ? sortParam : 'default'
  const sortDir: 'asc' | 'desc' = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
  const activeFilterCount = [sortBy !== 'default', highProteinOnly, lightOnly].filter(Boolean).length

  const updateParams = (changes: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true }
    )
  }

  useEffect(() => {
    if (!userId) return
    Promise.all([
      recipeService.getRecipes(),
      favoriteService.getFavoriteIds(userId),
      userService.getUserPreferences(userId),
      ratingService.getMine(userId).catch(() => []),
      fridgeService.getFridgeItems(userId).catch(() => []),
    ])
      .then(([allRecipes, favIds, prefs, myRatings, fridgeItems]) => {
        setRecipes(allRecipes)
        setFavoriteIds(new Set(favIds))
        setRatings(new Map(myRatings.filter((r) => r.rating).map((r) => [r.recipe_id, r.rating as number])))
        setFridgeKeys(new Set(fridgeItems.map((item: any) => ingredientKey(item.food_name))))
        setExcludedFoods(
          (Array.isArray(prefs?.allergies) ? prefs.allergies : [])
            .map((s: string) => s.trim())
            .filter(Boolean)
        )
        setEquipmentAll(prefs?.equipment_all ?? true)
        setUserEquipment(new Set(Array.isArray(prefs?.equipment) ? prefs.equipment : []))
        setDietaryRestrictions(Array.isArray(prefs?.dietary_restrictions) ? prefs.dietary_restrictions : [])
      })
      .catch((err) => console.error('Recipes load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId])

  // Remember the filters, so that the Recipes tab reopens with them
  useEffect(() => {
    const query = searchParams.toString()
    saveRecipesSearch(query ? `?${query}` : '')
  }, [searchParams])

  // Back from a recipe (or another tab): same place in the list
  const restoredScroll = useRef(false)
  useLayoutEffect(() => {
    if (isLoading) return
    const scroller = document.getElementById('app-scroll')
    if (!scroller) return
    if (!restoredScroll.current) {
      restoredScroll.current = true
      scroller.scrollTop = savedRecipesScroll()
    }
    const onScroll = () => saveRecipesScroll(scroller.scrollTop)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [isLoading])

  const toggleFavorite = async (e: React.MouseEvent, recipeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return
    const isFav = favoriteIds.has(recipeId)
    const next = new Set(favoriteIds)
    isFav ? next.delete(recipeId) : next.add(recipeId)
    setFavoriteIds(next)

    try {
      if (isFav) {
        await favoriteService.removeFavorite(userId, recipeId)
      } else {
        await favoriteService.addFavorite(userId, recipeId)
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
      setFavoriteIds(favoriteIds)
    }
  }

  const selectSort = (option: SortKey) => {
    if (option === 'default') {
      updateParams({ sort: null, dir: null })
    } else if (sortBy === option) {
      updateParams({ dir: sortDir === 'desc' ? 'asc' : null })
    } else {
      updateParams({ sort: option, dir: null })
    }
    setShowFilters(false)
  }

  /** How many of the recipe's ingredients (staples aside) are already in the fridge. */
  const fridgeMatch = useMemo(() => {
    const map = new Map<string, { have: number; total: number }>()
    for (const recipe of recipes) {
      const keys = recipeIngredientKeys(recipe)
      let have = 0
      keys.forEach((key) => fridgeKeys.has(key) && have++)
      map.set(recipe.id, { have, total: keys.size })
    }
    return map
  }, [recipes, fridgeKeys])

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim())
    return recipes.filter((recipe) => {
      if (showFavoritesOnly && !favoriteIds.has(recipe.id)) return false
      if (category && !isRecipeInCategory(recipe, category)) return false
      // An unrecognised ingredient could cost or weigh anything: no "cheap" or "light" claim then
      const complete = !(lowBudgetOnly || lightOnly) || unknownIngredients(recipe).length === 0
      if (lowBudgetOnly && (!complete || recipeCost(recipe).perServing > LOW_BUDGET_PER_SERVING)) return false
      if (fridgeMode && !(fridgeMatch.get(recipe.id)?.have ?? 0)) return false
      if (highProteinOnly && recipeNutritionPerServing(recipe).protein < HIGH_PROTEIN_PER_SERVING) return false
      if (lightOnly && (!complete || recipeNutritionPerServing(recipe).kcal > LIGHT_KCAL_PER_SERVING)) return false

      if (!query) return true
      const ingredientNames = (recipe.recipe_ingredients || []).map((i: any) => i.ingredient_name).join(' ')
      const haystack = normalizeText(`${recipe.title} ${(recipe.tags || []).join(' ')} ${ingredientNames}`)
      return haystack.includes(query)
    })
  }, [recipes, search, showFavoritesOnly, lowBudgetOnly, fridgeMode, highProteinOnly, lightOnly, category, favoriteIds, recipeCost, fridgeMatch])

  const sorted = useMemo(() => {
    // "What can I cook with my fridge?": most ingredients already at home first
    if (fridgeMode && sortBy === 'default') {
      const score = (r: any) => {
        const m = fridgeMatch.get(r.id)
        return m && m.total ? m.have + m.have / m.total : 0
      }
      return [...filtered].sort((a, b) => score(b) - score(a))
    }
    if (sortBy === 'default') return filtered
    const keyOf = (recipe: any) =>
      sortBy === 'time'
        ? (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
        : sortBy === 'rating'
          ? ratings.get(recipe.id) ?? 0
          : recipe.difficulty ?? 0
    return [...filtered].sort((a, b) => (sortDir === 'asc' ? keyOf(a) - keyOf(b) : keyOf(b) - keyOf(a)))
  }, [filtered, sortBy, sortDir, fridgeMode, fridgeMatch, ratings])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => updateParams({ q: value })}
          placeholder={t('recipes.search')}
          className="flex-1"
        />
        <Link
          to="/recipes/new"
          aria-label={t('recipes.create')}
          title={t('recipes.create')}
          className="w-10 h-10 shrink-0 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-strong"
        >
          <Plus size={20} />
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
        {[null, ...MEAL_CATEGORIES].map((cat) => {
          const isActive = category === cat
          return (
            <button
              key={cat ?? 'all'}
              onClick={() => updateParams({ cat })}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${
                isActive ? 'bg-ink text-surface-100 border-ink' : 'bg-surface-200 text-ink-muted border-border'
              }`}
            >
              {t((cat ? `recipes.category.${cat}` : 'recipes.category.all') as TranslationKey)}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <button
          onClick={() => updateParams({ favorites: showFavoritesOnly ? null : 'true' })}
          className={chipClass(showFavoritesOnly)}
        >
          <Heart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          {t('recipes.favoritesOnly')}
        </button>

        <button
          onClick={() => updateParams({ fridge: fridgeMode ? null : '1' })}
          title={t('fridgeMatch.hint')}
          className={chipClass(fridgeMode)}
        >
          <Refrigerator size={14} />
          {t('fridgeMatch.filter')}
        </button>

        <button
          onClick={() => updateParams({ budget: lowBudgetOnly ? null : 'low' })}
          title={t('prices.lowBudgetHint', { max: formatEuros(LOW_BUDGET_PER_SERVING) })}
          className={chipClass(lowBudgetOnly)}
        >
          <PiggyBank size={14} />
          {t('prices.lowBudget')}
        </button>

        <button onClick={() => setShowFilters(!showFilters)} className={chipClass(activeFilterCount > 0)}>
          <SlidersHorizontal size={14} />
          {t('recipes.filters')}
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
      </div>

      {showFilters && (
        <div className="bg-surface-200 border border-border rounded-md shadow-sm p-2 space-y-2">
          <div>
            <p className="text-xs font-display font-semibold text-ink-muted px-2 py-1">{t('recipes.sortBy')}</p>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option
              return (
                <button
                  key={option}
                  onClick={() => selectSort(option)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-sm text-sm text-ink hover:bg-surface-100"
                >
                  <span>{t(`recipes.sort.${option}` as TranslationKey)}</span>
                  <span className="flex items-center gap-1.5">
                    {option !== 'default' &&
                      (isActive ? (
                        sortDir === 'desc' ? (
                          <ArrowDown size={14} className="text-primary" />
                        ) : (
                          <ArrowUp size={14} className="text-primary" />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="text-ink-muted" />
                      ))}
                    {option === 'default' && isActive && <Check size={14} className="text-primary" />}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-xs font-display font-semibold text-ink-muted px-2 py-1">{t('nutrition.filters')}</p>
            {[
              { active: highProteinOnly, param: 'protein', label: t('nutrition.highProtein', { min: HIGH_PROTEIN_PER_SERVING }) },
              { active: lightOnly, param: 'light', label: t('nutrition.light', { max: LIGHT_KCAL_PER_SERVING }) },
            ].map(({ active, param, label }) => (
              <button
                key={param}
                onClick={() => updateParams({ [param]: active ? null : '1' })}
                className="w-full flex items-center justify-between px-2 py-2 rounded-sm text-sm text-ink hover:bg-surface-100"
              >
                <span>{label}</span>
                <span
                  className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                    active ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {active && <Check size={11} className="text-white" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {fridgeMode && fridgeKeys.size === 0 && (
        <p className="text-sm text-ink-muted bg-tint-sand rounded-md px-3 py-2">{t('fridgeMatch.emptyFridge')}</p>
      )}

      {sorted.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('recipes.none')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((recipe) => {
            const isFav = favoriteIds.has(recipe.id)
            const warnings = getRecipeWarnings(recipe, excludedFoods, dietaryRestrictions)
            const missing = getMissingEquipment(recipe, equipmentAll, userEquipment)
            const myRating = ratings.get(recipe.id)
            const match = fridgeMatch.get(recipe.id)
            return (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="bg-surface-200 border border-border rounded-md overflow-hidden flex flex-col"
              >
                <div className="relative h-28">
                  <RecipeImage recipe={recipe} />
                  {recipe.created_by && recipe.created_by === userId && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-accent px-2 py-0.5 rounded-full">
                      {t('recipes.mine')}
                    </span>
                  )}
                  {fridgeMode && match && match.total > 0 && (
                    <span
                      title={t('fridgeMatch.badge', { have: match.have, total: match.total })}
                      className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-surface-200 px-2 py-0.5 rounded-full"
                    >
                      <Refrigerator size={11} />
                      {match.have}/{match.total}
                    </span>
                  )}
                  <div className="absolute top-1.5 left-1.5 flex gap-1">
                    {warnings.hasWarning && (
                      <span
                        title={t('warning.recipe')}
                        className="w-7 h-7 rounded-full bg-danger text-white shadow-md ring-2 ring-white flex items-center justify-center"
                      >
                        <AlertTriangle size={14} />
                      </span>
                    )}
                    {missing.length > 0 && (
                      <span
                        title={t('warning.equipment')}
                        className="w-7 h-7 rounded-full bg-accent text-white shadow-md ring-2 ring-white flex items-center justify-center"
                      >
                        <Wrench size={13} />
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    aria-label={t('recipes.toggleFavorite')}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface-200 shadow flex items-center justify-center text-primary"
                  >
                    <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="p-2.5 flex-1 flex flex-col">
                  <h3 className="font-display font-semibold text-sm text-ink line-clamp-2">{recipe.title}</h3>
                  {myRating && (
                    <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-accent font-semibold">
                      <Star size={11} fill="currentColor" />
                      {myRating}/5
                    </span>
                  )}
                  <div className="mt-auto pt-1.5 flex flex-wrap items-center justify-between gap-x-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDuration((recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0))}
                    </span>
                    {recipeCost(recipe).perServing > 0 && (
                      <span title={t('prices.disclaimer')}>{formatEstimate(recipeCost(recipe).perServing)}/{t('prices.perPerson')}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
