"""
Appointment model for patient appointment management
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.database import db

class Appointment(db.Model):
    """Model for patient appointments"""
    __tablename__ = 'appointments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id'), nullable=False)
    
    # Appointment details
    title = Column(String(255), nullable=False)
    appointment_type = Column(String(100), nullable=False)  # consultation, therapy, checkup, etc.
    appointment_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    
    # Location and provider details
    location = Column(String(500))
    address = Column(Text)
    provider_name = Column(String(255))
    provider_specialty = Column(String(255))
    provider_phone = Column(String(20))
    provider_email = Column(String(255))
    
    # Status and tracking
    status = Column(String(20), default='upcoming')  # upcoming, completed, missed, cancelled
    priority = Column(String(20), default='normal')  # low, normal, high, urgent
    
    # Preparation and follow-up
    preparation_notes = Column(Text)  # What to bring, pre-appointment instructions
    questions_to_ask = Column(ARRAY(String))  # Questions prepared for the appointment
    documents_needed = Column(ARRAY(String))  # List of documents to bring
    
    # Post-appointment details
    summary = Column(Text)  # Summary of what happened
    diagnosis_notes = Column(Text)  # Any diagnosis or findings
    treatment_plan = Column(Text)  # Recommended treatment
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    follow_up_instructions = Column(Text)
    
    # Reminders
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    caregiver = relationship("Caregiver")
    
    def to_dict(self):
        """Convert appointment to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'caregiver_id': str(self.caregiver_id),
            'title': self.title,
            'type': self.appointment_type,
            'date': self.appointment_date.isoformat() if self.appointment_date else None,
            'time': self.appointment_date.strftime('%H:%M') if self.appointment_date else None,
            'duration_minutes': self.duration_minutes,
            'location': self.location,
            'address': self.address,
            'provider': self.provider_name,
            'doctor': self.provider_name,  # Alias for frontend compatibility
            'specialty': self.provider_specialty,
            'provider_specialty': self.provider_specialty,
            'provider_phone': self.provider_phone,
            'provider_email': self.provider_email,
            'status': self.status,
            'priority': self.priority,
            'preparation_notes': self.preparation_notes,
            'notes': self.preparation_notes,  # Alias for frontend compatibility
            'questions_to_ask': self.questions_to_ask,
            'documents_needed': self.documents_needed,
            'summary': self.summary,
            'diagnosis_notes': self.diagnosis_notes,
            'treatment_plan': self.treatment_plan,
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'follow_up_instructions': self.follow_up_instructions,
            'reminder_sent': self.reminder_sent,
            'reminder_sent_at': self.reminder_sent_at.isoformat() if self.reminder_sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }