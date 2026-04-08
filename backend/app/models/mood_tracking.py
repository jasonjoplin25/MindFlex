"""
Mood tracking model for patient mood and behavioral monitoring
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.database import db

class MoodEntry(db.Model):
    """Model for patient mood tracking entries"""
    __tablename__ = 'mood_entries'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey('caregivers.id'), nullable=False)
    
    # Mood assessment
    mood = Column(String(50), nullable=False)  # happy, sad, angry, anxious, calm, etc.
    mood_score = Column(Integer)  # 1-10 scale for mood intensity
    
    # Energy and activity levels
    energy_level = Column(String(50), default='medium')  # low, medium, high
    energy_score = Column(Integer)  # 1-10 scale
    
    # Anxiety and stress
    anxiety_level = Column(String(50), default='low')  # low, medium, high
    anxiety_score = Column(Integer)  # 1-10 scale
    
    # Sleep quality (if applicable to this entry)
    sleep_quality = Column(String(50))  # poor, fair, good, excellent
    sleep_duration_hours = Column(Float)  # Hours of sleep
    
    # Cognitive indicators
    confusion_level = Column(String(50), default='none')  # none, mild, moderate, severe
    orientation_score = Column(Integer)  # 1-10 scale for time/place/person orientation
    memory_clarity = Column(String(50), default='clear')  # clear, foggy, impaired
    
    # Behavioral observations
    agitation_level = Column(String(50), default='none')  # none, mild, moderate, severe
    social_engagement = Column(String(50), default='normal')  # withdrawn, normal, outgoing
    appetite = Column(String(50), default='normal')  # poor, fair, good, excellent
    
    # Physical indicators
    pain_level = Column(Integer, default=0)  # 0-10 pain scale
    physical_comfort = Column(String(50), default='comfortable')  # uncomfortable, fair, comfortable
    
    # Context and triggers
    time_of_day = Column(String(20))  # morning, afternoon, evening, night
    location = Column(String(255))  # Where observation was made
    activity_context = Column(String(255))  # What was happening when observed
    triggers = Column(ARRAY(String))  # Potential mood triggers observed
    
    # Interventions and responses
    interventions_used = Column(ARRAY(String))  # What was done to help
    response_to_intervention = Column(String(255))  # How patient responded
    
    # Additional notes
    notes = Column(Text)
    behavioral_notes = Column(Text)
    caregiver_concerns = Column(Text)
    
    # Timestamps
    observation_datetime = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="mood_entries")
    caregiver = relationship("Caregiver")
    
    def to_dict(self):
        """Convert mood entry to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'caregiver_id': str(self.caregiver_id),
            'mood': self.mood,
            'mood_score': self.mood_score,
            'energy': self.energy_level,
            'energy_score': self.energy_score,
            'anxiety': self.anxiety_level,
            'anxiety_score': self.anxiety_score,
            'sleep_quality': self.sleep_quality,
            'sleep_duration_hours': self.sleep_duration_hours,
            'confusion_level': self.confusion_level,
            'orientation_score': self.orientation_score,
            'memory_clarity': self.memory_clarity,
            'agitation_level': self.agitation_level,
            'social_engagement': self.social_engagement,
            'appetite': self.appetite,
            'pain_level': self.pain_level,
            'physical_comfort': self.physical_comfort,
            'time_of_day': self.time_of_day,
            'location': self.location,
            'activity_context': self.activity_context,
            'triggers': self.triggers or [],
            'interventions_used': self.interventions_used or [],
            'response_to_intervention': self.response_to_intervention,
            'notes': self.notes,
            'behavioral_notes': self.behavioral_notes,
            'caregiver_concerns': self.caregiver_concerns,
            'observation_datetime': self.observation_datetime.isoformat() if self.observation_datetime else None,
            'date': self.observation_datetime.strftime('%Y-%m-%d') if self.observation_datetime else None,
            'time': self.observation_datetime.strftime('%H:%M') if self.observation_datetime else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class MoodPattern(db.Model):
    """Model for tracking mood patterns and analytics"""
    __tablename__ = 'mood_patterns'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    
    # Pattern identification
    pattern_type = Column(String(100), nullable=False)  # daily_cycle, weekly_pattern, trigger_response, etc.
    pattern_description = Column(Text)
    
    # Pattern metrics
    frequency = Column(String(50))  # daily, weekly, monthly, irregular
    severity = Column(String(50))  # mild, moderate, severe
    duration = Column(String(100))  # How long pattern typically lasts
    
    # Identified triggers and interventions
    common_triggers = Column(ARRAY(String))
    effective_interventions = Column(ARRAY(String))
    
    # Time periods when pattern is active
    start_date = Column(DateTime)
    end_date = Column(DateTime)  # Null if ongoing
    
    # Pattern status
    status = Column(String(20), default='active')  # active, resolved, monitoring
    confidence_level = Column(Float)  # AI confidence in pattern (0-1)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient")
    
    def to_dict(self):
        """Convert mood pattern to dictionary"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'pattern_type': self.pattern_type,
            'pattern_description': self.pattern_description,
            'frequency': self.frequency,
            'severity': self.severity,
            'duration': self.duration,
            'common_triggers': self.common_triggers or [],
            'effective_interventions': self.effective_interventions or [],
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'confidence_level': self.confidence_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }