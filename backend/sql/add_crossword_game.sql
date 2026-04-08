-- Add Crossword game to the games table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM games WHERE name = 'Crossword') THEN
        INSERT INTO games (id, name, description, type, category, difficulty_levels, avg_duration_seconds, instructions, config, is_active, created_at, updated_at)
        VALUES (
          uuid_generate_v4(), 
          'Crossword', 
          'Solve word puzzles by filling in letters based on intersecting clues', 
          'crossword', 
          'word',
          ARRAY['easy', 'medium', 'hard'], 
          720, 
          'Fill the grid with words that match the given clues. Words intersect at shared letters. Click a word to see its clue, then type letters to fill it in.',
          '{"scoring": {"easy": 800, "medium": 1500, "hard": 2500}, "grid_sizes": {"easy": "11x11", "medium": "13x13", "hard": "15x15"}, "word_counts": {"easy": "15-20", "medium": "25-35", "hard": "40-50"}}'::jsonb,
          true,
          NOW(),
          NOW()
        );
    END IF;
END
$$;