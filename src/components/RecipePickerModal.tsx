import { useEffect, useMemo, useState } from 'react'
import { Search, Clock, AlertTriangle, Heart, Wrench } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { recipeService, favoriteService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { normalizeText } from '@/utils/text'
import { formatDuration } from '@/utils/date'
import { SLOT_CATEGORIES, isRecipeInCategory, type MealSlot } from '@/constants/mealCategories'
import Modal from '@/components/common/Modal'

interface RecipePickerModalProps {
  title: string
  /** Planner slot: only recipes of the matching category are offered. */
  slot: MealSlot
  onClose: () => void
  onSelect: (recipe: any) => void
}

export default function RecipePickerModal({ title, slot, onClose, onSelect }: RecipePickerModalProps) {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { recipeHasWarning, missingEquipment } = useFoodWarnings()
  const [recipes, setRecipes] = useState<any[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([recipeService.getRecipes(), favoriteService.getFavoriteIds(userId)])
      .then(([allRecipes, favIds]) => {
        setRecipes(allRecipes)
        setFavoriteIds(new Set(favIds))
      })
      .catch((err) => console.error('Recipe picker load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId])

  const filtered = useMemo(() => {
    const categories = SLOT_CATEGORIES[slot]
    const query = normalizeText(search.trim())
    return recipes.filter((r) => {
      if (!categories.some((c) => isRecipeInCategory(r, c))) return false
      if (favoritesOnly && !favoriteIds.has(r.id)) return false
      if (!query) return true
      const ingredientNames = (r.recipe_ingredients || []).map((i: any) => i.ingredient_name).join(' ')
      return normalizeText(`${r.title} ${ingredientNames}`).includes(query)
    })
  }, [recipes, slot, search, favoritesOnly, favoriteIds])

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('recipes.search')}
            autoFocus
            className="w-full pl-9 pr-3 py-2 border border-border rounded-full bg-surface-100 text-ink text-sm"
          />
        </div>
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          aria-pressed={favoritesOnly}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border ${
            favoritesOnly ? 'bg-primary text-white border-primary' : 'bg-surface-100 text-ink-muted border-border'
          }`}
        >
          <Heart size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
          {t('recipes.favoritesOnly')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-ink-muted text-sm py-6">…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-6">{t('recipes.none')}</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-auto">
          {filtered.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-sm border border-border hover:bg-surface-100 text-left"
            >
              <span className="text-sm text-ink font-medium flex items-center gap-1.5 min-w-0">
                {favoriteIds.has(recipe.id) && <Heart size={12} className="text-primary shrink-0" fill="currentColor" />}
                {recipeHasWarning(recipe) && (
                  <AlertTriangle size={13} className="text-danger shrink-0" aria-label={t('warning.recipe')} />
                )}
                {missingEquipment(recipe).length > 0 && (
                  <Wrench size={12} className="text-accent shrink-0" aria-label={t('warning.equipment')} />
                )}
                <span className="truncate">{recipe.title}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-muted shrink-0 ml-2">
                <Clock size={12} />
                {formatDuration((recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0))}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
