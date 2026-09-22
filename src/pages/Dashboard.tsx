import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Utensils, Cookie, Moon, Plus, X, Check, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { mealPlanService, shoppingService, userService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { getWeekDates, toISODate, isSameDay, formatDuration } from '@/utils/date'
import { normalizeText } from '@/utils/text'
import type { TranslationKey } from '@/i18n/translations'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RecipePickerModal from '@/components/RecipePickerModal'
import Logo from '@/components/common/Logo'

const MEAL_SLOTS: { key: 'breakfast' | 'lunch' | 'snack' | 'dinner'; icon: typeof Clock; tint: string }[] = [
  { key: 'breakfast', icon: Clock, tint: 'bg-tint-sand' },
  { key: 'lunch', icon: Utensils, tint: 'bg-tint-sage' },
  { key: 'snack', icon: Cookie, tint: 'bg-tint-sand' },
  { key: 'dinner', icon: Moon, tint: 'bg-tint-clay' },
]

export default function DashboardPage() {
  const { t, language } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { recipeHasWarning } = useFoodWarnings()
  const [username, setUsername] = useState('')
  const [weekPlan, setWeekPlan] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])

  const loadWeek = (userId: string, anchor: Date) => {
    const dates = getWeekDates(anchor)
    return mealPlanService.getWeekPlan(userId, toISODate(dates[0]), toISODate(dates[6]))
  }

  useEffect(() => {
    if (!userId) return
    Promise.all([userService.getUserPreferences(userId), loadWeek(userId, new Date())])
      .then(([prefs, plan]) => {
        setUsername(prefs?.username || '')
        setWeekPlan(plan)
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId])

  const entriesForSelectedDay = useMemo(() => {
    const iso = toISODate(selectedDate)
    const map = new Map<string, any>()
    for (const entry of weekPlan) {
      if (entry.meal_date === iso) map.set(entry.meal_type, entry)
    }
    return map
  }, [weekPlan, selectedDate])

  const handleSelectRecipe = async (recipe: any) => {
    if (!userId || !pickerSlot) return
    try {
      const entry = await mealPlanService.setMeal(userId, toISODate(selectedDate), pickerSlot, recipe.id)
      setWeekPlan((prev) => [...prev.filter((e) => e.id !== entry.id), entry])
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

  const handleGenerateList = async () => {
    if (!userId || weekPlan.length === 0) return
    setIsGenerating(true)
    setGenerated(false)
    try {
      const list = await shoppingService.getOrCreateActiveList(userId)
      const existingItems = await shoppingService.getListItems(list.id)
      const existingByName = new Map(existingItems.map((i: any) => [normalizeText(i.food_name), i]))

      const aggregated = new Map<string, { name: string; unit: string; qty: number }>()
      for (const entry of weekPlan) {
        for (const ing of entry.recipes?.recipe_ingredients || []) {
          const key = normalizeText(ing.ingredient_name)
          const prev = aggregated.get(key)
          const qty = Number(ing.quantity) || 0
          if (prev) {
            prev.qty += qty
          } else {
            aggregated.set(key, { name: ing.ingredient_name, unit: ing.unit, qty })
          }
        }
      }

      for (const [key, ing] of aggregated) {
        const existing = existingByName.get(key)
        if (existing) {
          await shoppingService.updateItemQuantity(existing.id, (Number(existing.quantity) || 0) + ing.qty)
        } else {
          await shoppingService.addItemToList(list.id, {
            food_name: ing.name,
            category: 'Autre',
            quantity: ing.qty || 1,
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
      <div className="flex items-center gap-3 mb-4">
        <Logo iconOnly size={56} />
        <div>
          <p className="text-sm text-ink-muted">
            {t('dashboard.greeting')} {username}
          </p>
          <h1 className="font-display text-3xl font-extrabold text-ink leading-tight">{t('dashboard.week')}</h1>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-5">
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

      <div className="space-y-3">
        {MEAL_SLOTS.map(({ key, icon: Icon, tint }) => {
          const entry = entriesForSelectedDay.get(key)
          const recipe = entry?.recipes

          if (recipe) {
            const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
            return (
              <div key={key} className="relative bg-surface-200 border border-border rounded-md p-3 flex items-center gap-3">
                <Link to={`/recipes/${recipe.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-sm flex items-center justify-center shrink-0 ${tint}`}>
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-muted">{t(`dashboard.mealType.${key}` as TranslationKey)}</p>
                    <p className="font-display font-semibold text-ink truncate">{recipe.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
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
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveMeal(entry)}
                  aria-label="Remove"
                  className="p-1.5 text-ink-muted hover:text-danger shrink-0"
                >
                  <X size={16} />
                </button>
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

      {pickerSlot && (
        <RecipePickerModal
          title={t(`dashboard.mealType.${pickerSlot}` as TranslationKey)}
          onClose={() => setPickerSlot(null)}
          onSelect={handleSelectRecipe}
        />
      )}
    </div>
  )
}
