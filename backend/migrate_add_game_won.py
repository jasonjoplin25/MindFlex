#!/usr/bin/env python3
"""
Migration script to add game_won column to game_sessions table
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

def add_game_won_column():
    """Add game_won column to game_sessions table."""
    print("Adding game_won column to game_sessions table...")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(config['development'])
    
    # Initialize database
    init_db(app)
    
    with app.app_context():
        try:
            # Check if column already exists
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='game_sessions' AND column_name='game_won';
            """))
            
            if result.fetchone():
                print("Column 'game_won' already exists in game_sessions table.")
                return True
                
            # Add the column
            print("Adding game_won column to game_sessions table...")
            db.session.execute(text("""
                ALTER TABLE game_sessions 
                ADD COLUMN game_won BOOLEAN DEFAULT FALSE;
            """))
            
            # Update existing records to set game_won = false (already the default)
            print("Setting default values for existing records...")
            db.session.execute(text("""
                UPDATE game_sessions 
                SET game_won = FALSE 
                WHERE game_won IS NULL;
            """))
            
            db.session.commit()
            print("Successfully added game_won column to game_sessions table.")
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"Error adding column: {e}")
            return False

if __name__ == '__main__':
    if add_game_won_column():
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)