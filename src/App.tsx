import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { userService } from '@/services/supabaseClient'

// Pages
import LoginPage from '@/pages/Login'
import SignupPage from '@/pages/Signup'
import DashboardPage from '@/pages/Dashboard'
import FridgePage from '@/pages/Fridge'
import RecipesPage from '@/pages/Recipes'
import RecipeDetailPage from '@/pages/RecipeDetail'
import RecipeEditorPage from '@/pages/RecipeEditor'
import CookModePage from '@/pages/CookMode'
import AdminUsersPage from '@/pages/admin/AdminUsers'
import AdminFeedbacksPage from '@/pages/admin/AdminFeedbacks'
import AdminProfilePage from '@/pages/admin/AdminProfile'
import ShoppingPage from '@/pages/Shopping'
import ProfilePage from '@/pages/Profile'

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
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          isAdminMode ? (
            <Route element={<MainLayout admin />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
              <Route path="*" element={<Navigate to="/admin/users" replace />} />
            </Route>
          ) : (
          <>
            {/* Full screen, without the navigation bar */}
            <Route path="/recipes/:id/cook" element={<CookModePage />} />
            <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/fridge" element={<FridgePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeEditorPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </>
          )
        )}
      </Routes>
    </Router>
  )
}

export default App
