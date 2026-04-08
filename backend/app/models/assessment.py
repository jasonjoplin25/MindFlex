from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric
from datetime import datetime
import uuid
from app.database import db

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id', ondelete='CASCADE'))
    assessment_type = Column(String(50), nullable=False)
    results = Column(JSONB, nullable=False)
    score = Column(Numeric(5, 2))
    administered_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    def __init__(self, patient_id, assessment_type, results, **kwargs):
        self.patient_id = patient_id
        self.assessment_type = assessment_type
        self.results = results
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert assessment to dictionary."""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'assessment_type': self.assessment_type,
            'results': self.results or {},
            'score': float(self.score) if self.score else None,
            'administered_by': str(self.administered_by) if self.administered_by else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def get_patient_assessments(cls, patient_id, assessment_type=None):
        """Get assessments for a patient."""
        query = cls.query.filter_by(patient_id=patient_id)
        if assessment_type:
            query = query.filter_by(assessment_type=assessment_type)
        return query.order_by(cls.created_at.desc()).all()
    
    def __repr__(self):
        return f'<Assessment {self.assessment_type} for {self.patient_id}>'