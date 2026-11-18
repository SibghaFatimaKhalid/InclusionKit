-- ============================================================================
-- InclusionKit - Accessibility Management System
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- ============================================================================
-- Run this script in your Supabase Project -> SQL Editor -> New Query.

-- 1. Personalized Accessibility Profiles
CREATE TABLE IF NOT EXISTS public.accessibility_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'User',
  disability_preset TEXT NOT NULL DEFAULT 'custom',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accessibility_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.accessibility_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.accessibility_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.accessibility_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Custom Voice Commands & Macros
CREATE TABLE IF NOT EXISTS public.voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase TEXT NOT NULL,
  action_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own voice commands"
  ON public.voice_commands FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Saved TTS & Reading History
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_position INT NOT NULL DEFAULT 0,
  tts_rate NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reading history"
  ON public.reading_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. HCI Usability Analytics
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_key TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'toggle',
  duration_sec INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert analytics"
  ON public.usage_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own analytics"
  ON public.usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Domain-Specific Presets
CREATE TABLE IF NOT EXISTS public.domain_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  preset_name TEXT NOT NULL DEFAULT 'Custom',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domain presets"
  ON public.domain_presets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Accessibility Feedback & Bug Reports
CREATE TABLE IF NOT EXISTS public.accessibility_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_section TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accessibility_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reports"
  ON public.accessibility_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can submit reports"
  ON public.accessibility_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own reports"
  ON public.accessibility_reports FOR UPDATE
  USING (auth.uid() = user_id);
