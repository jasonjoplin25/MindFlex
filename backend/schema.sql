-- MindFlex PostgreSQL Schema
-- Run this file to create the initial database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    user_type VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (user_type IN ('patient', 'caregiver', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table for extended patient information
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    medical_record_number VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT[],
    medications TEXT[],
    cognitive_baseline JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caregivers table
CREATE TABLE IF NOT EXISTS caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50),
    specialty VARCHAR(100),
    organization VARCHAR(200),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caregiver-Patient relationships
CREATE TABLE IF NOT EXISTS caregiver_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES caregivers(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'primary',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    permissions JSONB DEFAULT '{"view_scores": true, "view_medical": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(caregiver_id, patient_id)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    difficulty_levels TEXT[] DEFAULT ARRAY['easy', 'medium', 'hard'],
    avg_duration_seconds INTEGER DEFAULT 300,
    instructions TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions (individual game instances)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER,
    duration_seconds INTEGER NOT NULL,
    errors INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    session_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    criteria JSONB NOT NULL,
    points INTEGER DEFAULT 0,
    badge_level VARCHAR(20) DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);

-- Assessment results
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    results JSONB NOT NULL,
    score NUMERIC(5,2),
    administered_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_patients_caregiver_id ON caregiver_patients(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_patients_patient_id ON caregiver_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started_at ON game_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient_id ON assessments(patient_id);

-- Insert initial games data
INSERT INTO games (id, name, description, type, category, difficulty_levels, avg_duration_seconds, instructions, config) VALUES
('11111111-1111-1111-1111-111111111111', 'Memory Match', 'Test and improve your visual memory by matching pairs of cards', 'memory', 'cognitive', ARRAY['easy', 'medium', 'hard'], 180, 'Flip cards to find matching pairs. Remember the positions of cards you''ve seen to make matches more efficiently.', '{"grid_sizes": {"easy": [3,4], "medium": [4,4], "hard": [4,6]}, "time_limits": {"easy": 300, "medium": 240, "hard": 180}}'),
('22222222-2222-2222-2222-222222222222', 'Word Scramble', 'Unscramble letters to form words and improve your verbal cognitive abilities', 'word', 'language', ARRAY['easy', 'medium', 'hard'], 240, 'Unscramble the letters to form valid words. Use hints if you get stuck.', '{"word_lengths": {"easy": [4,5], "medium": [5,7], "hard": [6,9]}, "hint_system": true}'),
('33333333-3333-3333-3333-333333333333', 'Pattern Recognition', 'Identify and continue visual patterns to enhance visual-spatial memory', 'pattern', 'visual', ARRAY['easy', 'medium', 'hard'], 210, 'Study the pattern and select the option that correctly continues it.', '{"pattern_types": ["sequence", "rotation", "color", "shape"], "complexity": {"easy": 1, "medium": 2, "hard": 3}}'),
('44444444-4444-4444-4444-444444444444', 'Math Challenge', 'Solve arithmetic problems quickly to improve processing speed', 'math', 'numerical', ARRAY['easy', 'medium', 'hard'], 300, 'Solve math problems before time runs out. Each correct answer adds time.', '{"operations": {"easy": ["+", "-"], "medium": ["+", "-", "*"], "hard": ["+", "-", "*", "/"]}, "number_ranges": {"easy": [1, 20], "medium": [1, 100], "hard": [1, 200]}}'),
('55555555-5555-5555-5555-555555555555', 'Reaction Time', 'Test and improve your reaction speed and attention', 'reaction', 'attention', ARRAY['easy', 'medium', 'hard'], 120, 'Click as quickly as possible when the target appears. Avoid distractors.', '{"target_types": ["color", "shape", "text"], "distractor_count": {"easy": 0, "medium": 2, "hard": 4}, "delay_range": {"easy": [2,4], "medium": [1,3], "hard": [0.5,2]}}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (id, name, description, icon, criteria, points, badge_level) VALUES
('a1111111-1111-1111-1111-111111111111', 'First Steps', 'Complete your first game', 'trophy', '{"games_completed": 1}', 10, 'bronze'),
('a2222222-2222-2222-2222-222222222222', 'Memory Master', 'Score over 80% in a memory game', 'brain', '{"game_type": "memory", "min_score_percent": 80}', 25, 'silver'),
('a3333333-3333-3333-3333-333333333333', 'Streak Champion', 'Play games for 7 consecutive days', 'calendar', '{"consecutive_days": 7}', 50, 'gold'),
('a4444444-4444-4444-4444-444444444444', 'Speed Demon', 'Complete a reaction game in under 30 seconds', 'lightning', '{"game_type": "reaction", "max_duration": 30}', 30, 'silver'),
('a5555555-5555-5555-5555-555555555555', 'Perfectionist', 'Complete a game with no errors', 'star', '{"errors": 0, "completed": true}', 40, 'gold')
ON CONFLICT (id) DO NOTHING;