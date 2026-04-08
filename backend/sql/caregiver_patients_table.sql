-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create caregiver_patients table to manage relationships
CREATE TABLE IF NOT EXISTS caregiver_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Add constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'pending')),
    CONSTRAINT unique_caregiver_patient UNIQUE (caregiver_id, patient_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_caregiver_patients_caregiver_id ON caregiver_patients(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_patients_patient_id ON caregiver_patients(patient_id);

-- Enable Row Level Security
ALTER TABLE caregiver_patients ENABLE ROW LEVEL SECURITY;

-- Caregivers can view their own patient relationships
CREATE POLICY caregiver_patients_select_policy ON caregiver_patients
    FOR SELECT
    USING (
        auth.uid() = caregiver_id OR
        auth.uid() = patient_id
    );

-- Only caregivers can create relationships (we'll handle this through API)
CREATE POLICY caregiver_patients_insert_policy ON caregiver_patients
    FOR INSERT
    WITH CHECK (auth.uid() = caregiver_id);

-- Only involved parties can update the relationship
CREATE POLICY caregiver_patients_update_policy ON caregiver_patients
    FOR UPDATE
    USING (
        auth.uid() = caregiver_id OR
        auth.uid() = patient_id
    );

-- Grant permissions
GRANT ALL ON caregiver_patients TO authenticated; 