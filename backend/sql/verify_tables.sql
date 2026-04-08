-- List all tables in our schema
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('game_scores', 'caregiver_patients', 'games')
ORDER BY table_name, ordinal_position; 