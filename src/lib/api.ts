import { supabase } from './supabase'

// Types for AI responses
export interface GeneratedTask {
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  goal_id: string
  subtask_id?: string
}

export interface GeneratedReflection {
  questions: {
    id: string
    type: 'single_choice' | 'multi_choice' | 'text' | 'surprise'
    question: string
    options?: string[]
  }[]
}

export interface WeeklyInsight {
  text: string
}

export interface CharacterMessage {
  message: string
}

export interface AIUsageStats {
  model: string
  request_type: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
  created_at: string
  request_summary?: string
  response_text?: string
  success: boolean
  error_message?: string
}

// Call Supabase Edge Function
async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    })
    
    if (error) {
      return { data: null, error: error.message }
    }
    
    return { data: data as T, error: null }
  } catch (err) {
    return { data: null, error: `API не ответил: ${err instanceof Error ? err.message : 'неизвестная ошибка'}` }
  }
}

// Generate 3 daily tasks
export async function generateDailyTasks(params: {
  method_title: string
  method_description: string
  key_principles?: string[]
  how_to_apply?: string
  goals: { id: string; title: string; description?: string; subtask?: { id: string; title: string } }[]
  model?: string
}) {
  return callEdgeFunction<{ tasks: GeneratedTask[] }>('generate-tasks', params)
}

// Generate reflection questions
export async function generateReflection(params: {
  method_title: string
  method_description: string
  tasks_summary: string
  model?: string
}) {
  return callEdgeFunction<GeneratedReflection>('generate-reflection', params)
}

// Generate weekly insight
export async function generateWeeklyInsight(params: {
  method_title: string
  reflection_responses: Record<string, unknown>[]
  tasks_completed: number
  tasks_total: number
  model?: string
}) {
  return callEdgeFunction<WeeklyInsight>('generate-insight', params)
}

// Generate character message
export async function generateCharacterMessage(params: {
  character_stage: string
  points: number
  streak_days: number
  tasks_completed_today: number
  model?: string
}) {
  return callEdgeFunction<CharacterMessage>('character-voice', params)
}

// Get AI usage stats with optional date range
export async function getAIUsageStats(params?: { from?: string; to?: string }): Promise<AIUsageStats[]> {
  let query = supabase
    .from('ai_logs')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (params?.from) {
    query = query.gte('created_at', params.from + 'T00:00:00')
  }
  if (params?.to) {
    query = query.lte('created_at', params.to + 'T23:59:59')
  }
  
  query = query.limit(500)
  
  const { data, error } = await query
  if (error) return []
  return data || []
}

// Get AI cost summary by model
export async function getAICostSummary(): Promise<{ model: string; total_cost: number; total_requests: number; total_input_tokens: number; total_output_tokens: number }[]> {
  const { data, error } = await supabase
    .from('ai_logs')
    .select('model, cost_usd, input_tokens, output_tokens')
  
  if (error || !data) return []
  
  // Aggregate by model
  const byModel: Record<string, { total_cost: number; total_requests: number; total_input_tokens: number; total_output_tokens: number }> = {}
  
  for (const log of data) {
    if (!byModel[log.model]) {
      byModel[log.model] = { total_cost: 0, total_requests: 0, total_input_tokens: 0, total_output_tokens: 0 }
    }
    byModel[log.model].total_cost += Number(log.cost_usd)
    byModel[log.model].total_requests += 1
    byModel[log.model].total_input_tokens += log.input_tokens
    byModel[log.model].total_output_tokens += log.output_tokens
  }
  
  return Object.entries(byModel).map(([model, stats]) => ({ model, ...stats }))
}
