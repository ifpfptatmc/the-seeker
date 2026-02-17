import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Calendar, ChevronRight, MessageSquare, AlertCircle, Zap, X, BookOpen, Lightbulb, ListChecks, Sparkles } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Character } from '../components/Character'
import { TaskCard } from '../components/TaskCard'
import { useStore } from '../store/useStore'
import { TEST_METHODS } from '../lib/icons'
import { generateDailyTasks, generateCharacterMessage } from '../lib/api'
import { CHARACTER_STAGES } from '../lib/icons'
import { pullSync, pushDailyTasks } from '../lib/sync'
import { isConfigured as isTodoistConfigured } from '../lib/todoist'
import type { DailyTask, TaskDifficulty } from '../types'

const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; points: number; color: string; emoji: string }> = {
  easy: { label: 'легко', points: 10, color: 'bg-green-500', emoji: '🟢' },
  medium: { label: 'средне', points: 25, color: 'bg-amber-500', emoji: '🟡' },
  hard: { label: 'сложно', points: 40, color: 'bg-red-500', emoji: '🔴' },
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export function HomePage() {
  const navigate = useNavigate()
  const { 
    currentMethod, 
    dailyTasks, 
    progress,
    tasksGeneratedDate,
    characterMessage,
    characterMessageDate,
    preferredModel,
    setDailyTasks,
    setCurrentMethod,
    setProgress,
    setTasksGeneratedDate,
    setCharacterMessage,
    goals,
    spheres,
    updateSphere,
    updateGoal,
    addGoal,
    archiveGoal,
    addSphere,
  } = useStore()
  
  // If we already have tasks for today, skip the full loading screen
  const hasCachedData = tasksGeneratedDate === getTodayStr() && dailyTasks.length > 0
  const [isLoading, setIsLoading] = useState(!hasCachedData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMethodModal, setShowMethodModal] = useState(false)
  const initCalled = useRef(false)
  
  const activeGoals = goals.filter(g => g.status === 'active')
  
  const today = new Date()
  const baseSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const todayStr = getTodayStr()
  
  // Get the next actionable subtask for a goal (respecting strict_order)
  const getNextSubtask = (goal: typeof activeGoals[0]) => {
    if (!goal) return null
    const subtasks = (goal.subtasks || []).sort((a, b) => a.order - b.order)
    if (subtasks.length === 0) return null
    
    if (goal.strict_order) {
      return subtasks.find(s => !s.completed) || null
    } else {
      const incomplete = subtasks.filter(s => !s.completed)
      if (incomplete.length === 0) return null
      const idx = Math.floor(seededRandom(baseSeed + goal.id.length) * incomplete.length)
      return incomplete[idx]
    }
  }
  
  const getRandomGoals = (seed?: number) => {
    const s = seed ?? baseSeed
    if (activeGoals.length === 0) return [null, null, null]
    if (activeGoals.length === 1) return [activeGoals[0], activeGoals[0], activeGoals[0]]
    if (activeGoals.length === 2) {
      const flip = Math.floor(seededRandom(s) * 2)
      return flip ? [activeGoals[1], activeGoals[0], activeGoals[1]] : [activeGoals[0], activeGoals[1], activeGoals[0]]
    }
    
    const indices: number[] = []
    let attempt = 0
    while (indices.length < 3 && attempt < 20) {
      const idx = Math.floor(seededRandom(s + attempt * 7) * activeGoals.length)
      if (!indices.includes(idx)) {
        indices.push(idx)
      }
      attempt++
    }
    
    return indices.map(i => activeGoals[i])
  }
  
  // Initialize on load
  useEffect(() => {
    if (initCalled.current) return
    initCalled.current = true
    
    const init = async () => {
      // Pull from Todoist in background (don't block UI)
      if (isTodoistConfigured()) {
        setIsSyncing(true)
        pullSync(spheres, goals, updateSphere, updateGoal, addGoal, archiveGoal, addSphere)
          .catch(() => {})
          .finally(() => setIsSyncing(false))
      }
      
      // Init progress if needed
      if (!progress) {
        setProgress({
          id: 'demo',
          user_id: 'demo',
          points: 0,
          level: 1,
          stage: 1,
          streak_days: 0,
          longest_streak: 0,
          tasks_completed: 0,
          weeks_completed: 0,
          updated_at: new Date().toISOString()
        })
      }
      
      // Pick weekly method if needed (or reset if old method not in current list)
      let method = currentMethod
      const methodExists = method && TEST_METHODS.some(m => m.id === method!.id)
      if (!method || !methodExists) {
        const weekSeed = Math.floor(baseSeed / 7)
        const methodIndex = Math.floor(seededRandom(weekSeed) * TEST_METHODS.length)
        const randomMethod = TEST_METHODS[methodIndex]
        method = {
          id: randomMethod.id,
          title: randomMethod.title,
          description: randomMethod.description,
          duration_days: randomMethod.duration_days,
          tasks: []
        }
        setCurrentMethod(method)
        // Method changed -- force task regeneration
        setDailyTasks([])
        setTasksGeneratedDate(null)
      }
      
      // Generate tasks if needed (new day or no tasks)
      const needTasks = !tasksGeneratedDate || tasksGeneratedDate !== todayStr || dailyTasks.length === 0
      
      if (needTasks && activeGoals.length > 0) {
        setIsGenerating(true)
        setError(null)
        
        const selectedGoals = getRandomGoals()
        const goalsForAPI = selectedGoals
          .filter(Boolean)
          .map(g => {
            const base: { id: string; title: string; description?: string; subtask?: { id: string; title: string } } = {
              id: g!.id,
              title: g!.title,
              description: g!.description
            }
            const nextSub = getNextSubtask(g!)
            if (nextSub) {
              base.subtask = { id: nextSub.id, title: nextSub.title }
            }
            return base
          })
        
        try {
          const result = await generateDailyTasks({
            method_title: method.title,
            method_description: method.description,
            goals: goalsForAPI,
            model: preferredModel
          })
          
          if (result.error || !result.data?.tasks) {
            setError(result.error || 'AI не вернул задания')
          } else {
            const tasks: DailyTask[] = result.data.tasks.map((t, i) => {
              const difficulty = t.difficulty as TaskDifficulty
              const matchedGoal = selectedGoals[i] || activeGoals.find(g => g.title === t.goal_id || g.id === t.goal_id)
              const nextSub = matchedGoal ? getNextSubtask(matchedGoal) : null
              return {
                id: `task-${difficulty}-${todayStr}`,
                user_id: 'demo',
                session_id: 'demo',
                goal_id: matchedGoal?.id,
                goal_title: matchedGoal?.title,
                subtask_title: nextSub?.title,
                date: todayStr,
                title: t.title,
                description: t.description,
                difficulty,
                completed: false,
                points_earned: DIFFICULTY_CONFIG[difficulty]?.points || 10
              }
            })
            setDailyTasks(tasks)
            setTasksGeneratedDate(todayStr)
            
            // Push to Todoist
            if (isTodoistConfigured()) {
              pushDailyTasks(tasks, todayStr).catch(() => {})
            }
          }
        } catch (err) {
          setError(`API не ответил: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`)
        }
        
        setIsGenerating(false)
      } else if (needTasks && activeGoals.length === 0) {
        // No goals – can't generate tasks
        setDailyTasks([])
      }
      
      // Generate character message if needed (new day)
      if (!characterMessageDate || characterMessageDate !== todayStr) {
        const points = progress?.points || 0
        const currentStageInfo = [...CHARACTER_STAGES]
          .reverse()
          .find(s => points >= s.points) || CHARACTER_STAGES[0]
        
        try {
          const msgResult = await generateCharacterMessage({
            character_stage: currentStageInfo.stage,
            points,
            streak_days: progress?.streak_days || 0,
            tasks_completed_today: dailyTasks.filter(t => t.completed).length,
            model: preferredModel
          })
          
          if (msgResult.data?.message) {
            setCharacterMessage(msgResult.data.message, todayStr)
          }
        } catch {
          // не критично – просто не показываем сообщение
        }
      }
      
      setIsLoading(false)
    }
    
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Patch cached tasks: fill in goal_title/subtask_title if missing
  useEffect(() => {
    if (dailyTasks.length === 0 || goals.length === 0) return
    if (!dailyTasks.some(t => !t.goal_title)) return
    
    const difficultyOrder = ['easy', 'medium', 'hard']
    const selectedGoals = getRandomGoals()
    
    const patched = dailyTasks.map(t => {
      if (t.goal_title) return t
      // Try by goal_id first
      if (t.goal_id) {
        const g = goals.find(g => g.id === t.goal_id)
        if (g) {
          const nextSub = getNextSubtask(g)
          return { ...t, goal_title: g.title, subtask_title: nextSub?.title }
        }
      }
      // Fallback: match by difficulty index (mirrors generation order)
      const idx = difficultyOrder.indexOf(t.difficulty)
      if (idx >= 0 && selectedGoals[idx]) {
        const g = selectedGoals[idx]!
        const nextSub = getNextSubtask(g)
        return { ...t, goal_id: g.id, goal_title: g.title, subtask_title: nextSub?.title }
      }
      return t
    })
    
    if (patched.some((t, i) => t !== dailyTasks[i])) {
      setDailyTasks(patched)
    }
  }, [dailyTasks, goals]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Regenerate tasks manually – fresh random goals each time
  const handleRegenerate = async () => {
    if (activeGoals.length === 0) return
    setIsGenerating(true)
    setError(null)
    
    const regenSeed = Date.now()
    const selectedGoals = getRandomGoals(regenSeed)
    const goalsForAPI = selectedGoals
      .filter(Boolean)
      .map(g => {
        const base: { id: string; title: string; description?: string; subtask?: { id: string; title: string } } = {
          id: g!.id,
          title: g!.title,
          description: g!.description
        }
        const nextSub = getNextSubtask(g!)
        if (nextSub) base.subtask = { id: nextSub.id, title: nextSub.title }
        return base
      })
    
    try {
      const result = await generateDailyTasks({
        method_title: currentMethod?.title || '',
        method_description: currentMethod?.description || '',
        goals: goalsForAPI,
        model: preferredModel
      })
      
      if (result.error || !result.data?.tasks) {
        setError(result.error || 'AI не вернул задания')
      } else {
        const tasks: DailyTask[] = result.data.tasks.map((t, i) => {
          const difficulty = t.difficulty as TaskDifficulty
          const matchedGoal = selectedGoals[i] || activeGoals.find(g => g.title === t.goal_id || g.id === t.goal_id)
          const nextSub = matchedGoal ? getNextSubtask(matchedGoal) : null
          return {
            id: `task-${difficulty}-${todayStr}-r${Date.now()}`,
            user_id: 'demo',
            session_id: 'demo',
            goal_id: matchedGoal?.id,
            goal_title: matchedGoal?.title,
            subtask_title: nextSub?.title,
            date: todayStr,
            title: t.title,
            description: t.description,
            difficulty,
            completed: false,
            points_earned: DIFFICULTY_CONFIG[difficulty]?.points || 10
          }
        })
        setDailyTasks(tasks)
        setTasksGeneratedDate(todayStr)
        
        if (isTodoistConfigured()) {
          pushDailyTasks(tasks, todayStr).catch(() => {})
        }
      }
    } catch (err) {
      setError(`API не ответил: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`)
    }
    
    setIsGenerating(false)
  }
  
  const completedCount = dailyTasks.filter(t => t.completed).length
  const totalCount = dailyTasks.length
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const earnedPoints = dailyTasks.filter(t => t.completed).reduce((sum, t) => sum + t.points_earned, 0)
  const totalPoints = dailyTasks.reduce((sum, t) => sum + t.points_earned, 0)
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Layout>
    )
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Character Section */}
        <Character />
        
        {/* Character Voice */}
        {characterMessage && (
          <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <p className="text-sm text-primary-700 dark:text-primary-300 italic text-center">
              "{characterMessage}"
            </p>
          </div>
        )}
        
        {/* Current Method */}
        {currentMethod && (
          <div 
            className="card bg-gradient-to-br from-primary-500 to-accent-500 text-white cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setShowMethodModal(true)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  методика недели
                </p>
                <h2 className="text-xl font-bold mt-1">{currentMethod.title}</h2>
                <p className="text-sm opacity-90 mt-2">{currentMethod.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-60 mt-1" />
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="card bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-700 dark:text-red-300 text-sm">
                  не удалось сгенерировать задания
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                <button 
                  onClick={handleRegenerate}
                  className="mt-2 text-xs text-red-500 underline underline-offset-2 hover:text-red-600"
                >
                  попробовать снова
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Today's Progress */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            задания на сегодня
          </h2>
          <div className="flex items-center gap-2">
            {!isGenerating && dailyTasks.length > 0 && (
              <button
                onClick={handleRegenerate}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                title="перегенерировать задания"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <div className="text-sm font-medium text-primary-500">
              +{earnedPoints}/{totalPoints}
            </div>
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Generating State */}
        {isGenerating && (
          <div className="card flex items-center justify-center py-12">
            <div className="text-center">
              <Zap className="w-8 h-8 text-primary-500 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-gray-500">AI генерирует задания...</p>
              <p className="text-xs text-gray-400 mt-1">обычно занимает 5–10 секунд</p>
            </div>
          </div>
        )}
        
        {/* Tasks List by Difficulty */}
        {!isGenerating && (
          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as TaskDifficulty[]).map(difficulty => {
              const task = dailyTasks.find(t => t.difficulty === difficulty)
              if (!task) return null
              
              const config = DIFFICULTY_CONFIG[difficulty]
              
              return (
                <div key={difficulty} className="relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color} rounded-l-xl`} />
                  <TaskCard task={task} difficultyConfig={config} />
                </div>
              )
            })}
          </div>
        )}
        
        {/* No goals warning */}
        {activeGoals.length === 0 && (
          <div className="card bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-amber-700 dark:text-amber-300">
              добавь цели!
            </h3>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              перейди в раздел goals чтобы задать цели на год
            </p>
          </div>
        )}
        
        {/* All completed message */}
        {completedCount === totalCount && totalCount > 0 && (
          <div className="card bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300">
              все задания выполнены!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              +{earnedPoints} очков заработано. увидимся завтра!
            </p>
          </div>
        )}
        
        {/* Weekly Reflection CTA */}
        {(() => {
          const dow = new Date().getDay()
          const isEndOfWeek = dow === 0 || dow === 5 || dow === 6
          const daysLeft = dow <= 5 ? 5 - dow : 5 + 7 - dow
          
          return (
            <button
              onClick={() => navigate('/reflection')}
              className={`w-full card text-white hover:shadow-2xl transition-all ${
                isEndOfWeek 
                  ? 'bg-gradient-to-r from-accent-500 to-primary-500' 
                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold">еженедельная рефлексия</h3>
                  <p className="text-sm opacity-80">
                    {isEndOfWeek 
                      ? 'заверши неделю и получи +50 очков!' 
                      : `откроется через ${daysLeft} дн. (пятница)`
                    }
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </div>
            </button>
          )
        })()}
      </div>
      
      {/* Method Detail Modal */}
      {showMethodModal && currentMethod && (() => {
        const methodData = TEST_METHODS.find(m => m.id === currentMethod.id)
        return (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowMethodModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            {/* Modal */}
            <div 
              className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl overflow-y-auto animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header gradient */}
              <div className="sticky top-0 z-10 bg-gradient-to-br from-primary-500 to-accent-500 px-5 pt-5 pb-4">
                <button 
                  onClick={() => setShowMethodModal(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                
                <p className="text-sm text-white/70 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  методика недели
                </p>
                <h2 className="text-2xl font-bold text-white mt-1">{currentMethod.title}</h2>
                <p className="text-sm text-white/90 mt-2">{currentMethod.description}</p>
                
                {methodData?.source && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{methodData.source.book} -- {methodData.source.author}, {methodData.source.year}</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="px-5 py-4 space-y-5">
                {/* Why it works */}
                {methodData?.why_it_works && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      почему это работает
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {methodData.why_it_works}
                    </p>
                  </div>
                )}
                
                {/* Key principles */}
                {methodData?.key_principles && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary-500" />
                      ключевые принципы
                    </h3>
                    <ul className="space-y-2">
                      {methodData.key_principles.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* How to apply */}
                {methodData?.how_to_apply && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                      <ListChecks className="w-4 h-4 text-green-500" />
                      как применять
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {methodData.how_to_apply}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Bottom padding for mobile */}
              <div className="h-6" />
            </div>
          </div>
        )
      })()}
    </Layout>
  )
}
