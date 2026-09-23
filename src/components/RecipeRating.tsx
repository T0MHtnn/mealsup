import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ratingService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'

/** "Ton avis" on a recipe: 1–5 stars + a private note, saved automatically. */
export default function RecipeRating({ recipeId }: { recipeId: string }) {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (!userId) return
    ratingService
      .getMine(userId)
      .then((all) => {
        const mine = all.find((r) => r.recipe_id === recipeId)
        setRating(mine?.rating ?? null)
        setNote(mine?.note ?? '')
        setSavedNote(mine?.note ?? '')
      })
      .catch((err) => console.error('Rating load error:', err))
  }, [userId, recipeId])

  const save = async (nextRating: number | null, nextNote: string) => {
    if (!userId) return
    setStatus('saving')
    try {
      await ratingService.save(userId, recipeId, nextRating, nextNote.trim() || null)
      setSavedNote(nextNote)
      setStatus('saved')
    } catch (err) {
      console.error('Rating save error:', err)
      setStatus('error')
    }
  }

  const selectRating = (value: number) => {
    // Tapping the current rating again removes it
    const next = rating === value ? null : value
    setRating(next)
    save(next, note)
  }

  return (
    <section className="bg-surface-200 border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-ink text-sm">{t('rating.title')}</h2>
        {status === 'saved' && <span className="text-[11px] text-primary">{t('rating.saved')}</span>}
        {status === 'error' && <span className="text-[11px] text-danger">{t('rating.error')}</span>}
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label={t('rating.title')}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={t('rating.stars', { n: value })}
            onClick={() => selectRating(value)}
            className="p-0.5 text-accent"
          >
            <Star size={26} fill={rating !== null && value <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          if (status !== 'saving') setStatus('idle')
        }}
        onBlur={() => note !== savedNote && save(rating, note)}
        placeholder={t('rating.notePlaceholder')}
        rows={2}
        maxLength={2000}
        className="w-full px-3 py-2 border border-border rounded-sm bg-surface-100 text-ink text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <p className="text-[11px] text-ink-muted">{t('rating.private')}</p>
    </section>
  )
}
