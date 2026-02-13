import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Plus, X, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { Sphere, Goal } from '../types'

const SUGGESTED_SPHERES = [
  { name: 'health', icon: '💪', color: 'bg-green-500' },
  { name: 'career', icon: '💼', color: 'bg-blue-500' },
  { name: 'relationships', icon: '❤️', color: 'bg-pink-500' },
  { name: 'finance', icon: '💰', color: 'bg-amber-500' },
  { name: 'learning', icon: '📚', color: 'bg-purple-500' },
  { name: 'creativity', icon: '🎨', color: 'bg-orange-500' },
  { name: 'mindfulness', icon: '🧘', color: 'bg-teal-500' },
  { name: 'home', icon: '🏠', color: 'bg-indigo-500' },
]

const STEPS = ['welcome', 'spheres', 'goals', 'ready'] as const
type Step = typeof STEPS[number]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setSpheres, setGoals, setOnboardingComplete } = useStore()
  
  const [step, setStep] = useState<Step>('welcome')
  const [selectedSpheres, setSelectedSpheres] = useState<typeof SUGGESTED_SPHERES>([])
  const [goalsMap, setGoalsMap] = useState<Record<string, string[]>>({})
  const [currentGoalInput, setCurrentGoalInput] = useState('')
  const [activeSphereIndex, setActiveSphereIndex] = useState(0)
  
  const currentStepIndex = STEPS.indexOf(step)
  
  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex])
    }
  }
  
  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex])
    }
  }
  
  const toggleSphere = (sphere: typeof SUGGESTED_SPHERES[0]) => {
    setSelectedSpheres(prev => {
      const exists = prev.find(s => s.name === sphere.name)
      if (exists) {
        return prev.filter(s => s.name !== sphere.name)
      }
      return [...prev, sphere]
    })
  }
  
  const addGoal = () => {
    if (!currentGoalInput.trim()) return
    
    const sphereName = selectedSpheres[activeSphereIndex]?.name
    if (!sphereName) return
    
    setGoalsMap(prev => ({
      ...prev,
      [sphereName]: [...(prev[sphereName] || []), currentGoalInput.trim()]
    }))
    setCurrentGoalInput('')
  }
  
  const removeGoal = (sphereName: string, goalIndex: number) => {
    setGoalsMap(prev => ({
      ...prev,
      [sphereName]: prev[sphereName]?.filter((_, i) => i !== goalIndex) || []
    }))
  }
  
  const handleComplete = () => {
    // Create spheres
    const spheres: Sphere[] = selectedSpheres.map((s, i) => ({
      id: `sphere-${Date.now()}-${i}`,
      user_id: 'demo',
      name: s.name,
      color: s.color,
      icon: s.icon,
      order: i,
      created_at: new Date().toISOString()
    }))
    
    // Create goals
    const goals: Goal[] = []
    spheres.forEach(sphere => {
      const sphereGoals = goalsMap[sphere.name] || []
      sphereGoals.forEach((title, i) => {
        goals.push({
          id: `goal-${Date.now()}-${sphere.id}-${i}`,
          user_id: 'demo',
          sphere_id: sphere.id,
          title,
          status: 'active',
          progress: 0,
          subtasks: [],
          strict_order: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })
    })
    
    setSpheres(spheres)
    setGoals(goals)
    setOnboardingComplete(true)
    navigate('/')
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
          style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      
      <div className="max-w-lg mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-bounce-slow">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              welcome to The Seeker
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
              every week, you'll explore a new approach to productivity. 
              no more boring routines – just experiments and discovery.
            </p>
            
            <div className="space-y-4 text-left w-full max-w-sm">
              {[
                { emoji: '🎲', text: 'random weekly methods' },
                { emoji: '🎯', text: 'goals connected to daily tasks' },
                { emoji: '🌱', text: 'character that grows with you' },
                { emoji: '✨', text: 'fun reflections at the end of each week' },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-gray-700 dark:text-gray-300">{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Spheres Step */}
        {step === 'spheres' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              choose your life spheres
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              select areas you want to focus on this year
            </p>
            
            <div className="grid grid-cols-2 gap-3 flex-1">
              {SUGGESTED_SPHERES.map(sphere => {
                const isSelected = selectedSpheres.find(s => s.name === sphere.name)
                return (
                  <button
                    key={sphere.name}
                    onClick={() => toggleSphere(sphere)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-12 h-12 ${sphere.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>
                      {sphere.icon}
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {sphere.name}
                    </p>
                  </button>
                )
              })}
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              {selectedSpheres.length} selected
            </p>
          </div>
        )}
        
        {/* Goals Step */}
        {step === 'goals' && selectedSpheres.length > 0 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              set your goals
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              what do you want to achieve in each sphere?
            </p>
            
            {/* Sphere Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {selectedSpheres.map((sphere, index) => {
                const goalCount = goalsMap[sphere.name]?.length || 0
                return (
                  <button
                    key={sphere.name}
                    onClick={() => setActiveSphereIndex(index)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      activeSphereIndex === index
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{sphere.icon}</span>
                    <span className="font-medium">{sphere.name}</span>
                    {goalCount > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeSphereIndex === index
                          ? 'bg-white/20'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {goalCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Current Sphere Goals */}
            <div className="flex-1 space-y-3">
              {/* Goal Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentGoalInput}
                  onChange={(e) => setCurrentGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  placeholder={`add a ${selectedSpheres[activeSphereIndex]?.name.toLowerCase()} goal...`}
                  className="input flex-1"
                />
                <button onClick={addGoal} className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Goals List */}
              {(goalsMap[selectedSpheres[activeSphereIndex]?.name] || []).map((goal, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <span className="text-lg">{selectedSpheres[activeSphereIndex]?.icon}</span>
                  <span className="flex-1 text-gray-800 dark:text-gray-200">{goal}</span>
                  <button 
                    onClick={() => removeGoal(selectedSpheres[activeSphereIndex]?.name, index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {(goalsMap[selectedSpheres[activeSphereIndex]?.name] || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>no goals yet. add your first one!</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Ready Step */}
        {step === 'ready' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-6 animate-bounce-slow">🚀</div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              you're all set!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
              your first random method is waiting for you. 
              ready to start your journey?
            </p>
            
            <div className="w-full max-w-sm p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-8">
              <div className="flex justify-between mb-4">
                <span className="text-gray-500">spheres</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedSpheres.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">goals</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {Object.values(goalsMap).flat().length}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step !== 'welcome' && (
            <button onClick={handleBack} className="btn btn-secondary flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              back
            </button>
          )}
          
          <button 
            onClick={step === 'ready' ? handleComplete : handleNext}
            disabled={step === 'spheres' && selectedSpheres.length === 0}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {step === 'ready' ? 'start seeking' : 'continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
