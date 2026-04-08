-- Forge & Glow Initial Tables Migration
-- Path: supabase/migrations/20260407_initial_tables.sql

-- Enable RLS
ALTER TABLE IF EXISTS daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_completions ENABLE ROW LEVEL SECURITY;

-- 1. daily_metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  entry_date DATE NOT NULL,
  water_ml FLOAT DEFAULT 0,
  weight_kg FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, entry_date)
);

-- 2. item_completions (Routine items)
CREATE TABLE IF NOT EXISTS item_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  entry_date DATE NOT NULL,
  item_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, entry_date, item_id)
);

-- 3. exercise_completions (Gym exercises)
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  entry_date DATE NOT NULL,
  exercise_num TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, entry_date, exercise_num)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON daily_metrics(username, entry_date);
CREATE INDEX IF NOT EXISTS idx_items_user_date ON item_completions(username, entry_date);
CREATE INDEX IF NOT EXISTS idx_exercises_user_date ON exercise_completions(username, entry_date);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_metrics_updated_at') THEN
    CREATE TRIGGER tr_metrics_updated_at BEFORE UPDATE ON daily_metrics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_items_updated_at') THEN
    CREATE TRIGGER tr_items_updated_at BEFORE UPDATE ON item_completions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_exercises_updated_at') THEN
    CREATE TRIGGER tr_exercises_updated_at BEFORE UPDATE ON exercise_completions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- RLS Baseline Policies (Simple version for now)
-- You may want to restrict based on authenticated user IDs if using Supabase Auth properly.
-- Following the "current app flow" compatibility request:
CREATE POLICY "Allow all access" ON daily_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access" ON item_completions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON exercise_completions FOR ALL USING (true);
