import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Send, Sparkles, Lock, Plus, RefreshCw, Zap, AlertCircle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useStore } from '../store/useStore'
import { TEST_METHODS } from '../lib/icons'
import { generateReflection, generateWeeklyInsight } from '../lib/api'

// ============================
// AI-generated question type
// ============================
interface AIQuestion {
  id: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'surprise'
  question: string
  options?: string[]
}

// ============================
// Custom answer input component
// ============================
function CustomAnswerInput({ onAdd }: { onAdd: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  
  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim())
      setText('')
      setIsOpen(false)
    }
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 p-3 rounded-xl text-sm text-primary-500 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all w-full"
      >
        <Plus className="w-4 h-4" />
        свой вариант
      </button>
    )
  }
  
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="напиши свой вариант..."
        className="input flex-1 text-sm"
        autoFocus
      />
      <button
        onClick={handleAdd}
        disabled={!text.trim()}
        className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm disabled:opacity-50"
      >
        OK
      </button>
      <button
        onClick={() => { setIsOpen(false); setText('') }}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm"
      >
        X
      </button>
    </div>
  )
}

export function ReflectionPage() {
  const navigate = useNavigate()
  const { currentMethod, dailyTasks, addPoints, setCurrentMethod, setDailyTasks, setTasksGeneratedDate, preferredModel } = useStore()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({})
  
  // AI states
  const [questions, setQuestions] = useState<AIQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const today = new Date()
  const dayOfWeek = today.getDay()
  const isEndOfWeek = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6
  const [forceOpen, setForceOpen] = useState(false)
  
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = questions.length > 0 && currentQuestionIndex === questions.length - 1
  
  const canProceed = (() => {
    if (!currentQuestion) return false
    const resp = responses[currentQuestion.id]
    if (!resp) return false
    if (Array.isArray(resp)) return resp.length > 0
    if (typeof resp === 'string') return resp.trim().length > 0
    return true
  })()
  
  // Load AI questions
  useEffect(() => {
    if (!isEndOfWeek && !forceOpen) return
    
    const loadQuestions = async () => {
      setIsLoadingQuestions(true)
      setQuestionsError(null)
      
      const tasksSummary = dailyTasks
        .map(t => `${t.title} (${t.difficulty}, ${t.completed ? 'выполнено' : 'не выполнено'})`)
        .join('\n') || 'нет данных о заданиях'
      
      try {
        const result = await generateReflection({
          method_title: currentMethod?.title || 'неизвестная методика',
          method_description: currentMethod?.description || '',
          tasks_summary: tasksSummary,
          model: preferredModel
        })
        
        if (result.error || !result.data?.questions) {
          setQuestionsError(result.error || 'AI не вернул вопросы')
        } else {
          setQuestions(result.data.questions)
        }
      } catch (err) {
        setQuestionsError(`API не ответил: ${err instanceof Error ? err.message : 'ошибка'}`)
      }
      
      setIsLoadingQuestions(false)
    }
    
    loadQuestions()
  }, [forceOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  
  const addCustomOption = (questionId: string, value: string) => {
    setCustomOptions(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), value]
    }))
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Generate weekly insight
    const completedTasks = dailyTasks.filter(t => t.completed).length
    try {
      const insightResult = await generateWeeklyInsight({
        method_title: currentMethod?.title || '',
        reflection_responses: Object.entries(responses).map(([id, value]) => {
          const q = questions.find(qq => qq.id === id)
          return { question: q?.question || id, answer: value }
        }),
        tasks_completed: completedTasks,
        tasks_total: dailyTasks.length,
        model: preferredModel
      })
      
      if (insightResult.data?.text) {
        setWeeklyInsight(insightResult.data.text)
      }
    } catch {
      // не критично
    }
    
    // Add points
    addPoints(50)
    
    // Switch to new method
    const currentMethodId = currentMethod?.id
    const availableMethods = TEST_METHODS.filter(m => m.id !== currentMethodId)
    const newMethod = availableMethods[Math.floor(Math.random() * availableMethods.length)] || TEST_METHODS[0]
    setCurrentMethod({
      id: newMethod.id,
      title: newMethod.title,
      description: newMethod.description,
      duration_days: newMethod.duration_days,
      tasks: []
    })
    
    // Clear tasks for new week
    setDailyTasks([])
    setTasksGeneratedDate(null)
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }
  
  const handleNext = () => {
    if (isLastQuestion) handleSubmit()
    else setCurrentQuestionIndex(prev => prev + 1)
  }
  
  const handleBack = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1)
  }
  
  const setResponse = (value: string | string[]) => {
    setResponses(prev => ({ ...prev, [currentQuestion.id]: value }))
  }
  
  const toggleMultiOption = (option: string) => {
    const current = (responses[currentQuestion.id] as string[]) || []
    if (current.includes(option)) {
      setResponse(current.filter(o => o !== option))
    } else {
      setResponse([...current, option])
    }
  }
  
  // Lock screen
  if (!isEndOfWeek && !forceOpen) {
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + 7 - dayOfWeek
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            рефлексия откроется в пятницу
          </h2>
          <p className="text-gray-500 mb-2">
            {daysUntilFriday === 1 ? 'завтра!' : `через ${daysUntilFriday} дн.`}
          </p>
          <p className="text-sm text-gray-400 mb-8 max-w-xs">
            сначала поживи с методикой, попробуй задания. 
            рефлексия будет доступна с пятницы по воскресенье.
          </p>
          <button
            onClick={() => setForceOpen(true)}
            className="text-sm text-primary-500 hover:text-primary-600 underline underline-offset-4"
          >
            всё равно открыть (для тестирования)
          </button>
        </div>
      </Layout>
    )
  }
  
  // Loading questions
  if (isLoadingQuestions) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Zap className="w-10 h-10 text-primary-500 animate-pulse mb-4" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            AI готовит вопросы...
          </h2>
          <p className="text-sm text-gray-400">обычно занимает 5–10 секунд</p>
        </div>
      </Layout>
    )
  }
  
  // Error loading questions
  if (questionsError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            не удалось загрузить вопросы
          </h2>
          <p className="text-sm text-red-500 mb-6">{questionsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            попробовать снова
          </button>
        </div>
      </Layout>
    )
  }
  
  // Submitting
  if (isSubmitting) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Zap className="w-10 h-10 text-accent-500 animate-pulse mb-4" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            AI анализирует неделю...
          </h2>
          <p className="text-sm text-gray-400">генерируем недельный инсайт</p>
        </div>
      </Layout>
    )
  }
  
  // Success screen
  if (isSubmitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-6 animate-bounce-slow">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            неделя завершена!
          </h2>
          
          {/* Weekly Insight */}
          {weeklyInsight && (
            <div className="card bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 max-w-sm w-full mb-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-accent-500 font-medium mb-1">недельный инсайт</p>
                  <p className="text-sm text-accent-700 dark:text-accent-300">{weeklyInsight}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-accent-100 dark:bg-accent-900/30 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-accent-500" />
            <span className="font-bold text-accent-700 dark:text-accent-300">+50 очков</span>
          </div>
          
          {currentMethod && (
            <div className="card bg-gradient-to-br from-primary-500 to-accent-500 text-white max-w-sm w-full mb-6">
              <p className="text-sm opacity-80 mb-1">новая методика:</p>
              <h3 className="text-lg font-bold">{currentMethod.title}</h3>
              <p className="text-sm opacity-80 mt-1">{currentMethod.description}</p>
            </div>
          )}
          <button onClick={() => navigate('/')} className="btn btn-primary">
            начать новую неделю
          </button>
        </div>
      </Layout>
    )
  }
  
  if (!currentQuestion) return null
  
  // All options for current question (base + custom)
  const allOptions = currentQuestion.options 
    ? [...currentQuestion.options, ...(customOptions[currentQuestion.id] || [])]
    : undefined
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-primary-500 font-medium mb-1">еженедельная рефлексия</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentMethod?.title || 'эта неделя'}
          </h1>
        </div>
        
        <div className="flex gap-1">
          {questions.map((_, index) => (
            <div 
              key={index}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                index < currentQuestionIndex 
                  ? 'bg-primary-500'
                  : index === currentQuestionIndex
                    ? 'bg-primary-300'
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        <p className="text-center text-sm text-gray-400">
          {currentQuestionIndex + 1} / {questions.length}
        </p>
        
        <div className="card min-h-[300px] flex flex-col">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
            {currentQuestion.question}
          </p>
          
          {/* SINGLE CHOICE */}
          {currentQuestion.type === 'single_choice' && allOptions && (
            <div className="flex-1 flex flex-col gap-2">
              {allOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setResponse(option)}
                  className={`p-3 rounded-xl text-left text-sm transition-all ${
                    responses[currentQuestion.id] === option
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 font-medium'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
              <CustomAnswerInput onAdd={(val) => {
                addCustomOption(currentQuestion.id, val)
                setResponse(val)
              }} />
            </div>
          )}
          
          {/* MULTI CHOICE */}
          {currentQuestion.type === 'multi_choice' && allOptions && (
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-3">можно выбрать несколько</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {allOptions.map((option) => {
                  const selected = ((responses[currentQuestion.id] as string[]) || []).includes(option)
                  return (
                    <button
                      key={option}
                      onClick={() => toggleMultiOption(option)}
                      className={`px-3 py-2 rounded-full text-sm transition-all ${
                        selected
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              <CustomAnswerInput onAdd={(val) => {
                addCustomOption(currentQuestion.id, val)
                toggleMultiOption(val)
              }} />
            </div>
          )}
          
          {/* TEXT */}
          {currentQuestion.type === 'text' && (
            <textarea
              value={responses[currentQuestion.id] as string || ''}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="напиши свой ответ..."
              className="input flex-1 resize-none"
              rows={4}
            />
          )}
          
          {/* SURPRISE – render like single choice if has options, otherwise text input */}
          {currentQuestion.type === 'surprise' && (
            <>
              {allOptions && allOptions.length > 0 ? (
                <div className="flex-1 flex flex-col gap-2">
                  {allOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setResponse(option)}
                      className={`p-3 rounded-xl text-left text-sm transition-all ${
                        responses[currentQuestion.id] === option
                          ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 font-medium'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                  <CustomAnswerInput onAdd={(val) => {
                    addCustomOption(currentQuestion.id, val)
                    setResponse(val)
                  }} />
                </div>
              ) : (
                <input
                  type="text"
                  value={responses[currentQuestion.id] as string || ''}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="твой ответ..."
                  className="input text-center text-lg"
                />
              )}
            </>
          )}
        </div>
        
        <div className="flex gap-3">
          {currentQuestionIndex > 0 && (
            <button onClick={handleBack} className="btn btn-secondary flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              назад
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={!canProceed}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLastQuestion ? (
              <><Send className="w-5 h-5" /> завершить</>
            ) : (
              <>далее <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </Layout>
  )
}
