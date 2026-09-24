import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { userService } from '@/services/supabaseClient'

// Pages: the first screens are in the main bundle, the others are downloaded
// only when opened (smaller app to load on the phone).
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
const SignupPage = lazy(() => import('@/pages/Signup'))
const FridgePage = lazy(() => import('@/pages/Fridge'))
const RecipesPage = lazy(() => import('@/pages/Recipes'))
const RecipeDetailPage = lazy(() => import('@/pages/RecipeDetail'))
const RecipeEditorPage = lazy(() => import('@/pages/RecipeEditor'))
const CookModePage = lazy(() => import('@/pages/CookMode'))
const ShoppingPage = lazy(() => import('@/pages/Shopping'))
const ProfilePage = lazy(() => import('@/pages/Profile'))
const HelpPage = lazy(() => import('@/pages/Help'))
const RecapPage = lazy(() => import('@/pages/Recap'))
const LegalPage = lazy(() => import('@/pages/Legal'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminFeedbacksPage = lazy(() => import('@/pages/admin/AdminFeedbacks'))
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfile'))

// Layout
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

function App() {
  const { session, isLoading } = useAuth()
  const setSession = useAuthStore((state) => state.setSession)
  const role = useAuthStore((state) => state.role)
  const setRole = useAuthStore((state) => state.setRole)
  const adminMode = useUiStore((state) => state.adminMode)
  const setAdminMode = useUiStore((state) => state.setAdminMode)

  useEffect(() => {
    if (session) {
      setSession(session)
    }
  }, [session, setSession])

  // Account type (member / admin), stored in the users table and protected server side
  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setRole(null)
      return
    }
    userService
      .getUserPreferences(userId)
      .then((prefs) => {
        const nextRole = prefs?.role === 'admin' ? 'admin' : 'member'
        setRole(nextRole)
        if (nextRole !== 'admin') setAdminMode(false)
      })
      .catch(() => setRole('member'))
  }, [session?.user.id, setRole, setAdminMode])

  const isAdminMode = role === 'admin' && adminMode

  // Wait for the role before showing the admin screens (no flash of the wrong interface)
  if (isLoading || (session && adminMode && role === null)) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/legal/:doc" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          isAdminMode ? (
            <Route element={<MainLayout admin />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
              <Route path="/legal/:doc" element={<LegalPage />} />
              <Route path="*" element={<Navigate to="/admin/users" replace />} />
            </Route>
          ) : (
          <>
            {/* Full screen, without the navigation bar */}
            <Route path="/recipes/:id/cook" element={<CookModePage />} />
            <Route path="/legal/:doc" element={<LegalPage />} />
            <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/fridge" element={<FridgePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeEditorPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/recap" element={<RecapPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </>
          )
        )}
      </Routes>
      </Suspense>
    </Router>
  )
}

export default App
