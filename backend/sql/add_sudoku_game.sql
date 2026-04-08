-- Check if Sudoku game already exists, if not insert it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM games WHERE name = 'Sudoku') THEN
        INSERT INTO games (id, name, description, type, category, difficulty_levels, avg_duration_seconds, instructions, config, is_active, created_at, updated_at)
        VALUES (
          uuid_generate_v4(), 
          'Sudoku', 
          'Fill the 9x9 grid with numbers 1-9, ensuring each row, column, and 3x3 box contains all digits', 
          'sudoku', 
          'puzzle',
          ARRAY['easy', 'medium', 'hard'], 
          480, 
          'Fill the grid so each row, column, and 3x3 box contains numbers 1-9 without repetition. Use logic and deduction to solve the puzzle.',
          '{"scoring": {"easy": 1000, "medium": 2000, "hard": 3000}, "hints": {"easy": 5, "medium": 3, "hard": 1}}'::jsonb,
          true,
          NOW(),
          NOW()
        );
    END IF;
END
$$;