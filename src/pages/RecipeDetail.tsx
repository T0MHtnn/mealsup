import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart, Clock, Users, Gauge, Minus, Plus, CalendarPlus, AlertTriangle, Pencil, Trash2, Wrench, ChefHat } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { recipeService, favoriteService, mealPlanService, userService, storageService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import type { TranslationKey } from '@/i18n/translations'
import type { DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { getRecipeWarnings } from '@/utils/warnings'
import { normalizeText } from '@/utils/text'
import { formatDuration } from '@/utils/date'
import { formatEstimate } from '@/utils/prices'
import { formatAmount } from '@/utils/quantity'
import { usePrices } from '@/hooks/usePrices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RecipeImage from '@/components/common/RecipeImage'
import DaySlotPickerModal from '@/components/DaySlotPickerModal'
import RecipeRating from '@/components/RecipeRating'
import { estimateRecipeNutrition } from '@/utils/nutrition'
import InfoButton from '@/components/common/InfoButton'

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { missingEquipment } = useFoodWarnings()
  const { recipeCost } = usePrices()

  const [recipe, setRecipe] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [servings, setServings] = useState(1)
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients')
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [planAdded, setPlanAdded] = useState(false)
  const [excludedFoods, setExcludedFoods] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestrictionKey[]>([])

  useEffect(() => {
    if (!id || !userId) return
    Promise.all([recipeService.getRecipeById(id), favoriteService.getFavoriteIds(userId), userService.getUserPreferences(userId)])
      .then(([data, favIds, prefs]) => {
        setRecipe(data)
        setServings(data?.servings || 1)
        setIsFavorite(favIds.includes(id))
        setExcludedFoods(
          (Array.isArray(prefs?.allergies) ? prefs.allergies : []).map((s: string) => normalizeText(s))
        )
        setDietaryRestrictions(Array.isArray(prefs?.dietary_restrictions) ? prefs.dietary_restrictions : [])
      })
      .catch((err) => console.error('Recipe detail load error:', err))
      .finally(() => setIsLoading(false))
  }, [id, userId])

  const toggleFavorite = async () => {
    if (!userId || !id) return
    const next = !isFavorite
    setIsFavorite(next)
    try {
      if (next) {
        await favoriteService.addFavorite(userId, id)
      } else {
        await favoriteService.removeFavorite(userId, id)
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
      setIsFavorite(!next)
    }
  }

  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!id) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await recipeService.deleteRecipe(id)
      storageService.removeRecipeImage(recipe?.image_url).catch(() => {})
      navigate('/recipes', { replace: true })
    } catch (err) {
      console.error('Delete recipe error:', err)
      setConfirmDelete(false)
    }
  }

  const handleAddToPlan = async (date: string, mealType: string) => {
    if (!userId || !id) return
    try {
      // Remember the servings chosen on this page (null = the recipe's own number)
      const plannedServings = recipe && servings !== (recipe.servings || 1) ? servings : null
      await mealPlanService.setMeal(userId, date, mealType, id, plannedServings)
      setPlanAdded(true)
    } catch (err) {
      console.error('Add to plan error:', err)
    } finally {
      setShowPlanPicker(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!recipe) {
    return <p className="text-center text-ink-muted text-sm py-8">{t('recipes.notFound')}</p>
  }

  const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const baseServings = recipe.servings || 1
  const scale = servings / baseServings

  const isOwner = Boolean(userId) && recipe.created_by === userId

  const warnings = getRecipeWarnings(recipe, excludedFoods, dietaryRestrictions)
  const hasExcludedMatch = (recipe.recipe_ingredients || []).some((ing: any) => {
    const name = normalizeText(ing.ingredient_name || '')
    return excludedFoods.some((f) => f && name.includes(f)) && warnings.matchedIngredientIds.has(ing.id)
  })

  return (
    <div>
      <div className="relative h-56 overflow-hidden">
        <RecipeImage recipe={recipe} size="full" iconSize={56} />
        {recipe.image_url && recipe.image_credit && (
          // Author and license of a photo that is not the user's own (free licenses require it)
          <a
            href={recipe.image_source_url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-1.5 right-1.5 max-w-[80%] truncate text-[10px] text-white/90 bg-black/45 px-1.5 py-0.5 rounded-sm"
          >
            {t('recipes.photoCredit', { credit: recipe.image_credit })}
          </a>
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-surface-200 shadow flex items-center justify-center text-ink"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={toggleFavorite}
          aria-label={t('recipes.toggleFavorite')}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-200 shadow flex items-center justify-center text-primary"
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">{recipe.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-ink-muted">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatDuration(totalTime)}
            </span>
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {recipe.servings} {t('recipes.servings')}
              </span>
            )}
            {recipe.difficulty && (
              <span className="flex items-center gap-1">
                <Gauge size={14} />
                {t(`recipes.difficulty.${recipe.difficulty}` as TranslationKey)}
              </span>
            )}
          </div>
        </div>

        {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag: string) => (
              <span key={tag} className="text-xs font-semibold text-accent bg-tint-clay px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {warnings.hasWarning && (
          <div className="flex items-start gap-2 p-3 bg-tint-clay border border-danger rounded-sm text-sm text-danger">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{hasExcludedMatch ? t('profile.excludeFoodWarning') : t('profile.dietaryWarning')}</span>
          </div>
        )}

        {missingEquipment(recipe).length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-tint-sand border border-accent rounded-sm text-sm text-accent">
            <Wrench size={16} className="shrink-0 mt-0.5" />
            <span>
              {t('warning.equipmentDetail', {
                list: missingEquipment(recipe)
                  .map((key) => t(`equipment.${key}` as TranslationKey))
                  .join(', '),
              })}
            </span>
          </div>
        )}

        {recipe.description && <p className="text-sm text-ink-muted">{recipe.description}</p>}

        {(() => {
          const cost = recipeCost(recipe)
          const shown = cost.perServing * servings
          return (
            <div className="bg-tint-sand rounded-sm px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ink">
                  <span className="font-display font-semibold">{t('prices.estimatedCost')} :</span> {formatEstimate(shown)}{' '}
                  <span className="text-ink-muted">
                    ({t('prices.forPeople', { n: servings })}, {formatEstimate(cost.perServing)}/{t('prices.perPerson')})
                  </span>
                </p>
                <InfoButton title={t('prices.infoTitle')} paragraphs={[t('prices.disclaimer'), t('prices.infoStore')]} />
              </div>
            </div>
          )
        })()}

        {(() => {
          const n = estimateRecipeNutrition(recipe)
          const grams = Math.round(n.gramsPerServing / 5) * 5
          const rows: { label: string; key: keyof typeof n.perServing; unit: string }[] = [
            { label: t('nutrition.energy'), key: 'kcal', unit: ' kcal' },
            { label: t('nutrition.protein'), key: 'protein', unit: ' g' },
            { label: t('nutrition.carbs'), key: 'carbs', unit: ' g' },
            { label: t('nutrition.fat'), key: 'fat', unit: ' g' },
          ]
          const fmt = (value: number, unit: string) => `${value < 10 && unit === ' g' ? value.toFixed(1).replace('.', ',') : Math.round(value)}${unit}`
          return (
            <div className="bg-surface-200 border border-border rounded-sm px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-display font-semibold text-ink">{t('nutrition.title')}</p>
                <InfoButton title={t('nutrition.infoTitle')} paragraphs={[t('nutrition.basis'), t('nutrition.disclaimer')]} />
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {n.servings > 1
                  ? t('nutrition.portionIs', { n: n.servings, g: grams })
                  : t('nutrition.portionIsWhole', { g: grams })}
              </p>
              <table className="w-full mt-2 text-sm">
                <thead>
                  <tr className="text-[11px] text-ink-muted">
                    <th className="text-left font-normal pb-1" />
                    <th className="text-right font-semibold pb-1">{t('nutrition.colServing', { g: grams })}</th>
                    <th className="text-right font-semibold pb-1">{t('nutrition.col100g')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map(({ label, key, unit }) => (
                    <tr key={key}>
                      <td className="py-1 text-ink">{label.charAt(0).toUpperCase() + label.slice(1)}</td>
                      <td className="py-1 text-right font-display font-semibold text-ink">≈ {fmt(n.perServing[key], unit)}</td>
                      <td className="py-1 text-right text-ink-muted">{n.per100g ? `≈ ${fmt(n.per100g[key], unit)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        <div className="flex items-center justify-between bg-surface-200 border border-border rounded-md p-3">
          <span className="text-sm font-display font-semibold text-ink">
            {t('recipes.servingsFor')} {servings} {t('recipes.people')}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              aria-label={t('common.decrease')}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-ink hover:bg-surface-100"
            >
              <Minus size={14} />
            </button>
            <span className="w-5 text-center font-display font-semibold text-ink">{servings}</span>
            <button
              onClick={() => setServings((s) => s + 1)}
              aria-label={t('common.increase')}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-ink hover:bg-surface-100"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="inline-flex rounded-full border border-border p-0.5 w-full">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-colors ${
              activeTab === 'ingredients' ? 'bg-primary text-white' : 'text-ink-muted'
            }`}
          >
            {t('recipes.ingredients')}
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-colors ${
              activeTab === 'steps' ? 'bg-primary text-white' : 'text-ink-muted'
            }`}
          >
            {t('recipes.steps')}
          </button>
        </div>

        {activeTab === 'ingredients' ? (
          <div className="bg-surface-200 border border-border rounded-md divide-y divide-border">
            {(recipe.recipe_ingredients || []).map((ing: any) => {
              const isFlagged = warnings.matchedIngredientIds.has(ing.id)
              return (
                <div key={ing.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className={`flex items-center gap-2 ${isFlagged ? 'text-danger font-medium' : 'text-ink'}`}>
                    {isFlagged ? (
                      <AlertTriangle size={13} className="shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    {ing.ingredient_name}
                  </span>
                  <span className={isFlagged ? 'text-danger font-semibold' : 'text-primary font-semibold'}>
                    {formatAmount(ing.quantity != null ? ing.quantity * scale : null, ing.unit)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
          <ol className="space-y-3">
            {recipe.instructions.map((step: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-ink">
                <span className="shrink-0 w-6 h-6 rounded-full bg-tint-sage text-primary font-display font-semibold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-muted text-center py-6">{t('recipes.noSteps')}</p>
        )}

        {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
          <Link
            to={`/recipes/${recipe.id}/cook?servings=${servings}`}
            className="w-full py-3 bg-accent text-white rounded-full font-display font-semibold flex items-center justify-center gap-2 hover:opacity-90"
          >
            <ChefHat size={18} />
            {t('cook.start')}
          </Link>
        )}

        <button
          onClick={() => setShowPlanPicker(true)}
          className="w-full py-3 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong flex items-center justify-center gap-2"
        >
          <CalendarPlus size={18} />
          {planAdded ? t('dashboard.addedToPlan') : t('dashboard.addToPlan')}
        </button>

        {isOwner && (
          <div className="flex gap-2">
            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="flex-1 py-2.5 rounded-full border border-border text-ink font-display font-semibold flex items-center justify-center gap-2 hover:bg-surface-200"
            >
              <Pencil size={16} />
              {t('recipes.edit')}
            </Link>
            <button
              onClick={handleDelete}
              className={`flex-1 py-2.5 rounded-full border font-display font-semibold flex items-center justify-center gap-2 ${
                confirmDelete ? 'bg-danger text-white border-danger' : 'border-border text-danger hover:bg-surface-200'
              }`}
            >
              <Trash2 size={16} />
              {confirmDelete ? t('recipes.deleteConfirm') : t('recipes.delete')}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-6">
        <RecipeRating recipeId={recipe.id} />
      </div>

      {showPlanPicker && (
        <DaySlotPickerModal onClose={() => setShowPlanPicker(false)} onConfirm={handleAddToPlan} />
      )}
    </div>
  )
}
