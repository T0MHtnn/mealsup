import { Suspense, useEffect, useLayoutEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, Search, Refrigerator, ShoppingCart, User, Users, MessageSquare, ShieldCheck } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { TranslationKey } from '@/i18n/translations'
import { useAdminStore } from '@/store/adminStore'
import { savedRecipesSearch } from '@/utils/recipesListState'
import Logo from '@/components/common/Logo'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type Tab = { to: string; labelKey: TranslationKey; icon: typeof Home; end?: boolean }

const APP_TABS: Tab[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/recipes', labelKey: 'nav.recipes', icon: Search },
  { to: '/fridge', labelKey: 'nav.fridge', icon: Refrigerator },
  { to: '/shopping', labelKey: 'nav.shopping', icon: ShoppingCart },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
]

// Administration mode (admin accounts only)
const ADMIN_TABS: Tab[] = [
  { to: '/admin/users', labelKey: 'admin.nav.users', icon: Users },
  { to: '/admin/feedbacks', labelKey: 'admin.nav.feedbacks', icon: MessageSquare },
  { to: '/admin/profile', labelKey: 'nav.profile', icon: User },
]

// How often the admin badge checks for new messages
const FEEDBACK_REFRESH_MS = 60_000

export default function MainLayout({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const tabs = admin ? ADMIN_TABS : APP_TABS
  const isHome = !admin && location.pathname === '/'
  const isRecipeDetail = !admin && /^\/recipes\/.+/.test(location.pathname)
  const openFeedbacks = useAdminStore((state) => state.openFeedbacks)
  const refreshOpenFeedbacks = useAdminStore((state) => state.refreshOpenFeedbacks)

  // A new page starts at the top (the recipes list then puts itself back where it was)
  useLayoutEffect(() => {
    const scroller = document.getElementById('app-scroll')
    if (scroller) scroller.scrollTop = 0
  }, [location.pathname])

  useEffect(() => {
    if (!admin) return
    refreshOpenFeedbacks()
    const timer = window.setInterval(refreshOpenFeedbacks, FEEDBACK_REFRESH_MS)
    const onVisible = () => document.visibilityState === 'visible' && refreshOpenFeedbacks()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [admin, refreshOpenFeedbacks])

  return (
    <div className="min-h-[100dvh] bg-border sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex flex-col h-[100dvh] sm:h-[850px] sm:max-h-[92vh] w-full sm:max-w-sm bg-surface-100 sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-surface-200 overflow-hidden">
        {!isHome && !isRecipeDetail && (
          <header className="shrink-0 h-14 bg-surface-200 border-b border-border flex items-center justify-center gap-2">
            <Logo size={24} />
            {admin && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-accent px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} />
                {t('admin.badge')}
              </span>
            )}
          </header>
        )}

        <main id="app-scroll" className="flex-1 overflow-auto pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Raised above the bottom edge of the phone (home bar, rounded corners) */}
        <nav className="absolute bottom-0 left-0 right-0 bg-surface-200 border-t border-border pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center h-14">
            {tabs.map(({ to, labelKey, icon: Icon, end }) => {
              const badge = admin && to === '/admin/feedbacks' ? openFeedbacks : 0
              // Back to the recipes with the same search and filters as last time
              const target = to === '/recipes' ? `/recipes${savedRecipesSearch()}` : to
              return (
                <NavLink
                  key={to}
                  to={target}
                  end={end}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
                    }`
                  }
                >
                  <span className="relative">
                    <Icon size={22} strokeWidth={2} />
                    {badge > 0 && (
                      <span
                        aria-label={t('admin.feedbacks.openCount', { n: badge })}
                        className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-surface-200"
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  {t(labelKey)}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
