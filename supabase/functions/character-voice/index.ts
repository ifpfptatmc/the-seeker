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
    const { character_stage, points, streak_days, tasks_completed_today, model = 'claude-sonnet' } = await req.json()
    
    const personalities: Record<string, string> = {
      'egg': 'ты – яйцо. говоришь сонно, мечтательно, ждёшь когда вылупишься. используй метафоры про сон и пробуждение.',
      'caterpillar_1': 'ты – маленькая гусеница. говоришь восторженно, всё новое и интересное. используй "ого!", "а что это?"',
      'caterpillar_2': 'ты – растущая гусеница. говоришь уверенно, с аппетитом к жизни. используй метафоры еды и роста.',
      'caterpillar_3': 'ты – мощная гусеница. говоришь как опытный путник, делишься мудростью. спокойная сила.',
      'chrysalis': 'ты – куколка. говоришь загадочно, ощущаешь внутреннюю трансформацию. медитативный тон.',
      'butterfly': 'ты – бабочка. говоришь свободно, легко, с высоты полёта. видишь большую картину.',
    }
    
    const personality = personalities[character_stage] || personalities['egg']
    
    const system = `ты – персонаж в приложении The Seeker. ${personality}
правила:
- ОДНА фраза, максимум 15 слов
- нижний регистр
- короткое тире (–)
- никаких эмодзи
- тон зависит от контекста (стрик, очки, выполненные задания)
- ответ СТРОГО в JSON`

    const prompt = `стадия: ${character_stage}
очки: ${points}
стрик: ${streak_days} дней подряд
задания выполнено сегодня: ${tasks_completed_today}

скажи одну фразу при открытии приложения.

ответь JSON:
{ "message": "..." }`

    const llmResponse = await callLLM({ model, system, prompt, maxTokens: 100 })
    
    let parsed
    try {
      const jsonMatch = llmResponse.text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : llmResponse.text)
    } catch {
      await logAIUsage({
        userId, requestType: 'character', response: llmResponse, success: false, errorMessage: 'failed to parse JSON',
        requestSummary: `персонаж: ${character_stage} | ${points} очков | стрик ${streak_days}`,
        responseText: llmResponse.text
      })
      return new Response(JSON.stringify({ message: '...' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    await logAIUsage({
      userId, requestType: 'character', response: llmResponse, success: true,
      requestSummary: `персонаж: ${character_stage} | ${points} очков | стрик ${streak_days}`,
      responseText: parsed.message || ''
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
