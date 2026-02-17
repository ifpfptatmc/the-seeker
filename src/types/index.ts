// User
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

// Spheres & Goals
export interface Sphere {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  order: number;
  created_at: string;
  todoist_id?: string; // Todoist project ID
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  todoist_id?: string; // Todoist task ID
}

export interface Goal {
  id: string;
  user_id: string;
  sphere_id: string;
  title: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  progress: number; // 0-100
  subtasks: Subtask[];
  strict_order: boolean; // true = sequential, false = any order
  created_at: string;
  updated_at: string;
  todoist_id?: string; // Todoist task ID
}

// Methods & Tasks
export interface Method {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  tasks: MethodTask[];
  source?: { book: string; author: string; year: number };
  why_it_works?: string;
  key_principles?: string[];
  how_to_apply?: string;
}

export interface MethodTask {
  id: string;
  method_id: string;
  title: string;
  description: string;
  day_type: 'any' | 'specific';
  day_number?: number;
}

// Weekly Sessions
export interface WeeklySession {
  id: string;
  user_id: string;
  method_id: string;
  week_start: string;
  week_end: string;
  status: 'active' | 'completed';
  created_at: string;
}

// Daily Tasks
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export interface TaskResult {
  type: 'text' | 'image' | 'file';
  content: string; // text content or file URL
  created_at: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  session_id: string;
  method_task_id?: string;
  goal_id?: string;
  goal_title?: string;
  subtask_title?: string;
  date: string;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  completed: boolean;
  completed_at?: string;
  points_earned: number;
  result?: TaskResult;
}

// Reflections
export interface Reflection {
  id: string;
  user_id: string;
  session_id: string;
  format: ReflectionFormat;
  responses: ReflectionResponse[];
  created_at: string;
}

export type ReflectionFormat = 
  | 'questions'
  | 'scale'
  | 'meme'
  | 'one_word'
  | 'emoji'
  | 'quick_pick';

export interface ReflectionResponse {
  question_id: string;
  question: string;
  answer: string | number;
}

// Gamification
export interface UserProgress {
  id: string;
  user_id: string;
  points: number;
  level: number;
  stage: number;
  streak_days: number;
  longest_streak: number;
  tasks_completed: number;
  weeks_completed: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  points_reward: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

// Theme
export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'sky' | 'violet' | 'rose' | 'amber' | 'emerald';

// Butterfly Collection
export interface Butterfly {
  id: string;
  name: string;
  species: string;
  image: string;
  rarity: 'common' | 'rare' | 'legendary';
  unlocked_at?: string;
}

// Garden & Artifacts
export interface GardenItem {
  id: string;
  type: 'flower' | 'tree' | 'decoration';
  name: string;
  image: string;
  position: { x: number; y: number };
  unlocked_at: string;
}

export interface Artifact {
  id: string;
  method_id: string;
  name: string;
  description: string;
  image: string;
  unlocked_at?: string;
}

// Character Stages (Caterpillar -> Butterfly)
export type CharacterStage = 
  | 'egg'           // Stage 1
  | 'caterpillar_1' // Stage 2: tiny
  | 'caterpillar_2' // Stage 3: growing
  | 'caterpillar_3' // Stage 4: big
  | 'chrysalis'     // Stage 5: cocoon
  | 'butterfly';    // Stage 6: final form
