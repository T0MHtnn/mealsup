import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

// Pages
import LoginPage from '@/pages/Login'
import SignupPage from '@/pages/Signup'
import DashboardPage from '@/pages/Dashboard'
import FridgePage from '@/pages/Fridge'
import RecipesPage from '@/pages/Recipes'
import RecipeDetailPage from '@/pages/RecipeDetail'
import RecipeEditorPage from '@/pages/RecipeEditor'
import CookModePage from '@/pages/CookMode'
import ShoppingPage from '@/pages/Shopping'
import ProfilePage from '@/pages/Profile'

// Layout
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'

function App() {
  const { session, isLoading } = useAuth()
  const setSession = useAuthStore((state) => state.setSession)

  useEffect(() => {
    if (session) {
      setSession(session)
    }
  }, [session, setSession])

  if (isLoading) {
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
        )}
      </Routes>
    </Router>
  )
}

export default App
