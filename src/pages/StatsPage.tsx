import { useState, useMemo } from 'react'
import { Layout } from '../components/Layout'
import { useStore } from '../store/useStore'
import { Target, Flame, Calendar, CheckCircle, Star, ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

// Generate demo calendar data with points
const generateCalendarData = () => {
  const data: Record<string, { tasks: number; points: number }> = {}
  const today = new Date()
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const seed = date.getDate() + date.getMonth() * 31
    
    const easyDone = (seed * 17) % 100 > 20
    const mediumDone = (seed * 23) % 100 > 35
    const hardDone = (seed * 31) % 100 > 55
    
    const tasksCompleted = (easyDone ? 1 : 0) + (mediumDone ? 1 : 0) + (hardDone ? 1 : 0)
    const pointsEarned = (easyDone ? 10 : 0) + (mediumDone ? 25 : 0) + (hardDone ? 40 : 0)
    
    data[dateStr] = { tasks: tasksCompleted, points: pointsEarned }
  }
  
  return data
}

export function StatsPage() {
  const { goals, spheres, progress } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  const calendarData = useMemo(() => generateCalendarData(), [])
  
  const completedGoals = goals.filter(g => g.status === 'completed')
  const totalGoals = goals.filter(g => g.status !== 'archived').length
  
  // Calculate sphere stats
  const sphereStats = spheres.map(sphere => {
    const sphereGoals = goals.filter(g => g.sphere_id === sphere.id && g.status !== 'archived')
    const completed = sphereGoals.filter(g => g.status === 'completed').length
    const total = sphereGoals.length
    const avgProg = total > 0 ? Math.round(sphereGoals.reduce((sum, g) => sum + g.progress, 0) / total) : 0
    return { ...sphere, completed, total, avgProg }
  }).sort((a, b) => b.avgProg - a.avgProg)
  
  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day)
      const dateStr = dateObj.toISOString().split('T')[0]
      const dayData = calendarData[dateStr] || { tasks: 0, points: 0 }
      days.push({
        date: dateStr,
        dateObj,
        day,
        tasks: dayData.tasks,
        points: dayData.points
      })
    }
    
    return days
  }
  
  const monthDays = getDaysInMonth(currentMonth)
  
  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0
    const sortedDates = Object.keys(calendarData).sort().reverse()
    for (const dateStr of sortedDates) {
      if (calendarData[dateStr].tasks > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [calendarData])
  
  // Total points from calendar data
  const totalPoints = useMemo(() => {
    return Object.values(calendarData).reduce((sum, d) => sum + d.points, 0)
  }, [calendarData])
  
  // Selected date stats
  const selectedDateStats = useMemo(() => {
    if (!selectedDate) return null
    const data = calendarData[selectedDate]
    if (!data) return null
    
    const dateObj = new Date(selectedDate)
    return {
      date: dateObj,
      tasks: data.tasks,
      points: data.points,
      formatted: `${dateObj.getDate()} ${MONTHS[dateObj.getMonth()].toLowerCase()}`
    }
  }, [selectedDate, calendarData])
  
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    if (next <= new Date()) {
      setCurrentMonth(next)
    }
  }
  
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && 
                         currentMonth.getFullYear() === new Date().getFullYear()
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gradient">vibe check</h1>
          <p className="text-gray-500">твоя статистика и прогресс</p>
        </div>
        
        {/* Main Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Row 1 */}
          <div className="card bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Flame className="w-5 h-5 mb-1 opacity-80" />
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-xs opacity-80">дней подряд</div>
          </div>
          
          <div className="card bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <Star className="w-5 h-5 mb-1 opacity-80" />
            <div className="text-2xl font-bold">{progress?.points || totalPoints}</div>
            <div className="text-xs opacity-80">всего очков</div>
          </div>
          
          {/* Row 2 */}
          <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CheckCircle className="w-5 h-5 mb-1 opacity-80" />
            <div className="text-2xl font-bold">{completedGoals.length}</div>
            <div className="text-xs opacity-80">целей достигнуто</div>
          </div>
          
          <div className="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <Target className="w-5 h-5 mb-1 opacity-80" />
            <div className="text-2xl font-bold">{totalGoals}</div>
            <div className="text-xs opacity-80">всего целей</div>
          </div>
        </div>
        
        {/* Calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
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
              disabled={isCurrentMonth}
              className={`p-2 rounded-lg ${isCurrentMonth ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }
              
              const bgColor = day.tasks === 3 
                ? 'bg-green-500' 
                : day.tasks === 2 
                  ? 'bg-amber-500' 
                  : day.tasks === 1 
                    ? 'bg-sky-400'
                    : 'bg-gray-100 dark:bg-gray-800'
              
              const isToday = day.date === new Date().toISOString().split('T')[0]
              const isFuture = day.dateObj > new Date()
              const isSelected = day.date === selectedDate
              
              return (
                <button
                  key={day.date}
                  onClick={() => !isFuture && setSelectedDate(day.date === selectedDate ? null : day.date)}
                  disabled={isFuture}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    isFuture 
                      ? 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed' 
                      : `${bgColor} ${day.tasks > 0 ? 'text-white' : 'text-gray-500'} hover:scale-110 cursor-pointer`
                  } ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-500 scale-110' : ''}`}
                >
                  {day.day}
                </button>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-sky-400" />
              <span>1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span>2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>3</span>
            </div>
          </div>
          
          {/* Selected date stats */}
          {selectedDateStats && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-sm text-gray-500 mb-3">
                {selectedDateStats.formatted}
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <div className="text-xl font-bold text-primary-600">{selectedDateStats.tasks}/3</div>
                  <div className="text-xs text-primary-600">задач</div>
                </div>
                <div className="p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                  <div className="text-xl font-bold text-accent-600">+{selectedDateStats.points}</div>
                  <div className="text-xs text-accent-600">очков</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Hint when no date selected */}
          {!selectedDateStats && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-400">
                нажми на день, чтобы увидеть детали
              </p>
            </div>
          )}
        </div>
        
        {/* Sphere Stats */}
        {sphereStats.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-500" />
              прогресс по сферам
            </h3>
            
            <div className="space-y-3">
              {sphereStats.map((sphere, index) => (
                <div key={sphere.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 text-lg">
                    {index === 0 && sphere.total > 0 ? '🥇' : 
                     index === 1 && sphere.total > 0 ? '🥈' : 
                     index === 2 && sphere.total > 0 ? '🥉' : sphere.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{sphere.name}</span>
                      <span className="text-gray-500">{sphere.completed}/{sphere.total}</span>
                    </div>
                    <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${sphere.avgProg}%`,
                          background: `linear-gradient(90deg, 
                            rgb(56, 189, 248) 0%, 
                            rgb(59, 130, 246) ${Math.min(sphere.avgProg * 1.5, 100)}%)`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400 w-10 text-right">
                    {sphere.avgProg}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
