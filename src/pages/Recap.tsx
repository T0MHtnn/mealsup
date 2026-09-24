import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Trophy, Carrot, Salad, Wallet, UtensilsCrossed } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { mealPlanService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { usePrices } from '@/hooks/usePrices'
import { getWeekDates, toISODate } from '@/utils/date'
import { formatEstimate } from '@/utils/prices'
import { computeWeekRecap, type WeekRecap } from '@/utils/weeklyRecap'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import InfoButton from '@/components/common/InfoButton'

const CHART_HEIGHT = 120

export default function RecapPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { recipeCost } = usePrices()
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'

  // 0 = this week, -1 = last week…
  const [offset, setOffset] = useState(0)
  const [entries, setEntries] = useState<any[] | null>(null)
  const [previousEntries, setPreviousEntries] = useState<any[]>([])
  const [activeDay, setActiveDay] = useState<number | null>(null)

  const weekDates = useMemo(() => {
    const anchor = new Date()
    anchor.setDate(anchor.getDate() + offset * 7)
    return getWeekDates(anchor)
  }, [offset])
  const previousDates = useMemo(() => {
    const anchor = new Date(weekDates[0])
    anchor.setDate(anchor.getDate() - 7)
    return getWeekDates(anchor)
  }, [weekDates])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setEntries(null)
    setActiveDay(null)
    // The week before is loaded too, for the comparison
    Promise.all([
      mealPlanService.getWeekPlan(userId, toISODate(weekDates[0]), toISODate(weekDates[6])),
      mealPlanService.getWeekPlan(userId, toISODate(previousDates[0]), toISODate(previousDates[6])),
    ])
      .then(([current, previous]) => {
        if (cancelled) return
        setEntries(current)
        setPreviousEntries(previous)
      })
      .catch((err) => {
        console.error('Recap load error:', err)
        if (!cancelled) setEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [userId, weekDates, previousDates])

  const recap = useMemo(
    () => (entries ? computeWeekRecap(weekDates, entries, recipeCost) : null),
    [entries, weekDates, recipeCost]
  )
  const previous = useMemo(
    () => computeWeekRecap(previousDates, previousEntries, recipeCost),
    [previousDates, previousEntries, recipeCost]
  )

  const num = (value: number) => Math.round(value).toLocaleString(locale)
  const shortDate = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const weekLabel =
    offset === 0
      ? t('recap.thisWeek')
      : offset === -1
        ? t('recap.lastWeek')
        : `${shortDate(weekDates[0])} – ${shortDate(weekDates[6])}`

  return (
    <div className="p-4 pb-8 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-2xl text-ink flex-1">{t('recap.title')}</h1>
        <InfoButton title={t('recap.infoTitle')} paragraphs={[t('recap.disclaimer'), t('nutrition.disclaimer')]} size={18} />
      </div>

      <div className="flex items-center justify-between bg-surface-200 border border-border rounded-full px-1 py-1">
        <button
          onClick={() => setOffset((o) => o - 1)}
          aria-label={t('recap.previousWeek')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-100"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-display font-semibold text-ink text-sm">{weekLabel}</p>
          <p className="text-[11px] text-ink-muted">
            {shortDate(weekDates[0])} – {shortDate(weekDates[6])}
          </p>
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset === 0}
          aria-label={t('recap.nextWeek')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-100 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {!recap ? (
        <LoadingSpinner />
      ) : recap.meals === 0 ? (
        <div className="bg-surface-200 border border-border rounded-md p-6 text-center space-y-3">
          <UtensilsCrossed size={28} className="mx-auto text-ink-muted" />
          <p className="text-sm text-ink">{t('recap.empty')}</p>
          <Link to="/" className="inline-block text-sm font-semibold text-primary">
            {t('recap.planWeek')} →
          </Link>
        </div>
      ) : (
        renderRecap(recap)
      )}
    </div>
  )

  // Plain render function (not a nested component: no remount on every render)
  function renderRecap(recap: WeekRecap) {
    // 15 % headroom above the highest day, for the average label
    const maxKcal = Math.max(...recap.days.map((d) => d.kcal), 1) * 1.15
    const avgTop = recap.avgKcal > 0 ? CHART_HEIGHT - (recap.avgKcal / maxKcal) * CHART_HEIGHT : null
    const active = activeDay !== null ? recap.days[activeDay] : null
    const diff = previous.avgKcal > 0 ? ((recap.avgKcal - previous.avgKcal) / previous.avgKcal) * 100 : null

    // Share of energy brought by each macronutrient (4 / 4 / 9 kcal per gram)
    const macroKcal = recap.total.protein * 4 + recap.total.carbs * 4 + recap.total.fat * 9 || 1
    const macros = [
      { label: t('nutrition.protein'), grams: recap.total.protein, share: (recap.total.protein * 4) / macroKcal },
      { label: t('nutrition.carbs'), grams: recap.total.carbs, share: (recap.total.carbs * 4) / macroKcal },
      { label: t('nutrition.fat'), grams: recap.total.fat, share: (recap.total.fat * 9) / macroKcal },
    ]
    const perDay = (grams: number) => num(grams / Math.max(1, recap.activeDays))

    return (
      <>
        {/* Calories: headline + one bar per day */}
        <section className="bg-surface-200 border border-border rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <Flame size={14} className="text-accent" /> {t('recap.avgPerDay')}
              </p>
              <p className="font-display font-extrabold text-3xl text-ink leading-tight">
                ≈ {num(recap.avgKcal)} <span className="text-base font-semibold text-ink-muted">kcal</span>
              </p>
              {diff !== null && Math.abs(diff) >= 1 && (
                <p className="text-xs text-ink-muted mt-0.5">
                  {diff > 0 ? '▲' : '▼'} {t(diff > 0 ? 'recap.moreThanLast' : 'recap.lessThanLast', { n: Math.round(Math.abs(diff)) })}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 whitespace-nowrap">
              <p className="text-xs text-ink-muted">{t('recap.weekTotal')}</p>
              <p className="font-display font-semibold text-ink">≈ {num(recap.total.kcal)} kcal</p>
            </div>
          </div>

          <p className="text-xs text-ink-muted mt-3 h-4" aria-live="polite">
            {active
              ? `${active.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric' })} : ${
                  active.meals > 0 ? `≈ ${num(active.kcal)} kcal · ${t(active.meals > 1 ? 'recap.mealsCount' : 'recap.mealCount', { n: active.meals })}` : t('recap.nothingPlanned')
                }`
              : t('recap.tapDay')}
          </p>

          <div className="relative mt-2" style={{ height: CHART_HEIGHT }} onMouseLeave={() => setActiveDay(null)}>
            {/* Baseline + average reference line */}
            <div className="absolute inset-x-0 bottom-0 border-t border-border" />
            {avgTop !== null && (
              <div className="absolute inset-x-0 border-t border-dashed border-ink-muted/40 pointer-events-none" style={{ top: avgTop }}>
                <span className="absolute right-0 -top-4 text-[10px] text-ink-muted bg-surface-200 px-1">{t('recap.avgShort')}</span>
              </div>
            )}
            <div className="absolute inset-0 grid grid-cols-7">
              {recap.days.map((day, i) => {
                const height = (day.kcal / maxKcal) * CHART_HEIGHT
                const isActive = activeDay === i
                return (
                  <button
                    key={i}
                    onClick={() => setActiveDay(isActive ? null : i)}
                    onMouseEnter={() => setActiveDay(i)}
                    aria-label={`${day.date.toLocaleDateString(locale, { weekday: 'long' })} : ${day.meals > 0 ? `${num(day.kcal)} kcal` : t('recap.nothingPlanned')}`}
                    className="h-full flex items-end justify-center"
                  >
                    {day.kcal > 0 && (
                      <span
                        className={`w-3/5 rounded-t-[4px] transition-opacity ${isActive || activeDay === null ? 'bg-primary' : 'bg-primary opacity-40'}`}
                        style={{ height: Math.max(3, height) }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-7 mt-1">
            {recap.days.map((day, i) => (
              <span key={i} className={`text-center text-[10px] uppercase font-semibold ${activeDay === i ? 'text-ink' : 'text-ink-muted'}`}>
                {day.date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2)}
              </span>
            ))}
          </div>
        </section>

        {/* Top dish and top ingredient */}
        <div className="grid grid-cols-2 gap-3">
          <section className="bg-tint-sand rounded-md p-3">
            <p className="text-xs text-ink-muted flex items-center gap-1">
              <Trophy size={14} className="text-accent" /> {t('recap.topDish')}
            </p>
            {recap.topRecipe && recap.topRecipe.count > 1 ? (
              <>
                <Link to={`/recipes/${recap.topRecipe.recipe.id}`} className="block font-display font-semibold text-ink mt-1 leading-snug">
                  {recap.topRecipe.recipe.title}
                </Link>
                <p className="text-xs text-ink-muted mt-0.5">{t('recap.times', { n: recap.topRecipe.count })}</p>
              </>
            ) : (
              <p className="text-sm text-ink mt-1 leading-snug">{t('recap.allDifferent')}</p>
            )}
          </section>
          <section className="bg-tint-sage rounded-md p-3">
            <p className="text-xs text-ink-muted flex items-center gap-1">
              <Carrot size={14} className="text-primary" /> {t('recap.topIngredient')}
            </p>
            {recap.topIngredient ? (
              <>
                <p className="font-display font-semibold text-ink mt-1 leading-snug">{recap.topIngredient.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {t(recap.topIngredient.meals > 1 ? 'recap.inMeals' : 'recap.inMeal', { n: recap.topIngredient.meals })}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted mt-1">—</p>
            )}
          </section>
        </div>

        {/* Macronutrients */}
        <section className="bg-surface-200 border border-border rounded-md p-4">
          <h2 className="font-display font-semibold text-ink">{t('recap.macros')}</h2>
          <p className="text-xs text-ink-muted mt-0.5">{t('recap.macrosHint')}</p>
          <div className="mt-3 space-y-3">
            {macros.map((m) => (
              <div key={m.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="inline-block text-ink first-letter:uppercase">{m.label}</span>
                  <span className="text-ink">
                    <span className="font-display font-semibold">≈ {perDay(m.grams)} g</span>
                    <span className="text-ink-muted"> {t('recap.perDay')} · {Math.round(m.share * 100)} %</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-100 mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${m.share * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Other figures */}
        <section className="bg-surface-200 border border-border rounded-md divide-y divide-border">
          {[
            { icon: UtensilsCrossed, label: t('recap.plannedMeals'), value: `${recap.meals}`, hint: t('recap.onDays', { n: recap.activeDays }) },
            { icon: Salad, label: t('recap.variety'), value: `${recap.distinctRecipes}`, hint: t('recap.varietyHint', { n: recap.distinctIngredients }) },
            { icon: Wallet, label: t('recap.budget'), value: formatEstimate(recap.cost) || '—', hint: t('recap.budgetHint') },
          ].map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <Icon size={18} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">{label}</p>
                <p className="text-[11px] text-ink-muted">{hint}</p>
              </div>
              <p className="font-display font-semibold text-ink">{value}</p>
            </div>
          ))}
        </section>

        <p className="text-[11px] text-ink-muted text-center">{t('recap.basisShort')}</p>
      </>
    )
  }
}
