// Shared LLM client for all edge functions
// Supports multiple models with cost tracking

export interface LLMResponse {
  text: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
}

// Cost per 1M tokens (input / output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet': { input: 3.0, output: 15.0 },
  'claude-haiku': { input: 0.25, output: 1.25 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
}

// Map user-facing model names to API model IDs
const MODEL_IDS: Record<string, string> = {
  'claude-sonnet': 'claude-sonnet-4-20250514',
  'claude-haiku': 'claude-haiku-3-5-20241022',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet']
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

export async function callLLM(params: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
}): Promise<LLMResponse> {
  const { model = 'claude-sonnet', system, prompt, maxTokens = 1500 } = params
  const startTime = Date.now()
  
  const isClaudeModel = model.startsWith('claude')
  
  if (isClaudeModel) {
    return callClaude({ model, system, prompt, maxTokens, startTime })
  } else {
    return callOpenAI({ model, system, prompt, maxTokens, startTime })
  }
}

async function callClaude(params: {
  model: string
  system: string
  prompt: string
  maxTokens: number
  startTime: number
}): Promise<LLMResponse> {
  const { model, system, prompt, maxTokens, startTime } = params
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
  
  const modelId = MODEL_IDS[model] || MODEL_IDS['claude-sonnet']
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${response.status} ${err}`)
  }
  
  const data = await response.json()
  const latencyMs = Date.now() - startTime
  const inputTokens = data.usage?.input_tokens || 0
  const outputTokens = data.usage?.output_tokens || 0
  
  return {
    text: data.content?.[0]?.text || '',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: calculateCost(model, inputTokens, outputTokens),
    latency_ms: latencyMs,
  }
}

async function callOpenAI(params: {
  model: string
  system: string
  prompt: string
  maxTokens: number
  startTime: number
}): Promise<LLMResponse> {
  const { model, system, prompt, maxTokens, startTime } = params
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')
  
  const modelId = MODEL_IDS[model] || model
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  })
  
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${err}`)
  }
  
  const data = await response.json()
  const latencyMs = Date.now() - startTime
  const inputTokens = data.usage?.prompt_tokens || 0
  const outputTokens = data.usage?.completion_tokens || 0
  
  return {
    text: data.choices?.[0]?.message?.content || '',
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: calculateCost(model, inputTokens, outputTokens),
    latency_ms: latencyMs,
  }
}
