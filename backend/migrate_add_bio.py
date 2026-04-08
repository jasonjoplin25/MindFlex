#!/usr/bin/env python3
"""
Database migration script to add bio column to users table
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

def add_bio_column():
    """Add bio column to users table."""
    print("Adding bio column to users table...")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(config['development'])
    
    # Initialize database
    init_db(app)
    
    with app.app_context():
        try:
            # Check if bio column already exists
            result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio';"))
            if result.fetchone():
                print("✓ Bio column already exists")
                return True
            
            # Add bio column
            db.session.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR(500);"))
            db.session.commit()
            print("✓ Bio column added successfully!")
            
        except Exception as e:
            print(f"✗ Error adding bio column: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == '__main__':
    success = add_bio_column()
    sys.exit(0 if success else 1)