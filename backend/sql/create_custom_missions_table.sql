-- Create custom_missions table for storing user-created snake game missions
-- This table stores the custom mission layouts created in the Mission Builder

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS custom_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    grid_size INTEGER NOT NULL,
    grid_data JSONB NOT NULL,  -- The 2D grid array with walls, snake_start, animals, and target
    animal_type VARCHAR(50) NOT NULL DEFAULT 'turtle',  -- Which animal to rescue (turtle, ladybug, spider, etc.)
    is_public BOOLEAN DEFAULT FALSE,  -- Whether others can play this mission
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on creator_id for efficient user mission lookups
CREATE INDEX IF NOT EXISTS idx_custom_missions_creator_id ON custom_missions(creator_id);

-- Create index on is_public for efficient public mission lookups
CREATE INDEX IF NOT EXISTS idx_custom_missions_public ON custom_missions(is_public) WHERE is_public = TRUE;

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_custom_missions_created_at ON custom_missions(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_missions_updated_at_trigger
    BEFORE UPDATE ON custom_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_missions_updated_at();