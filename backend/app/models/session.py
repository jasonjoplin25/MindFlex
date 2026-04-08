from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from datetime import datetime, timedelta
import uuid
from app.database import db

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    session_token = Column(String(512), unique=True, nullable=False)
    refresh_token = Column(String(512), unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity = Column(DateTime(timezone=True), default=datetime.utcnow)
    user_agent = Column(String)
    ip_address = Column(INET)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    def __init__(self, user_id, session_token, expires_at, **kwargs):
        self.user_id = user_id
        self.session_token = session_token
        self.expires_at = expires_at
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'session_token': self.session_token,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'user_agent': self.user_agent,
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def is_expired(self):
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
    
    @classmethod
    def find_by_token(cls, token):
        """Find session by token."""
        return cls.query.filter_by(session_token=token, is_active=True).first()
    
    @classmethod
    def find_by_refresh_token(cls, refresh_token):
        """Find session by refresh token."""
        return cls.query.filter_by(refresh_token=refresh_token, is_active=True).first()
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Remove expired sessions."""
        expired_sessions = cls.query.filter(cls.expires_at < datetime.utcnow()).all()
        for session in expired_sessions:
            db.session.delete(session)
        db.session.commit()
        return len(expired_sessions)
    
    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()
        db.session.commit()
    
    def revoke(self):
        """Revoke this session."""
        self.is_active = False
        db.session.commit()
    
    def extend_session(self, additional_hours=24):
        """Extend session expiration."""
        self.expires_at = datetime.utcnow() + timedelta(hours=additional_hours)
        db.session.commit()
    
    def __repr__(self):
        return f'<UserSession {self.user_id}>'