import { type ReactNode, useRef, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Target, History, Settings, Sparkles, BarChart3 } from 'lucide-react'
import { useStore } from '../store/useStore'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { progress } = useStore()
  
  // Pull-to-refresh
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const mainRef = useRef<HTMLDivElement>(null)
  const THRESHOLD = 80
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY
    } else {
      touchStartY.current = 0
    }
  }, [])
  
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current || isRefreshing) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, 120))
    }
  }, [isRefreshing])
  
  const onTouchEnd = useCallback(() => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(THRESHOLD * 0.5)
      window.location.reload()
    } else {
      setPullDistance(0)
    }
    touchStartY.current = 0
  }, [pullDistance, isRefreshing])
  
  const navItems = [
    { path: '/', icon: Home, label: 'home' },
    { path: '/goals', icon: Target, label: 'goals' },
    { path: '/stats', icon: BarChart3, label: 'vibes' },
    { path: '/history', icon: History, label: 'history' },
    { path: '/settings', icon: Settings, label: 'settings' },
  ]
  
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 overflow-auto"
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          <div className={`w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full ${
            pullDistance >= THRESHOLD ? 'animate-spin' : ''
          }`} style={{ 
            transform: `rotate(${pullDistance * 3}deg)`,
            opacity: Math.min(pullDistance / THRESHOLD, 1) 
          }} />
        </div>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient">The Seeker</h1>
          {progress && (
            <div className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {progress.points} pts
              </span>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
