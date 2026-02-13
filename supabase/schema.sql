-- The Seeker Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  preferred_model TEXT DEFAULT 'claude-sonnet',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spheres (life areas)
CREATE TABLE IF NOT EXISTS spheres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sphere_id UUID REFERENCES spheres(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  strict_order BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Methods (productivity techniques)
CREATE TABLE IF NOT EXISTS methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INTEGER DEFAULT 7,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Sessions
CREATE TABLE IF NOT EXISTS weekly_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  method_id UUID REFERENCES methods(id) ON DELETE SET NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Tasks (AI-generated)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES weekly_sessions(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  subtask_id UUID REFERENCES subtasks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 10,
  result_type TEXT CHECK (result_type IN ('text', 'image', 'file')),
  result_content TEXT,
  result_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflections
CREATE TABLE IF NOT EXISTS reflections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES weekly_sessions(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '[]'::jsonb,
  weekly_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Progress (gamification)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  stage INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  weeks_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Log (cost tracking per model)
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  model TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('tasks', 'reflection', 'insight', 'character')),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character messages (cached daily)
CREATE TABLE IF NOT EXISTS character_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  character_stage TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spheres ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own spheres" ON spheres FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subtasks" ON subtasks FOR ALL 
  USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = subtasks.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can manage own sessions" ON weekly_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON daily_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reflections" ON reflections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own ai_logs" ON ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert ai_logs" ON ai_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can manage own character_messages" ON character_messages FOR ALL USING (auth.uid() = user_id);

-- Methods are readable by all authenticated users
CREATE POLICY "Authenticated users can read methods" ON methods FOR SELECT TO authenticated USING (true);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert test methods (NOT from the book)
INSERT INTO methods (id, title, description, duration_days, is_test) VALUES
  ('00000000-0000-0000-0000-000000000001', 'блоки фокуса', 'раздели день на 90-минутные блоки глубокой работы с 20-минутными перерывами. мозг работает циклами – используй это.', 7, true),
  ('00000000-0000-0000-0000-000000000002', 'карта энергии', 'отслеживай свою энергию каждый час в течение дня. найди свои пики и спады, чтобы планировать важные дела на время максимальной продуктивности.', 7, true),
  ('00000000-0000-0000-0000-000000000003', 'правило двух минут', 'если задача занимает меньше 2 минут – делай её сразу, не откладывай. это убирает ментальный мусор и освобождает голову для важного.', 7, true)
ON CONFLICT DO NOTHING;

-- Index for fast AI log queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_date ON ai_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_character_messages_user_date ON character_messages(user_id, date);
