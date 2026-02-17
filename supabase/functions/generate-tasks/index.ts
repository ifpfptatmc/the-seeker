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
    const { method_title, method_description, key_principles, how_to_apply, goals, model = 'claude-sonnet' } = await req.json()
    
    if (!method_title || !goals || goals.length === 0) {
      return new Response(JSON.stringify({ error: 'method_title and goals are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const goalsText = goals.map((g: { id: string; title: string; description?: string; subtask?: { id: string; title: string } }, i: number) => {
      let line = `${i + 1}. "${g.title}"`
      if (g.description) line += ` – ${g.description}`
      if (g.subtask) line += ` (текущий шаг: "${g.subtask.title}")`
      return line
    }).join('\n')

    const principlesText = key_principles?.length
      ? `\nключевые принципы методики:\n${key_principles.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`
      : ''
    
    const applyText = how_to_apply ? `\nкак применять: ${how_to_apply}` : ''
    
    const system = `ты – помощник в приложении The Seeker. генерируешь ежедневные задания на русском языке.
правила:
- пиши в нижнем регистре (без заглавных букв в начале предложения)
- используй короткое тире (–), НЕ длинное (—)
- будь конкретной и практичной
- задание должно быть выполнимо за один день
- если есть подзадача – задание должно быть привязано именно к ней
- ответ СТРОГО в JSON формате, без markdown

КРИТИЧЕСКИ ВАЖНО:
- каждое из 3 заданий должно быть ПРИНЦИПИАЛЬНО РАЗНЫМ действием
- ЗАПРЕЩЕНО давать одно и то же действие с разной длительностью (например "делай X 15 минут" / "делай X 30 минут" / "делай X 1 час" -- это ПЛОХО)
- каждое задание должно опираться на РАЗНЫЙ принцип или аспект методики
- формулировки должны быть конкретными: что именно сделать, а не "порефлексируй" или "подумай"
- разная сложность = разный ТИП действия, а не просто больше времени на то же самое`

    const prompt = `методика недели: "${method_title}"
описание: ${method_description}
${principlesText}
${applyText}

цели пользователя (к каждому заданию привяжи РАЗНУЮ цель):
${goalsText}

сгенерируй ровно 3 задания разной сложности. каждое задание:
- привязано к методике недели, но использует РАЗНЫЙ аспект/принцип
- связано с конкретной целью пользователя (goal_id)
- если у цели есть текущий шаг (подзадача) – задание должно быть про этот шаг (subtask_id)
- easy: ~15 мин, простое действие (например: составить список, записать мысль, заполнить таблицу)
- medium: ~30-60 мин, требует усилий (например: провести анализ, реструктурировать план, провести эксперимент)
- hard: ~1-2 часа, серьёзная работа (например: глубокая сессия, полный пересмотр подхода, практика с документированием)

НЕ ПОВТОРЯЙ одно и то же действие с разной длительностью! каждое задание = уникальное действие.

ответь JSON:
{
  "tasks": [
    { "title": "...", "description": "краткое описание зачем это полезно", "difficulty": "easy", "goal_id": "...", "subtask_id": "..." },
    { "title": "...", "description": "...", "difficulty": "medium", "goal_id": "...", "subtask_id": "..." },
    { "title": "...", "description": "...", "difficulty": "hard", "goal_id": "...", "subtask_id": "..." }
  ]
}`

    const llmResponse = await callLLM({ model, system, prompt })
    
    let parsed
    try {
      const jsonMatch = llmResponse.text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : llmResponse.text)
    } catch {
      await logAIUsage({
        userId, requestType: 'tasks', response: llmResponse, success: false, errorMessage: 'failed to parse JSON',
        requestSummary: `методика: ${method_title} | цели: ${goals.map((g: { title: string }) => g.title).join(', ')}`,
        responseText: llmResponse.text
      })
      return new Response(JSON.stringify({ error: 'AI вернул невалидный ответ, попробуй ещё раз' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Build readable summary of what AI generated
    const tasksSummary = parsed.tasks?.map((t: { title: string; difficulty: string }) => `[${t.difficulty}] ${t.title}`).join(' | ') || ''
    
    await logAIUsage({
      userId, requestType: 'tasks', response: llmResponse, success: true,
      requestSummary: `методика: ${method_title} | цели: ${goals.map((g: { title: string }) => g.title).join(', ')}`,
      responseText: tasksSummary
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
