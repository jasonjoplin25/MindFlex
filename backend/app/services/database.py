"""
Database service for handling database sessions
"""
from app.database import db
from contextlib import contextmanager

def get_db():
    """
    Get database session - yields the SQLAlchemy db object
    Used for compatibility with route handlers expecting a session generator
    """
    yield db.session

@contextmanager
def get_db_session():
    """
    Context manager for database sessions with automatic cleanup
    """
    try:
        yield db.session
    except Exception:
        db.session.rollback()
        raise
    finally:
        db.session.close()