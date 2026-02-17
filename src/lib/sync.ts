// Todoist ↔ Seeker sync engine
import * as todoist from './todoist'
import type { Sphere, Goal, Subtask, DailyTask } from '../types'

const GOALS_ROOT_PROJECT_NAME = 'Цели 2026'
const SEEKER_DAILY_PROJECT_NAME = 'сикер!!'

// ============================
// State types
// ============================

export interface SyncResult {
  spheresCreated: number
  spheresUpdated: number
  goalsCreated: number
  goalsUpdated: number
  goalsArchived: number
  subtasksCreated: number
  subtasksUpdated: number
  dailyTasksPushed: number
  errors: string[]
}

// ============================
// Initial sync: push Seeker → Todoist
// Creates project structure from existing Seeker data
// ============================

export async function initialSync(
  spheres: Sphere[],
  goals: Goal[],
  updateSphere: (id: string, updates: Partial<Sphere>) => void,
  updateGoal: (id: string, updates: Partial<Goal>) => void,
): Promise<SyncResult> {
  const result: SyncResult = {
    spheresCreated: 0, spheresUpdated: 0,
    goalsCreated: 0, goalsUpdated: 0, goalsArchived: 0,
    subtasksCreated: 0, subtasksUpdated: 0,
    dailyTasksPushed: 0, errors: []
  }
  
  try {
    const projects = await todoist.getProjects()
    
    // Find or create root project "Цели 2026"
    let rootProject = projects.find(p => p.name === GOALS_ROOT_PROJECT_NAME && !p.parent_id)
    if (!rootProject) {
      rootProject = await todoist.createProject({ name: GOALS_ROOT_PROJECT_NAME, color: 'blue' })
    }
    const rootId = rootProject.id
    
    // For each sphere: find or create Todoist sub-project
    for (const sphere of spheres) {
      try {
        let sphereProject = sphere.todoist_id
          ? projects.find(p => p.id === sphere.todoist_id)
          : projects.find(p => p.name === sphere.name && p.parent_id === rootId)
        
        if (!sphereProject) {
          sphereProject = await todoist.createProject({
            name: sphere.name,
            parent_id: rootId,
          })
          result.spheresCreated++
        }
        
        // Save todoist_id
        if (sphere.todoist_id !== sphereProject.id) {
          updateSphere(sphere.id, { todoist_id: sphereProject.id })
        }
        
        // Get existing tasks in this project
        const existingTasks = await todoist.getTasks(sphereProject.id)
        
        // For each goal in this sphere: find or create Todoist task
        const sphereGoals = goals.filter(g => g.sphere_id === sphere.id && g.status !== 'archived')
        
        for (const goal of sphereGoals) {
          try {
            let goalTask = goal.todoist_id
              ? existingTasks.find(t => t.id === goal.todoist_id)
              : existingTasks.find(t => t.content === goal.title && !t.parent_id)
            
            if (!goalTask) {
              goalTask = await todoist.createTask({
                content: goal.title,
                description: goal.description || '',
                project_id: sphereProject.id,
              })
              result.goalsCreated++
            }
            
            // Save todoist_id
            if (goal.todoist_id !== goalTask.id) {
              updateGoal(goal.id, { todoist_id: goalTask.id })
            }
            
            // Sync subtasks
            for (const subtask of (goal.subtasks || [])) {
              try {
                let subTask = subtask.todoist_id
                  ? existingTasks.find(t => t.id === subtask.todoist_id)
                  : existingTasks.find(t => t.content === subtask.title && t.parent_id === goalTask!.id)
                
                if (!subTask) {
                  subTask = await todoist.createTask({
                    content: subtask.title,
                    project_id: sphereProject.id,
                    parent_id: goalTask.id,
                  })
                  result.subtasksCreated++
                }
                
                // Update subtask's todoist_id in store
                if (subtask.todoist_id !== subTask.id) {
                  const updatedSubtasks = (goal.subtasks || []).map(s =>
                    s.id === subtask.id ? { ...s, todoist_id: subTask!.id } : s
                  )
                  updateGoal(goal.id, { subtasks: updatedSubtasks })
                }
              } catch (err) {
                result.errors.push(`subtask "${subtask.title}": ${err instanceof Error ? err.message : 'error'}`)
              }
            }
          } catch (err) {
            result.errors.push(`goal "${goal.title}": ${err instanceof Error ? err.message : 'error'}`)
          }
        }
      } catch (err) {
        result.errors.push(`sphere "${sphere.name}": ${err instanceof Error ? err.message : 'error'}`)
      }
    }
  } catch (err) {
    result.errors.push(`sync failed: ${err instanceof Error ? err.message : 'error'}`)
  }
  
  return result
}

