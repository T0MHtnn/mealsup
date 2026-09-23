import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, X, Lock, Check, Link2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { recipeService, supabase, type RecipeIngredientInput } from '@/services/supabaseClient'
import { parseIngredientLine } from '@/utils/recipeImport'
import { useTranslation } from '@/hooks/useTranslation'
import type { TranslationKey } from '@/i18n/translations'
import { EQUIPMENT_LIST, type EquipmentKey } from '@/constants/equipment'
import { MEAL_CATEGORIES, MEAL_CATEGORY_TAG, isRecipeInCategory, type MealCategory } from '@/constants/mealCategories'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface IngredientRow {
  name: string
  quantity: string
  unit: string
}

// Units used across the recipes; '' = counted items ("3 œufs") shown as "unité"
const UNIT_OPTIONS = ['', 'g', 'kg', 'ml', 'cl', 'L', 'c.à.s', 'c.à.c', 'pincée', 'gousse', 'tranche', 'branche', 'feuille', 'bouquet', 'sachet', 'rouleau', 'à goût']

const EMPTY_INGREDIENT: IngredientRow = { name: '', quantity: '', unit: 'g' }
const CATEGORY_TAGS: string[] = Object.values(MEAL_CATEGORY_TAG)

const inputClass =
  'w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink placeholder:text-ink-muted/70 focus:ring-2 focus:ring-primary focus:border-transparent'

