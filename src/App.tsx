import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

// Pages
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import FridgePage from '@/pages/Fridge'
import RecipesPage from '@/pages/Recipes'
import ShoppingPage from '@/pages/Shopping'
import PreferencesPage from '@/pages/Preferences'

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
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/fridge" element={<FridgePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}

export default App
