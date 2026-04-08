"""
Patient routine model for storing daily routine activities
"""
from datetime import datetime, time
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Time
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import db

class PatientRoutine(db.Model):
    """Model for patient routine activities"""
    __tablename__ = 'patient_routines'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id'), nullable=False)
    
    # Routine details
    routine_type = Column(String(50), nullable=False)  # 'morning', 'evening'
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Scheduling
    scheduled_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=30)
    
    # Priority and requirements
    priority = Column(String(20), default='normal')  # 'high', 'normal', 'low'
    is_required = Column(Boolean, default=True)
    
    # Status tracking
    completion_status = Column(String(20), default='pending')  # 'pending', 'completed', 'skipped'
    completed_at = Column(DateTime)
    
    # Additional information
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient")
    caregiver = relationship("Caregiver")
    
    def to_dict(self):
        """Convert routine to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'caregiver_id': str(self.caregiver_id),
            'routine_type': self.routine_type,
            'name': self.name,
            'description': self.description,
            'scheduled_time': self.scheduled_time.strftime('%H:%M') if self.scheduled_time else None,
            'duration_minutes': self.duration_minutes,
            'priority': self.priority,
            'is_required': self.is_required,
            'completion_status': self.completion_status,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }