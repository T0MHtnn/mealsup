import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/supabaseClient'
import { STORES, type StoreKey } from '@/constants/prices'
import { catalogPackLabel, estimateRecipeCost, estimateShoppingItemCost } from '@/utils/prices'

/** Price estimates (not verified, indicative only) adjusted to the store chosen in the profile. */
export function usePrices() {
  const userId = useAuthStore((state) => state.session?.user.id)
  const [store, setStore] = useState<StoreKey>('average')

  useEffect(() => {
    if (!userId) return
    userService
      .getUserPreferences(userId)
      .then((prefs) => {
        const saved = prefs?.preferred_store
        if (STORES.some((s) => s.key === saved)) setStore(saved)
      })
      .catch((err) => console.error('Store preference load error:', err))
  }, [userId])

  const factor = STORES.find((s) => s.key === store)?.factor ?? 1

  const recipeCost = useCallback((recipe: any) => estimateRecipeCost(recipe, factor), [factor])
  const itemCost = useCallback(
    (item: { food_name: string; quantity?: number | null; unit?: string | null }) =>
      estimateShoppingItemCost(item.food_name, item.quantity, item.unit) * factor,
    [factor]
  )
  const packLabel = useCallback((name: string) => catalogPackLabel(name, factor), [factor])

  return { store, factor, recipeCost, itemCost, packLabel }
}
