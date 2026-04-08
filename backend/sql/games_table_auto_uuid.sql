-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create games table with auto-generated UUIDs
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty_levels JSONB NOT NULL,
  avg_duration_seconds INTEGER NOT NULL,
  instructions TEXT NOT NULL,
  thumbnail TEXT
);

-- Insert initial game data with explicit UUID generation
INSERT INTO games (id, name, description, type, difficulty_levels, avg_duration_seconds, instructions, thumbnail)
VALUES
  (uuid_generate_v4(), 'Memory Match', 'Test and improve your memory by matching pairs of cards', 'memory', '["easy", "medium", "hard"]', 120, 'Flip cards to find matching pairs. Remember the positions of cards you''ve seen to make matches more efficiently.', '/assets/games/memory-match.jpg'),
  (uuid_generate_v4(), 'Word Scramble', 'Unscramble letters to form words', 'word', '["easy", "medium", "hard"]', 180, 'Rearrange the scrambled letters to form valid words. Use hints if you get stuck.', '/assets/games/word-scramble.jpg'),
  (uuid_generate_v4(), 'Pattern Recognition', 'Identify and continue visual patterns', 'pattern', '["easy", "medium", "hard"]', 150, 'Study the pattern and select the option that correctly continues it. Look for repeating elements, progressions, or transformations.', '/assets/games/pattern-recognition.jpg'),
  (uuid_generate_v4(), 'Math Challenge', 'Solve arithmetic problems under time pressure', 'math', '["easy", "medium", "hard"]', 240, 'Solve arithmetic problems before time runs out. Each correct answer adds time to the clock.', '/assets/games/math-challenge.jpg'),
  (uuid_generate_v4(), 'Reaction Time', 'Test and improve your reaction speed', 'reflex', '["easy", "medium", "hard"]', 90, 'Click as quickly as possible when the target appears. Avoid clicking on distractors.', '/assets/games/reaction-time.jpg');

-- Drop existing policies if they exist
DROP POLICY IF EXISTS games_select_policy ON games;
DROP POLICY IF EXISTS games_modify_policy ON games;

-- Add RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Everyone can read games
CREATE POLICY games_select_policy ON games
  FOR SELECT USING (true);

-- Only authenticated users can modify games
CREATE POLICY games_modify_policy ON games
  USING (auth.role() = 'authenticated'); 