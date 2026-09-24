import { createClient } from '@supabase/supabase-js'
import { cached, clearCache, invalidate, peek } from '@/services/cache'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache durations (writes made in the app invalidate them immediately)
const RECIPES_TTL = 30 * 60 * 1000 // recipes rarely change
const USER_TTL = 5 * 60 * 1000

// ============ AUTH ============

export const authService = {
  /**
   * Creates the account and sends the confirmation e-mail: the account only
   * becomes active once the link in it has been clicked.
   */
  signUp: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
    // Already registered and confirmed: Supabase answers without error but with no identity
    if (data.user && data.user.identities?.length === 0) throw { code: 'user_already_exists' }
    return data
  },

  /** Sends the confirmation e-mail again (link expired or not received). */
  resendConfirmation: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    clearCache()
    if (error) throw error
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },
}

// ============ FRIDGE ============

export const fridgeService = {
  addItem: async (userId: string, item: any) => {
    const { data, error } = await supabase
      .from('fridge_items')
      .insert([{ user_id: userId, ...item }])
      .select()
    if (error) throw error
    return data?.[0]
  },

  getFridgeItems: async (userId: string) => {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_available', true)
      .order('expiry_date', { ascending: true })
    if (error) throw error
    return data || []
  },

  addItems: async (userId: string, items: any[]) => {
    if (items.length === 0) return []
    const { data, error } = await supabase
      .from('fridge_items')
      .insert(items.map((item) => ({ user_id: userId, ...item })))
      .select()
    if (error) throw error
    return data || []
  },

  deleteItem: async (itemId: string) => {
    const { error } = await supabase
      .from('fridge_items')
      .delete()
      .eq('id', itemId)
    if (error) throw error
  },

  updateItem: async (itemId: string, updates: any) => {
    const { data, error } = await supabase
      .from('fridge_items')
      .update(updates)
      .eq('id', itemId)
      .select()
    if (error) throw error
    return data?.[0]
  },
}

// ============ RECIPES ============

export interface RecipeInput {
  title: string
  description: string
  prep_time_mins: number
  cook_time_mins: number
  servings: number
  difficulty: number
  tags: string[]
  equipment_needed: string[]
  instructions: string[]
  image_url?: string | null
  image_credit?: string | null
  image_source_url?: string | null
}

export interface RecipeIngredientInput {
  ingredient_name: string
  quantity: number | null
  unit: string
}

const replaceIngredients = async (recipeId: string, ingredients: RecipeIngredientInput[]) => {
  const { error: deleteError } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
  if (deleteError) throw deleteError
  if (ingredients.length === 0) return
  const { error } = await supabase
    .from('recipe_ingredients')
    .insert(ingredients.map((ing) => ({ recipe_id: recipeId, ...ing })))
  if (error) throw error
}

export const recipeService = {
  // RLS returns the public recipes plus the user's own private ones
  getRecipes: () =>
    cached(
      'recipes',
      RECIPES_TTL,
      async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('*, recipe_ingredients(*)')
          .order('title')
        if (error) throw error
        return data || []
      },
      true
    ) as Promise<any[]>,

  /** User recipes are always private: only their author can see them. */
  createRecipe: async (userId: string, recipe: RecipeInput, ingredients: RecipeIngredientInput[]) => {
    const { data, error } = await supabase
      .from('recipes')
      .insert([{ ...recipe, created_by: userId, visibility: 'private' }])
      .select('id')
      .single()
    if (error) throw error
    await replaceIngredients(data.id, ingredients)
    invalidate('recipes')
    return data.id as string
  },

  updateRecipe: async (recipeId: string, recipe: RecipeInput, ingredients: RecipeIngredientInput[]) => {
    const { error } = await supabase
      .from('recipes')
      .update({ ...recipe, updated_at: new Date().toISOString() })
      .eq('id', recipeId)
    if (error) throw error
    await replaceIngredients(recipeId, ingredients)
    invalidate('recipes')
  },

  deleteRecipe: async (recipeId: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
    if (error) throw error
    invalidate('recipes')
  },

  getRecipeById: async (recipeId: string) => {
    // Opened from the list: the recipe is already loaded, no request needed
    const fromList = peek<any[]>('recipes')?.find((r) => r.id === recipeId)
    if (fromList) return fromList
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('id', recipeId)
      .single()
    if (error) throw error
    return data
  },

  getRecipesByDietary: async (dietaryType: string) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('dietary_type', dietaryType)
      .eq('visibility', 'public')
    if (error) throw error
    return data || []
  },
}

