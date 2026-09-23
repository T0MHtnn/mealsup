import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============ AUTH ============

export const authService = {
  signUp: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })
    if (error) throw error
    return data
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
  getRecipes: async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .order('title')
    if (error) throw error
    return data || []
  },

  /** User recipes are always private: only their author can see them. */
  createRecipe: async (userId: string, recipe: RecipeInput, ingredients: RecipeIngredientInput[]) => {
    const { data, error } = await supabase
      .from('recipes')
      .insert([{ ...recipe, created_by: userId, visibility: 'private' }])
      .select('id')
      .single()
    if (error) throw error
    await replaceIngredients(data.id, ingredients)
    return data.id as string
  },

  updateRecipe: async (recipeId: string, recipe: RecipeInput, ingredients: RecipeIngredientInput[]) => {
    const { error } = await supabase
      .from('recipes')
      .update({ ...recipe, updated_at: new Date().toISOString() })
      .eq('id', recipeId)
    if (error) throw error
    await replaceIngredients(recipeId, ingredients)
  },

  deleteRecipe: async (recipeId: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
    if (error) throw error
  },

  getRecipeById: async (recipeId: string) => {
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

// ============ FAVORITES ============

export const favoriteService = {
  getFavoriteIds: async (userId: string) => {
    const { data, error } = await supabase
      .from('favorite_recipes')
      .select('recipe_id')
      .eq('user_id', userId)
    if (error) throw error
    return (data || []).map((row) => row.recipe_id)
  },

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
    if (error) throw error
  },

  removeFavorite: async (userId: string, recipeId: string) => {
    const { error } = await supabase
      .from('favorite_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
    if (error) throw error
  },
}

// ============ USER PREFERENCES ============

export const userService = {
  getUserPreferences: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  updatePreferences: async (userId: string, preferences: any) => {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, email: userData.user?.email, ...preferences })
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
  getMine: async (userId: string): Promise<RecipeRating[]> => {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('recipe_id, rating, note')
      .eq('user_id', userId)
    if (error) throw error
    return data || []
  },

  save: async (userId: string, recipeId: string, rating: number | null, note: string | null) => {
    const { error } = await supabase
      .from('recipe_ratings')
      .upsert({ user_id: userId, recipe_id: recipeId, rating, note, updated_at: new Date().toISOString() })
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
