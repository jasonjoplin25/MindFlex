#!/usr/bin/env python3
"""
Database migration script to create therapy-related tables
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db
from app.models.therapy import SoundCategory, TherapySound, TherapySession, UserSoundPreference, TherapyProgram, ProgramEnrollment
from config import config
from flask import Flask

def create_therapy_tables():
    """Create all therapy-related tables"""
    try:
        # Create Flask app
        app = Flask(__name__)
        config_name = os.environ.get('FLASK_ENV', 'development')
        app.config.from_object(config[config_name])
        
        # Initialize database
        db = init_db(app)
        
        with app.app_context():
            # Import all models to ensure they're registered
            from app.models import *
            
            # Create all tables
            db.create_all()
            
            print("✓ Therapy tables created successfully!")
            print("Tables created:")
            print("  - sound_categories")
            print("  - therapy_sounds") 
            print("  - therapy_sessions")
            print("  - user_sound_preferences")
            print("  - therapy_programs")
            print("  - program_enrollments")
            
            return True
            
    except Exception as e:
        print(f"✗ Error creating therapy tables: {str(e)}")
        return False

if __name__ == '__main__':
    success = create_therapy_tables()
    if not success:
        sys.exit(1)
    
    print("\n🎉 Database migration completed successfully!")
    print("\nNext steps:")
    print("1. Run the therapy data seeding script:")
    print("   python app/seeds/therapy_data.py")
    print("2. Start the Flask application:")
    print("   python app.py")