// ============ SHOPPING LISTS ============

export const shoppingService = {
  createList: async (userId: string) => {
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert([{ user_id: userId, status: 'draft' }])
      .select()
    if (error) throw error
    return data?.[0]
  },

  getOrCreateActiveList: async (userId: string) => {
    const { data: existing, error: findError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
    if (findError) throw findError
    if (existing && existing.length > 0) return existing[0]

    const { data, error } = await supabase
      .from('shopping_lists')
      .insert([{ user_id: userId, status: 'draft' }])
      .select()
    if (error) throw error
    return data?.[0]
  },

  addItemToList: async (listId: string, item: any) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert([{ shopping_list_id: listId, is_purchased: false, ...item }])
      .select()
    if (error) throw error
    return data?.[0]
  },

  toggleItemChecked: async (itemId: string, isChecked: boolean) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: isChecked })
      .eq('id', itemId)
      .select()
    if (error) throw error
    return data?.[0]
  },

  updateItemQuantity: async (itemId: string, quantity: number) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
    if (error) throw error
    return data?.[0]
  },

  removeItem: async (itemId: string) => {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId)
    if (error) throw error
  },

  clearList: async (listId: string) => {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('shopping_list_id', listId)
    if (error) throw error
  },

  getListItems: async (listId: string) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', listId)
      .order('category', { ascending: true })
    if (error) throw error
    return data || []
  },

  updateListStatus: async (listId: string, status: string) => {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ status })
      .eq('id', listId)
    if (error) throw error
  },

  completeList: async (userId: string, listId: string, items: any[]) => {
    const { error: historyError } = await supabase
      .from('purchase_history')
      .insert([
        {
          user_id: userId,
          shopping_list_id: listId,
          items,
          date_purchased: new Date().toISOString(),
        },
      ])
    if (historyError) throw historyError

    const { error: statusError } = await supabase
      .from('shopping_lists')
      .update({ status: 'completed' })
      .eq('id', listId)
    if (statusError) throw statusError
  },

  getShoppingHistory: async (userId: string, limit = 10) => {
    const { data, error } = await supabase
      .from('purchase_history')
      .select('*')
      .eq('user_id', userId)
      .order('date_purchased', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },
}

// ============ ARTICLES AJOUTÉS ============

export interface UserFood {
  id: string
  name: string
  category: string | null
  /** Price of one unit (a pack, a piece) in euros, or null when unknown. */
  price: number | null
}

export const userFoodService = {
  getFoods: async (userId: string): Promise<UserFood[]> => {
    const { data, error } = await supabase
      .from('user_foods')
      .select('id, name, category, price')
      .eq('user_id', userId)
      .order('name', { ascending: true })
    if (error) throw error
    return (data || []).map((f: any) => ({ ...f, price: f.price == null ? null : Number(f.price) }))
  },

  addFood: async (userId: string, food: Omit<UserFood, 'id'>): Promise<UserFood> => {
    const { data, error } = await supabase
      .from('user_foods')
      .insert([{ user_id: userId, ...food }])
      .select('id, name, category, price')
      .single()
    if (error) throw error
    return { ...data, price: data.price == null ? null : Number(data.price) }
  },

  removeFood: async (foodId: string) => {
    const { error } = await supabase.from('user_foods').delete().eq('id', foodId)
    if (error) throw error
  },
}

// ============ FAVORITES ============

