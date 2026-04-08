from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint
from datetime import datetime
import uuid
from app.database import db

class Caregiver(db.Model):
    __tablename__ = 'caregivers'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    license_number = Column(String(50))
    specialty = Column(String(100))
    organization = Column(String(200))
    phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient_relationships = db.relationship('CaregiverPatient', backref='caregiver', cascade='all, delete-orphan')
    
    def __init__(self, user_id, **kwargs):
        self.user_id = user_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert caregiver to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'license_number': self.license_number,
            'specialty': self.specialty,
            'organization': self.organization,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def find_by_user_id(cls, user_id):
        """Find caregiver by user ID."""
        return cls.query.filter_by(user_id=user_id).first()
    
    def get_patients(self):
        """Get all active patients for this caregiver."""
        return [rel.patient for rel in self.patient_relationships if rel.status == 'active']
    
    def __repr__(self):
        return f'<Caregiver {self.id}>'


class CaregiverPatient(db.Model):
    __tablename__ = 'caregiver_patients'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id', ondelete='CASCADE'))
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id', ondelete='CASCADE'))
    relationship_type = Column(String(50), nullable=False, default='primary')
    status = Column(String(20), default='active')
    permissions = Column(JSONB, default={'view_scores': True, 'view_medical': False})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('caregiver_id', 'patient_id', name='unique_caregiver_patient'),)
    
    def __init__(self, caregiver_id, patient_id, **kwargs):
        self.caregiver_id = caregiver_id
        self.patient_id = patient_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert relationship to dictionary."""
        return {
            'id': str(self.id),
            'caregiver_id': str(self.caregiver_id),
            'patient_id': str(self.patient_id),
            'relationship_type': self.relationship_type,
            'status': self.status,
            'permissions': self.permissions or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def find_by_caregiver_id(cls, caregiver_id):
        """Find all relationships for a caregiver."""
        return cls.query.filter_by(caregiver_id=caregiver_id).all()
    
    @classmethod
    def find_by_patient_id(cls, patient_id):
        """Find all relationships for a patient."""
        return cls.query.filter_by(patient_id=patient_id).all()
    
    def __repr__(self):
        return f'<CaregiverPatient {self.caregiver_id} -> {self.patient_id}>'