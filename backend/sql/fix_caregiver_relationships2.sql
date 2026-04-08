-- Fix missing caregiver-patient relationships with proper UUID generation

-- Insert missing relationships (assign all patients to all caregivers for now)
INSERT INTO caregiver_patients (id, caregiver_id, patient_id, relationship_type, status)
SELECT 
    gen_random_uuid() as id,
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
SELECT 'Relationships created:' as status;
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