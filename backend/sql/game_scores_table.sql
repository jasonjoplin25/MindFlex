-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create game_scores table
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    errors INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Add constraints
    CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
    CONSTRAINT positive_score CHECK (score >= 0),
    CONSTRAINT positive_duration CHECK (duration >= 0),
    CONSTRAINT positive_errors CHECK (errors >= 0)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_scores_patient_id ON game_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at);

-- Enable Row Level Security
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Users can insert their own scores
CREATE POLICY game_scores_insert_policy ON game_scores
    FOR INSERT
    WITH CHECK (auth.uid()::text = patient_id::text);

-- Users can view their own scores
CREATE POLICY game_scores_select_policy ON game_scores
    FOR SELECT
    USING (
        auth.uid()::text = patient_id::text OR
        -- Allow caregivers to view their patients' scores (assuming caregiver_patient relationship exists)
        EXISTS (
            SELECT 1 FROM caregiver_patients
            WHERE caregiver_id = auth.uid()
            AND patient_id = game_scores.patient_id
        )
    );

-- Create a view for game leaderboards
CREATE OR REPLACE VIEW game_leaderboards AS
SELECT 
    gs.game_name,
    gs.game_type,
    gs.difficulty,
    u.email as user_email,
    gs.score,
    gs.duration,
    gs.created_at
FROM game_scores gs
JOIN auth.users u ON gs.patient_id = u.id
WHERE gs.created_at >= NOW() - INTERVAL '30 days'
ORDER BY gs.score DESC;

-- Grant appropriate permissions
GRANT ALL ON game_scores TO authenticated;
GRANT SELECT ON game_leaderboards TO authenticated; 