export const favoriteService = {
  getFavoriteIds: (userId: string) =>
    cached(`favorites:${userId}`, USER_TTL, async () => {
      const { data, error } = await supabase
        .from('favorite_recipes')
        .select('recipe_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data || []).map((row) => row.recipe_id as string)
    }),

  getFavoriteRecipes: async (userId: string) => {
    const { data, error } = await supabase
      .from('favorite_recipes')
      .select('recipe_id, recipes(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((row: any) => row.recipes).filter(Boolean)
  },

  addFavorite: async (userId: string, recipeId: string) => {
    const { error } = await supabase
      .from('favorite_recipes')
      .insert([{ user_id: userId, recipe_id: recipeId }])
    invalidate(`favorites:${userId}`)
    if (error) throw error
  },

  removeFavorite: async (userId: string, recipeId: string) => {
    const { error } = await supabase
      .from('favorite_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
    invalidate(`favorites:${userId}`)
    if (error) throw error
  },
}

// ============ USER PREFERENCES ============

export const userService = {
  getUserPreferences: (userId: string) =>
    cached(`prefs:${userId}`, USER_TTL, async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    }) as Promise<any>,

  updatePreferences: async (userId: string, preferences: any) => {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, email: userData.user?.email, ...preferences })
    invalidate(`prefs:${userId}`)
    if (error) throw error
  },
}

// ============ RETOURS UTILISATEURS ============

export const feedbackService = {
  send: async (userId: string, email: string | undefined, message: string) => {
    const { error } = await supabase.from('feedback').insert([{ user_id: userId, email: email || null, message }])
    if (error) throw error
  },
}

// ============ STOCKAGE (AVATAR) ============

