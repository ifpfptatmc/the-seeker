import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { callLLM } from '../_shared/llm.ts'
import { logAIUsage, corsHeaders } from '../_shared/log.ts'
import { getUserId } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const userId = await getUserId(req)
    const { method_title, reflection_responses, tasks_completed, tasks_total, model = 'claude-sonnet' } = await req.json()
    
    const system = `ты – помощник в приложении The Seeker. пишешь короткий недельный инсайт на русском языке.
правила:
- нижний регистр, короткое тире (–)
- максимум 2-3 предложения
- будь конкретной, не общей
- тон: поддерживающий, но честный
- если результаты слабые – не делай вид что всё отлично, но и не дави
- ответ СТРОГО в JSON`

    const prompt = `методика недели: "${method_title}"
выполнено заданий: ${tasks_completed} из ${tasks_total}

ответы на рефлексию:
${JSON.stringify(reflection_responses, null, 2)}

напиши короткий инсайт (2-3 предложения) о прошедшей неделе.

ответь JSON:
{ "text": "..." }`

    const llmResponse = await callLLM({ model, system, prompt, maxTokens: 300 })
    
    let parsed
    try {
      const jsonMatch = llmResponse.text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : llmResponse.text)
    } catch {
      await logAIUsage({
        userId, requestType: 'insight', response: llmResponse, success: false, errorMessage: 'failed to parse JSON',
        requestSummary: `инсайт: ${method_title} | ${tasks_completed}/${tasks_total} заданий`,
        responseText: llmResponse.text
      })
      return new Response(JSON.stringify({ error: 'AI вернул невалидный ответ' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    await logAIUsage({
      userId, requestType: 'insight', response: llmResponse, success: true,
      requestSummary: `инсайт: ${method_title} | ${tasks_completed}/${tasks_total} заданий`,
      responseText: parsed.text || ''
    })
    
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (err) {
    return new Response(JSON.stringify({ error: `ошибка: ${err.message}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
