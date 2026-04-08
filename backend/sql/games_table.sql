-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty_levels JSONB NOT NULL,
  avg_duration_seconds INTEGER NOT NULL,
  instructions TEXT NOT NULL,
  thumbnail TEXT
);

-- Insert initial game data
INSERT INTO games (id, name, description, type, difficulty_levels, avg_duration_seconds, instructions, thumbnail)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Memory Match', 'Test and improve your memory by matching pairs of cards', 'memory', '["easy", "medium", "hard"]', 120, 'Flip cards to find matching pairs. Remember the positions of cards you''ve seen to make matches more efficiently.', '/assets/games/memory-match.jpg'),
  ('22222222-2222-2222-2222-222222222222', 'Word Scramble', 'Unscramble letters to form words', 'word', '["easy", "medium", "hard"]', 180, 'Rearrange the scrambled letters to form valid words. Use hints if you get stuck.', '/assets/games/word-scramble.jpg'),
  ('33333333-3333-3333-3333-333333333333', 'Pattern Recognition', 'Identify and continue visual patterns', 'pattern', '["easy", "medium", "hard"]', 150, 'Study the pattern and select the option that correctly continues it. Look for repeating elements, progressions, or transformations.', '/assets/games/pattern-recognition.jpg'),
  ('44444444-4444-4444-4444-444444444444', 'Math Challenge', 'Solve arithmetic problems under time pressure', 'math', '["easy", "medium", "hard"]', 240, 'Solve arithmetic problems before time runs out. Each correct answer adds time to the clock.', '/assets/games/math-challenge.jpg'),
  ('55555555-5555-5555-5555-555555555555', 'Reaction Time', 'Test and improve your reaction speed', 'reflex', '["easy", "medium", "hard"]', 90, 'Click as quickly as possible when the target appears. Avoid clicking on distractors.', '/assets/games/reaction-time.jpg'),
  ('66666666-6666-6666-6666-666666666666', 'Snake Game', 'Classic snake game to test your reflexes and planning skills', 'snake', '["easy", "medium", "hard"]', 300, 'Control the snake to eat food and grow longer. Avoid hitting walls or yourself. Use arrow keys or WASD to move.', '/assets/games/snake.jpg');

-- Add RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Everyone can read games
CREATE POLICY games_select_policy ON games
  FOR SELECT USING (true);

-- Only authenticated users can modify games
CREATE POLICY games_modify_policy ON games
  USING (auth.role() = 'authenticated'); 