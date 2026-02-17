import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Monitor, Palette, LogOut, Bell, Shield, HelpCircle, Brain, ChevronDown, ChevronRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useStore } from '../store/useStore'
import { signOut } from '../lib/supabase'
import { getAICostSummary } from '../lib/api'
import { isConfigured as isTodoistConfigured } from '../lib/todoist'
import { initialSync, pullSync } from '../lib/sync'
import type { SyncResult } from '../lib/sync'
import type { Theme, AccentColor } from '../types'

const ACCENT_COLORS: { name: string; value: AccentColor; color: string }[] = [
  { name: 'sky', value: 'sky', color: 'bg-sky-500' },
  { name: 'violet', value: 'violet', color: 'bg-violet-500' },
  { name: 'rose', value: 'rose', color: 'bg-rose-500' },
  { name: 'amber', value: 'amber', color: 'bg-amber-500' },
  { name: 'emerald', value: 'emerald', color: 'bg-emerald-500' },
]

const AI_MODELS = [
  { value: 'claude-sonnet', label: 'Claude Sonnet', description: 'самая умная, ~$3/1M tokens', tier: 'premium' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'сильная, ~$2.5/1M tokens', tier: 'premium' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini', description: 'быстрая и дешёвая, ~$0.15/1M tokens', tier: 'budget' },
  { value: 'claude-haiku', label: 'Claude Haiku', description: 'быстрая, ~$0.25/1M tokens', tier: 'budget' },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const { theme, accentColor, setTheme, setAccentColor, user, progress, preferredModel, setPreferredModel, spheres, goals, updateSphere, updateGoal, addGoal, archiveGoal, setUser } = useStore()
  const [showAIStats, setShowAIStats] = useState(false)
  const [aiStats, setAiStats] = useState<{ model: string; total_cost: number; total_requests: number; total_input_tokens: number; total_output_tokens: number }[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  
  const todoistReady = isTodoistConfigured()
  const hasLinkedSpheres = spheres.some(s => s.todoist_id)
  
  const handleInitialSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const result = await initialSync(spheres, goals, updateSphere, updateGoal)
      setSyncResult(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'ошибка синхронизации')
    }
    setIsSyncing(false)
  }
  
  const handlePullSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const result = await pullSync(spheres, goals, updateSphere, updateGoal, addGoal, archiveGoal)
      setSyncResult(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'ошибка синхронизации')
    }
    setIsSyncing(false)
  }
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  
  useEffect(() => {
    if (showAIStats) {
      getAICostSummary().then(setAiStats)
    }
  }, [showAIStats])
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-2xl text-white">
              {user?.name?.[0] || '🌟'}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {user?.name || 'seeker'}
              </h2>
              <p className="text-sm text-gray-500">
                {user?.email || 'demo@theseeker.app'}
              </p>
              {progress && (
                <p className="text-xs text-primary-500 mt-1">
                  level {progress.level} • {progress.points} points
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* AI Model */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI model
          </h3>
          
          <div className="space-y-2">
            {AI_MODELS.map(({ value, label, description, tier }) => (
              <button
                key={value}
                onClick={() => setPreferredModel(value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  preferredModel === value
                    ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500'
                    : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  preferredModel === value ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      tier === 'premium' 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {tier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </button>
            ))}
          </div>
          
          {/* AI Usage Stats */}
          <button
            onClick={() => setShowAIStats(!showAIStats)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500 transition-colors"
          >
            {showAIStats ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            usage stats
          </button>
          
          {showAIStats && (
            <div className="space-y-2">
              {aiStats.length === 0 ? (
                <p className="text-xs text-gray-400">пока нет данных</p>
              ) : (
                <>
                  {aiStats.map(stat => (
                    <div key={stat.model} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{stat.model}</span>
                        <span className="text-sm font-mono text-primary-500">${stat.total_cost.toFixed(4)}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{stat.total_requests} запросов</span>
                        <span>{(stat.total_input_tokens / 1000).toFixed(1)}k input</span>
                        <span>{(stat.total_output_tokens / 1000).toFixed(1)}k output</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">total</span>
                    <span className="text-sm font-mono font-bold text-primary-500">
                      ${aiStats.reduce((sum, s) => sum + s.total_cost, 0).toFixed(4)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Todoist Sync */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Todoist
          </h3>
          
          {!todoistReady ? (
            <p className="text-sm text-gray-500">
              добавь VITE_TODOIST_API_TOKEN в .env чтобы включить синхронизацию
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">токен подключён</span>
              </div>
              
              {!hasLinkedSpheres ? (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    первый синк создаст проект "Цели 2026" в Todoist с твоими сферами и целями
                  </p>
                  <button
                    onClick={handleInitialSync}
                    disabled={isSyncing}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> синхронизация...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> первый синк с Todoist</>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    синк происходит автоматически при открытии приложения
                  </p>
                  <button
                    onClick={handlePullSync}
                    disabled={isSyncing}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> синхронизация...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> синхронизировать сейчас</>
                    )}
                  </button>
                </div>
              )}
              
              {/* Sync Result */}
              {syncResult && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-300">синк завершён</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                    {syncResult.spheresCreated > 0 && <p>сфер создано: {syncResult.spheresCreated}</p>}
                    {syncResult.goalsCreated > 0 && <p>целей создано: {syncResult.goalsCreated}</p>}
                    {syncResult.goalsUpdated > 0 && <p>целей обновлено: {syncResult.goalsUpdated}</p>}
                    {syncResult.goalsArchived > 0 && <p>целей архивировано: {syncResult.goalsArchived}</p>}
                    {syncResult.subtasksCreated > 0 && <p>подзадач создано: {syncResult.subtasksCreated}</p>}
                    {syncResult.subtasksUpdated > 0 && <p>подзадач обновлено: {syncResult.subtasksUpdated}</p>}
                    {syncResult.errors.length > 0 && (
                      <div className="mt-1 text-amber-600 dark:text-amber-400">
                        {syncResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                      </div>
                    )}
                    {syncResult.spheresCreated === 0 && syncResult.goalsCreated === 0 && syncResult.goalsUpdated === 0 && syncResult.subtasksCreated === 0 && syncResult.errors.length === 0 && (
                      <p>всё актуально, изменений нет</p>
                    )}
                  </div>
                </div>
              )}
              
              {syncError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-600 dark:text-red-400">{syncError}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Appearance */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            appearance
          </h3>
          
          {/* Theme */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">theme</p>
            <div className="flex gap-2">
              {[
                { value: 'light' as Theme, icon: Sun, label: 'light' },
                { value: 'dark' as Theme, icon: Moon, label: 'dark' },
                { value: 'system' as Theme, icon: Monitor, label: 'system' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    theme === value
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Accent Color */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">accent color</p>
            <div className="flex gap-3">
              {ACCENT_COLORS.map(({ name, value, color }) => (
                <button
                  key={value}
                  onClick={() => setAccentColor(value)}
                  className={`w-10 h-10 ${color} rounded-full transition-all ${
                    accentColor === value 
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-400'
                      : 'hover:scale-110'
                  }`}
                  title={name}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Settings List */}
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {[
            { icon: Bell, label: 'notifications', description: 'reminders and alerts' },
            { icon: Shield, label: 'privacy', description: 'data and security' },
            { icon: HelpCircle, label: 'help & support', description: 'FAQ and contact' },
          ].map(({ icon: Icon, label, description }) => (
            <button
              key={label}
              className="w-full flex items-center gap-4 py-4 first:pt-0 last:pb-0 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-6 px-6 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
        
        {/* Sign Out */}
        <button 
          onClick={() => {
            signOut().catch(() => {})
            setUser(null)
            navigate('/auth', { replace: true })
          }}
          className="w-full btn bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          sign out
        </button>
        
        {/* Version */}
        <p className="text-center text-xs text-gray-400">
          The Seeker v0.1.0 • made with 💜
        </p>
      </div>
    </Layout>
  )
}
