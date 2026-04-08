#!/usr/bin/env python3
"""
Add Snake game to existing database
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
from app.models.game import Game

def add_snake_game():
    """Add Snake game to existing database."""
    print("Adding Snake game to database...")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(config['development'])
    
    # Initialize database
    init_db(app)
    
    with app.app_context():
        try:
            # Check if Snake game already exists
            existing_snake = Game.query.filter_by(type='snake').first()
            if existing_snake:
                print("Snake game already exists!")
                return True
            
            # Add Snake game
            snake_game = Game(
                name='Snake Game',
                type='snake',
                description='Classic snake game to test your reflexes and planning skills',
                difficulty_levels=['easy', 'medium', 'hard'],
                is_active=True
            )
            
            db.session.add(snake_game)
            db.session.commit()
            
            print("✓ Snake game added successfully!")
            
            # Verify it was added
            all_games = Game.query.all()
            print(f"Total games in database: {len(all_games)}")
            for game in all_games:
                print(f"  - {game.name} ({game.type})")
            
        except Exception as e:
            print(f"✗ Error adding Snake game: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == '__main__':
    success = add_snake_game()
    sys.exit(0 if success else 1)