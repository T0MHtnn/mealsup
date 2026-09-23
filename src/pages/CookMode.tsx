import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, ListChecks, Play, Pause, Timer, Check, BellRing } from 'lucide-react'
import { recipeService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { detectTimers, formatClock } from '@/utils/timers'
import { formatAmount } from '@/utils/quantity'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface RunningTimer {
  id: number
  label: string
  /** When running: timestamp (ms) at which it ends. */
  endsAt: number | null
  /** When paused: seconds left. */
  remaining: number
  done: boolean
}

/** Short beep with the Web Audio API (no sound file needed). */
function beep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    ;[0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.value = 0.2
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.2)
    })
  } catch {
    // no audio available: vibration + visual alert only
  }
}

/** Keeps the screen on while cooking (when the browser supports it). */
function useWakeLock() {
  useEffect(() => {
    let lock: any = null
    const request = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request('screen')
      } catch {
        lock = null
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && request()
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release?.().catch(() => undefined)
    }
  }, [])
}

export default function CookModePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  useWakeLock()

  const [recipe, setRecipe] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [timers, setTimers] = useState<RunningTimer[]>([])
  const [, setTick] = useState(0)
  const nextTimerId = useRef(1)

  useEffect(() => {
    if (!id) return
    recipeService
      .getRecipeById(id)
      .then(setRecipe)
      .catch((err) => console.error('Cook mode load error:', err))
      .finally(() => setIsLoading(false))
  }, [id])

  // Timer loop: re-render twice a second and ring the ones that just ended
  useEffect(() => {
    if (!timers.some((tm) => tm.endsAt && !tm.done)) return
    const interval = window.setInterval(() => {
      const now = Date.now()
      let rang = false
      setTimers((prev) =>
        prev.map((tm) => {
          if (tm.endsAt && !tm.done && tm.endsAt <= now) {
            rang = true
            return { ...tm, done: true, endsAt: null, remaining: 0 }
          }
          return tm
        })
      )
      if (rang) {
        beep()
        navigator.vibrate?.([300, 150, 300, 150, 300])
      }
      setTick((n) => n + 1)
    }, 500)
    return () => window.clearInterval(interval)
  }, [timers])

  if (isLoading) return <LoadingSpinner />
  if (!recipe) return <p className="text-center text-ink-muted text-sm py-8">{t('recipes.notFound')}</p>

  const steps: string[] = Array.isArray(recipe.instructions) ? recipe.instructions : []
  const baseServings = recipe.servings || 1
  const servings = Math.max(1, Number(searchParams.get('servings')) || baseServings)
  const scale = servings / baseServings
  const current = steps[step] ?? ''
  const isLast = step >= steps.length - 1

  const startTimer = (label: string, seconds: number) => {
    setTimers((prev) => [
      ...prev,
      { id: nextTimerId.current++, label: `${t('cook.step')} ${step + 1} · ${label}`, endsAt: Date.now() + seconds * 1000, remaining: seconds, done: false },
    ])
  }

  const toggleTimer = (timerId: number) => {
    setTimers((prev) =>
      prev.map((tm) => {
        if (tm.id !== timerId || tm.done) return tm
        return tm.endsAt
          ? { ...tm, endsAt: null, remaining: (tm.endsAt - Date.now()) / 1000 }
          : { ...tm, endsAt: Date.now() + tm.remaining * 1000 }
      })
    )
  }

  const removeTimer = (timerId: number) => setTimers((prev) => prev.filter((tm) => tm.id !== timerId))

  const secondsLeft = (tm: RunningTimer) => (tm.endsAt ? (tm.endsAt - Date.now()) / 1000 : tm.remaining)

  return (
    <div className="min-h-[100dvh] bg-surface-100 flex flex-col">
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-border bg-surface-200">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('cook.exit')}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink shrink-0"
        >
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-muted">
            {t('cook.step')} {step + 1} / {steps.length}
          </p>
          <h1 className="font-display font-semibold text-ink truncate">{recipe.title}</h1>
        </div>
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          aria-pressed={showIngredients}
          className={`h-9 px-3 rounded-full border text-sm font-medium flex items-center gap-1.5 shrink-0 ${
            showIngredients ? 'bg-primary text-white border-primary' : 'border-border text-ink'
          }`}
        >
          <ListChecks size={16} />
          {t('recipes.ingredients')}
        </button>
      </header>

      <div className="h-1 bg-border">
        <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / Math.max(1, steps.length)) * 100}%` }} />
      </div>

      <main className="flex-1 overflow-auto px-5 py-6 space-y-5">
        {showIngredients && (
          <div className="bg-surface-200 border border-border rounded-md divide-y divide-border">
            <p className="px-3 py-2 text-xs font-semibold text-ink-muted">
              {t('prices.forPeople', { n: servings })}
            </p>
            {(recipe.recipe_ingredients || []).map((ing: any) => (
              <div key={ing.id} className="flex items-center justify-between px-3 py-2 text-base">
                <span className="text-ink">{ing.ingredient_name}</span>
                <span className="text-primary font-semibold shrink-0 ml-3">
                  {formatAmount(ing.quantity != null ? ing.quantity * scale : null, ing.unit)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xl leading-relaxed text-ink">{current}</p>

        {detectTimers(current).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detectTimers(current).map((dt) => (
              <button
                key={dt.seconds}
                onClick={() => startTimer(dt.label, dt.seconds)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tint-sand text-ink font-display font-semibold"
              >
                <Timer size={18} className="text-accent" />
                {dt.label}
              </button>
            ))}
          </div>
        )}
      </main>

      {timers.length > 0 && (
        <div className="px-4 pb-2 space-y-1.5">
          {timers.map((tm) => (
            <div
              key={tm.id}
              className={`flex items-center gap-3 rounded-md px-3 py-2 border ${
                tm.done ? 'bg-danger text-white border-danger animate-pulse' : 'bg-surface-200 border-border text-ink'
              }`}
            >
              {tm.done ? <BellRing size={18} /> : <Timer size={18} className="text-accent" />}
              <span className="flex-1 text-sm truncate">{tm.label}</span>
              <span className="font-display font-bold tabular-nums">{tm.done ? t('cook.timerDone') : formatClock(secondsLeft(tm))}</span>
              {!tm.done && (
                <button onClick={() => toggleTimer(tm.id)} aria-label={tm.endsAt ? t('cook.pause') : t('cook.resume')} className="p-1">
                  {tm.endsAt ? <Pause size={18} /> : <Play size={18} />}
                </button>
              )}
              <button onClick={() => removeTimer(tm.id)} aria-label={t('cook.removeTimer')} className="p-1">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <footer className="grid grid-cols-2 gap-3 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] bg-surface-100">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="py-4 rounded-full border border-border text-ink font-display font-semibold flex items-center justify-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
          {t('cook.previous')}
        </button>
        {isLast ? (
          <button
            onClick={() => navigate(-1)}
            className="py-4 rounded-full bg-primary text-white font-display font-semibold flex items-center justify-center gap-1"
          >
            <Check size={20} />
            {t('cook.finish')}
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="py-4 rounded-full bg-primary text-white font-display font-semibold flex items-center justify-center gap-1"
          >
            {t('cook.next')}
            <ChevronRight size={20} />
          </button>
        )}
      </footer>
    </div>
  )
}
