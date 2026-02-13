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
    const { method_title, method_description, tasks_summary, model = 'claude-sonnet' } = await req.json()
    
    const system = `ты – помощник в приложении The Seeker. генерируешь вопросы для еженедельной рефлексии на русском языке.
правила:
- пиши в нижнем регистре
- используй короткое тире (–), НЕ длинное (—)
- вопросы должны быть разнообразными: от серьёзных до мемных
- каждый раз генерируй УНИКАЛЬНЫЕ вопросы, не повторяйся
- surprise вопросы = необычный формат (мем-шкала, ассоциации, метафоры)
- ответ СТРОГО в JSON формате, без markdown`

    const prompt = `методика этой недели: "${method_title}"
${method_description}

что пользователь делал на этой неделе:
${tasks_summary || 'нет данных о заданиях'}

сгенерируй ровно 10 вопросов для рефлексии:
- 3 вопроса типа "single_choice" (один вариант из нескольких)
- 2 вопроса типа "multi_choice" (несколько вариантов)
- 3 вопроса типа "text" (развёрнутый текстовый ответ)
- 2 вопроса типа "surprise" (необычный формат: мем-шкала, ассоциация с едой/погодой, emoji-рейтинг, метафора, one-word)

для single_choice и multi_choice обязательно дай 4-6 вариантов ответа.
для surprise – дай варианты если это шкала/выбор, или оставь пустой массив если ответ свободный.

ответь JSON:
{
  "questions": [
    { "id": "q1", "type": "single_choice", "question": "...", "options": ["...", "...", "..."] },
    { "id": "q2", "type": "multi_choice", "question": "...", "options": ["...", "...", "..."] },
    { "id": "q3", "type": "text", "question": "...", "options": [] },
    { "id": "q4", "type": "surprise", "question": "...", "options": ["...", "..."] }
  ]
}`

    const llmResponse = await callLLM({ model, system, prompt, maxTokens: 2000 })
    
    let parsed
    try {
      const jsonMatch = llmResponse.text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : llmResponse.text)
    } catch {
      await logAIUsage({
        userId, requestType: 'reflection', response: llmResponse, success: false, errorMessage: 'failed to parse JSON',
        requestSummary: `рефлексия для: ${method_title}`,
        responseText: llmResponse.text
      })
      return new Response(JSON.stringify({ error: 'AI вернул невалидный ответ' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const questionsList = parsed.questions?.map((q: { type: string; question: string }) => `[${q.type}] ${q.question}`).join(' | ') || ''
    
    await logAIUsage({
      userId, requestType: 'reflection', response: llmResponse, success: true,
      requestSummary: `рефлексия для: ${method_title}`,
      responseText: questionsList
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
