import { create } from 'zustand'

export interface FridgeItem {
  id: string
  user_id: string
  food_name: string
  category: string // 'Fruits', 'Légumes', 'Viandes', etc.
  shelf_life_days: number
  quantity: string | number
  unit: string // 'pièce', 'g', 'L', etc.
  added_date: string
  expiry_date: string
  is_available: boolean
}

interface FridgeStore {
  items: FridgeItem[]
  setItems: (items: FridgeItem[]) => void
  addItem: (item: FridgeItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<FridgeItem>) => void
  clearFridge: () => void
  getItemsByCategory: (category: string) => FridgeItem[]
  getExpiringItems: (daysThreshold: number) => FridgeItem[]
}

export const useFridgeStore = create<FridgeStore>((set, get) => ({
  items: [],
  
  setItems: (items) => set({ items }),
  
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  
  clearFridge: () => set({ items: [] }),
  
  getItemsByCategory: (category) => {
    return get().items.filter((item) => item.category === category)
  },
  
  getExpiringItems: (daysThreshold) => {
    const today = new Date()
    return get().items.filter((item) => {
      const expiryDate = new Date(item.expiry_date)
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0
    })
  },
}))
