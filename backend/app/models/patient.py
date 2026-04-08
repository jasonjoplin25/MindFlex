from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from datetime import datetime
import uuid
from app.database import db

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    medical_record_number = Column(String(50))
    emergency_contact_name = Column(String(100))
    emergency_contact_phone = Column(String(20))
    medical_conditions = Column(ARRAY(String))
    medications = Column(ARRAY(String))
    cognitive_baseline = Column(JSONB, default={})
    
    # Additional patient attributes expected by caregiver service
    age = Column(Integer)
    gender = Column(String(20))
    condition = Column(String(200))
    mobility_level = Column(String(50))
    notes = Column(Text)
    strengths = Column(ARRAY(String))
    improvement_areas = Column(ARRAY(String))
    interests = Column(ARRAY(String))
    preferences = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    caregiver_relationships = db.relationship('CaregiverPatient', backref='patient', cascade='all, delete-orphan')
    assessments = db.relationship('Assessment', backref='patient', cascade='all, delete-orphan')
    medications = db.relationship('Medication', back_populates='patient', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', back_populates='patient', cascade='all, delete-orphan') 
    patient_notes = db.relationship('PatientNote', back_populates='patient', cascade='all, delete-orphan')
    mood_entries = db.relationship('MoodEntry', back_populates='patient', cascade='all, delete-orphan')
    
    def __init__(self, user_id, **kwargs):
        self.user_id = user_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self, include_medical=False):
        """Convert patient to dictionary."""
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'age': self.age,
            'gender': self.gender,
            'condition': self.condition,
            'mobility_level': self.mobility_level,
            'notes': self.notes,
            'strengths': self.strengths or [],
            'improvement_areas': self.improvement_areas or [],
            'interests': self.interests or [],
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'preferences': self.preferences or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_medical:
            data.update({
                'medical_record_number': self.medical_record_number,
                'medical_conditions': self.medical_conditions or [],
                'medications': self.medications or [],
                'cognitive_baseline': self.cognitive_baseline or {}
            })
        
        return data
    
    @classmethod
    def find_by_user_id(cls, user_id):
        """Find patient by user ID."""
        return cls.query.filter_by(user_id=user_id).first()
    
    def get_caregivers(self):
        """Get all active caregivers for this patient."""
        return [rel.caregiver for rel in self.caregiver_relationships if rel.status == 'active']
    
    def __repr__(self):
        return f'<Patient {self.id}>'