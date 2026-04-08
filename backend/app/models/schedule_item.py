"""
Schedule item model for AAC Communication System
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import db

class ScheduleItem(db.Model):
    """Model for user's schedule items/tasks."""
    
    __tablename__ = 'schedule_items'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    emoji = Column(String(10), nullable=False, default='📝')
    text = Column(Text, nullable=False)
    time = Column(String(20), nullable=False)  # Store as string like "9:00 AM"
    completed = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)  # For custom ordering
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="schedule_items")
    
    def to_dict(self):
        """Convert the schedule item to a dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'emoji': self.emoji,
            'text': self.text,
            'time': self.time,
            'completed': self.completed,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<ScheduleItem {self.text} at {self.time}>'