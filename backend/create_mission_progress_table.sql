-- Create mission_progress table to track sequential campaign progress
CREATE TABLE IF NOT EXISTS mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('easy', 'medium', 'hard')),
    mission_number INTEGER NOT NULL CHECK (mission_number >= 1 AND mission_number <= 10),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    score INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, campaign_type, mission_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_campaign ON mission_progress(user_id, campaign_type);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_progress_completed_at ON mission_progress(completed_at);

-- Add comments for documentation
COMMENT ON TABLE mission_progress IS 'Tracks user progress through sequential mission campaigns';
COMMENT ON COLUMN mission_progress.campaign_type IS 'The campaign difficulty: easy, medium, or hard';
COMMENT ON COLUMN mission_progress.mission_number IS 'Mission number within the campaign (1-10)';
COMMENT ON COLUMN mission_progress.completed_at IS 'When the mission was completed';
COMMENT ON COLUMN mission_progress.score IS 'Score achieved in this mission';
COMMENT ON COLUMN mission_progress.duration_seconds IS 'Time taken to complete the mission';
COMMENT ON COLUMN mission_progress.session_data IS 'Additional metadata about the mission completion';