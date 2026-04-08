from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
import uuid
from app.database import db

class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(String)
    icon = Column(String(100))
    criteria = Column(JSONB, nullable=False)
    points = Column(Integer, default=0)
    badge_level = Column(String(20), default='bronze')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user_achievements = db.relationship('UserAchievement', backref='achievement', cascade='all, delete-orphan')
    
    def __init__(self, name, criteria, **kwargs):
        self.name = name
        self.criteria = criteria
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert achievement to dictionary."""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'criteria': self.criteria or {},
            'points': self.points,
            'badge_level': self.badge_level,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def get_active_achievements(cls):
        """Get all active achievements."""
        return cls.query.filter_by(is_active=True).all()
    
    def check_criteria(self, user_data):
        """Check if user data meets achievement criteria."""
        criteria = self.criteria or {}
        
        # Basic criteria checking logic
        for key, required_value in criteria.items():
            user_value = user_data.get(key)
            
            if isinstance(required_value, dict):
                # Handle complex criteria (e.g., {"min_score_percent": 80})
                for operator, value in required_value.items():
                    if operator == 'min' and (user_value is None or user_value < value):
                        return False
                    elif operator == 'max' and (user_value is None or user_value > value):
                        return False
                    elif operator == 'equals' and user_value != value:
                        return False
            else:
                # Simple equality check
                if user_value != required_value:
                    return False
        
        return True
    
    def __repr__(self):
        return f'<Achievement {self.name}>'


class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    achievement_id = Column(UUID(as_uuid=True), ForeignKey('achievements.id', ondelete='CASCADE'))
    earned_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    achievement_metadata = Column(JSONB, default={})
    
    __table_args__ = (UniqueConstraint('user_id', 'achievement_id', name='unique_user_achievement'),)
    
    def __init__(self, user_id, achievement_id, **kwargs):
        self.user_id = user_id
        self.achievement_id = achievement_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert user achievement to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'achievement_id': str(self.achievement_id),
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'achievement_metadata': self.achievement_metadata or {}
        }
    
    @classmethod
    def get_user_achievements(cls, user_id):
        """Get all achievements for a user with related achievement data."""
        from sqlalchemy.orm import joinedload
        return cls.query.options(joinedload(cls.achievement)).filter_by(user_id=user_id).all()
    
    @classmethod
    def user_has_achievement(cls, user_id, achievement_id):
        """Check if user has specific achievement."""
        return cls.query.filter_by(user_id=user_id, achievement_id=achievement_id).first() is not None
    
    def __repr__(self):
        return f'<UserAchievement {self.user_id} -> {self.achievement_id}>'