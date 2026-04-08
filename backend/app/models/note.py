"""
Note model for patient notes and observations
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.database import db

class PatientNote(db.Model):
    """Model for caregiver notes about patients"""
    __tablename__ = 'patient_notes'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id'), nullable=False)
    
    # Note content
    title = Column(String(255))
    content = Column(Text, nullable=False)
    note_type = Column(String(50), default='observation')  # observation, concern, milestone, medication, behavior, etc.
    category = Column(String(50), default='general')  # cognitive, behavioral, physical, social, medical, etc.
    
    # Importance and urgency
    urgency = Column(String(20), default='normal')  # low, normal, medium, high, critical
    priority = Column(String(20), default='normal')  # low, normal, high
    
    # Tagging and organization
    tags = Column(ARRAY(String))  # Searchable tags like ['memory', 'improvement', 'medication']
    
    # Status and visibility
    status = Column(String(20), default='active')  # active, archived, deleted
    is_private = Column(Boolean, default=False)  # Only visible to creating caregiver
    requires_follow_up = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    follow_up_completed = Column(Boolean, default=False)
    
    # Related information
    related_appointment_id = Column(UUID(as_uuid=True), ForeignKey('appointments.id'))
    related_medication_id = Column(UUID(as_uuid=True), ForeignKey('medications.id'))
    
    # Timestamps
    observation_date = Column(DateTime, default=datetime.utcnow)  # When the observation occurred
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="patient_notes")
    caregiver = relationship("Caregiver")
    related_appointment = relationship("Appointment")
    related_medication = relationship("Medication")
    
    def to_dict(self):
        """Convert note to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'caregiver_id': str(self.caregiver_id),
            'title': self.title,
            'content': self.content,
            'type': self.note_type,
            'category': self.category,
            'urgency': self.urgency,
            'priority': self.priority,
            'tags': self.tags or [],
            'status': self.status,
            'is_private': self.is_private,
            'requires_follow_up': self.requires_follow_up,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'follow_up_completed': self.follow_up_completed,
            'related_appointment_id': str(self.related_appointment_id) if self.related_appointment_id else None,
            'related_medication_id': str(self.related_medication_id) if self.related_medication_id else None,
            'observation_date': self.observation_date.isoformat() if self.observation_date else None,
            'date': self.observation_date.strftime('%Y-%m-%d') if self.observation_date else None,
            'time': self.observation_date.strftime('%H:%M') if self.observation_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }