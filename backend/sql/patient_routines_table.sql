-- Create patient routines table for storing daily routine activities
CREATE TABLE IF NOT EXISTS patient_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    
    -- Routine details
    routine_type VARCHAR(50) NOT NULL, -- 'morning', 'evening'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scheduling
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Priority and requirements
    priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
    is_required BOOLEAN DEFAULT TRUE,
    
    -- Status tracking
    completion_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
    completed_at TIMESTAMP,
    
    -- Additional information
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_routines_patient_id ON patient_routines(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_routines_routine_type ON patient_routines(routine_type);
CREATE INDEX IF NOT EXISTS idx_patient_routines_scheduled_time ON patient_routines(scheduled_time);

-- Create update trigger for updated_at field
CREATE OR REPLACE FUNCTION update_patient_routines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_routines_updated_at 
    BEFORE UPDATE ON patient_routines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_patient_routines_updated_at();