// Auth helper: extracts user ID from JWT or falls back to demo mode
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function getUserId(req: Request): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
  
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return 'demo'
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'demo'
  } catch {
    return 'demo'
  }
}
