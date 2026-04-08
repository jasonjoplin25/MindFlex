-- Add new columns to patients table for caregiver service compatibility
-- Execute this migration to update existing patients table structure

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add age column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='age') THEN
        ALTER TABLE patients ADD COLUMN age INTEGER;
    END IF;
    
    -- Add gender column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='gender') THEN
        ALTER TABLE patients ADD COLUMN gender VARCHAR(20);
    END IF;
    
    -- Add condition column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='condition') THEN
        ALTER TABLE patients ADD COLUMN condition VARCHAR(200);
    END IF;
    
    -- Add mobility_level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='mobility_level') THEN
        ALTER TABLE patients ADD COLUMN mobility_level VARCHAR(50);
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='notes') THEN
        ALTER TABLE patients ADD COLUMN notes TEXT;
    END IF;
    
    -- Add strengths column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='strengths') THEN
        ALTER TABLE patients ADD COLUMN strengths VARCHAR(100)[];
    END IF;
    
    -- Add improvement_areas column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='improvement_areas') THEN
        ALTER TABLE patients ADD COLUMN improvement_areas VARCHAR(100)[];
    END IF;
    
    -- Add interests column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patients' AND column_name='interests') THEN
        ALTER TABLE patients ADD COLUMN interests VARCHAR(100)[];
    END IF;
    
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;