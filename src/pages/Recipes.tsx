import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, Clock, Utensils, SlidersHorizontal, ArrowUp, ArrowDown, ArrowUpDown, Check, AlertTriangle, Plus, Wrench, PiggyBank } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { recipeService, favoriteService, userService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import type { EquipmentKey } from '@/constants/equipment'
import type { DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { MEAL_CATEGORIES, isRecipeInCategory, type MealCategory } from '@/constants/mealCategories'
import type { TranslationKey } from '@/i18n/translations'
import { normalizeText } from '@/utils/text'
import { getMissingEquipment, getRecipeWarnings } from '@/utils/warnings'
import { formatDuration } from '@/utils/date'
import { formatEuros } from '@/utils/prices'
import { usePrices } from '@/hooks/usePrices'
import { LOW_BUDGET_PER_SERVING } from '@/constants/prices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SearchInput from '@/components/common/SearchInput'

const HERO_TINTS = ['bg-tint-sage', 'bg-tint-sand', 'bg-tint-clay']

function heroTintFor(recipe: any) {
  const tags: string[] = recipe.tags || []
  if (tags.includes('petit-déjeuner')) return 'bg-tint-sand'
  if (tags.includes('dessert') || tags.includes('bbq')) return 'bg-tint-clay'
  return HERO_TINTS[recipe.title.length % HERO_TINTS.length]
}

type SortKey = 'default' | 'time' | 'difficulty'

export default function RecipesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { recipeCost } = usePrices()
  const userId = useAuthStore((state) => state.session?.user.id)
  const [recipes, setRecipes] = useState<any[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [excludedFoods, setExcludedFoods] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestrictionKey[]>([])
  const [equipmentAll, setEquipmentAll] = useState(true)
  const [userEquipment, setUserEquipment] = useState<Set<EquipmentKey>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Search, category, favorites and sort live in the URL, so that going back
  // from a recipe restores the exact same filtered list.
  const search = searchParams.get('q') ?? ''
  const showFavoritesOnly = searchParams.get('favorites') === 'true'
  const lowBudgetOnly = searchParams.get('budget') === 'low'
  const categoryParam = searchParams.get('cat') as MealCategory | null
  const category = categoryParam && MEAL_CATEGORIES.includes(categoryParam) ? categoryParam : null
  const sortParam = searchParams.get('sort')
  const sortBy: SortKey = sortParam === 'time' || sortParam === 'difficulty' ? sortParam : 'default'
  const sortDir: 'asc' | 'desc' = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'

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
    ])
      .then(([allRecipes, favIds, prefs]) => {
        setRecipes(allRecipes)
        setFavoriteIds(new Set(favIds))
        setExcludedFoods(
          (Array.isArray(prefs?.allergies) ? prefs.allergies : [])
            .map((s: string) => normalizeText(s))
            .filter(Boolean)
        )
        setEquipmentAll(prefs?.equipment_all ?? true)
        setUserEquipment(new Set(Array.isArray(prefs?.equipment) ? prefs.equipment : []))
        setDietaryRestrictions(Array.isArray(prefs?.dietary_restrictions) ? prefs.dietary_restrictions : [])
      })
      .catch((err) => console.error('Recipes load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId])

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

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim())
    return recipes.filter((recipe) => {
      if (showFavoritesOnly && !favoriteIds.has(recipe.id)) return false
      if (category && !isRecipeInCategory(recipe, category)) return false
      if (lowBudgetOnly && recipeCost(recipe).perServing > LOW_BUDGET_PER_SERVING) return false


      if (!query) return true
      const ingredientNames = (recipe.recipe_ingredients || []).map((i: any) => i.ingredient_name).join(' ')
      const haystack = normalizeText(`${recipe.title} ${(recipe.tags || []).join(' ')} ${ingredientNames}`)
      return haystack.includes(query)
    })
  }, [recipes, search, showFavoritesOnly, lowBudgetOnly, category, favoriteIds, recipeCost])

  const sorted = useMemo(() => {
    if (sortBy === 'default') return filtered
    const withKey = filtered.map((recipe) => ({
      recipe,
      key:
        sortBy === 'time'
          ? (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
          : recipe.difficulty ?? 0,
    }))
    withKey.sort((a, b) => (sortDir === 'asc' ? a.key - b.key : b.key - a.key))
    return withKey.map((w) => w.recipe)
  }, [filtered, sortBy, sortDir])

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

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateParams({ favorites: showFavoritesOnly ? null : 'true' })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
            showFavoritesOnly
              ? 'bg-primary text-white border-primary'
              : 'bg-surface-200 text-ink-muted border-border'
          }`}
        >
          <Heart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          {t('recipes.favoritesOnly')}
        </button>

        <button
          onClick={() => updateParams({ budget: lowBudgetOnly ? null : 'low' })}
          title={t('prices.lowBudgetHint', { max: formatEuros(LOW_BUDGET_PER_SERVING) })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
            lowBudgetOnly ? 'bg-primary text-white border-primary' : 'bg-surface-200 text-ink-muted border-border'
          }`}
        >
          <PiggyBank size={14} />
          {t('prices.lowBudget')}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
              sortBy !== 'default'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-200 text-ink-muted border-border'
            }`}
          >
            <SlidersHorizontal size={14} />
            {t('recipes.filters')}
          </button>

          {showFilters && (
            <div className="absolute z-10 mt-2 w-60 bg-surface-200 border border-border rounded-md shadow-lg p-2">
              <p className="text-xs font-display font-semibold text-ink-muted px-2 py-1">{t('recipes.sortBy')}</p>
              {(['default', 'time', 'difficulty'] as const).map((option) => {
                const isActive = sortBy === option
                return (
                  <button
                    key={option}
                    onClick={() => selectSort(option)}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-sm text-sm text-ink hover:bg-surface-100"
                  >
                    <span>{t(`recipes.sort.${option}` as const)}</span>
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
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('recipes.none')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((recipe) => {
            const isFav = favoriteIds.has(recipe.id)
            const warnings = getRecipeWarnings(recipe, excludedFoods, dietaryRestrictions)
            const missing = getMissingEquipment(recipe, equipmentAll, userEquipment)
            return (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="bg-surface-200 border border-border rounded-md overflow-hidden flex flex-col"
              >
                <div className={`relative h-24 flex items-center justify-center ${heroTintFor(recipe)}`}>
                  <Utensils className="text-primary" size={26} strokeWidth={1.75} />
                  {recipe.created_by && recipe.created_by === userId && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-accent px-2 py-0.5 rounded-full">
                      {t('recipes.mine')}
                    </span>
                  )}
                  <div className="absolute top-1.5 left-1.5 flex gap-1">
                    {warnings.hasWarning && (
                      <span
                        title={t('warning.recipe')}
                        className="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center text-danger"
                      >
                        <AlertTriangle size={14} />
                      </span>
                    )}
                    {missing.length > 0 && (
                      <span
                        title={t('warning.equipment')}
                        className="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center text-accent"
                      >
                        <Wrench size={13} />
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    aria-label="Toggle favorite"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center text-primary"
                  >
                    <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="p-2.5 flex-1 flex flex-col">
                  <h3 className="font-display font-semibold text-sm text-ink line-clamp-2">{recipe.title}</h3>
                  <div className="mt-auto pt-1.5 flex flex-wrap items-center justify-between gap-x-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDuration((recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0))}
                    </span>
                    <span title={t('prices.disclaimer')}>≈ {formatEuros(recipeCost(recipe).perServing)}/{t('prices.perPerson')}</span>
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
