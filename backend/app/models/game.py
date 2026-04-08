from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from datetime import datetime
import uuid
from app.database import db

class Game(db.Model):
    __tablename__ = 'games'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=False)
    type = Column(String(50), nullable=False)
    category = Column(String(50))
    difficulty_levels = Column(ARRAY(String), default=['easy', 'medium', 'hard'])
    avg_duration_seconds = Column(Integer, default=300)
    instructions = Column(String)
    config = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = db.relationship('GameSession', backref='game', cascade='all, delete-orphan')
    
    def __init__(self, name, description, type, **kwargs):
        self.name = name
        self.description = description
        self.type = type
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert game to dictionary."""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'type': self.type,
            'category': self.category,
            'difficulty_levels': self.difficulty_levels or [],
            'avg_duration_seconds': self.avg_duration_seconds,
            'instructions': self.instructions,
            'config': self.config or {},
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_active_games(cls):
        """Get all active games."""
        return cls.query.filter_by(is_active=True).all()
    
    @classmethod
    def find_by_type(cls, game_type):
        """Find games by type."""
        return cls.query.filter_by(type=game_type, is_active=True).all()
    
    def get_config_for_difficulty(self, difficulty):
        """Get configuration for specific difficulty level."""
        config = self.config or {}
        if difficulty in config:
            return config[difficulty]
        return config
    
    def __repr__(self):
        return f'<Game {self.name}>'


class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    game_id = Column(UUID(as_uuid=True), ForeignKey('games.id', ondelete='CASCADE'))
    difficulty = Column(String(20), nullable=False)
    score = Column(Integer, nullable=False, default=0)
    max_possible_score = Column(Integer)
    duration_seconds = Column(Integer, nullable=False)
    errors = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    game_won = Column(Boolean, default=False)
    session_data = Column(JSONB, default={})
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    def __init__(self, player_id, game_id, difficulty, **kwargs):
        self.player_id = player_id
        self.game_id = game_id
        self.difficulty = difficulty
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': str(self.id),
            'player_id': str(self.player_id),
            'game_id': str(self.game_id),
            'difficulty': self.difficulty,
            'score': self.score,
            'max_possible_score': self.max_possible_score,
            'duration_seconds': self.duration_seconds,
            'errors': self.errors,
            'completed': self.completed,
            'game_won': self.game_won,
            'session_data': self.session_data or {},
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def score_percentage(self):
        """Calculate score as percentage."""
        if self.max_possible_score and self.max_possible_score > 0:
            return round((self.score / self.max_possible_score) * 100, 2)
        return 0
    
    @classmethod
    def get_user_sessions(cls, user_id, limit=10):
        """Get recent sessions for a user."""
        return cls.query.filter_by(player_id=user_id)\
                       .order_by(cls.started_at.desc())\
                       .limit(limit).all()
    
    @classmethod
    def get_leaderboard(cls, game_id=None, difficulty=None, limit=10):
        """Get leaderboard for games."""
        query = cls.query.filter_by(completed=True)
        
        if game_id:
            query = query.filter_by(game_id=game_id)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        
        return query.order_by(cls.score.desc()).limit(limit).all()
    
    def complete_session(self, final_score=None, session_data=None, max_possible_score=None, game_won=False):
        """Mark session as completed."""
        self.completed = True
        self.completed_at = datetime.utcnow()
        if final_score is not None:
            self.score = final_score
        if max_possible_score is not None:
            self.max_possible_score = max_possible_score
        if session_data:
            self.session_data = {**(self.session_data or {}), **session_data}
        self.game_won = game_won
    
    def __repr__(self):
        return f'<GameSession {self.id}>'


class CustomMission(db.Model):
    __tablename__ = 'custom_missions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    creator_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    grid_size = Column(Integer, nullable=False)
    grid_data = Column(JSONB, nullable=False)  # The 2D grid array
    animal_type = Column(String(50), nullable=False, default='turtle')  # Which animal to rescue
    is_public = Column(Boolean, default=False)  # Whether others can play this mission
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, name, creator_id, grid_size, grid_data, animal_type='turtle', **kwargs):
        self.name = name
        self.creator_id = creator_id
        self.grid_size = grid_size
        self.grid_data = grid_data
        self.animal_type = animal_type
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert custom mission to dictionary."""
        return {
            'id': str(self.id),
            'name': self.name,
            'creator_id': str(self.creator_id),
            'grid_size': self.grid_size,
            'grid_data': self.grid_data,
            'animal_type': self.animal_type,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_user_missions(cls, user_id):
        """Get all missions created by a user."""
        return cls.query.filter_by(creator_id=user_id).order_by(cls.created_at.desc()).all()
    
    @classmethod
    def get_public_missions(cls, limit=50):
        """Get public missions that others can play."""
        return cls.query.filter_by(is_public=True).order_by(cls.created_at.desc()).limit(limit).all()
    
    def __repr__(self):
        return f'<CustomMission {self.name}>'


class MissionProgress(db.Model):
    __tablename__ = 'mission_progress'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    campaign_type = Column(String(20), nullable=False)
    mission_number = Column(Integer, nullable=False)
    completed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    score = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    session_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_id, campaign_type, mission_number, **kwargs):
        self.user_id = user_id
        self.campaign_type = campaign_type
        self.mission_number = mission_number
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert mission progress to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'campaign_type': self.campaign_type,
            'mission_number': self.mission_number,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'score': self.score,
            'duration_seconds': self.duration_seconds,
            'session_data': self.session_data or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_user_campaign_progress(cls, user_id, campaign_type):
        """Get user's progress for a specific campaign."""
        return cls.query.filter_by(user_id=user_id, campaign_type=campaign_type)\
                       .order_by(cls.mission_number.asc()).all()
    
    @classmethod
    def get_user_all_progress(cls, user_id):
        """Get user's progress for all campaigns."""
        return cls.query.filter_by(user_id=user_id)\
                       .order_by(cls.campaign_type.asc(), cls.mission_number.asc()).all()
    
    @classmethod
    def get_completed_missions_count(cls, user_id, campaign_type):
        """Get count of completed missions for a campaign."""
        return cls.query.filter_by(user_id=user_id, campaign_type=campaign_type).count()
    
    @classmethod
    def is_mission_completed(cls, user_id, campaign_type, mission_number):
        """Check if a specific mission is completed."""
        mission = cls.query.filter_by(
            user_id=user_id, 
            campaign_type=campaign_type, 
            mission_number=mission_number
        ).first()
        return mission is not None
    
    @classmethod
    def create_or_update_progress(cls, user_id, campaign_type, mission_number, score=0, duration_seconds=0, session_data=None):
        """Create new progress entry or update existing one."""
        existing = cls.query.filter_by(
            user_id=user_id,
            campaign_type=campaign_type,
            mission_number=mission_number
        ).first()
        
        if existing:
            # Update existing progress if new score is higher
            if score > existing.score:
                existing.score = score
                existing.duration_seconds = duration_seconds
                existing.session_data = session_data or {}
                existing.completed_at = datetime.utcnow()
                existing.updated_at = datetime.utcnow()
            return existing
        else:
            # Create new progress entry
            new_progress = cls(
                user_id=user_id,
                campaign_type=campaign_type,
                mission_number=mission_number,
                score=score,
                duration_seconds=duration_seconds,
                session_data=session_data or {}
            )
            db.session.add(new_progress)
            return new_progress
    
    def __repr__(self):
        return f'<MissionProgress {self.campaign_type.upper()}{self.mission_number} - User {self.user_id}>'