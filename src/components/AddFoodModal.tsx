import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { GROCERY_CATEGORIES, GROCERY_CATALOG, type GroceryCategory } from '@/constants/groceryCatalog'
import { classifyGroceryItem, simplify } from '@/utils/groceryCategory'
import { formatEuros } from '@/utils/prices'
import Modal from '@/components/common/Modal'
import type { UserFood } from '@/services/supabaseClient'

// Same product whatever the accents, case or plural: "Tomates" = "tomate"
const productKey = (name: string) =>
  simplify(name)
    .split(' ')
    .map((w) => (w.length > 3 && /[sx]$/.test(w) ? w.slice(0, -1) : w))
    .join(' ')

const CATALOG_KEYS = new Map<string, GroceryCategory>()
for (const category of GROCERY_CATEGORIES) {
  for (const item of GROCERY_CATALOG[category]) CATALOG_KEYS.set(productKey(item), category)
}

/** "2,50", "2.5", "2,50 €" -> 2.5 ; "" -> null ; anything else -> NaN */
function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[€\s]/g, '').replace(',', '.')
  if (!cleaned) return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN
  const value = Number(cleaned)
  return value > 0 && value < 10000 ? value : NaN
}

interface AddFoodModalProps {
  existing: UserFood[]
  /** The item being edited (otherwise a new one is added). */
  initial?: UserFood
  onSave: (food: Omit<UserFood, 'id'>) => Promise<void>
  onClose: () => void
}

/** Adds (or edits) a product missing from the catalog in the member's own foods, with an optional price. */
export default function AddFoodModal({ existing, initial, onSave, onClose }: AddFoodModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [priceText, setPriceText] = useState(initial?.price ? String(initial.price).replace('.', ',') : '')
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const trimmed = name.trim().replace(/\s+/g, ' ')
  const price = parsePrice(priceText)

  const review = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!trimmed) return
    const key = productKey(trimmed)
    const inCatalog = CATALOG_KEYS.get(key)
    if (inCatalog) return setError(t('shopping.customExists', { category: inCatalog }))
    if (existing.some((f) => f.id !== initial?.id && productKey(f.name) === key)) return setError(t('shopping.customAlreadyAdded'))
    if (Number.isNaN(price)) return setError(t('shopping.customInvalidPrice'))
    setStep('confirm')
  }

  const confirm = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await onSave({ name: trimmed, category: classifyGroceryItem(trimmed), price })
    } catch (err) {
      console.error('Add custom food error:', err)
      setError(t('shopping.customError'))
      setIsSaving(false)
    }
  }

  return (
    <Modal title={initial ? t('shopping.editCustom') : t('shopping.addCustom')} onClose={onClose}>
      {step === 'form' ? (
        <form onSubmit={review} className="space-y-3">
          <div className="flex gap-2">
            <label className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-ink-muted mb-1">{t('shopping.customName')}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoFocus
                className="w-full px-3 py-2 border border-border rounded-sm bg-surface-100 text-ink text-sm"
              />
            </label>
            <label className="w-24 shrink-0">
              <span className="block text-xs font-semibold text-ink-muted mb-1">{t('shopping.customPrice')}</span>
              <span className="relative block">
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="—"
                  className="w-full pl-3 pr-6 py-2 border border-border rounded-sm bg-surface-100 text-ink text-sm"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted pointer-events-none">€</span>
              </span>
            </label>
          </div>
          <p className="text-xs text-ink-muted">{t('shopping.customPriceHint')}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={!trimmed}
            className="w-full py-2.5 bg-accent text-white rounded-full font-display font-semibold disabled:opacity-40"
          >
            {t('shopping.customNext')}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink">{initial ? t('shopping.customConfirmEditTitle') : t('shopping.customConfirmTitle')}</p>
          <div className="bg-surface-100 border border-border rounded-md p-3 space-y-1">
            <p className="text-lg font-display font-semibold text-ink break-words">« {trimmed} »</p>
            <p className="text-sm text-ink-muted">
              {price ? t('shopping.customConfirmPrice', { price: formatEuros(price) }) : t('shopping.customConfirmNoPrice')}
            </p>
          </div>
          {!initial && <p className="text-xs text-ink-muted">{t('shopping.customConfirmHint')}</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('form')}
              disabled={isSaving}
              className="flex-1 py-2.5 border border-border text-ink rounded-full font-display font-semibold"
            >
              {t('shopping.customEdit')}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-accent text-white rounded-full font-display font-semibold disabled:opacity-40"
            >
              {initial ? t('shopping.customSave') : t('shopping.customConfirm')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
