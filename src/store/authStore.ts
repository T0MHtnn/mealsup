import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  username?: string
  allergies: string[]
  preferences: string[]
  dietary_restrictions: string[]
}

interface AuthStore {
  session: Session | null
  /** Account type, loaded after sign-in (null while unknown) */
  role: 'member' | 'admin' | null
  setRole: (role: 'member' | 'admin' | null) => void
  user: User | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  role: null,
  setRole: (role) => set({ role }),
  user: null,
  isLoading: false,
  
  setSession: (session) => set({ session }),
  
  setUser: (user) => set({ user }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => set({ session: null, user: null, role: null }),
}))
