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

export const recipeService = {
  getRecipes: async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('visibility', 'public')
    if (error) throw error
    return data || []
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

  addItemToList: async (listId: string, item: any) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert([{ shopping_list_id: listId, ...item }])
      .select()
    if (error) throw error
    return data?.[0]
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

  getShoppingHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from('purchase_history')
      .select('*')
      .eq('user_id', userId)
      .order('date_purchased', { ascending: false })
    if (error) throw error
    return data || []
  },
}

// ============ USER PREFERENCES ============

export const userService = {
  getUserPreferences: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  updatePreferences: async (userId: string, preferences: any) => {
    const { error } = await supabase
      .from('users')
      .update(preferences)
      .eq('id', userId)
    if (error) throw error
  },
}
