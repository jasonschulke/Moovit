-- Moove Database Schema for Supabase
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New Query

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  personality TEXT DEFAULT 'encouraging',
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sessions (completed workouts)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  template_id UUID,
  name TEXT NOT NULL,
  blocks JSONB DEFAULT '[]',
  exercises JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  total_duration INTEGER,
  overall_effort INTEGER,
  cardio_type TEXT,
  distance NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved workout templates
CREATE TABLE saved_workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  estimated_minutes INTEGER,
  blocks JSONB DEFAULT '[]',
  cardio_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom exercises
CREATE TABLE custom_exercises (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  equipment TEXT NOT NULL,
  default_weight NUMERIC,
  default_reps INTEGER,
  default_duration INTEGER,
  description TEXT,
  alternatives TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences (JSON blob for flexibility)
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  rest_days TEXT[] DEFAULT '{}',
  equipment_config JSONB DEFAULT '{}',
  favorites JSONB DEFAULT '{"workouts":[],"exercises":[]}',
  skip_counts JSONB DEFAULT '{}',
  custom_descriptions JSONB DEFAULT '{"exercises":{},"workouts":{}}',
  chat_history JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can CRUD own sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own workouts" ON saved_workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own exercises" ON custom_exercises FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
