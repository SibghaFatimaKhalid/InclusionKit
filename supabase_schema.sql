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

-- 7. Online Store Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can place orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 8. Role Column on Profiles (user | admin)
ALTER TABLE public.accessibility_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 9. Database-Driven Store Products (Public Read, Admin Write)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  reviews INT NOT NULL DEFAULT 120,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  swatches JSONB NOT NULL DEFAULT '[{"id":"obsidian","name":"Obsidian Black","hex":"#0f172a","symbol":"●"},{"id":"azure","name":"Pacific Azure","hex":"#0284c7","symbol":"◆"}]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Only admins can add products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accessibility_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.accessibility_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Grant Schema & Table Permissions to Supabase API Roles (RLS still enforces security)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
