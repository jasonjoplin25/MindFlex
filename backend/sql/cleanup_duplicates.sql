-- Create a temporary table with unique games
CREATE TEMP TABLE unique_games AS
SELECT DISTINCT ON (name) *
FROM games
ORDER BY name, id;

-- Delete all games
TRUNCATE games;

-- Reinsert only unique games
INSERT INTO games
SELECT * FROM unique_games;

-- Drop temporary table
DROP TABLE unique_games; 