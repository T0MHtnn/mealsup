import { useEffect, useState } from 'react'
import { Sun, UtensilsCrossed, Cookie, Moon } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/store/authStore'
import { mealPlanService } from '@/services/supabaseClient'
import { getWeekDates, toISODate, isSameDay } from '@/utils/date'
import type { TranslationKey } from '@/i18n/translations'
import Modal from '@/components/common/Modal'

const MEAL_TYPES: { key: 'breakfast' | 'lunch' | 'snack' | 'dinner'; icon: typeof Sun }[] = [
  { key: 'breakfast', icon: Sun },
  { key: 'lunch', icon: UtensilsCrossed },
  { key: 'snack', icon: Cookie },
  { key: 'dinner', icon: Moon },
]

interface DaySlotPickerModalProps {
  onClose: () => void
  onConfirm: (date: string, mealType: string) => void
}

export default function DaySlotPickerModal({ onClose, onConfirm }: DaySlotPickerModalProps) {
  const { t, language } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const today = new Date()
  const weekDates = getWeekDates(today)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [weekPlan, setWeekPlan] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return
    mealPlanService
      .getWeekPlan(userId, toISODate(weekDates[0]), toISODate(weekDates[6]))
      .then(setWeekPlan)
      .catch((err) => console.error('Week plan load error:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const existingFor = (mealType: string) => {
    const iso = toISODate(selectedDate)
    return weekPlan.find((e) => e.meal_date === iso && e.meal_type === mealType)
  }

  return (
    <Modal title={t('dashboard.addToPlan')} onClose={onClose}>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDates.map((d) => {
          const isSelected = isSameDay(d, selectedDate)
          return (
            <button
              key={toISODate(d)}
              onClick={() => setSelectedDate(d)}
              className={`flex flex-col items-center gap-1 py-2 rounded-sm ${
                isSelected ? 'bg-primary text-white' : 'text-ink hover:bg-surface-100'
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

      <p className="text-xs font-display font-semibold text-ink-muted mb-2">{t('dashboard.mealType')}</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {MEAL_TYPES.map(({ key, icon: Icon }) => {
          const existing = existingFor(key)
          return (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-sm border text-sm ${
                selectedType === key ? 'bg-tint-sage border-primary text-ink' : 'border-border text-ink-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} className={selectedType === key ? 'text-primary' : ''} />
                {t(`dashboard.mealType.${key}` as TranslationKey)}
              </span>
              {existing && (
                <span className="text-[11px] text-accent font-medium truncate w-full text-left">
                  {existing.recipes?.title}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => selectedType && onConfirm(toISODate(selectedDate), selectedType)}
        disabled={!selectedType}
        className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold disabled:opacity-40"
      >
        {t('dashboard.confirm')}
      </button>
    </Modal>
  )
}
