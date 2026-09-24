import { useEffect, useMemo, useState } from 'react'
import { Plus, X, AlertTriangle, ChefHat, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useFridgeStore, type FridgeItem } from '@/store/fridgeStore'
import { fridgeService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { normalizeText } from '@/utils/text'
import { classifyGroceryItem } from '@/utils/groceryCategory'
import { ingredientKey } from '@/utils/ingredients'
import { suggestedExpiry } from '@/utils/shelfLife'
import { formatFridgeQuantity } from '@/utils/quantity'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SearchInput from '@/components/common/SearchInput'
import FoodWarningBadge from '@/components/common/FoodWarningBadge'
import FoodAutocomplete, { canonicalFoodName } from '@/components/common/FoodAutocomplete'

// Units offered for a fridge quantity ('' = number of items)
const FRIDGE_UNITS = ['', 'g', 'kg', 'ml', 'cl', 'L']

/** Day of an expiry date ("" when none), to compare lots. */
const expiryDay = (date: string | null | undefined) => (date ? String(date).slice(0, 10) : '')

/** Most recently added item first (the one kept when merging duplicates). */
const byMostRecent = (a: FridgeItem, b: FridgeItem) => (b.added_date || '').localeCompare(a.added_date || '')

export default function FridgePage() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { items, setItems, addItem, removeItem, updateItem } = useFridgeStore()
  const { foodFlag } = useFoodWarnings()
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [expirySuggested, setExpirySuggested] = useState(false)
  const [search, setSearch] = useState('')
  const [isMerging, setIsMerging] = useState(false)

  useEffect(() => {
    if (!userId) return
    fridgeService
      .getFridgeItems(userId)
      .then(setItems)
      .catch((err) => console.error('Fridge load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId, setItems])

  const existingKeys = useMemo(() => new Set(items.map((i) => ingredientKey(i.food_name))), [items])

  // Same product already in the fridge (even written differently: "riz" / "Riz")
  const sameProduct = useMemo(() => {
    const name = foodName.trim()
    if (!name) return []
    const key = ingredientKey(name)
    return items.filter((i) => ingredientKey(i.food_name) === key).sort(byMostRecent)
  }, [foodName, items])

  // A duplicate is the same product with the same expiry date (or both without date).
  // With another date it is another lot (today's steaks vs the ones expiring tomorrow): kept apart.
  const duplicate = useMemo(
    () => sameProduct.find((i) => expiryDay(i.expiry_date) === expiryDay(expiryDate)) ?? null,
    [sameProduct, expiryDate]
  )
  const otherLots = duplicate ? [] : sameProduct

  // Groups of existing duplicates (same product, same expiry date), to merge them
  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, FridgeItem[]>()
    for (const item of items) {
      const key = `${ingredientKey(item.food_name)}|${expiryDay(item.expiry_date)}`
      groups.set(key, [...(groups.get(key) ?? []), item])
    }
    return [...groups.values()].filter((g) => g.length > 1)
  }, [items])

  const resetForm = () => {
    setFoodName('')
    setQuantity('')
    setUnit('')
    setExpiryDate('')
    setExpirySuggested(false)
    setShowForm(false)
  }

  const selectFood = (name: string) => {
    setFoodName(name)
    // Suggest an expiry date for this product, unless one was already chosen
    if (!expiryDate || expirySuggested) {
      const suggestion = suggestedExpiry(name)
      setExpiryDate(suggestion ?? '')
      setExpirySuggested(Boolean(suggestion))
    }
  }

  const addNew = async () => {
    if (!userId || !foodName.trim()) return
    const name = canonicalFoodName(foodName)
    const newItem = await fridgeService.addItem(userId, {
      food_name: name,
      category: classifyGroceryItem(name),
      quantity: quantity || null,
      unit: quantity ? unit || null : null,
      added_date: new Date().toISOString(),
      expiry_date: expiryDate || null,
      is_available: true,
    })
    addItem(newItem)
    resetForm()
  }

  /** Refresh the existing line instead of creating a duplicate. */
  const updateExisting = async () => {
    if (!duplicate) return
    const updates: Partial<FridgeItem> = { added_date: new Date().toISOString() }
    if (quantity) {
      updates.quantity = quantity
      updates.unit = unit || null
    }
    if (expiryDate) updates.expiry_date = expiryDate
    updateItem(duplicate.id, updates)
    await fridgeService.updateItem(duplicate.id, updates).catch((err) => console.error('Update error:', err))
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (duplicate) updateExisting()
    else addNew()
  }

  const handleDelete = async (id: string) => {
    removeItem(id)
    await fridgeService.deleteItem(id).catch((err) => console.error('Delete error:', err))
  }

  /** Keep the most recent line of each duplicated product, delete the others. */
  const mergeDuplicates = async () => {
    setIsMerging(true)
    try {
      for (const group of duplicateGroups) {
        const [keep, ...others] = [...group].sort(byMostRecent)
        // Keep a quantity / expiry date if the kept line has none
        const updates: Partial<FridgeItem> = {}
        if (!keep.quantity) updates.quantity = others.find((o) => o.quantity)?.quantity ?? null
        if (!keep.expiry_date) updates.expiry_date = others.find((o) => o.expiry_date)?.expiry_date ?? null
        if (Object.values(updates).some((v) => v)) {
          updateItem(keep.id, updates)
          await fridgeService.updateItem(keep.id, updates)
        }
        for (const other of others) {
          removeItem(other.id)
          await fridgeService.deleteItem(other.id)
        }
      }
    } catch (err) {
      console.error('Merge duplicates error:', err)
    } finally {
      setIsMerging(false)
    }
  }

  const daysUntilExpiry = (expiry: string | null) => {
    if (!expiry) return null
    const diff = new Date(expiry).getTime() - new Date().setHours(0, 0, 0, 0)
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const filteredItems = useMemo(() => {
    const query = normalizeText(search.trim())
    if (!query) return items
    return items.filter((i) => normalizeText(i.food_name).includes(query))
  }, [items, search])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong"
      >
        <Plus size={18} />
        {t('fridge.add')}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-200 border border-border rounded-md p-4 space-y-3">
          <FoodAutocomplete
            value={foodName}
            onChange={(value) => setFoodName(value)}
            onSelect={selectFood}
            placeholder={t('fridge.name')}
            existingKeys={existingKeys}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={quantity}
                // Only digits and one decimal separator are kept
                onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                placeholder={t('fridge.quantity')}
                aria-label={t('fridge.quantity')}
                className="w-full min-w-0 px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                aria-label={t('fridge.unit')}
                className="shrink-0 px-2 py-2 border border-border rounded-sm bg-surface-200 text-ink"
              >
                {FRIDGE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u || t('fridge.unitItems')}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value)
                  setExpirySuggested(false)
                }}
                aria-label={t('fridge.expiryPlaceholder')}
                className={`w-full px-3 py-2 border border-border rounded-sm bg-surface-200 ${
                  expiryDate ? 'text-ink' : 'text-transparent'
                }`}
              />
              {!expiryDate && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                  {t('fridge.expiryPlaceholder')}
                </span>
              )}
            </div>
          </div>
          {expirySuggested && expiryDate && <p className="text-xs text-ink-muted">{t('fridge.expirySuggested')}</p>}

          {duplicate ? (
            <div className="space-y-2">
              <p className="text-sm text-ink bg-tint-sand rounded-sm px-3 py-2">
                {t('fridge.duplicateHint', { name: duplicate.food_name })}
              </p>
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong"
              >
                {t('fridge.updateExisting', { name: duplicate.food_name })}
              </button>
              <button type="button" onClick={addNew} className="w-full py-2 text-sm text-ink-muted underline">
                {t('fridge.addAnyway')}
              </button>
            </div>
          ) : (
            <>
              {otherLots.length > 0 && (
                <p className="text-xs text-ink-muted bg-tint-sage rounded-sm px-3 py-2">
                  {t('fridge.otherLot', { name: otherLots[0].food_name, n: otherLots.length })}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong"
              >
                {t('fridge.submit')}
              </button>
            </>
          )}
        </form>
      )}

      {duplicateGroups.length > 0 && (
        <div className="bg-tint-sand border border-border rounded-md p-3 space-y-2">
          <p className="text-sm text-ink flex items-start gap-2">
            <Copy size={16} className="text-accent shrink-0 mt-0.5" />
            {t('fridge.duplicatesFound', {
              list: duplicateGroups.map((g) => `${g[0].food_name} (${g.length})`).join(', '),
            })}
          </p>
          <p className="text-xs text-ink-muted">{t('fridge.mergeHint')}</p>
          <button
            onClick={mergeDuplicates}
            disabled={isMerging}
            className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-display font-semibold disabled:opacity-50"
          >
            {t('fridge.mergeDuplicates')}
          </button>
        </div>
      )}

      {items.length > 0 && (
        <Link
          to="/recipes?fridge=1"
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary text-primary rounded-full font-display font-semibold hover:bg-tint-sage"
        >
          <ChefHat size={18} />
          {t('fridgeMatch.whatToCook')}
        </Link>
      )}

      {items.length > 0 && <SearchInput value={search} onChange={setSearch} placeholder={t('fridge.search')} />}

      {items.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('fridge.empty')}</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('fridge.noResults')}</p>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const days = daysUntilExpiry(item.expiry_date)
            const isExpiringSoon = days !== null && days <= 3
            return (
              <div
                key={item.id}
                className="bg-surface-200 border border-border rounded-md p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{item.food_name}</p>
                  <FoodWarningBadge flag={foodFlag(item.food_name)} withLabel />
                  {formatFridgeQuantity(item.quantity, item.unit) && (
                    <p className="text-xs text-ink-muted">{formatFridgeQuantity(item.quantity, item.unit)}</p>
                  )}
                  {days !== null && (
                    <p
                      className={`text-xs mt-0.5 flex items-center gap-1 ${
                        isExpiringSoon ? 'text-danger font-medium' : 'text-ink-muted'
                      }`}
                    >
                      {isExpiringSoon && <AlertTriangle size={12} />}
                      {days < 0
                        ? t('fridge.expired')
                        : days === 0
                        ? t('fridge.expiresToday')
                        : t('fridge.expiresIn', { days })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  aria-label={t('common.delete')}
                  className="p-1.5 text-ink-muted hover:text-danger"
                >
                  <X size={18} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
