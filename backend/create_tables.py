#!/usr/bin/env python3
"""
Database table creation script for MindFlex application
Creates all necessary tables based on SQLAlchemy models
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

# Import all models to ensure they're registered with SQLAlchemy
from app.models.user import User
from app.models.patient import Patient
from app.models.caregiver import Caregiver
from app.models.game import Game, GameSession, CustomMission
from app.models.achievement import Achievement, UserAchievement
from app.models.assessment import Assessment
from app.models.therapy import TherapySession, SoundCategory, TherapySound
from app.models.session import UserSession

def create_tables():
    """Create all database tables."""
    print("Creating MindFlex database tables...")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(config['development'])
    
    # Initialize database
    init_db(app)
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✓ All tables created successfully!")
            
            # Create initial data if needed
            create_initial_data()
            
            print("✓ Database initialization complete!")
            
        except Exception as e:
            print(f"✗ Error creating tables: {e}")
            return False
    
    return True

def create_initial_data():
    """Create initial data for the application."""
    print("Creating initial data...")
    
    # Create default games if they don't exist
    if not Game.query.first():
        games = [
            {
                'name': 'Memory Match',
                'type': 'memory',
                'description': 'Match pairs of cards to test your memory',
                'difficulty_levels': ['easy', 'medium', 'hard'],
                'is_active': True
            },
            {
                'name': 'Math Challenge',
                'type': 'math',
                'description': 'Solve math problems to improve cognitive function',
                'difficulty_levels': ['easy', 'medium', 'hard'],
                'is_active': True
            },
            {
                'name': 'Word Scramble',
                'type': 'word',
                'description': 'Unscramble words to test your vocabulary',
                'difficulty_levels': ['easy', 'medium', 'hard'],
                'is_active': True
            },
            {
                'name': 'Pattern Recognition',
                'type': 'pattern',
                'description': 'Identify patterns to enhance cognitive abilities',
                'difficulty_levels': ['easy', 'medium', 'hard'],
                'is_active': True
            },
            {
                'name': 'Reaction Time',
                'type': 'reaction',
                'description': 'Test and improve your reaction time',
                'difficulty_levels': ['easy', 'medium', 'hard'],
                'is_active': True
            },
            {
                'name': 'Snake Game',
                'type': 'snake',
                'description': 'Classic snake game to test your reflexes and planning skills',
                'difficulty_levels': ['easy', 'medium', 'hard'],
                'is_active': True
            }
        ]
        
        for game_data in games:
            game = Game(
                name=game_data['name'],
                type=game_data['type'],
                description=game_data['description'],
                difficulty_levels=game_data['difficulty_levels'],
                is_active=game_data['is_active']
            )
            db.session.add(game)
        
        print("✓ Created default games")
    
    # Create default achievements if they don't exist
    if not Achievement.query.first():
        achievements = [
            {
                'name': 'First Steps',
                'description': 'Complete your first game',
                'criteria': {'games_completed': 1},
                'points': 10,
                'badge_level': 'bronze'
            },
            {
                'name': 'Dedicated Player',
                'description': 'Play games for 7 consecutive days',
                'criteria': {'consecutive_days': 7},
                'points': 50,
                'badge_level': 'silver'
            },
            {
                'name': 'High Scorer',
                'description': 'Achieve a score above 90%',
                'criteria': {'min_score_percent': 90},
                'points': 25,
                'badge_level': 'gold'
            },
            {
                'name': 'Memory Master',
                'description': 'Complete 50 memory games',
                'criteria': {'memory_games_completed': 50},
                'points': 100,
                'badge_level': 'gold'
            },
            {
                'name': 'Math Wizard',
                'description': 'Complete 50 math games',
                'criteria': {'math_games_completed': 50},
                'points': 100,
                'badge_level': 'gold'
            }
        ]
        
        for achievement_data in achievements:
            achievement = Achievement(
                name=achievement_data['name'],
                description=achievement_data['description'],
                criteria=achievement_data['criteria'],
                points=achievement_data['points'],
                badge_level=achievement_data['badge_level']
            )
            db.session.add(achievement)
        
        print("✓ Created default achievements")
    
    # Create default sound categories for therapy if they don't exist
    if not SoundCategory.query.first():
        categories = [
            {
                'name': 'Nature',
                'description': 'Natural sounds for relaxation'
            },
            {
                'name': 'White Noise',
                'description': 'White noise for focus and concentration'
            },
            {
                'name': 'Meditation',
                'description': 'Guided meditation and mindfulness sounds'
            },
            {
                'name': 'Classical',
                'description': 'Classical music for cognitive enhancement'
            }
        ]
        
        for category_data in categories:
            category = SoundCategory(
                name=category_data['name'],
                description=category_data['description']
            )
            db.session.add(category)
        
        print("✓ Created default sound categories")
    
    # Commit all initial data
    try:
        db.session.commit()
        print("✓ Initial data committed to database")
    except Exception as e:
        print(f"✗ Error committing initial data: {e}")
        db.session.rollback()

if __name__ == '__main__':
    success = create_tables()
    sys.exit(0 if success else 1)