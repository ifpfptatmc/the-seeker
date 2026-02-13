import { useState, useMemo, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, ChevronDown, ChevronRight, ChevronLeft, FileText, MessageSquare, Brain, Clock, Zap, AlertCircle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { getAIUsageStats } from '../lib/api'
import type { AIUsageStats } from '../lib/api'

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

const REQUEST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  tasks: { label: 'задания', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  reflection: { label: 'рефлексия', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  insight: { label: 'инсайт', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  character: { label: 'персонаж', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

// Generate demo history data
const generateDemoHistory = () => {
  const history: Record<string, { 
    tasksCompleted: number
    pointsEarned: number
    tasks: Array<{ 
      title: string
      goal: string
      difficulty: string
      completed: boolean
      points: number
      result?: string
    }>
    reflection?: {
      format: string
      answers: string[]
    }
  }> = {}
  
  const today = new Date()
  const goals = ['выучить Python', 'пробежать марафон', 'написать книгу', 'медитировать', 'читать 30 мин/день']
  const reflectionFormats = ['вопросы', 'шкала', 'быстрый выбор', 'одно слово']
  
  for (let i = 60; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const seed = date.getDate() + date.getMonth() * 31
    const easyDone = (seed * 17) % 100 > 20
    const mediumDone = (seed * 23) % 100 > 35
    const hardDone = (seed * 31) % 100 > 55
    
    const tasksCompleted = (easyDone ? 1 : 0) + (mediumDone ? 1 : 0) + (hardDone ? 1 : 0)
    const pointsEarned = (easyDone ? 10 : 0) + (mediumDone ? 25 : 0) + (hardDone ? 40 : 0)
    
    history[dateStr] = {
      tasksCompleted,
      pointsEarned,
      tasks: [
        { 
          title: 'лёгкая задача', 
          goal: goals[seed % goals.length],
          difficulty: 'easy', 
          completed: easyDone, 
          points: 10,
          result: easyDone && (seed % 3 === 0) ? 'сделала 3 шага к цели!' : undefined
        },
        { 
          title: 'средняя задача', 
          goal: goals[(seed + 1) % goals.length],
          difficulty: 'medium', 
          completed: mediumDone, 
          points: 25,
          result: mediumDone && (seed % 4 === 0) ? 'поработала 45 минут без отвлечений' : undefined
        },
        { 
          title: 'сложная задача', 
          goal: goals[(seed + 2) % goals.length],
          difficulty: 'hard', 
          completed: hardDone, 
          points: 40,
          result: hardDone && (seed % 5 === 0) ? 'большой прогресс! закончила главу.' : undefined
        },
      ],
      reflection: date.getDay() === 0 ? {
        format: reflectionFormats[seed % reflectionFormats.length],
        answers: ['было продуктивно!', 'хочу больше фокуса']
      } : undefined
    }
  }
  
  return history
}

// ============================
// Date range presets
// ============================
type DateRange = 'today' | '7d' | '30d' | 'all' | 'custom'

function getDateRange(range: DateRange, customFrom?: string, customTo?: string): { from?: string; to?: string } {
  const today = new Date().toISOString().split('T')[0]
  switch (range) {
    case 'today': return { from: today, to: today }
    case '7d': {
      const d = new Date(); d.setDate(d.getDate() - 7)
      return { from: d.toISOString().split('T')[0], to: today }
    }
    case '30d': {
      const d = new Date(); d.setDate(d.getDate() - 30)
      return { from: d.toISOString().split('T')[0], to: today }
    }
    case 'custom': return { from: customFrom, to: customTo }
    default: return {}
  }
}

// ============================
// AI Log Tab Component
// ============================
function AILogTab() {
  const [logs, setLogs] = useState<AIUsageStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  
  const loadLogs = (range: DateRange, cFrom?: string, cTo?: string) => {
    setIsLoading(true)
    const params = getDateRange(range, cFrom, cTo)
    getAIUsageStats(params).then(data => {
      setLogs(data)
      setIsLoading(false)
    })
  }
  
  useEffect(() => {
    loadLogs('all')
  }, [])
  
  const handleRangeChange = (range: DateRange) => {
    setDateRange(range)
    if (range !== 'custom') loadLogs(range)
  }
  
  const handleCustomApply = () => {
    if (customFrom) loadLogs('custom', customFrom, customTo || customFrom)
  }
  
  const totalCost = logs.reduce((sum, l) => sum + Number(l.cost_usd), 0)
  const totalRequests = logs.length
  const totalInputTokens = logs.reduce((sum, l) => sum + l.input_tokens, 0)
  const totalOutputTokens = logs.reduce((sum, l) => sum + l.output_tokens, 0)
  
  // Group by model for summary
  const byModel = useMemo(() => {
    const m: Record<string, { count: number; cost: number }> = {}
    for (const l of logs) {
      if (!m[l.model]) m[l.model] = { count: 0, cost: 0 }
      m[l.model].count++
      m[l.model].cost += Number(l.cost_usd)
    }
    return Object.entries(m)
  }, [logs])
  
  // Group by date
  const logsByDate = useMemo(() => {
    const groups: Record<string, AIUsageStats[]> = {}
    for (const log of logs) {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(log)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [logs])
  
  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {([
            ['today', 'сегодня'],
            ['7d', '7 дней'],
            ['30d', '30 дней'],
            ['all', 'всё'],
            ['custom', 'период'],
          ] as [DateRange, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => handleRangeChange(value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                dateRange === value
                  ? 'bg-primary-500 text-white font-medium'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {dateRange === 'custom' && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 block mb-0.5">от</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="input text-xs !py-1.5"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 block mb-0.5">до</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="input text-xs !py-1.5"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customFrom}
              className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg disabled:opacity-50"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Zap className="w-6 h-6 text-primary-500 animate-pulse" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-8">
          <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">нет вызовов за этот период</p>
          <p className="text-xs text-gray-400 mt-1">попробуй выбрать другой диапазон</p>
        </div>
      ) : (
        <>
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card bg-primary-50 dark:bg-primary-900/20 py-3">
          <p className="text-xs text-gray-500">потрачено</p>
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
            ${totalCost.toFixed(4)}
          </p>
          <p className="text-xs text-gray-400">~{(totalCost * 100).toFixed(2)} руб</p>
        </div>
        <div className="card bg-accent-50 dark:bg-accent-900/20 py-3">
          <p className="text-xs text-gray-500">запросов</p>
          <p className="text-lg font-bold text-accent-600 dark:text-accent-400">{totalRequests}</p>
          <p className="text-xs text-gray-400">{totalInputTokens + totalOutputTokens} токенов</p>
        </div>
      </div>
      
      {/* Per-model breakdown */}
      {byModel.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {byModel.map(([model, stats]) => (
            <div key={model} className="text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
              <span className="font-mono font-medium text-gray-600 dark:text-gray-400">{model}</span>
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-primary-500">${stats.cost.toFixed(4)}</span>
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-gray-500">{stats.count}x</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Logs by Date */}
      {/* Logs by Date */}
      {logsByDate.map(([date, dayLogs]) => {
        const dateObj = new Date(date)
        const dayCost = dayLogs.reduce((sum, l) => sum + Number(l.cost_usd), 0)
        
        return (
          <div key={date} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-gray-500">
                {dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' })}
              </h3>
              <span className="text-xs text-gray-400 font-mono">${dayCost.toFixed(4)}</span>
            </div>
            
            {dayLogs.map((log, idx) => {
              const logId = `${date}-${idx}`
              const isExpanded = expandedId === logId
              const typeInfo = REQUEST_TYPE_LABELS[log.request_type] || { label: log.request_type, color: 'bg-gray-100 text-gray-700' }
              const time = new Date(log.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div key={logId} className="card !py-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : logId)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{log.model}</span>
                          {!log.success && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                        {log.response_text && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-2 text-left">
                            {log.response_text}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-mono text-primary-500">${Number(log.cost_usd).toFixed(4)}</p>
                        <p className="text-[10px] text-gray-400">{time}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {/* Request Summary */}
                      {log.request_summary && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">запрос</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            {log.request_summary}
                          </p>
                        </div>
                      )}
                      
                      {/* Full Response */}
                      {log.response_text && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">ответ AI</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-lg whitespace-pre-wrap">
                            {log.response_text}
                          </p>
                        </div>
                      )}
                      
                      {/* Error */}
                      {log.error_message && (
                        <div>
                          <p className="text-xs text-red-400 mb-1">ошибка</p>
                          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            {log.error_message}
                          </p>
                        </div>
                      )}
                      
                      {/* Technical Details */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">input</p>
                          <p className="text-sm font-mono font-medium text-gray-600 dark:text-gray-400">{log.input_tokens}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">output</p>
                          <p className="text-sm font-mono font-medium text-gray-600 dark:text-gray-400">{log.output_tokens}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">latency</p>
                          <p className="text-sm font-mono font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {(log.latency_ms / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
        </>
      )}
    </div>
  )
}

// ============================
// Main History Page
// ============================
export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'ai'>('history')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'reflections'>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const history = useMemo(() => generateDemoHistory(), [])
  
  const filteredEntries = useMemo(() => {
    return Object.entries(history)
      .filter(([_, data]) => {
        if (filterType === 'tasks') return data.tasksCompleted > 0
        if (filterType === 'reflections') return data.reflection !== undefined
        return true
      })
      .sort(([a], [b]) => b.localeCompare(a))
  }, [history, filterType])
  
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    if (next <= new Date()) {
      setCurrentMonth(next)
    }
  }
  
  const monthEntries = filteredEntries.filter(([dateStr]) => {
    const date = new Date(dateStr)
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear()
  })
  
  return (
    <Layout>
      <div className="space-y-4">
        {/* Header with Tab Switch */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            история
          </h1>
        </div>
        
        {/* Main Tabs: History / AI Log */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' 
                ? 'bg-white dark:bg-gray-700 shadow text-primary-600 font-medium' 
                : 'text-gray-500'
            }`}
          >
            <Calendar className="w-4 h-4" />
            дневник
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ai' 
                ? 'bg-white dark:bg-gray-700 shadow text-primary-600 font-medium' 
                : 'text-gray-500'
            }`}
          >
            <Brain className="w-4 h-4" />
            AI log
          </button>
        </div>
        
        {/* AI Log Tab */}
        {activeTab === 'ai' && <AILogTab />}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            {/* Month Navigation */}
            <div className="card">
              <div className="flex items-center justify-between">
                <button 
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                
                <button 
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-1 ${
                  filterType === 'all' 
                    ? 'bg-white dark:bg-gray-700 shadow text-primary-600 font-medium' 
                    : 'text-gray-500'
                }`}
              >
                всё
              </button>
              <button
                onClick={() => setFilterType('tasks')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-1 ${
                  filterType === 'tasks' 
                    ? 'bg-white dark:bg-gray-700 shadow text-primary-600 font-medium' 
                    : 'text-gray-500'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                задачи
              </button>
              <button
                onClick={() => setFilterType('reflections')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-1 ${
                  filterType === 'reflections' 
                    ? 'bg-white dark:bg-gray-700 shadow text-primary-600 font-medium' 
                    : 'text-gray-500'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                рефлексии
              </button>
            </div>
            
            {/* History List */}
            <div className="space-y-2">
              {monthEntries.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-gray-500">нет записей за этот месяц</p>
                </div>
              ) : (
                monthEntries.map(([dateStr, data]) => {
                  const dateObj = new Date(dateStr)
                  const isExpanded = selectedDate === dateStr
                  
                  return (
                    <div key={dateStr} className="card">
                      <button
                        onClick={() => setSelectedDate(isExpanded ? null : dateStr)}
                        className="w-full flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold ${
                            data.tasksCompleted === 3 ? 'bg-green-500' :
                            data.tasksCompleted === 2 ? 'bg-amber-500' :
                            data.tasksCompleted === 1 ? 'bg-sky-400' :
                            'bg-gray-300 text-gray-600'
                          }`}>
                            <span className="text-lg">{dateObj.getDate()}</span>
                            <span className="text-[10px] opacity-80">
                              {dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })}
                            </span>
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {data.tasksCompleted}/3 задач
                              </span>
                              {data.reflection && (
                                <span className="text-xs px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full">
                                  рефлексия
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              +{data.pointsEarned} очков
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              задачи
                            </h4>
                            <div className="space-y-2">
                              {data.tasks.map((task, idx) => (
                                <div 
                                  key={idx}
                                  className={`p-3 rounded-lg ${
                                    task.completed 
                                      ? 'bg-green-50 dark:bg-green-900/20' 
                                      : 'bg-gray-50 dark:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {task.completed ? (
                                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={task.completed ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 line-through'}>
                                        {task.title}
                                      </p>
                                      <p className="text-xs text-primary-500 mt-0.5">
                                        {task.goal}
                                      </p>
                                      {task.result && (
                                        <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm text-green-700 dark:text-green-300">
                                          <FileText className="w-3 h-3 inline mr-1" />
                                          {task.result}
                                        </div>
                                      )}
                                    </div>
                                    <span className={`text-sm font-bold ${
                                      task.completed ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                      {task.completed ? `+${task.points}` : '–'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {data.reflection && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                рефлексия ({data.reflection.format})
                              </h4>
                              <div className="p-3 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                                {data.reflection.answers.map((answer, idx) => (
                                  <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                    {answer}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
