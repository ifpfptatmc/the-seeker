import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, Archive, Check, X, Upload, Edit2, CheckCircle, RotateCcw, Trash2, HelpCircle, FileText, Lock, Unlock, GripVertical, Circle, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { IconPicker } from '../components/IconPicker'
import { useStore } from '../store/useStore'
import { SPHERE_ICONS, SPHERE_COLORS } from '../lib/icons'
import { isConfigured as isTodoistConfigured } from '../lib/todoist'
import { pullSync, pushGoalCreate, pushGoalComplete, pushSubtaskCreate, pushSubtaskUpdate, pushSubtaskComplete, pushSubtaskReopen } from '../lib/sync'
import type { Sphere, Goal, Subtask } from '../types'

const IMPORT_TEMPLATE = `## 🎯 карьера
профессиональный рост

• пройти курс | со всеми заданиями
  - установить среду
  - пройти первый модуль
  - финальный проект
• получить повышение | до конца года
- выступить на конференции

## 💪 здоровье  
физическое и ментальное

пробежать марафон | тренировки 3р/нед
  - начать бегать 3 раза в неделю
  - пробежать 10 км
  - полумарафон
медитировать | 10 мин утром`

export function GoalsPage() {
  const { spheres, goals, addSphere, addGoal, addGoalsBatch, updateGoal, archiveGoal, completeGoal, restoreGoal, updateSphere, deleteSphere, addSubtask, updateSubtask, toggleSubtask, deleteSubtask, reorderSubtasks, toggleStrictOrder } = useStore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [expandedSpheres, setExpandedSpheres] = useState<string[]>([])
  const [showAddSphere, setShowAddSphere] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState<string | null>(null)
  const [showBatchImport, setShowBatchImport] = useState<string | null>(null)
  const [showFullImport, setShowFullImport] = useState(false)
  const [showEditSphere, setShowEditSphere] = useState<string | null>(null)
  const [showImportHelp, setShowImportHelp] = useState(false)
  const [newSphereName, setNewSphereName] = useState('')
  const [newSphereDescription, setNewSphereDescription] = useState('')
  const [newSphereColor, setNewSphereColor] = useState(SPHERE_COLORS[0].value)
  const [newSphereIcon, setNewSphereIcon] = useState(SPHERE_ICONS[0])
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDescription, setNewGoalDescription] = useState('')
  const [batchGoalsText, setBatchGoalsText] = useState('')
  const [fullImportText, setFullImportText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [draggedSubtask, setDraggedSubtask] = useState<string | null>(null)
  const [editingSubtask, setEditingSubtask] = useState<{ goalId: string; subtaskId: string } | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')
  
  const runSync = useCallback(async () => {
    if (!isTodoistConfigured() || isSyncing) return
    setIsSyncing(true)
    try {
      await pullSync(spheres, goals, updateSphere, updateGoal, addGoal, archiveGoal)
    } catch (err) {
      console.error('sync error:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [spheres, goals, updateSphere, updateGoal, addGoal, archiveGoal, isSyncing])
  
  // Auto-sync on mount
  useEffect(() => {
    if (isTodoistConfigured() && spheres.some(s => s.todoist_id)) {
      runSync()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const toggleSphere = (id: string) => {
    setExpandedSpheres(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }
  
  const handleAddSphere = () => {
    if (!newSphereName.trim()) return
    
    const sphere: Sphere = {
      id: `sphere-${Date.now()}`,
      user_id: 'demo',
      name: newSphereName,
      description: newSphereDescription || undefined,
      color: newSphereColor,
      icon: newSphereIcon,
      order: spheres.length,
      created_at: new Date().toISOString()
    }
    
    addSphere(sphere)
    setNewSphereName('')
    setNewSphereDescription('')
    setNewSphereColor(SPHERE_COLORS[0].value)
    setNewSphereIcon(SPHERE_ICONS[0])
    setShowAddSphere(false)
    setExpandedSpheres(prev => [...prev, sphere.id])
  }
  
  const handleAddGoal = (sphereId: string) => {
    if (!newGoalTitle.trim()) return
    
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      user_id: 'demo',
      sphere_id: sphereId,
      title: newGoalTitle,
      description: newGoalDescription || undefined,
      status: 'active',
      progress: 0,
      subtasks: [],
      strict_order: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    addGoal(goal)
    
    // Push to Todoist
    if (isTodoistConfigured()) {
      const sphere = spheres.find(s => s.id === sphereId)
      if (sphere?.todoist_id) {
        pushGoalCreate(goal, sphere).then(todoistId => {
          if (todoistId) updateGoal(goal.id, { todoist_id: todoistId })
        })
      }
    }
    
    setNewGoalTitle('')
    setNewGoalDescription('')
    setShowAddGoal(null)
  }
  
  const handleBatchImport = (sphereId: string) => {
    if (!batchGoalsText.trim()) return
    
    const lines = batchGoalsText.split('\n').filter(line => line.trim())
    const newGoals: Goal[] = lines.map((line, index) => {
      const cleanLine = line.trim().replace(/^[-•*]\s*/, '')
      const [title, description] = cleanLine.split('|').map(s => s.trim())
      
      return {
        id: `goal-${Date.now()}-${index}`,
        user_id: 'demo',
        sphere_id: sphereId,
        title: title,
        description: description || undefined,
        status: 'active',
        progress: 0,
        subtasks: [],
        strict_order: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
    
    addGoalsBatch(newGoals)
    setBatchGoalsText('')
    setShowBatchImport(null)
  }
  
  const handleFullImport = () => {
    if (!fullImportText.trim()) return
    
    const lines = fullImportText.split('\n')
    const newSpheres: Sphere[] = []
    const newGoals: Goal[] = []
    
    let currentSphere: Sphere | null = null
    let currentGoal: Goal | null = null
    let expectDescription = false
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        expectDescription = false
        continue
      }
      
      // Check indentation: if line starts with spaces/tabs, it's a subtask
      const isIndented = /^[\t]|^[ ]{2,}/.test(line) && !line.trimStart().startsWith('#')
      
      // Sphere header: ## 🎯 Name or # 🎯 Name
      if (trimmed.startsWith('#')) {
        const content = trimmed.replace(/^#+\s*/g, '').replace(/^#+\s*/g, '').trim()
        const match = content.match(/^([^\w\s]+)\s*(.+)$/)
        
        if (match) {
          const [, icon, name] = match
          currentSphere = {
            id: `sphere-${Date.now()}-${newSpheres.length}`,
            user_id: 'demo',
            name: name.trim(),
            icon: icon.trim(),
            color: SPHERE_COLORS[newSpheres.length % SPHERE_COLORS.length].value,
            order: spheres.length + newSpheres.length,
            created_at: new Date().toISOString()
          }
          newSpheres.push(currentSphere)
          currentGoal = null
          expectDescription = true
        }
      }
      // Subtask: indented line under a goal
      else if (isIndented && currentGoal) {
        const content = trimmed.replace(/^[-–—•*>»○●□■◦‣⁃➤➔→\d.)\]]+\s*/, '').trim()
        if (!content) continue
        
        const subtask: Subtask = {
          id: `sub-${Date.now()}-${currentGoal.subtasks.length}`,
          title: content,
          completed: false,
          order: currentGoal.subtasks.length
        }
        currentGoal.subtasks.push(subtask)
      }
      // Sphere description: line after ## that does NOT contain | and does NOT start with list markers
      else if (expectDescription && currentSphere) {
        const hasMarker = /^[-–—•*>»○●□■◦‣⁃➤➔→\d.)\]]+\s/.test(trimmed)
        const hasPipe = trimmed.includes('|')
        
        if (!hasMarker && !hasPipe) {
          currentSphere.description = trimmed
          expectDescription = false
          continue
        } else {
          expectDescription = false
        }
      }
      
      // Goal: non-indented line after sphere header
      if (!trimmed.startsWith('#') && currentSphere && !expectDescription && !isIndented) {
        const content = trimmed.replace(/^[-–—•*>»○●□■◦‣⁃➤➔→\d.)\]]+\s*/, '').trim()
        if (!content) continue
        
        const [title, desc] = content.split('|').map(s => s.trim())
        
        if (title === currentSphere.description) continue
        
        currentGoal = {
          id: `goal-${Date.now()}-${newGoals.length}`,
          user_id: 'demo',
          sphere_id: currentSphere.id,
          title: title,
          description: desc || undefined,
          status: 'active',
          progress: 0,
          subtasks: [],
          strict_order: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        newGoals.push(currentGoal)
      }
    }
    
    newSpheres.forEach(s => addSphere(s))
    if (newGoals.length > 0) addGoalsBatch(newGoals)
    
    setFullImportText('')
    setShowFullImport(false)
    setExpandedSpheres(prev => [...prev, ...newSpheres.map(s => s.id)])
  }
  
  const handleEditSphere = (sphere: Sphere) => {
    setShowEditSphere(sphere.id)
    setNewSphereName(sphere.name)
    setNewSphereDescription(sphere.description || '')
    setNewSphereColor(sphere.color)
    setNewSphereIcon(sphere.icon)
  }
  
  const handleSaveEditSphere = (id: string) => {
    updateSphere(id, {
      name: newSphereName,
      description: newSphereDescription || undefined,
      color: newSphereColor,
      icon: newSphereIcon
    })
    setShowEditSphere(null)
    setNewSphereName('')
    setNewSphereDescription('')
  }
  
  const handleDeleteSphere = (id: string) => {
    if (confirm('удалить сферу и все её цели?')) {
      deleteSphere(id)
      setShowEditSphere(null)
    }
  }
  
  const activeGoals = goals.filter(g => g.status === 'active')
  const archivedGoals = goals.filter(g => g.status === 'archived')
  const completedGoals = goals.filter(g => g.status === 'completed')
  
  const allCountableGoals = [...activeGoals, ...completedGoals]
  const totalProgress = allCountableGoals.length > 0 
    ? Math.round(allCountableGoals.reduce((sum, g) => sum + g.progress, 0) / allCountableGoals.length)
    : 0
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              прогресс года
            </h2>
            <div className="flex items-center gap-3">
              {isTodoistConfigured() && (
                <button
                  onClick={runSync}
                  disabled={isSyncing}
                  className="p-1.5 text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50"
                  title="синхронизировать с Todoist"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <span className="text-2xl font-bold text-gradient">{totalProgress}%</span>
            </div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{activeGoals.length} активных</span>
            <span>{completedGoals.length} выполнено</span>
            <span>{spheres.length} сфер</span>
          </div>
        </div>
        
        {/* Full Import Button */}
        <button
          onClick={() => setShowFullImport(true)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <FileText className="w-5 h-5" />
          импортировать всё
        </button>
        
        {/* Full Import Modal */}
        {showFullImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  импорт сфер и целей
                </h3>
                <button 
                  onClick={() => setShowImportHelp(!showImportHelp)}
                  className="p-2 text-gray-400 hover:text-primary-500"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
              
              {showImportHelp && (
                <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm">
                  <p className="font-medium text-primary-700 dark:text-primary-300 mb-2">формат:</p>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
{IMPORT_TEMPLATE}
                  </pre>
                  <p className="mt-3 text-gray-500">
                    <strong>##</strong> = сфера (иконка + название)<br/>
                    строка без маркера и без | = описание сферы<br/>
                    строка без отступа = цель (название | описание)<br/>
                    строка с отступом (2+ пробела) = подзадача
                  </p>
                </div>
              )}
              
              <textarea
                value={fullImportText}
                onChange={(e) => setFullImportText(e.target.value)}
                placeholder="вставь сюда сферы и цели..."
                className="input text-sm min-h-[200px] font-mono"
                autoFocus
              />
              
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleFullImport}
                  className="btn btn-primary flex-1"
                  disabled={!fullImportText.trim()}
                >
                  импортировать
                </button>
                <button 
                  onClick={() => { setShowFullImport(false); setFullImportText(''); }}
                  className="btn btn-secondary"
                >
                  отмена
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Spheres */}
        <div className="space-y-3">
          {spheres.map(sphere => {
            const sphereActiveGoals = activeGoals.filter(g => g.sphere_id === sphere.id)
            const sphereCompletedGoals = completedGoals.filter(g => g.sphere_id === sphere.id)
            const allSphereGoals = [...sphereActiveGoals, ...sphereCompletedGoals]
            const isExpanded = expandedSpheres.includes(sphere.id)
            const isEditing = showEditSphere === sphere.id
            const sphereProgress = allSphereGoals.length > 0
              ? Math.round(allSphereGoals.reduce((sum, g) => sum + g.progress, 0) / allSphereGoals.length)
              : 0
            
            return (
              <div key={sphere.id} className="card">
                {/* Sphere Header */}
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newSphereName}
                      onChange={(e) => setNewSphereName(e.target.value)}
                      placeholder="название сферы"
                      className="input"
                      autoFocus
                    />
                    <textarea
                      value={newSphereDescription}
                      onChange={(e) => setNewSphereDescription(e.target.value)}
                      placeholder="описание (опционально)"
                      className="input text-sm min-h-[60px]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">иконка</p>
                      <IconPicker selected={newSphereIcon} onSelect={setNewSphereIcon} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">цвет</p>
                      <div className="flex flex-wrap gap-2">
                        {SPHERE_COLORS.map(color => (
                          <button
                            key={color.value}
                            onClick={() => setNewSphereColor(color.value)}
                            className={`w-8 h-8 ${color.value} rounded-full transition-all ${
                              newSphereColor === color.value 
                                ? 'ring-2 ring-offset-2 ring-gray-400'
                                : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEditSphere(sphere.id)} className="btn btn-primary flex-1">
                        сохранить
                      </button>
                      <button onClick={() => setShowEditSphere(null)} className="btn btn-secondary">
                        отмена
                      </button>
                      <button onClick={() => handleDeleteSphere(sphere.id)} className="btn bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleSphere(sphere.id)}
                    >
                      <div className={`w-10 h-10 ${sphere.color} rounded-xl flex items-center justify-center text-xl`}>
                        {sphere.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {sphere.name}
                        </h3>
                        {sphere.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{sphere.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {sphereActiveGoals.length} активных • {sphereCompletedGoals.length} выполнено • {sphereProgress}%
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEditSphere(sphere)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" onClick={() => toggleSphere(sphere.id)} />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" onClick={() => toggleSphere(sphere.id)} />
                    )}
                  </div>
                )}
                
                {/* Expanded Content */}
                {isExpanded && !isEditing && (
                  <div className="mt-4 space-y-2">
                    {/* Active Goals */}
                    {sphereActiveGoals.map(goal => {
                      const subtasks = goal.subtasks || []
                      const completedSubtasks = subtasks.filter(s => s.completed).length
                      const isSubtasksOpen = showSubtasks === goal.id
                      
                      return (
                        <div 
                          key={goal.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => {
                                completeGoal(goal.id)
                                if (isTodoistConfigured() && goal.todoist_id) {
                                  pushGoalComplete(goal)
                                }
                              }}
                              className="mt-1 p-1.5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title="отметить выполненной"
                            >
                              <Check className="w-3 h-3 text-transparent hover:text-green-500" />
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 flex-1">
                                  {goal.title}
                                </p>
                                {subtasks.length > 0 && (
                                  <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                    {completedSubtasks}/{subtasks.length}
                                  </span>
                                )}
                              </div>
                              {goal.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 relative">
                                  <div className="h-2 bg-gray-300/40 dark:bg-gray-600/40 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${goal.progress}%`,
                                        background: `linear-gradient(90deg, 
                                          rgb(56, 189, 248) 0%, 
                                          rgb(59, 130, 246) ${Math.min(goal.progress * 1.5, 100)}%)`
                                      }}
                                    />
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={goal.progress}
                                    onChange={(e) => updateGoal(goal.id, { progress: parseInt(e.target.value) })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-8">{goal.progress}%</span>
                              </div>
                              
                              {/* Subtasks toggle */}
                              <button
                                onClick={() => {
                                  setShowSubtasks(isSubtasksOpen ? null : goal.id)
                                  setNewSubtaskTitle('')
                                }}
                                className="mt-2 text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                              >
                                {isSubtasksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                {subtasks.length > 0 ? `подзадачи (${completedSubtasks}/${subtasks.length})` : 'добавить подзадачи'}
                              </button>
                            </div>
                            <button 
                              onClick={() => archiveGoal(goal.id)}
                              className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                              title="архивировать"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Subtasks panel */}
                          {isSubtasksOpen && (
                            <div className="mt-3 ml-9 space-y-1">
                              {/* Strict order toggle */}
                              {subtasks.length > 0 && (
                                <button
                                  onClick={() => toggleStrictOrder(goal.id)}
                                  className={`flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded-lg transition-colors ${
                                    goal.strict_order 
                                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  {goal.strict_order ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                  {goal.strict_order ? 'строгий порядок' : 'свободный порядок'}
                                </button>
                              )}
                              
                              {/* Subtask list */}
                              {[...subtasks].sort((a, b) => a.order - b.order).map((subtask, idx) => {
                                const isLocked = goal.strict_order && idx > 0 && !subtasks
                                  .filter(s => s.order < subtask.order)
                                  .every(s => s.completed)
                                
                                return (
                                  <div
                                    key={subtask.id}
                                    draggable
                                    onDragStart={() => setDraggedSubtask(subtask.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                      if (draggedSubtask && draggedSubtask !== subtask.id) {
                                        const sorted = [...subtasks].sort((a, b) => a.order - b.order)
                                        const ids = sorted.map(s => s.id)
                                        const fromIdx = ids.indexOf(draggedSubtask)
                                        const toIdx = ids.indexOf(subtask.id)
                                        ids.splice(fromIdx, 1)
                                        ids.splice(toIdx, 0, draggedSubtask)
                                        reorderSubtasks(goal.id, ids)
                                      }
                                      setDraggedSubtask(null)
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-lg group transition-colors ${
                                      subtask.completed 
                                        ? 'bg-green-50/50 dark:bg-green-900/10' 
                                        : isLocked 
                                          ? 'opacity-50' 
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                  >
                                    <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <button
                                      onClick={() => {
                                        if (isLocked) return
                                        toggleSubtask(goal.id, subtask.id)
                                        // Push to Todoist
                                        if (isTodoistConfigured() && subtask.todoist_id) {
                                          if (subtask.completed) {
                                            // Was completed, now reopening
                                            pushSubtaskReopen(subtask)
                                          } else {
                                            // Was active, now completing
                                            pushSubtaskComplete(subtask)
                                          }
                                        }
                                      }}
                                      disabled={isLocked}
                                      className="flex-shrink-0"
                                    >
                                      {subtask.completed ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : isLocked ? (
                                        <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 hover:text-primary-500" />
                                      )}
                                    </button>
                                    {editingSubtask?.goalId === goal.id && editingSubtask?.subtaskId === subtask.id ? (
                                      <input
                                        type="text"
                                        value={editingSubtaskTitle}
                                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && editingSubtaskTitle.trim()) {
                                            updateSubtask(goal.id, subtask.id, { title: editingSubtaskTitle.trim() })
                                            if (isTodoistConfigured() && subtask.todoist_id) {
                                              pushSubtaskUpdate({ ...subtask, title: editingSubtaskTitle.trim() })
                                            }
                                            setEditingSubtask(null)
                                          }
                                          if (e.key === 'Escape') setEditingSubtask(null)
                                        }}
                                        onBlur={() => {
                                          if (editingSubtaskTitle.trim() && editingSubtaskTitle.trim() !== subtask.title) {
                                            updateSubtask(goal.id, subtask.id, { title: editingSubtaskTitle.trim() })
                                            if (isTodoistConfigured() && subtask.todoist_id) {
                                              pushSubtaskUpdate({ ...subtask, title: editingSubtaskTitle.trim() })
                                            }
                                          }
                                          setEditingSubtask(null)
                                        }}
                                        className="flex-1 text-sm bg-white dark:bg-gray-700 border border-primary-300 dark:border-primary-600 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary-400 text-gray-700 dark:text-gray-200"
                                        autoFocus
                                      />
                                    ) : (
                                      <span 
                                        className={`text-sm flex-1 cursor-text ${
                                          subtask.completed 
                                            ? 'text-gray-400 line-through' 
                                            : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                        onClick={() => {
                                          setEditingSubtask({ goalId: goal.id, subtaskId: subtask.id })
                                          setEditingSubtaskTitle(subtask.title)
                                        }}
                                      >
                                        {subtask.title}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => deleteSubtask(goal.id, subtask.id)}
                                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )
                              })}
                              
                              {/* Add subtask */}
                              <div className="flex items-center gap-2 mt-1">
                                <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={showSubtasks === goal.id ? newSubtaskTitle : ''}
                                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                                      const newSub = {
                                        id: `sub-${Date.now()}`,
                                        title: newSubtaskTitle.trim(),
                                        completed: false,
                                        order: subtasks.length
                                      }
                                      addSubtask(goal.id, newSub)
                                      // Push to Todoist
                                      if (isTodoistConfigured() && goal.todoist_id) {
                                        const sp = spheres.find(s => s.id === goal.sphere_id)
                                        if (sp) {
                                          pushSubtaskCreate(newSub, goal, sp).then(tid => {
                                            if (tid) {
                                              updateSubtask(goal.id, newSub.id, { todoist_id: tid } as any)
                                            }
                                          })
                                        }
                                      }
                                      setNewSubtaskTitle('')
                                    }
                                  }}
                                  placeholder="добавить подзадачу..."
                                  className="flex-1 text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                />
                                {newSubtaskTitle.trim() && (
                                  <button
                                    onClick={() => {
                                      const newSub = {
                                        id: `sub-${Date.now()}`,
                                        title: newSubtaskTitle.trim(),
                                        completed: false,
                                        order: subtasks.length
                                      }
                                      addSubtask(goal.id, newSub)
                                      // Push to Todoist
                                      if (isTodoistConfigured() && goal.todoist_id) {
                                        const sp = spheres.find(s => s.id === goal.sphere_id)
                                        if (sp) {
                                          pushSubtaskCreate(newSub, goal, sp).then(tid => {
                                            if (tid) {
                                              updateSubtask(goal.id, newSub.id, { todoist_id: tid } as any)
                                            }
                                          })
                                        }
                                      }
                                      setNewSubtaskTitle('')
                                    }}
                                    className="text-primary-500 hover:text-primary-600"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {/* Completed Goals */}
                    {sphereCompletedGoals.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">выполнено</p>
                        {sphereCompletedGoals.map(goal => (
                          <div 
                            key={goal.id}
                            className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div className="flex-1">
                              <span className="text-gray-600 dark:text-gray-400 line-through">
                                {goal.title}
                              </span>
                              {goal.description && (
                                <p className="text-xs text-gray-400 line-through">{goal.description}</p>
                              )}
                            </div>
                            <button 
                              onClick={() => restoreGoal(goal.id)}
                              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                              title="восстановить"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Goal */}
                    {showAddGoal === sphere.id ? (
                      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <input
                          type="text"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="название цели..."
                          className="input text-sm"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddGoal(sphere.id)}
                        />
                        <textarea
                          value={newGoalDescription}
                          onChange={(e) => setNewGoalDescription(e.target.value)}
                          placeholder="описание (опционально)..."
                          className="input text-sm min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAddGoal(sphere.id)}
                            className="btn btn-primary text-sm flex-1"
                          >
                            <Check className="w-4 h-4" />
                            добавить
                          </button>
                          <button 
                            onClick={() => setShowAddGoal(null)}
                            className="btn btn-secondary text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : showBatchImport === sphere.id ? (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <HelpCircle className="w-4 h-4" />
                          <span>формат: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">название | описание</code></span>
                        </div>
                        <textarea
                          value={batchGoalsText}
                          onChange={(e) => setBatchGoalsText(e.target.value)}
                          placeholder="- цель 1 | описание цели&#10;- цель 2 | ещё описание&#10;- цель 3"
                          className="input text-sm min-h-[120px] font-mono"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleBatchImport(sphere.id)}
                            className="btn btn-primary text-sm flex-1"
                          >
                            импорт ({batchGoalsText.split('\n').filter(l => l.trim()).length})
                          </button>
                          <button 
                            onClick={() => { setShowBatchImport(null); setBatchGoalsText(''); }}
                            className="btn btn-secondary text-sm"
                          >
                            отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddGoal(sphere.id)}
                          className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          добавить цель
                        </button>
                        <button
                          onClick={() => setShowBatchImport(sphere.id)}
                          className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:border-accent-500 hover:text-accent-500 transition-colors"
                          title="импортировать несколько"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Add Sphere */}
        {showAddSphere ? (
          <div className="card space-y-4">
            <input
              type="text"
              value={newSphereName}
              onChange={(e) => setNewSphereName(e.target.value)}
              placeholder="название сферы..."
              className="input"
              autoFocus
            />
            <textarea
              value={newSphereDescription}
              onChange={(e) => setNewSphereDescription(e.target.value)}
              placeholder="описание (опционально)..."
              className="input text-sm min-h-[60px]"
            />
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">иконка</p>
              <IconPicker selected={newSphereIcon} onSelect={setNewSphereIcon} />
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">цвет</p>
              <div className="flex flex-wrap gap-2">
                {SPHERE_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewSphereColor(color.value)}
                    className={`w-8 h-8 ${color.value} rounded-full transition-all ${
                      newSphereColor === color.value 
                        ? 'ring-2 ring-offset-2 ring-gray-400'
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleAddSphere} className="btn btn-primary flex-1">
                создать сферу
              </button>
              <button onClick={() => setShowAddSphere(false)} className="btn btn-secondary">
                отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSphere(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            добавить сферу
          </button>
        )}
        
        {/* Archived Goals */}
        {archivedGoals.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Archive className="w-4 h-4" />
              {archivedGoals.length} в архиве
              {showArchived ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {showArchived && (
              <div className="mt-3 space-y-2">
                {archivedGoals.map(goal => (
                  <div 
                    key={goal.id}
                    className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl"
                  >
                    <div className="flex-1">
                      <span className="text-gray-500">{goal.title}</span>
                      {goal.description && (
                        <p className="text-xs text-gray-400">{goal.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => restoreGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                      title="восстановить"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
