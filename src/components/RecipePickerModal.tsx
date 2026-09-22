import { useEffect, useMemo, useState } from 'react'
import { Search, Clock, AlertTriangle } from 'lucide-react'
import { recipeService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { normalizeText } from '@/utils/text'
import { formatDuration } from '@/utils/date'
import Modal from '@/components/common/Modal'

interface RecipePickerModalProps {
  title: string
  onClose: () => void
  onSelect: (recipe: any) => void
}

export default function RecipePickerModal({ title, onClose, onSelect }: RecipePickerModalProps) {
  const { t } = useTranslation()
  const { recipeHasWarning } = useFoodWarnings()
  const [recipes, setRecipes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    recipeService
      .getRecipes()
      .then(setRecipes)
      .catch((err) => console.error('Recipe picker load error:', err))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim())
    if (!query) return recipes
    return recipes.filter((r) => {
      const ingredientNames = (r.recipe_ingredients || []).map((i: any) => i.ingredient_name).join(' ')
      return normalizeText(`${r.title} ${ingredientNames}`).includes(query)
    })
  }, [recipes, search])

  return (
    <Modal title={title} onClose={onClose}>
      <div className="relative mb-3">
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

      {isLoading ? (
        <p className="text-center text-ink-muted text-sm py-6">…</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-auto">
          {filtered.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-sm border border-border hover:bg-surface-100 text-left"
            >
              <span className="text-sm text-ink font-medium flex items-center gap-1.5 min-w-0">
                {recipeHasWarning(recipe) && (
                  <AlertTriangle size={13} className="text-danger shrink-0" aria-label={t('warning.recipe')} />
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
