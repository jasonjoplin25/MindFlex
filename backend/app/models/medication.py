"""
Medication model for patient medication management
"""
from datetime import datetime, time
from sqlalchemy import Column, String, Text, Boolean, DateTime, Time, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.database import db

class Medication(db.Model):
    """Model for patient medications"""
    __tablename__ = 'medications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id'), nullable=False)
    
    # Medication details
    name = Column(String(255), nullable=False)
    generic_name = Column(String(255))
    dosage = Column(String(100), nullable=False)  # e.g., "10mg", "5ml"
    unit = Column(String(20), default='mg')  # mg, ml, tablets, etc.
    
    # Administration details
    frequency = Column(String(100), nullable=False)  # e.g., "twice daily", "every 8 hours"
    route = Column(String(50), default='oral')  # oral, injection, topical, etc.
    times = Column(ARRAY(String), nullable=False)  # ["08:00", "20:00"]
    instructions = Column(Text)  # "Take with food", "On empty stomach", etc.
    
    # Status and tracking
    status = Column(String(20), default='active')  # active, discontinued, paused
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    
    # Prescription details
    prescriber = Column(String(255))  # Doctor name
    prescription_number = Column(String(100))
    refills_remaining = Column(Integer, default=0)
    
    # Side effects and monitoring
    side_effects = Column(ARRAY(String))  # Known side effects to monitor
    contraindications = Column(ARRAY(String))  # Drug interactions, allergies
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="medications")
    caregiver = relationship("Caregiver")
    medication_logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert medication to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'name': self.name,
            'generic_name': self.generic_name,
            'dosage': self.dosage,
            'unit': self.unit,
            'frequency': self.frequency,
            'route': self.route,
            'times': self.times,
            'instructions': self.instructions,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'prescriber': self.prescriber,
            'prescription_number': self.prescription_number,
            'refills_remaining': self.refills_remaining,
            'side_effects': self.side_effects,
            'contraindications': self.contraindications,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class MedicationLog(db.Model):
    """Model for tracking medication administration"""
    __tablename__ = 'medication_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medication_id = Column(UUID(as_uuid=True), ForeignKey('medications.id'), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id'))
    
    # Administration details
    scheduled_time = Column(DateTime, nullable=False)
    administered_time = Column(DateTime)
    dosage_given = Column(String(100))
    status = Column(String(20), default='scheduled')  # scheduled, given, missed, refused
    
    # Notes and observations
    notes = Column(Text)
    side_effects_observed = Column(ARRAY(String))
    effectiveness_rating = Column(Integer)  # 1-5 scale
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    medication = relationship("Medication", back_populates="medication_logs")
    patient = relationship("Patient")
    caregiver = relationship("Caregiver")
    
    def to_dict(self):
        """Convert medication log to dictionary"""
        return {
            'id': str(self.id),
            'medication_id': str(self.medication_id),
            'patient_id': str(self.patient_id),
            'caregiver_id': str(self.caregiver_id) if self.caregiver_id else None,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'administered_time': self.administered_time.isoformat() if self.administered_time else None,
            'dosage_given': self.dosage_given,
            'status': self.status,
            'notes': self.notes,
            'side_effects_observed': self.side_effects_observed,
            'effectiveness_rating': self.effectiveness_rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }