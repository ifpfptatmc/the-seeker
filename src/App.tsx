import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { HomePage } from './pages/HomePage'
import { GoalsPage } from './pages/GoalsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ReflectionPage } from './pages/ReflectionPage'
import { StatsPage } from './pages/StatsPage'

function AppRoutes() {
  const { isAuthenticated, hasCompletedOnboarding, theme, setLoading } = useStore()
  
  // Apply theme on mount and changes
  useEffect(() => {
    const applyTheme = () => {
      const isDark = 
        theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    applyTheme()
    setLoading(false)
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') applyTheme()
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, setLoading])
  
  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }
  
  // Authenticated but not onboarded
  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }
  
  // Fully authenticated and onboarded
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/reflection" element={<ReflectionPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
