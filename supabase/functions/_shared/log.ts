// Log AI usage to database for cost tracking + content
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { LLMResponse } from './llm.ts'

export async function logAIUsage(params: {
  userId: string
  requestType: 'tasks' | 'reflection' | 'insight' | 'character'
  response: LLMResponse
  success: boolean
  errorMessage?: string
  requestSummary?: string
  responseText?: string
}) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)
    
    const { error } = await supabase.from('ai_logs').insert({
      user_id: params.userId || 'demo',
      model: params.response.model,
      request_type: params.requestType,
      input_tokens: params.response.input_tokens,
      output_tokens: params.response.output_tokens,
      cost_usd: params.response.cost_usd,
      latency_ms: params.response.latency_ms,
      success: params.success,
      error_message: params.errorMessage || null,
      request_summary: params.requestSummary || null,
      response_text: params.responseText || null,
    })
    
    if (error) {
      console.error('Failed to log AI usage:', error.message)
    }
  } catch (err) {
    console.error('logAIUsage error:', err)
  }
}

// CORS headers for all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
