-- Fix missing caregiver-patient relationships
-- This creates relationships between all caregivers and all patients

-- Check current state first
SELECT 'Current state:' as status;
SELECT 
    u.email as caregiver_email,
    c.id as caregiver_id
FROM users u 
JOIN caregivers c ON u.id = c.user_id 
WHERE u.user_type = 'caregiver';

SELECT 
    u.email as patient_email,
    p.id as patient_id
FROM users u 
JOIN patients p ON u.id = p.user_id 
WHERE u.user_type = 'patient';

SELECT 
    cp.caregiver_id,
    cp.patient_id,
    cp.status
FROM caregiver_patients cp;

-- Insert missing relationships (assign all patients to all caregivers for now)
INSERT INTO caregiver_patients (caregiver_id, patient_id, relationship_type, status)
SELECT 
    c.id as caregiver_id,
    p.id as patient_id,
    'primary' as relationship_type,
    'active' as status
FROM caregivers c
CROSS JOIN patients p
WHERE NOT EXISTS (
    SELECT 1 FROM caregiver_patients cp 
    WHERE cp.caregiver_id = c.id 
    AND cp.patient_id = p.id
);

-- Show results after fixing
SELECT 'After fixing:' as status;
SELECT 
    cu.email as caregiver_email,
    pu.email as patient_email,
    cp.status,
    cp.created_at
FROM caregiver_patients cp
JOIN caregivers c ON cp.caregiver_id = c.id
JOIN users cu ON c.user_id = cu.id
JOIN patients p ON cp.patient_id = p.id
JOIN users pu ON p.user_id = pu.id
ORDER BY cu.email, pu.email;