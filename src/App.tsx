import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { supabase } from './lib/supabase'
import { HomePage } from './pages/HomePage'
import { GoalsPage } from './pages/GoalsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ReflectionPage } from './pages/ReflectionPage'
import { StatsPage } from './pages/StatsPage'

function AuthCallback() {
  const navigate = useNavigate()
  const { hasCompletedOnboarding } = useStore()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(hasCompletedOnboarding ? '/' : '/onboarding', { replace: true })
    }, 500)
    return () => clearTimeout(timer)
  }, [navigate, hasCompletedOnboarding])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/80">logging in...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, hasCompletedOnboarding, theme, setLoading, setUser } = useStore()
  const [authReady, setAuthReady] = useState(false)
  
  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'seeker',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at,
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setAuthReady(true)
    })
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'seeker',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at,
        })
      }
      setAuthReady(true)
    })
    
    return () => subscription.unsubscribe()
  }, [setUser])
  
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
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') applyTheme()
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, setLoading])
  
  // Show loading while checking auth
  if (!authReady && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }
  
  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
