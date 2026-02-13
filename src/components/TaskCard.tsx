import { useState } from 'react'
import { Check, Star, ChevronDown, ChevronUp, X, Image, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { DailyTask, TaskResult } from '../types'

interface DifficultyConfig {
  label: string
  points: number
  color: string
  emoji: string
}

interface TaskCardProps {
  task: DailyTask
  difficultyConfig?: DifficultyConfig
}

export function TaskCard({ task, difficultyConfig }: TaskCardProps) {
  const { completeTask, goals, dailyTasks, setDailyTasks } = useStore()
  const [showResult, setShowResult] = useState(false)
  const [resultText, setResultText] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  
  const linkedGoal = task.goal_id ? goals.find(g => g.id === task.goal_id) : null
  const linkedSubtask = linkedGoal?.subtasks?.filter(s => !s.completed).sort((a, b) => a.order - b.order)[0] || null
  
  // Fallback: use stored titles if goal not found by ID
  const displayGoalTitle = linkedGoal?.title || task.goal_title
  const displaySubtaskTitle = linkedSubtask?.title || task.subtask_title
  
  const handleComplete = () => {
    if (task.completed) return
    
    // If we have a result, save it
    if (resultText || resultImage) {
      const result: TaskResult = {
        type: resultImage ? 'image' : 'text',
        content: resultImage || resultText,
        created_at: new Date().toISOString()
      }
      
      setDailyTasks(dailyTasks.map(t => 
        t.id === task.id ? { ...t, result } : t
      ))
    }
    
    completeTask(task.id)
    setShowResult(false)
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setResultImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  return (
    <div 
      className={`card transition-all duration-300 ${
        task.completed 
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' 
          : 'hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Button */}
        <button
          onClick={handleComplete}
          disabled={task.completed}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
          }`}
        >
          {task.completed && <Check className="w-4 h-4" />}
        </button>
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Difficulty Badge */}
              {difficultyConfig && !task.completed && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${
                  task.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  task.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {difficultyConfig.emoji} {difficultyConfig.label}
                </span>
              )}
              
              <h3 className={`font-medium ${
                task.completed 
                  ? 'text-green-700 dark:text-green-300 line-through' 
                  : 'text-gray-800 dark:text-gray-200'
              }`}>
                {task.title}
              </h3>
              
              <p className={`text-sm mt-1 ${
                task.completed 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500'
              }`}>
                {task.description}
              </p>
              
              {displayGoalTitle && (
                <div className="mt-2 text-xs text-primary-500">
                  <p className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {displayGoalTitle}
                  </p>
                  {displaySubtaskTitle && (
                    <p className="ml-4 text-primary-400">
                      &rarr; {displaySubtaskTitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Points Badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${
              task.completed
                ? 'bg-green-500 text-white'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            }`}>
              +{task.points_earned}
            </div>
          </div>
          
          {/* Result Section (for incomplete tasks) */}
          {!task.completed && (
            <div className="mt-3">
              <button
                onClick={() => setShowResult(!showResult)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 transition-colors"
              >
                {showResult ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                добавить результат (опционально)
              </button>
              
              {showResult && (
                <div className="mt-3 space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  {/* Text Result */}
                  <textarea
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder="опиши что сделала..."
                    className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none"
                    rows={3}
                  />
                  
                  {/* Image Upload */}
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <Image className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">добавить фото</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  
                  {/* Preview */}
                  {resultImage && (
                    <div className="relative">
                      <img 
                        src={resultImage} 
                        alt="result" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setResultImage(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Submit */}
                  <button
                    onClick={handleComplete}
                    className="w-full btn btn-primary text-sm"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    выполнено {resultText || resultImage ? '+ с результатом' : ''}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Saved Result (for completed tasks) */}
          {task.completed && task.result && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                твой результат:
              </p>
              {task.result.type === 'text' && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{task.result.content}</p>
              )}
              {task.result.type === 'image' && (
                <img 
                  src={task.result.content} 
                  alt="result" 
                  className="w-full h-32 object-cover rounded-lg mt-1"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