export const storageService = {
  uploadAvatar: async (userId: string, file: File) => {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return `${data.publicUrl}?t=${Date.now()}`
  },

  /** Photo of an own recipe, in the user's folder of the recipe-images bucket. */
  uploadRecipeImage: async (userId: string, file: Blob) => {
    const path = `${userId}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(path, file, { contentType: 'image/jpeg', cacheControl: '31536000' })
    if (error) throw error
    return supabase.storage.from('recipe-images').getPublicUrl(path).data.publicUrl
  },

  /** Deletes a photo uploaded with uploadRecipeImage (other URLs are ignored). */
  removeRecipeImage: async (url: string | null | undefined) => {
    const marker = '/storage/v1/object/public/recipe-images/'
    const index = url?.indexOf(marker) ?? -1
    if (!url || index < 0) return
    await supabase.storage.from('recipe-images').remove([decodeURIComponent(url.slice(index + marker.length))])
  },

  /** Every file of a user (profile photo, recipe photos), before deleting the account. */
  removeAllUserFiles: async (userId: string) => {
    for (const bucket of ['avatars', 'recipe-images']) {
      const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 })
      const paths = (data || []).map((file) => `${userId}/${file.name}`)
      if (paths.length > 0) await supabase.storage.from(bucket).remove(paths)
    }
  },
}

// ============ COMPTE : EXPORT ET SUPPRESSION (RGPD) ============

export const accountService = {
  /** All the user's data in one object (right of access / portability). */
  exportData: async (userId: string) => {
    const read = async (query: PromiseLike<{ data: any; error: any }>) => {
      const { data, error } = await query
      return error ? [] : data || []
    }
    const lists = await read(supabase.from('shopping_lists').select('*').eq('user_id', userId))
    return {
      exported_at: new Date().toISOString(),
      profile: (await read(supabase.from('users').select('*').eq('id', userId)))[0] ?? null,
      fridge: await read(supabase.from('fridge_items').select('*').eq('user_id', userId)),
      meal_plan: await read(supabase.from('planned_meals').select('meal_date, meal_type, servings, recipes(title)').eq('user_id', userId)),
      favorites: await read(supabase.from('favorite_recipes').select('created_at, recipes(title)').eq('user_id', userId)),
      ratings: await read(supabase.from('recipe_ratings').select('rating, note, updated_at, recipes(title)').eq('user_id', userId)),
      shopping_lists: lists,
      shopping_list_items: lists.length
        ? await read(supabase.from('shopping_list_items').select('*').in('shopping_list_id', lists.map((l: any) => l.id)))
        : [],
      purchase_history: await read(supabase.from('purchase_history').select('*').eq('user_id', userId)),
      added_foods: await read(supabase.from('user_foods').select('name, category, price, created_at').eq('user_id', userId)),
      own_recipes: await read(supabase.from('recipes').select('*, recipe_ingredients(*)').eq('created_by', userId)),
      notification_devices: await read(supabase.from('push_subscriptions').select('endpoint, created_at').eq('user_id', userId)),
    }
  },

  /** Deletes the account and everything attached to it, then signs out. */
  deleteAccount: async (userId: string) => {
    await storageService.removeAllUserFiles(userId)
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
    clearCache()
    await supabase.auth.signOut().catch(() => {})
  },
}

// ============ PLANNING DE LA SEMAINE ============

export const mealPlanService = {
  getWeekPlan: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('planned_meals')
      .select('*, recipes(*, recipe_ingredients(*))')
      .eq('user_id', userId)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate)
    if (error) throw error
    return data || []
  },

  /** servings = null -> the recipe's own number of servings */
  setMeal: async (userId: string, mealDate: string, mealType: string, recipeId: string, servings: number | null = null) => {
    const { data, error } = await supabase
      .from('planned_meals')
      .upsert([{ user_id: userId, meal_date: mealDate, meal_type: mealType, recipe_id: recipeId, servings }], {
        onConflict: 'user_id,meal_date,meal_type',
      })
      .select('*, recipes(*, recipe_ingredients(*))')
    if (error) throw error
    return data?.[0]
  },

  setMeals: async (userId: string, meals: { meal_date: string; meal_type: string; recipe_id: string }[]) => {
    if (meals.length === 0) return []
    const { data, error } = await supabase
      .from('planned_meals')
      .upsert(meals.map((m) => ({ user_id: userId, servings: null, ...m })), { onConflict: 'user_id,meal_date,meal_type' })
      .select('*, recipes(*, recipe_ingredients(*))')
    if (error) throw error
    return data || []
  },

  updateServings: async (id: string, servings: number) => {
    const { error } = await supabase.from('planned_meals').update({ servings }).eq('id', id)
    if (error) throw error
  },

  removeMeal: async (id: string) => {
    const { error } = await supabase.from('planned_meals').delete().eq('id', id)
    if (error) throw error
  },
}

// ============ AVIS SUR LES RECETTES ============

export interface RecipeRating {
  recipe_id: string
  rating: number | null
  note: string | null
}

export const ratingService = {
  getMine: (userId: string): Promise<RecipeRating[]> =>
    cached(`ratings:${userId}`, USER_TTL, async () => {
      const { data, error } = await supabase
        .from('recipe_ratings')
        .select('recipe_id, rating, note')
        .eq('user_id', userId)
      if (error) throw error
      return (data || []) as RecipeRating[]
    }),

  save: async (userId: string, recipeId: string, rating: number | null, note: string | null) => {
    const { error } = await supabase
      .from('recipe_ratings')
      .upsert({ user_id: userId, recipe_id: recipeId, rating, note, updated_at: new Date().toISOString() })
    invalidate(`ratings:${userId}`)
    if (error) throw error
  },
}

// ============ NOTIFICATIONS PUSH ============

export const pushService = {
  saveSubscription: async (userId: string, subscription: PushSubscriptionJSON) => {
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
      },
      { onConflict: 'endpoint' }
    )
    if (error) throw error
  },

  deleteSubscription: async (endpoint: string) => {
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    if (error) throw error
  },
}

// ============ ADMINISTRATION (réservé aux admins, vérifié côté base) ============

export type UserRole = 'member' | 'admin'

export interface AdminUser {
  id: string
  email: string
  username: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
}

export interface Feedback {
  id: string
  user_id: string | null
  email: string | null
  message: string
  created_at: string
  resolved: boolean
}

export const adminService = {
  listUsers: async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) throw error
    return data || []
  },

  setRole: async (userId: string, role: UserRole) => {
    const { error } = await supabase.rpc('admin_set_role', { target: userId, new_role: role })
    if (error) throw error
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase.rpc('admin_delete_user', { target: userId })
    if (error) throw error
  },

  listFeedback: async (): Promise<Feedback[]> => {
    const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  setFeedbackResolved: async (id: string, resolved: boolean) => {
    const { error } = await supabase.from('feedback').update({ resolved }).eq('id', id)
    if (error) throw error
  },

  deleteFeedback: async (id: string) => {
    const { error } = await supabase.from('feedback').delete().eq('id', id)
    if (error) throw error
  },
}
