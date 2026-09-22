import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'fr' | 'en'
export type Theme = 'light' | 'dark' | 'system'

interface UiStore {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      language: 'fr',
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'mealsup-ui' }
  )
)

export function resolveIsDark(theme: Theme): boolean {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return theme === 'dark'
}