// ============================
// Pull sync: Todoist → Seeker
// Updates Seeker state from Todoist changes
// ============================

export async function pullSync(
  spheres: Sphere[],
  goals: Goal[],
  updateSphere: (id: string, updates: Partial<Sphere>) => void,
  updateGoal: (id: string, updates: Partial<Goal>) => void,
  addGoal: (goal: Goal) => void,
  _archiveGoal?: (id: string) => void,
  addSphere?: (sphere: Sphere) => void,
): Promise<SyncResult> {
  const result: SyncResult = {
    spheresCreated: 0, spheresUpdated: 0,
    goalsCreated: 0, goalsUpdated: 0, goalsArchived: 0,
    subtasksCreated: 0, subtasksUpdated: 0,
    dailyTasksPushed: 0, errors: []
  }
  
  try {
    const projects = await todoist.getProjects()
    const rootProject = projects.find(p => p.name === GOALS_ROOT_PROJECT_NAME && !p.parent_id)
    if (!rootProject) return result // no root project = nothing to sync
    
    const sphereProjects = projects.filter(p => p.parent_id === rootProject.id && !p.is_deleted && !p.is_archived)
    
    for (const sphereProject of sphereProjects) {
      // Find matching Seeker sphere or create new one
      let sphere = spheres.find(s => s.todoist_id === sphereProject.id)
        || spheres.find(s => s.name === sphereProject.name)
      
      if (!sphere) {
        if (!addSphere) continue
        const newSphere: Sphere = {
          id: `sphere-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          user_id: 'demo',
          name: sphereProject.name,
          color: ['#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#6366f1','#a855f7','#ec4899'][result.spheresCreated % 8],
          icon: ['🎯','💼','❤️','🧠','💰','🏋️','🎨','🌱'][result.spheresCreated % 8],
          order: spheres.length + result.spheresCreated,
          created_at: new Date().toISOString(),
          todoist_id: sphereProject.id,
        }
        addSphere(newSphere)
        sphere = newSphere
        result.spheresCreated++
      } else {
        // Link existing sphere if todoist_id missing
        if (!sphere.todoist_id) {
          updateSphere(sphere.id, { todoist_id: sphereProject.id })
        }
        // Update sphere name if changed in Todoist
        if (sphere.name !== sphereProject.name) {
          updateSphere(sphere.id, { name: sphereProject.name })
          result.spheresUpdated++
        }
      }
      
      // Get all tasks in this project
      const tasks = await todoist.getTasks(sphereProject.id)
      const topLevelTasks = tasks.filter(t => !t.parent_id)
      
      for (const task of topLevelTasks) {
        const goal = goals.find(g => g.todoist_id === task.id)
        
        if (goal) {
          // Existing goal – update from Todoist
          const updates: Partial<Goal> = {}
          
          if (goal.title !== task.content) updates.title = task.content
          if (task.description && goal.description !== task.description) updates.description = task.description
          
          // Check completion
          if (task.is_completed && goal.status === 'active') {
            updates.status = 'completed'
            updates.progress = 100
            result.goalsUpdated++
          }
          
          // Sync subtasks from Todoist
          // Note: Todoist API only returns ACTIVE tasks, completed ones disappear
          const todoistSubtasks = tasks.filter(t => t.parent_id === task.id)
          const todoistSubtaskIds = new Set(todoistSubtasks.map(t => t.id))
          const updatedSubtasks = [...(goal.subtasks || [])]
          
          // Update active subtasks from Todoist
          for (const tSub of todoistSubtasks) {
            const existingSub = updatedSubtasks.find(s => s.todoist_id === tSub.id)
            if (existingSub) {
              // Update existing -- task is active in Todoist, so mark uncompleted if needed
              if (existingSub.title !== tSub.content) existingSub.title = tSub.content
              if (existingSub.completed) {
                existingSub.completed = false // reopened in Todoist
                result.subtasksUpdated++
              }
            } else {
              // New subtask from Todoist
              updatedSubtasks.push({
                id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title: tSub.content,
                completed: false,
                order: updatedSubtasks.length,
                todoist_id: tSub.id,
              })
              result.subtasksCreated++
            }
          }
          
          // Mark subtasks completed if they have todoist_id but are NOT in active tasks
          for (const sub of updatedSubtasks) {
            if (sub.todoist_id && !todoistSubtaskIds.has(sub.todoist_id) && !sub.completed) {
              sub.completed = true
              result.subtasksUpdated++
            }
          }
          
          updates.subtasks = updatedSubtasks
          
          if (Object.keys(updates).length > 0) {
            updateGoal(goal.id, updates)
          }
        } else if (!task.is_completed) {
          // New goal from Todoist – create in Seeker
          const todoistSubtasks = tasks.filter(t => t.parent_id === task.id)
          const newGoal: Goal = {
            id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            user_id: 'demo',
            sphere_id: sphere.id,
            title: task.content,
            description: task.description || '',
            status: 'active',
            progress: 0,
            subtasks: todoistSubtasks.map((s, i) => ({
              id: `sub-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
              title: s.content,
              completed: s.is_completed,
              order: i,
              todoist_id: s.id,
            })),
            strict_order: false,
            created_at: task.created_at,
            updated_at: new Date().toISOString(),
            todoist_id: task.id,
          }
          addGoal(newGoal)
          result.goalsCreated++
        }
      }
      
      // Check for goals that disappeared from Todoist (completed or deleted)
      // Since API only returns active tasks, missing = completed OR deleted
      // We mark as completed (more common case; if actually deleted, user can archive manually)
      const sphereGoals = goals.filter(g => g.sphere_id === sphere.id && g.todoist_id && g.status === 'active')
      for (const goal of sphereGoals) {
        const stillExists = topLevelTasks.some(t => t.id === goal.todoist_id)
        if (!stillExists) {
          updateGoal(goal.id, { status: 'completed', progress: 100 })
          result.goalsUpdated++
        }
      }
    }
  } catch (err) {
    result.errors.push(`pull sync failed: ${err instanceof Error ? err.message : 'error'}`)
  }
  
  return result
}

