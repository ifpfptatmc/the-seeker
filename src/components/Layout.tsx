import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Target, History, Settings, Sparkles, BarChart3 } from 'lucide-react'
import { useStore } from '../store/useStore'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { progress } = useStore()
  
  const navItems = [
    { path: '/', icon: Home, label: 'home' },
    { path: '/goals', icon: Target, label: 'goals' },
    { path: '/stats', icon: BarChart3, label: 'vibes' },
    { path: '/history', icon: History, label: 'history' },
    { path: '/settings', icon: Settings, label: 'settings' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
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
