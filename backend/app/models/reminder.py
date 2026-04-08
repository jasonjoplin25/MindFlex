from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Time
from datetime import datetime, time
import uuid
from app.database import db

class Reminder(db.Model):
    __tablename__ = 'reminders'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id', ondelete='CASCADE'), nullable=False)
    
    # Reminder details
    type = Column(String(50), nullable=False, default='App Notification')  # SMS, Email, App Notification
    message = Column(Text, nullable=False)
    time = Column(Time, nullable=False)
    
    # Scheduling
    active = Column(Boolean, default=True)
    recurring = Column(Boolean, default=True)
    days_of_week = Column(ARRAY(String), default=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])  # Days when reminder is active
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, patient_id, caregiver_id, **kwargs):
        self.patient_id = patient_id
        self.caregiver_id = caregiver_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert reminder to dictionary."""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'caregiver_id': str(self.caregiver_id),
            'type': self.type,
            'message': self.message,
            'time': self.time.strftime('%H:%M') if self.time else None,
            'active': self.active,
            'recurring': self.recurring,
            'days_of_week': self.days_of_week or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Reminder {self.id}>'


class ReminderLog(db.Model):
    __tablename__ = 'reminder_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reminder_id = Column(UUID(as_uuid=True), ForeignKey('reminders.id', ondelete='CASCADE'), nullable=False)
    
    # Execution details
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    sent_time = Column(DateTime(timezone=True))
    status = Column(String(20), default='pending')  # pending, sent, failed
    error_message = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    def to_dict(self):
        """Convert reminder log to dictionary."""
        return {
            'id': str(self.id),
            'reminder_id': str(self.reminder_id),
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'sent_time': self.sent_time.isoformat() if self.sent_time else None,
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<ReminderLog {self.id}>'