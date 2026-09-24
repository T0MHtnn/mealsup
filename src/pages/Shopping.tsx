import { useEffect, useMemo, useState } from 'react'
import { Plus, Minus, Trash2, Check, ChevronDown, History, Refrigerator, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { shoppingService, fridgeService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useFoodWarnings } from '@/hooks/useFoodWarnings'
import { GROCERY_CATEGORIES, GROCERY_CATALOG, type GroceryCategory } from '@/constants/groceryCatalog'
import { normalizeText } from '@/utils/text'
import { classifyGroceryItem, itemCategory } from '@/utils/groceryCategory'
import { formatAmount } from '@/utils/quantity'
import { formatEstimate, formatEuros } from '@/utils/prices'
import { usePrices } from '@/hooks/usePrices'
import { ingredientKey } from '@/utils/ingredients'
import { isFridgeFood, suggestedExpiry } from '@/utils/shelfLife'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import FoodWarningBadge from '@/components/common/FoodWarningBadge'
import InfoButton from '@/components/common/InfoButton'

/** Quantity you can type directly instead of tapping "+" many times; saved on blur / Enter. */
function QuantityInput({ value, onCommit }: { value: number; onCommit: (quantity: number) => void }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const parsed = parseFloat(draft.replace(',', '.'))
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    if (next !== value) onCommit(next)
    else setDraft(String(value))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      aria-label={t('common.quantity')}
      className="w-12 text-center text-sm font-display font-semibold text-ink bg-transparent border border-border rounded-sm py-0.5"
    />
  )
}

// Offline support: the last loaded list is kept on the device, and items ticked
// without network are queued and sent when the connection comes back.
type PendingOp = { id: string; is_purchased: boolean }
const cacheKey = (userId: string) => `mealsup.shopping.${userId}`
const queueKey = (userId: string) => `mealsup.shopping.queue.${userId}`

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable: offline mode simply won't have the latest data
  }
}

export default function ShoppingPage() {
  const { t, language } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const { foodFlag } = useFoodWarnings()
  const { itemCost, packLabel } = usePrices()
  const [list, setList] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ingredients' | 'list'>('ingredients')
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory>(GROCERY_CATEGORIES[0])
  const [customItemName, setCustomItemName] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  const [fridgeKeys, setFridgeKeys] = useState<Set<string>>(new Set())
  const [fridgeMessage, setFridgeMessage] = useState<string | null>(null)

  const loadList = async (uid: string) => {
    const activeList = await shoppingService.getOrCreateActiveList(uid)
    const listItems = await shoppingService.getListItems(activeList.id)
    setList(activeList)
    setItems(listItems)
    setIsOffline(false)
  }

  useEffect(() => {
    if (!userId) return
    loadList(userId)
      .catch((err) => {
        // No network: show the list saved on this device
        console.warn('Shopping load failed, using the offline copy:', err)
        const cached = readJson<{ list: any; items: any[] } | null>(cacheKey(userId), null)
        if (cached) {
          setList(cached.list)
          setItems(cached.items)
        }
        setIsOffline(true)
      })
      .finally(() => setIsLoading(false))
    fridgeService
      .getFridgeItems(userId)
      .then((fridge) => setFridgeKeys(new Set(fridge.map((f: any) => ingredientKey(f.food_name)))))
      .catch(() => undefined)
  }, [userId])

  // Keep an offline copy of the list up to date
  useEffect(() => {
    if (userId && list) writeJson(cacheKey(userId), { list, items })
  }, [userId, list, items])

  // Back online: send the ticks made offline, then reload
  useEffect(() => {
    if (!userId) return
    const flush = async () => {
      const queue = readJson<PendingOp[]>(queueKey(userId), [])
      try {
        for (const op of queue) await shoppingService.toggleItemChecked(op.id, op.is_purchased)
        writeJson(queueKey(userId), [])
        await loadList(userId)
      } catch (err) {
        console.warn('Offline sync failed, will retry:', err)
      }
    }
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', flush)
    window.addEventListener('offline', goOffline)
    if (navigator.onLine && readJson<PendingOp[]>(queueKey(userId), []).length > 0) flush()
    return () => {
      window.removeEventListener('online', flush)
      window.removeEventListener('offline', goOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const openHistory = () => {
    if (!userId) return
    setShowHistory(true)
    shoppingService.getShoppingHistory(userId, 20).then(setHistory).catch((err) => console.error('History error:', err))
  }

  const itemByName = useMemo(() => {
    const map = new Map<string, any>()
    for (const item of items) map.set(normalizeText(item.food_name), item)
    return map
  }, [items])

  const setQuantity = async (name: string, quantity: number, category: string | null = selectedCategory) => {
    if (!list) return
    const existing = itemByName.get(normalizeText(name))

    if (quantity <= 0) {
      if (existing) {
        setItems(items.filter((i) => i.id !== existing.id))
        await shoppingService.removeItem(existing.id).catch((err) => console.error('Remove error:', err))
      }
      return
    }

    if (existing) {
      setItems(items.map((i) => (i.id === existing.id ? { ...i, quantity } : i)))
      await shoppingService
        .updateItemQuantity(existing.id, quantity)
        .catch((err) => console.error('Update quantity error:', err))
    } else {
      const newItem = await shoppingService.addItemToList(list.id, {
        food_name: name,
        category,
        quantity,
      })
      setItems([...items, newItem])
    }
  }

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = customItemName.trim()
    if (!name) return
    await setQuantity(name, 1, classifyGroceryItem(name))
    setCustomItemName('')
  }

  const toggleChecked = async (item: any) => {
    const next = !item.is_purchased
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_purchased: next } : i)))
    const enqueue = () => {
      if (!userId) return
      const queue = readJson<PendingOp[]>(queueKey(userId), []).filter((op) => op.id !== item.id)
      writeJson(queueKey(userId), [...queue, { id: item.id, is_purchased: next }])
      setIsOffline(true)
    }
    if (!navigator.onLine) return enqueue()
    await shoppingService.toggleItemChecked(item.id, next).catch((err) => {
      console.warn('Toggle failed, queued for later:', err)
      enqueue()
    })
  }

  const handleRemove = async (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId))
    await shoppingService.removeItem(itemId).catch((err) => console.error('Remove error:', err))
  }

  const handleCompleteShopping = async () => {
    if (!userId || !list || items.length === 0) return
    await shoppingService.completeList(userId, list.id, items)

    // What was bought goes to the fridge (ticked items, or everything if nothing was ticked),
    // with a suggested expiry date. Existing fridge items are kept as they are.
    const bought = items.some((i) => i.is_purchased) ? items.filter((i) => i.is_purchased) : items
    const today = new Date()
    const toFridge = bought
      .filter((i) => isFridgeFood(i.food_name))
      .map((i) => ({
        food_name: i.food_name,
        category: itemCategory(i),
        // number + unit ("500" + "g"); "à goût" lines have no quantity
        quantity: i.quantity != null && Number(i.quantity) > 0 ? String(i.quantity) : null,
        unit: i.quantity != null && Number(i.quantity) > 0 ? i.unit || null : null,
        added_date: today.toISOString(),
        expiry_date: suggestedExpiry(i.food_name, today),
        is_available: true,
      }))
    // New purchases are separate lots: the steaks bought today don't replace the ones expiring tomorrow
    try {
      await fridgeService.addItems(userId, toFridge)
      setFridgeMessage(toFridge.length > 0 ? t('shopping.addedToFridge', { n: toFridge.length }) : null)
    } catch (err) {
      console.error('Add to fridge error:', err)
    }

    const newList = await shoppingService.getOrCreateActiveList(userId)
    setList(newList)
    setItems([])
  }

  const handleClearList = async () => {
    if (!list) return
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    setConfirmClear(false)
    const previous = items
    setItems([])
    await shoppingService.clearList(list.id).catch((err) => {
      console.error('Clear list error:', err)
      setItems(previous)
    })
  }

  const toggleCollapsed = (category: string) => {
    const next = new Set(collapsed)
    next.has(category) ? next.delete(category) : next.add(category)
    setCollapsed(next)
  }

  // Items saved with an old or missing category are placed by their name
  const grouped = GROCERY_CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => itemCategory(i) === cat),
  })).filter((g) => g.items.length > 0)

  const estimatedTotal = items.reduce((sum, item) => sum + itemCost(item), 0)

  const totalCount = items.length
  const checkedCount = items.filter((i) => i.is_purchased).length
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      {isOffline && (
        <p className="flex items-start gap-2 text-sm text-ink bg-tint-sand rounded-md px-3 py-2">
          <WifiOff size={16} className="shrink-0 mt-0.5 text-accent" />
          {t('offline.shopping')}
        </p>
      )}
      {fridgeMessage && (
        <p className="flex items-center justify-between gap-2 text-sm text-ink bg-tint-sage rounded-md px-3 py-2">
          <span className="flex items-center gap-2">
            <Refrigerator size={16} className="text-primary shrink-0" />
            {fridgeMessage}
          </span>
          <Link to="/fridge" className="text-primary font-semibold shrink-0">
            {t('shopping.seeFridge')}
          </Link>
        </p>
      )}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-full border border-border p-0.5 flex-1">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-colors ${
              activeTab === 'ingredients' ? 'bg-primary text-white' : 'text-ink-muted'
            }`}
          >
            {t('shopping.tab.ingredients')}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-full text-sm font-display font-semibold transition-colors ${
              activeTab === 'list' ? 'bg-primary text-white' : 'text-ink-muted'
            }`}
          >
            {t('shopping.tab.list')} {totalCount > 0 && `(${totalCount})`}
          </button>
        </div>
        <button
          onClick={openHistory}
          aria-label={t('shopping.viewHistory')}
          className="w-10 h-10 shrink-0 rounded-full border border-border flex items-center justify-center text-ink-muted hover:text-ink"
        >
          <History size={18} />
        </button>
      </div>

      {activeTab === 'ingredients' ? (
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as GroceryCategory)}
            className="w-full px-3 py-2.5 border border-border rounded-sm bg-surface-200 text-ink font-display font-semibold"
          >
            {GROCERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="mt-3 space-y-1.5">
            {GROCERY_CATALOG[selectedCategory].map((name) => {
              const existing = itemByName.get(normalizeText(name))
              const qty = Number(existing?.quantity) || 0
              return (
                <div
                  key={name}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    qty > 0 ? 'bg-tint-sage border-primary' : 'bg-surface-200 border-border'
                  }`}
                >
                  <span className="min-w-0">
                    <span className={`text-sm flex items-center gap-1.5 ${qty > 0 ? 'text-ink font-medium' : 'text-ink-muted'}`}>
                      {name}
                      <FoodWarningBadge flag={foodFlag(name)} />
                    </span>
                    <span className="block text-[11px] text-ink-muted">{packLabel(name)}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(name, qty - 1)}
                      disabled={qty === 0}
                      aria-label={t('common.decrease')}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-ink disabled:opacity-30"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="flex items-center gap-1">
                      <QuantityInput value={qty} onCommit={(n) => setQuantity(name, n)} />
                      {existing?.unit && <span className="text-xs text-ink-muted">{existing.unit}</span>}
                    </span>
                    <button
                      onClick={() => setQuantity(name, qty + 1)}
                      aria-label={t('common.increase')}
                      className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-[11px] text-ink-muted mt-3 flex items-center gap-1.5">
            {t('prices.indicative')}
            <InfoButton title={t('prices.infoTitle')} paragraphs={[t('prices.disclaimer'), t('prices.infoStore')]} size={13} />
          </p>

          <form onSubmit={handleAddCustom} className="flex gap-2 mt-3">
            <input
              type="text"
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
              placeholder={t('shopping.customItem')}
              className="flex-1 px-3 py-2 border border-border rounded-full bg-surface-200 text-ink text-sm"
            />
            <button type="submit" className="px-3.5 py-2 bg-accent text-white rounded-full">
              <Plus size={16} />
            </button>
          </form>
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('shopping.empty')}</p>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className="text-ink-muted">
                {checkedCount} / {totalCount} {t('shopping.progress')}
              </span>
              <span className="text-primary font-semibold">{progressPct}%</span>
            </div>
          </div>

          <div className="bg-tint-sand rounded-md px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-semibold text-ink flex items-center gap-1.5">
                {t('prices.estimatedTotal')}
                <InfoButton title={t('prices.infoTitle')} paragraphs={[t('prices.disclaimer'), t('prices.infoStore')]} />
              </span>
              <span className="text-sm font-display font-bold text-ink">≈ {formatEuros(estimatedTotal)}</span>
            </div>
          </div>

          {grouped.map((group) => {
            const isCollapsed = collapsed.has(group.category)
            return (
              <div key={group.category}>
                <button
                  onClick={() => toggleCollapsed(group.category)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <h3 className="text-xs font-display font-bold text-ink-muted uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {group.category}
                  </h3>
                  <ChevronDown
                    size={16}
                    className={`text-ink-muted transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-200 border border-border rounded-md p-3 flex items-center gap-3"
                      >
                        <button
                          onClick={() => toggleChecked(item)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            item.is_purchased ? 'bg-primary border-primary' : 'border-border'
                          }`}
                        >
                          {item.is_purchased && <Check size={14} className="text-white" />}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            item.is_purchased ? 'line-through text-ink-muted' : 'text-ink'
                          }`}
                        >
                          {item.food_name}
                        </span>
                        <FoodWarningBadge flag={foodFlag(item.food_name)} />
                        {fridgeKeys.has(ingredientKey(item.food_name)) && (
                          <span
                            title={t('shopping.inFridge')}
                            aria-label={t('shopping.inFridge')}
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-tint-sage px-1.5 py-0.5 rounded-full shrink-0"
                          >
                            <Refrigerator size={11} />
                            {t('shopping.inFridgeShort')}
                          </span>
                        )}
                        <span className="flex flex-col items-end shrink-0">
                          {formatAmount(item.quantity, item.unit) && (
                            <span className="text-xs font-semibold text-primary">
                              {formatAmount(item.quantity, item.unit)}
                            </span>
                          )}
                          {formatEstimate(itemCost(item)) && (
                            <span className="text-[11px] text-ink-muted">{formatEstimate(itemCost(item))}</span>
                          )}
                        </span>
                        {!item.category && (
                          <span className="text-[10px] font-semibold text-accent bg-tint-clay px-2 py-0.5 rounded-full">
                            {t('shopping.addedBadge')}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1 text-ink-muted hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={handleCompleteShopping}
            disabled={isOffline}
            className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Check size={18} />
            {t('shopping.complete')}
          </button>

          <button
            onClick={handleClearList}
            disabled={isOffline}
            onBlur={() => setConfirmClear(false)}
            className={`w-full py-2.5 rounded-full font-display font-semibold flex items-center justify-center gap-2 border disabled:opacity-40 ${
              confirmClear ? 'bg-danger text-white border-danger' : 'border-border text-danger hover:bg-surface-200'
            }`}
          >
            <Trash2 size={17} />
            {confirmClear ? t('shopping.clearConfirm') : t('shopping.clearList')}
          </button>
        </div>
      )}

      {showHistory && (
        <Modal title={t('shopping.history')} onClose={() => setShowHistory(false)} tall>
          {history.length === 0 ? (
            <p className="text-center text-ink-muted text-sm py-6">{t('shopping.noHistory')}</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const isExpanded = expandedHistoryId === entry.id
                const entryItems: any[] = Array.isArray(entry.items) ? entry.items : []
                return (
                  <div key={entry.id} className="bg-surface-100 border border-border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryId(isExpanded ? null : entry.id)}
                      className="w-full p-3 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-ink">
                        {entryItems.length} {t('shopping.historyItems')}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-ink-muted">
                          {new Date(entry.date_purchased).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border">
                        {entryItems.length === 0 ? (
                          <p className="text-center text-ink-muted text-sm py-4">{t('shopping.noHistory')}</p>
                        ) : (
                          entryItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                              <span className="text-ink flex items-center gap-1.5">
                                {item.food_name}
                                <FoodWarningBadge flag={foodFlag(item.food_name)} />
                              </span>
                              <span className="text-primary font-semibold shrink-0 ml-3">
                                {formatAmount(item.quantity, item.unit)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
