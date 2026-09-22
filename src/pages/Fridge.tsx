import { useEffect, useMemo, useState } from 'react'
import { Plus, X, AlertTriangle, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFridgeStore } from '@/store/fridgeStore'
import { fridgeService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { normalizeText } from '@/utils/text'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import FoodWarningBadge from '@/components/common/FoodWarningBadge'

export default function FridgePage() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { items, setItems, addItem, removeItem } = useFridgeStore()
  const { foodFlag } = useFoodWarnings()
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!userId) return
    fridgeService
      .getFridgeItems(userId)
      .then(setItems)
      .catch((err) => console.error('Fridge load error:', err))
      .finally(() => setIsLoading(false))
  }, [userId, setItems])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !foodName.trim()) return

    const newItem = await fridgeService.addItem(userId, {
      food_name: foodName.trim(),
      category: 'Autre',
      quantity: quantity || null,
      unit: null,
      added_date: new Date().toISOString(),
      expiry_date: expiryDate || null,
      is_available: true,
    })
    addItem(newItem)
    setFoodName('')
    setQuantity('')
    setExpiryDate('')
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    removeItem(id)
    await fridgeService.deleteItem(id).catch((err) => console.error('Delete error:', err))
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
        <form
          onSubmit={handleAdd}
          className="bg-surface-200 border border-border rounded-md p-4 space-y-3"
        >
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder={t('fridge.name')}
            required
            className="w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('fridge.quantity')}
              className="px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink"
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong">
            {t('fridge.submit')}
          </button>
        </form>
      )}

      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('fridge.search')}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-full bg-surface-200 text-ink focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

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
                  {item.quantity && <p className="text-xs text-ink-muted">{item.quantity}</p>}
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
                  aria-label="Delete"
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