function toNumber(value: string, fallback: number) {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export default function RecipeEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.session?.user.id)
  const isEdit = Boolean(id)

  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<Set<MealCategory>>(new Set())
  const [prep, setPrep] = useState('')
  const [cook, setCook] = useState('')
  const [servings, setServings] = useState('4')
  const [difficulty, setDifficulty] = useState(1)
  const [equipment, setEquipment] = useState<Set<EquipmentKey>>(new Set())
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ ...EMPTY_INGREDIENT }])
  const [steps, setSteps] = useState<string[]>([''])
  // Tags other than the meal categories are kept untouched when editing
  const [otherTags, setOtherTags] = useState<string[]>([])
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'done' | 'error'>('idle')

  useEffect(() => {
    if (!id || !userId) return
    recipeService
      .getRecipeById(id)
      .then((recipe) => {
        if (!recipe || recipe.created_by !== userId) {
          navigate(`/recipes/${id}`, { replace: true })
          return
        }
        const tags: string[] = Array.isArray(recipe.tags) ? recipe.tags : []
        setTitle(recipe.title || '')
        setDescription(recipe.description || '')
        setCategories(new Set(MEAL_CATEGORIES.filter((c) => isRecipeInCategory(recipe, c))))
        setOtherTags(tags.filter((tag) => !CATEGORY_TAGS.includes(tag)))
        setPrep(recipe.prep_time_mins != null ? String(recipe.prep_time_mins) : '')
        setCook(recipe.cook_time_mins != null ? String(recipe.cook_time_mins) : '')
        setServings(String(recipe.servings || 4))
        setDifficulty(recipe.difficulty || 1)
        setEquipment(new Set(Array.isArray(recipe.equipment_needed) ? recipe.equipment_needed : []))
        const ings = (recipe.recipe_ingredients || []).map((ing: any) => ({
          name: ing.ingredient_name || '',
          quantity: ing.quantity != null ? String(ing.quantity) : '',
          unit: ing.unit || '',
        }))
        setIngredients(ings.length > 0 ? ings : [{ ...EMPTY_INGREDIENT }])
        const recipeSteps = Array.isArray(recipe.instructions) ? recipe.instructions : []
        setSteps(recipeSteps.length > 0 ? recipeSteps : [''])
      })
      .catch((err) => console.error('Recipe editor load error:', err))
      .finally(() => setIsLoading(false))
  }, [id, userId, navigate])

  const toggleInSet = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)))
  }

  /** Fill the form from a recipe page (the server function reads its structured data). */
  const handleImport = async () => {
    const url = importUrl.trim()
    if (!url) return
    setIsImporting(true)
    setImportStatus('idle')
    try {
      const { data, error } = await supabase.functions.invoke('import-recipe', { body: { url } })
      if (error || !data || data.error) throw error ?? new Error(data?.error)
      const source = new URL(data.source || url).hostname.replace(/^www\./, '')
      setTitle(data.title || '')
      setDescription(`${data.description ? `${data.description} ` : ''}(${t('import.source')} : ${source})`)
      if (data.prep_time_mins) setPrep(String(data.prep_time_mins))
      if (data.cook_time_mins) setCook(String(data.cook_time_mins))
      if (data.servings) setServings(String(data.servings))
      const parsed: IngredientRow[] = (data.ingredients || []).map((line: string) => parseIngredientLine(line))
      setIngredients(parsed.length > 0 ? parsed : [{ ...EMPTY_INGREDIENT }])
      setSteps(data.steps?.length ? data.steps : [''])
      setImportStatus('done')
    } catch (err) {
      console.error('Recipe import error:', err)
      setImportStatus('error')
    } finally {
      setIsImporting(false)
    }
  }

  const handleSave = async () => {
    if (!userId) return
    const cleanIngredients: RecipeIngredientInput[] = ingredients
      .filter((row) => row.name.trim())
      .map((row) => {
        const qty = parseFloat(row.quantity.replace(',', '.'))
        return {
          ingredient_name: row.name.trim(),
          quantity: Number.isFinite(qty) ? qty : null,
          unit: row.unit.trim(),
        }
      })
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)

    if (!title.trim() || categories.size === 0 || cleanIngredients.length === 0 || cleanSteps.length === 0) {
      setError(t('editor.errorRequired'))
      return
    }

    setError(null)
    setIsSaving(true)
    const input = {
      title: title.trim(),
      description: description.trim(),
      prep_time_mins: toNumber(prep, 0),
      cook_time_mins: toNumber(cook, 0),
      servings: Math.max(1, toNumber(servings, 1)),
      difficulty,
      tags: [...otherTags, ...MEAL_CATEGORIES.filter((c) => categories.has(c)).map((c) => MEAL_CATEGORY_TAG[c])],
      equipment_needed: [...equipment],
      instructions: cleanSteps,
    }

    try {
      if (id) {
        await recipeService.updateRecipe(id, input, cleanIngredients)
        navigate(-1)
      } else {
        const newId = await recipeService.createRecipe(userId, input, cleanIngredients)
        navigate(`/recipes/${newId}`, { replace: true })
      }
    } catch (err) {
      console.error('Recipe save error:', err)
      setError(t('editor.errorSave'))
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 pb-10 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-2xl text-ink">
          {isEdit ? t('editor.titleEdit') : t('editor.titleNew')}
        </h1>
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-muted">
        <Lock size={13} className="shrink-0" />
        {t('editor.privateNote')}
      </p>

      {!isEdit && (
        <section className="bg-tint-sage rounded-md p-3 space-y-2">
          <p className="text-sm font-display font-semibold text-ink flex items-center gap-2">
            <Link2 size={16} className="text-primary" />
            {t('import.title')}
          </p>
          <p className="text-xs text-ink-muted">{t('import.hint')}</p>
          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.marmiton.org/recettes/…"
              className={`${inputClass} flex-1 min-w-0`}
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !importUrl.trim()}
              className="px-4 bg-primary text-white rounded-sm font-display font-semibold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isImporting && <Loader2 size={15} className="animate-spin" />}
              {t('import.button')}
            </button>
          </div>
          {importStatus === 'done' && <p className="text-xs text-primary">{t('import.done')}</p>}
          {importStatus === 'error' && <p className="text-xs text-danger">{t('import.error')}</p>}
        </section>
      )}

      <section className="space-y-1.5">
        <label className="text-sm font-display font-semibold text-ink">{t('editor.name')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('editor.namePlaceholder')}
          className={inputClass}
        />
      </section>

      <section className="space-y-1.5">
        <label className="text-sm font-display font-semibold text-ink">{t('editor.description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('editor.descriptionPlaceholder')}
          rows={2}
          className={inputClass}
        />
      </section>

      <section className="space-y-1.5">
        <p className="text-sm font-display font-semibold text-ink">{t('editor.categories')}</p>
        <p className="text-xs text-ink-muted">{t('editor.categoriesHint')}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {MEAL_CATEGORIES.map((cat) => {
            const isActive = categories.has(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategories((prev) => toggleInSet(prev, cat))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border ${
                  isActive ? 'bg-primary text-white border-primary' : 'bg-surface-200 text-ink-muted border-border'
                }`}
              >
                {isActive && <Check size={13} />}
                {t(`recipes.category.${cat}` as TranslationKey)}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[
          { label: t('editor.prep'), value: prep, set: setPrep, placeholder: '15' },
          { label: t('editor.cook'), value: cook, set: setCook, placeholder: '30' },
          { label: t('editor.servings'), value: servings, set: setServings, placeholder: '4' },
        ].map((field) => (
          <div key={field.label} className="space-y-1">
            <label className="text-xs font-display font-semibold text-ink">{field.label}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </section>

      <section className="space-y-1.5">
        <p className="text-sm font-display font-semibold text-ink">{t('editor.difficulty')}</p>
        <div className="inline-flex rounded-full border border-border p-0.5 w-full">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              className={`flex-1 py-1.5 rounded-full text-sm font-display font-semibold ${
                difficulty === level ? 'bg-primary text-white' : 'text-ink-muted'
              }`}
            >
              {t(`recipes.difficulty.${level}` as TranslationKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <p className="text-sm font-display font-semibold text-ink">{t('editor.equipment')}</p>
        <p className="text-xs text-ink-muted">{t('editor.equipmentHint')}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {EQUIPMENT_LIST.map(({ key, icon: Icon }) => {
            const isActive = equipment.has(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setEquipment((prev) => toggleInSet(prev, key))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  isActive ? 'bg-primary text-white border-primary' : 'bg-surface-200 text-ink-muted border-border'
                }`}
              >
                <Icon size={13} />
                {t(`equipment.${key}` as const)}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <p className="text-sm font-display font-semibold text-ink">{t('editor.ingredients')}</p>
          <p className="text-xs text-ink-muted">{t('editor.ingredientsHint')}</p>
        </div>
        {ingredients.map((row, i) => (
          <div key={i} className="border border-border rounded-sm p-2 space-y-1.5 bg-surface-100">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                placeholder={t('editor.ingredientPlaceholder')}
                aria-label={t('editor.ingredientName')}
                className={`${inputClass} flex-1 min-w-0`}
              />
              <button
                type="button"
                onClick={() => setIngredients((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : [{ ...EMPTY_INGREDIENT }]))}
                aria-label={t('editor.remove')}
                className="p-1.5 text-ink-muted hover:text-danger shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pr-9">
              <label className="space-y-0.5">
                <span className="block text-[11px] font-semibold text-ink-muted">{t('editor.quantity')}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                  placeholder={t('editor.quantityPlaceholder')}
                  className={inputClass}
                />
              </label>
              <label className="space-y-0.5">
                <span className="block text-[11px] font-semibold text-ink-muted">{t('editor.unit')}</span>
                <select
                  value={row.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                  className={inputClass}
                >
                  {/* A unit saved earlier that is not in the list stays selectable */}
                  {!UNIT_OPTIONS.includes(row.unit) && <option value={row.unit}>{row.unit}</option>}
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit === '' ? t('editor.unitNone') : unit === 'à goût' ? t('editor.unitToTaste') : unit}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <Plus size={15} />
          {t('editor.addIngredient')}
        </button>
      </section>

      <section className="space-y-2">
        <div>
          <p className="text-sm font-display font-semibold text-ink">{t('editor.steps')}</p>
          <p className="text-xs text-ink-muted">{t('editor.stepsHint')}</p>
        </div>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="shrink-0 mt-2 w-6 h-6 rounded-full bg-tint-sage text-primary font-display font-semibold text-xs flex items-center justify-center">
              {i + 1}
            </span>
            <textarea
              value={step}
              onChange={(e) => updateStep(i, e.target.value)}
              placeholder={t('editor.stepPlaceholder')}
              rows={2}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => setSteps((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : ['']))}
              aria-label={t('editor.remove')}
              className="p-1 mt-2 text-ink-muted hover:text-danger shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, ''])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <Plus size={15} />
          {t('editor.addStep')}
        </button>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-50"
      >
        {isSaving ? t('editor.saving') : t('editor.save')}
      </button>
    </div>
  )
}
