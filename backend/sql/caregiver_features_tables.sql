-- SQL for creating caregiver feature tables
-- Run this to create the new tables for medication, appointment, note, and mood tracking

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    
    -- Medication details
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    unit VARCHAR(20) DEFAULT 'mg',
    
    -- Administration details  
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) DEFAULT 'oral',
    times TEXT[], -- Array of time strings like ['08:00', '20:00']
    instructions TEXT,
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Prescription details
    prescriber VARCHAR(255),
    prescription_number VARCHAR(100),
    refills_remaining INTEGER DEFAULT 0,
    
    -- Side effects and monitoring
    side_effects TEXT[],
    contraindications TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medication logs table for tracking administration
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES caregivers(id),
    
    -- Administration details
    scheduled_time TIMESTAMP NOT NULL,
    administered_time TIMESTAMP,
    dosage_given VARCHAR(100),
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, given, missed, refused
    
    -- Notes and observations
    notes TEXT,
    side_effects_observed TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    
    -- Appointment details
    title VARCHAR(255) NOT NULL,
    appointment_type VARCHAR(100) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Location and provider details
    location VARCHAR(500),
    address TEXT,
    provider_name VARCHAR(255),
    provider_specialty VARCHAR(255),
    provider_phone VARCHAR(20),
    provider_email VARCHAR(255),
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'scheduled',
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Preparation and follow-up
    preparation_notes TEXT,
    questions_to_ask TEXT[],
    documents_needed TEXT[],
    
    -- Post-appointment details
    summary TEXT,
    diagnosis_notes TEXT,
    treatment_plan TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP,
    follow_up_instructions TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patient notes table
CREATE TABLE IF NOT EXISTS patient_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    
    -- Note content
    title VARCHAR(255),
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'observation',
    category VARCHAR(50) DEFAULT 'general',
    
    -- Importance and urgency
    urgency VARCHAR(20) DEFAULT 'normal',
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Tagging and organization
    tags TEXT[],
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'active',
    is_private BOOLEAN DEFAULT FALSE,
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    
    -- Related information
    related_appointment_id UUID REFERENCES appointments(id),
    related_medication_id UUID REFERENCES medications(id),
    
    -- Timestamps
    observation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    
    -- Mood assessment
    mood VARCHAR(50) NOT NULL,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    
    -- Energy and activity levels
    energy_level VARCHAR(50) DEFAULT 'medium',
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
    
    -- Anxiety and stress
    anxiety_level VARCHAR(50) DEFAULT 'low',
    anxiety_score INTEGER CHECK (anxiety_score >= 1 AND anxiety_score <= 10),
    
    -- Sleep quality
    sleep_quality VARCHAR(50),
    sleep_duration_hours DECIMAL(4,2),
    
    -- Cognitive indicators
    confusion_level VARCHAR(50) DEFAULT 'none',
    orientation_score INTEGER CHECK (orientation_score >= 1 AND orientation_score <= 10),
    memory_clarity VARCHAR(50) DEFAULT 'clear',
    
    -- Behavioral observations
    agitation_level VARCHAR(50) DEFAULT 'none',
    social_engagement VARCHAR(50) DEFAULT 'normal',
    appetite VARCHAR(50) DEFAULT 'normal',
    
    -- Physical indicators
    pain_level INTEGER DEFAULT 0 CHECK (pain_level >= 0 AND pain_level <= 10),
    physical_comfort VARCHAR(50) DEFAULT 'comfortable',
    
    -- Context and triggers
    time_of_day VARCHAR(20),
    location VARCHAR(255),
    activity_context VARCHAR(255),
    triggers TEXT[],
    
    -- Interventions and responses
    interventions_used TEXT[],
    response_to_intervention VARCHAR(255),
    
    -- Additional notes
    notes TEXT,
    behavioral_notes TEXT,
    caregiver_concerns TEXT,
    
    -- Timestamps
    observation_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mood patterns table for analytics
CREATE TABLE IF NOT EXISTS mood_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Pattern identification
    pattern_type VARCHAR(100) NOT NULL,
    pattern_description TEXT,
    
    -- Pattern metrics
    frequency VARCHAR(50),
    severity VARCHAR(50),
    duration VARCHAR(100),
    
    -- Identified triggers and interventions
    common_triggers TEXT[],
    effective_interventions TEXT[],
    
    -- Time periods
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Pattern status
    status VARCHAR(20) DEFAULT 'active',
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_scheduled_time ON medication_logs(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_observation_date ON patient_notes(observation_date);
CREATE INDEX IF NOT EXISTS idx_patient_notes_type ON patient_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_mood_entries_patient_id ON mood_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_observation_date ON mood_entries(observation_datetime);

CREATE INDEX IF NOT EXISTS idx_mood_patterns_patient_id ON mood_patterns(patient_id);
CREATE INDEX IF NOT EXISTS idx_mood_patterns_status ON mood_patterns(status);

-- Create update triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_logs_updated_at BEFORE UPDATE ON medication_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_notes_updated_at BEFORE UPDATE ON patient_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_patterns_updated_at BEFORE UPDATE ON mood_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();