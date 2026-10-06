-- Supabase Leaderboard Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  school TEXT NOT NULL,
  best_score INTEGER NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  stability_score INTEGER NOT NULL CHECK (stability_score BETWEEN 0 AND 40),
  challenge_attempts INTEGER NOT NULL DEFAULT 0,
  experiment_count INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  school_scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique key: one record per student per school
-- (name + class + school combo — best effort for school demos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_student_school 
  ON leaderboard(student_name, class_name, school_scope);

-- Ranking index (primary: best_score DESC, then stability DESC, then fewer attempts ASC, then earliest ASC)
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranking
  ON leaderboard(school_scope, best_score DESC, stability_score DESC, challenge_attempts ASC, achieved_at ASC);

-- Function to upsert a student's score (only update if new score is better)
CREATE OR REPLACE FUNCTION upsert_leaderboard_score(
  p_student_name TEXT,
  p_class_name TEXT,
  p_school TEXT,
  p_best_score INTEGER,
  p_stability_score INTEGER,
  p_challenge_attempts INTEGER,
  p_experiment_count INTEGER,
  p_badges TEXT[],
  p_school_scope TEXT
) RETURNS TABLE(
  record_id UUID,
  updated BOOLEAN,
  current_best_score INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  existing_score INTEGER;
  existing_id UUID;
BEGIN
  -- Check for existing record
  SELECT id, best_score INTO existing_id, existing_score
  FROM leaderboard
  WHERE student_name = p_student_name
    AND class_name = p_class_name
    AND school_scope = p_school_scope
  LIMIT 1;

  IF existing_id IS NULL THEN
    -- Insert new record
    INSERT INTO leaderboard (
      student_name, class_name, school, best_score, stability_score,
      challenge_attempts, experiment_count, badges, achieved_at, school_scope
    ) VALUES (
      p_student_name, p_class_name, p_school, p_best_score, p_stability_score,
      p_challenge_attempts, p_experiment_count, p_badges, NOW(), p_school_scope
    )
    RETURNING id INTO existing_id;
    
    RETURN QUERY SELECT existing_id, TRUE, p_best_score;
  ELSIF p_best_score > existing_score THEN
    -- Update only if new score is better
    UPDATE leaderboard SET
      best_score = p_best_score,
      stability_score = p_stability_score,
      challenge_attempts = p_challenge_attempts,
      experiment_count = p_experiment_count,
      badges = p_badges,
      achieved_at = NOW(),
      updated_at = NOW()
    WHERE id = existing_id;
    
    RETURN QUERY SELECT existing_id, TRUE, p_best_score;
  ELSE
    -- Score not improved
    RETURN QUERY SELECT existing_id, FALSE, existing_score;
  END IF;
END;
$$;

-- Enable Row Level Security (RLS) — allow all reads, server-only writes
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public leaderboard read" ON leaderboard
  FOR SELECT USING (true);

-- Server-only write policy (uses service role key, bypasses RLS)
-- Writes should only come from the server API route using SUPABASE_SERVICE_ROLE_KEY
