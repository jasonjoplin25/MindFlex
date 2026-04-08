-- SQL for creating reminder system tables
-- Run this to create the reminders tables

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
    
    -- Reminder details
    type VARCHAR(50) NOT NULL DEFAULT 'App Notification',
    message TEXT NOT NULL,
    time TIME NOT NULL,
    
    -- Scheduling
    active BOOLEAN DEFAULT TRUE,
    recurring BOOLEAN DEFAULT TRUE,
    days_of_week TEXT[], -- Array of day names like ['Monday', 'Tuesday', 'Wednesday']
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reminder logs table for tracking sent reminders
CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    
    -- Execution details
    scheduled_time TIMESTAMP NOT NULL,
    sent_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_caregiver_id ON reminders(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(active);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder_id ON reminder_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_scheduled_time ON reminder_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON reminder_logs(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminder_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reminder_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_reminder_updated_at();