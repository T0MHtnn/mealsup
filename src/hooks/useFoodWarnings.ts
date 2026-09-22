import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/supabaseClient'
import type { DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { normalizeText } from '@/utils/text'
import { getFoodFlag, getRecipeWarnings } from '@/utils/warnings'

/** Loads the user's excluded foods + dietary restrictions and exposes checkers for foods and recipes. */
export function useFoodWarnings() {
  const userId = useAuthStore((state) => state.session?.user.id)
  const [excludedFoods, setExcludedFoods] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<DietaryRestrictionKey[]>([])

  useEffect(() => {
    if (!userId) return
    userService
      .getUserPreferences(userId)
      .then((prefs) => {
        setExcludedFoods(
          (Array.isArray(prefs?.allergies) ? prefs.allergies : [])
            .map((s: string) => normalizeText(s))
            .filter(Boolean)
        )
        setRestrictions(Array.isArray(prefs?.dietary_restrictions) ? prefs.dietary_restrictions : [])
      })
      .catch((err) => console.error('Food warnings load error:', err))
  }, [userId])

  const foodFlag = useCallback(
    (name: string) => getFoodFlag(name, excludedFoods, restrictions),
    [excludedFoods, restrictions]
  )

  const recipeHasWarning = useCallback(
    (recipe: any) => getRecipeWarnings(recipe, excludedFoods, restrictions).hasWarning,
    [excludedFoods, restrictions]
  )

  return { foodFlag, recipeHasWarning }
}
