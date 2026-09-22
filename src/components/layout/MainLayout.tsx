import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, Search, Refrigerator, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { TranslationKey } from '@/i18n/translations'
import Logo from '@/components/common/Logo'

const tabs: { to: string; labelKey: TranslationKey; icon: typeof Home; end?: boolean }[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/recipes', labelKey: 'nav.recipes', icon: Search },
  { to: '/fridge', labelKey: 'nav.fridge', icon: Refrigerator },
  { to: '/shopping', labelKey: 'nav.shopping', icon: ShoppingCart },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
]

export default function MainLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isRecipeDetail = /^\/recipes\/.+/.test(location.pathname)

  return (
    <div className="min-h-screen bg-border sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex flex-col h-screen sm:h-[850px] sm:max-h-[92vh] w-full sm:max-w-sm bg-surface-100 sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-surface-200 overflow-hidden">
        {!isHome && !isRecipeDetail && (
          <header className="shrink-0 h-14 bg-surface-200 border-b border-border flex items-center justify-center">
            <Logo size={24} />
          </header>
        )}

        <main className="flex-1 overflow-auto pb-16">
          <Outlet />
        </main>

        <nav className="absolute bottom-0 left-0 right-0 bg-surface-200 border-t border-border flex justify-around items-center h-16 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
