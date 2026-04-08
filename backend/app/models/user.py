from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Column, String, Boolean, DateTime, Date, text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    date_of_birth = Column(Date)
    bio = Column(String(500))
    profile_image = Column(String(255))
    user_type = Column(String(20), nullable=False, default='patient')
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    schedule_items = relationship("ScheduleItem", back_populates="user", cascade="all, delete-orphan")
    
    # Relationships
    patient = db.relationship('Patient', backref='user', uselist=False, cascade='all, delete-orphan')
    caregiver = db.relationship('Caregiver', backref='user', uselist=False, cascade='all, delete-orphan')
    game_sessions = db.relationship('GameSession', backref='player', cascade='all, delete-orphan')
    user_sessions = db.relationship('UserSession', backref='user', cascade='all, delete-orphan')
    user_achievements = db.relationship('UserAchievement', backref='user', cascade='all, delete-orphan')
    
    def __init__(self, email, password, **kwargs):
        self.email = email
        self.set_password(password)
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash."""
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        """Get full name of user."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        else:
            return self.email.split('@')[0]
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary."""
        data = {
            'id': str(self.id),
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'bio': self.bio,
            'profile_image': self.profile_image,
            'profile_image_url': f'/api/uploads/profile_images/{self.profile_image}' if self.profile_image else None,
            'user_type': self.user_type,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
        
        return data
    
    @classmethod
    def find_by_email(cls, email):
        """Find user by email."""
        return cls.query.filter_by(email=email).first()
    
    @classmethod
    def find_by_id(cls, user_id):
        """Find user by ID."""
        return cls.query.filter_by(id=user_id).first()
    
    def __repr__(self):
        return f'<User {self.email}>'