// ============================
// Push single change to Todoist
// ============================

export async function pushGoalCreate(goal: Goal, sphere: Sphere): Promise<string | null> {
  if (!sphere.todoist_id) return null
  
  try {
    const task = await todoist.createTask({
      content: goal.title,
      description: goal.description || '',
      project_id: sphere.todoist_id,
    })
    return task.id
  } catch {
    return null
  }
}

export async function pushGoalUpdate(goal: Goal): Promise<void> {
  if (!goal.todoist_id) return
  
  try {
    await todoist.updateTask(goal.todoist_id, {
      content: goal.title,
      description: goal.description,
    })
  } catch {
    // silent fail
  }
}

export async function pushGoalComplete(goal: Goal): Promise<void> {
  if (!goal.todoist_id) return
  try { await todoist.completeTask(goal.todoist_id) } catch {}
}

export async function pushSubtaskCreate(subtask: Subtask, goal: Goal, sphere: Sphere): Promise<string | null> {
  if (!goal.todoist_id || !sphere.todoist_id) return null
  
  try {
    const task = await todoist.createTask({
      content: subtask.title,
      project_id: sphere.todoist_id,
      parent_id: goal.todoist_id,
    })
    return task.id
  } catch {
    return null
  }
}

export async function pushSubtaskUpdate(subtask: Subtask): Promise<void> {
  if (!subtask.todoist_id) return
  try {
    await todoist.updateTask(subtask.todoist_id, { content: subtask.title })
  } catch {
    // silent
  }
}

export async function pushSubtaskComplete(subtask: Subtask): Promise<void> {
  if (!subtask.todoist_id) return
  try { await todoist.completeTask(subtask.todoist_id) } catch {}
}

export async function pushSubtaskReopen(subtask: Subtask): Promise<void> {
  if (!subtask.todoist_id) return
  try { await todoist.reopenTask(subtask.todoist_id) } catch {}
}

// ============================
// Push daily AI tasks to Todoist
// ============================

export async function pushDailyTasks(tasks: DailyTask[], date: string): Promise<void> {
  try {
    const projects = await todoist.getProjects()
    const seekerProject = projects.find(p => p.name === SEEKER_DAILY_PROJECT_NAME)
    if (!seekerProject) return
    
    const dateFormatted = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    
    // Create parent task for the day
    const parentTask = await todoist.createTask({
      content: `seeker: ${dateFormatted}`,
      project_id: seekerProject.id,
      due_string: 'today',
    })
    
    // Create subtasks with difficulty labels
    const difficultyLabels: Record<string, string> = {
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
    }
    
    for (const task of tasks) {
      await todoist.createTask({
        content: task.title,
        description: task.description,
        project_id: seekerProject.id,
        parent_id: parentTask.id,
        labels: [difficultyLabels[task.difficulty] || 'easy'],
      })
    }
  } catch {
    // silent – not critical
  }
}
