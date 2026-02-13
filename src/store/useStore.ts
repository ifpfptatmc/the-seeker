import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  User, 
  Sphere, 
  Goal, 
  Subtask,
  WeeklySession, 
  DailyTask, 
  UserProgress,
  Theme,
  AccentColor,
  Method
} from '../types'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  
  // Onboarding
  hasCompletedOnboarding: boolean
  setOnboardingComplete: (complete: boolean) => void
  
  // Spheres & Goals
  spheres: Sphere[]
  goals: Goal[]
  setSpheres: (spheres: Sphere[]) => void
  setGoals: (goals: Goal[]) => void
  addSphere: (sphere: Sphere) => void
  updateSphere: (id: string, updates: Partial<Sphere>) => void
  deleteSphere: (id: string) => void
  addGoal: (goal: Goal) => void
  addGoalsBatch: (goals: Goal[]) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  archiveGoal: (id: string) => void
  completeGoal: (id: string) => void
  restoreGoal: (id: string) => void
  
  // Subtasks
  addSubtask: (goalId: string, subtask: Subtask) => void
  updateSubtask: (goalId: string, subtaskId: string, updates: Partial<Subtask>) => void
  toggleSubtask: (goalId: string, subtaskId: string) => void
  deleteSubtask: (goalId: string, subtaskId: string) => void
  reorderSubtasks: (goalId: string, subtaskIds: string[]) => void
  toggleStrictOrder: (goalId: string) => void
  
  // Current Session
  currentSession: WeeklySession | null
  currentMethod: Method | null
  dailyTasks: DailyTask[]
  tasksGeneratedDate: string | null
  setCurrentSession: (session: WeeklySession | null) => void
  setCurrentMethod: (method: Method | null) => void
  setDailyTasks: (tasks: DailyTask[]) => void
  setTasksGeneratedDate: (date: string | null) => void
  completeTask: (taskId: string) => void
  
  // Character voice
  characterMessage: string | null
  characterMessageDate: string | null
  setCharacterMessage: (msg: string | null, date: string | null) => void
  
  // Progress
  progress: UserProgress | null
  setProgress: (progress: UserProgress | null) => void
  addPoints: (points: number) => void
  
  // Theme
  theme: Theme
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  
  // AI Model
  preferredModel: string
  setPreferredModel: (model: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // Onboarding
      hasCompletedOnboarding: false,
      setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),
      
      // Spheres & Goals
      spheres: [],
      goals: [],
      setSpheres: (spheres) => set({ spheres }),
      setGoals: (goals) => set({ goals }),
      addSphere: (sphere) => set((state) => ({ spheres: [...state.spheres, sphere] })),
      updateSphere: (id, updates) => set((state) => ({
        spheres: state.spheres.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteSphere: (id) => set((state) => ({
        spheres: state.spheres.filter(s => s.id !== id),
        goals: state.goals.filter(g => g.sphere_id !== id)
      })),
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      addGoalsBatch: (newGoals) => set((state) => ({ goals: [...state.goals, ...newGoals] })),
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g)
      })),
      archiveGoal: (id) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, status: 'archived', updated_at: new Date().toISOString() } : g)
      })),
      completeGoal: (id) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, status: 'completed', progress: 100, updated_at: new Date().toISOString() } : g)
      })),
      restoreGoal: (id) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, status: 'active', updated_at: new Date().toISOString() } : g)
      })),
      
      // Subtasks
      addSubtask: (goalId, subtask) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? {
          ...g,
          subtasks: [...(g.subtasks || []), subtask],
          updated_at: new Date().toISOString()
        } : g)
      })),
      updateSubtask: (goalId, subtaskId, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? {
          ...g,
          subtasks: (g.subtasks || []).map(s => s.id === subtaskId ? { ...s, ...updates } : s),
          updated_at: new Date().toISOString()
        } : g)
      })),
      toggleSubtask: (goalId, subtaskId) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? {
          ...g,
          subtasks: (g.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
          updated_at: new Date().toISOString()
        } : g)
      })),
      deleteSubtask: (goalId, subtaskId) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? {
          ...g,
          subtasks: (g.subtasks || []).filter(s => s.id !== subtaskId),
          updated_at: new Date().toISOString()
        } : g)
      })),
      reorderSubtasks: (goalId, subtaskIds) => set((state) => ({
        goals: state.goals.map(g => {
          if (g.id !== goalId) return g
          const subtasks = (g.subtasks || [])
          const reordered = subtaskIds.map((id, index) => {
            const subtask = subtasks.find(s => s.id === id)
            return subtask ? { ...subtask, order: index } : null
          }).filter(Boolean) as Subtask[]
          return { ...g, subtasks: reordered, updated_at: new Date().toISOString() }
        })
      })),
      toggleStrictOrder: (goalId) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? {
          ...g,
          strict_order: !g.strict_order,
          updated_at: new Date().toISOString()
        } : g)
      })),
      
      // Current Session
      currentSession: null,
      currentMethod: null,
      dailyTasks: [],
      tasksGeneratedDate: null,
      setCurrentSession: (currentSession) => set({ currentSession }),
      setCurrentMethod: (currentMethod) => set({ currentMethod }),
      setDailyTasks: (dailyTasks) => set({ dailyTasks }),
      setTasksGeneratedDate: (tasksGeneratedDate) => set({ tasksGeneratedDate }),
      completeTask: (taskId) => set((state) => {
        const task = state.dailyTasks.find(t => t.id === taskId)
        const pointsToAdd = task?.points_earned || 10
        return {
          dailyTasks: state.dailyTasks.map(t => 
            t.id === taskId 
              ? { ...t, completed: true, completed_at: new Date().toISOString() } 
              : t
          ),
          progress: state.progress 
            ? { ...state.progress, points: state.progress.points + pointsToAdd, tasks_completed: state.progress.tasks_completed + 1 }
            : null
        }
      }),
      
      // Character voice
      characterMessage: null,
      characterMessageDate: null,
      setCharacterMessage: (characterMessage, characterMessageDate) => set({ characterMessage, characterMessageDate }),
      
      // Progress
      progress: null,
      setProgress: (progress) => set({ progress }),
      addPoints: (points) => set((state) => ({
        progress: state.progress 
          ? { ...state.progress, points: state.progress.points + points }
          : null
      })),
      
      // Theme
      theme: 'system',
      accentColor: 'sky',
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      
      // AI Model
      preferredModel: 'claude-sonnet',
      setPreferredModel: (preferredModel) => set({ preferredModel }),
    }),
    {
      name: 'the-seeker-storage',
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        preferredModel: state.preferredModel,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        spheres: state.spheres,
        goals: state.goals,
        progress: state.progress,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentMethod: state.currentMethod,
        dailyTasks: state.dailyTasks,
        tasksGeneratedDate: state.tasksGeneratedDate,
        characterMessage: state.characterMessage,
        characterMessageDate: state.characterMessageDate,
      }),
    }
  )
)
