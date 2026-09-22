import { useEffect } from 'react'
import { useUiStore, resolveIsDark } from '@/store/uiStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle('dark', resolveIsDark(theme))
    }
    apply()

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  return <>{children}</>
}
