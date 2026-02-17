import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { signInWithGoogle, signInWithApple } from '../lib/supabase'

export function AuthPage() {
  const navigate = useNavigate()
  const { setUser, setProgress, hasCompletedOnboarding } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleDemoLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    await new Promise(r => setTimeout(r, 800))
    
    setUser({
      id: 'demo-user',
      email: 'demo@theseeker.app',
      name: 'seeker',
      created_at: new Date().toISOString()
    })
    
    setProgress({
      id: 'demo',
      user_id: 'demo-user',
      points: 0,
      level: 1,
      stage: 1,
      streak_days: 0,
      longest_streak: 0,
      tasks_completed: 0,
      weeks_completed: 0,
      updated_at: new Date().toISOString()
    })
    
    setIsLoading(false)
    
    if (hasCompletedOnboarding) {
      navigate('/')
    } else {
      navigate('/onboarding')
    }
  }
  
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }
  
  const handleAppleLogin = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await signInWithApple()
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">The Seeker</h1>
          <p className="text-white/80">
            weekly experiments for curious minds
          </p>
        </div>
        
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-sm text-white text-center">
            {error}
          </div>
        )}
        
        {/* Auth Buttons */}
        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-gray-800 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            continue with Google
          </button>
          
          <button 
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            continue with Apple
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-white/60 bg-transparent">or</span>
            </div>
          </div>
          
          <button 
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {isLoading ? 'loading...' : 'try demo mode'}
          </button>
        </div>
        
        {/* Terms */}
        <p className="text-center text-white/50 text-xs mt-8">
          by continuing, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  )
}
