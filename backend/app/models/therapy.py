from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from datetime import datetime
import uuid
from app.database import db

class SoundCategory(db.Model):
    """Sound therapy categories"""
    __tablename__ = 'sound_categories'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    color_theme = Column(String(7))  # Hex color code
    icon = Column(String(50))  # Icon identifier
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to sounds
    sounds = relationship("TherapySound", back_populates="category", cascade="all, delete-orphan")

class TherapySound(db.Model):
    """Individual sound therapy tracks"""
    __tablename__ = 'therapy_sounds'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey('sound_categories.id'), nullable=False)
    
    # Audio file information
    filename = Column(String(255))  # Relative path to audio file
    duration_seconds = Column(Integer)  # Duration in seconds
    file_size = Column(Integer)  # File size in bytes
    audio_format = Column(String(10), default='mp3')  # mp3, wav, etc.
    
    # Therapy properties
    frequency_range = Column(String(50))  # e.g., "40Hz-80Hz"
    therapeutic_benefits = Column(JSONB)  # Array of benefits
    recommended_duration = Column(Integer)  # Recommended listening duration in minutes
    volume_level = Column(Float, default=0.7)  # Default volume (0.0 to 1.0)
    
    # Metadata
    tags = Column(JSONB)  # Array of tags for filtering
    difficulty_level = Column(String(20), default='beginner')  # beginner, intermediate, advanced
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    play_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("SoundCategory", back_populates="sounds")
    sessions = relationship("TherapySession", back_populates="sound")

class TherapySession(db.Model):
    """User therapy listening sessions"""
    __tablename__ = 'therapy_sessions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    sound_id = Column(UUID(as_uuid=True), ForeignKey('therapy_sounds.id'), nullable=False)
    
    # Session data
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    duration_seconds = Column(Integer)  # Actual listening duration
    completed = Column(Boolean, default=False)
    
    # User interaction data
    volume_level = Column(Float)  # Volume used during session
    playback_speed = Column(Float, default=1.0)  # Playback speed
    interrupted = Column(Boolean, default=False)  # Was session interrupted?
    interruption_count = Column(Integer, default=0)
    
    # Mood and effectiveness tracking
    mood_before = Column(String(20))  # calm, anxious, stressed, etc.
    mood_after = Column(String(20))
    effectiveness_rating = Column(Integer)  # 1-5 scale
    notes = Column(Text)  # User notes about the session
    
    # Context information
    time_of_day = Column(String(20))  # morning, afternoon, evening, night
    environment = Column(String(50))  # home, office, outdoors, etc.
    device_type = Column(String(30))  # phone, tablet, computer, headphones
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    sound = relationship("TherapySound", back_populates="sessions")

class UserSoundPreference(db.Model):
    """User preferences for sound therapy"""
    __tablename__ = 'user_sound_preferences'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)
    
    # Preferred categories and sounds
    favorite_categories = Column(JSONB)  # Array of category IDs
    favorite_sounds = Column(JSONB)  # Array of sound IDs
    blocked_sounds = Column(JSONB)  # Array of sound IDs to avoid
    
    # Default session preferences
    default_volume = Column(Float, default=0.7)
    default_duration = Column(Integer, default=600)  # 10 minutes
    auto_repeat = Column(Boolean, default=False)
    fade_in_out = Column(Boolean, default=True)
    
    # Personalization settings
    stress_level = Column(String(20))  # low, moderate, high
    primary_goals = Column(JSONB)  # Array of goals: relaxation, focus, sleep, etc.
    listening_times = Column(JSONB)  # Preferred times of day
    
    # Accessibility settings
    hearing_sensitivity = Column(String(20))  # normal, sensitive, impaired
    frequency_preferences = Column(JSONB)  # Preferred frequency ranges
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

class TherapyProgram(db.Model):
    """Structured therapy programs with multiple sessions"""
    __tablename__ = 'therapy_programs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Program structure
    total_sessions = Column(Integer)  # Total number of sessions in program
    duration_days = Column(Integer)  # Program duration in days
    sessions_per_day = Column(Integer, default=1)
    session_duration = Column(Integer)  # Default session duration in minutes
    
    # Program content
    sound_sequence = Column(JSONB)  # Ordered array of sound IDs
    difficulty_progression = Column(String(20))  # static, gradual, adaptive
    therapeutic_focus = Column(String(50))  # anxiety, depression, focus, sleep, etc.
    
    # Metadata
    created_by = Column(String(100))  # Creator or source
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    recommended_for = Column(JSONB)  # Array of conditions/goals
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enrollments = relationship("ProgramEnrollment", back_populates="program")

class ProgramEnrollment(db.Model):
    """User enrollment in therapy programs"""
    __tablename__ = 'program_enrollments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey('therapy_programs.id'), nullable=False)
    
    # Enrollment tracking
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    current_session = Column(Integer, default=1)
    total_sessions_completed = Column(Integer, default=0)
    
    # Progress tracking
    completion_percentage = Column(Float, default=0.0)
    consecutive_days = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_session_date = Column(DateTime)
    
    # Outcomes
    initial_mood_assessment = Column(JSONB)  # Baseline mood/stress levels
    current_mood_assessment = Column(JSONB)  # Current assessment
    program_effectiveness = Column(Integer)  # 1-5 rating
    would_recommend = Column(Boolean)
    completion_notes = Column(Text)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    program = relationship("TherapyProgram", back_populates="enrollments")