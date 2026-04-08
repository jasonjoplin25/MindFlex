#!/usr/bin/env python3
"""
Database migration script to add profile_image column to users table
"""

import os
import sys
from flask import Flask
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import configuration and app components
from config import config
from app.database import db, init_db
from sqlalchemy import text

def add_profile_image_column():
    """Add profile_image column to users table."""
    print("Adding profile_image column to users table...")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(config['development'])
    
    # Initialize database
    init_db(app)
    
    with app.app_context():
        try:
            # Check if profile_image column already exists
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image';"))
            if result.fetchone():
                print("✓ Profile_image column already exists")
                return True
            
            # Add profile_image column
            db.session.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255);"))
            db.session.commit()
            print("✓ Profile_image column added successfully!")
            
        except Exception as e:
            print(f"✗ Error adding profile_image column: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == '__main__':
    success = add_profile_image_column()
    sys.exit(0 if success else 1)