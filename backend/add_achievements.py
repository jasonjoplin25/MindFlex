#!/usr/bin/env python3
"""
Add new achievements to the database
"""
import os
import sys
sys.path.append('.')

# Import everything we need
import app as app_module
create_app = app_module.create_app  
from app.database import db
from app.models.achievement import Achievement
import uuid

def add_new_achievements():
    """Add comprehensive achievements for all game types"""
    
    new_achievements = [
        # General achievements
        {
            'id': uuid.UUID('a1111111-1111-1111-1111-111111111112'),
            'name': 'Getting Started',
            'description': 'Complete 5 games',
            'icon': 'play_arrow',
            'criteria': {'total_games': 5},
            'points': 25,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a1111111-1111-1111-1111-111111111113'),
            'name': 'Regular Player',
            'description': 'Complete 25 games',
            'icon': 'sports_esports',
            'criteria': {'total_games': 25},
            'points': 50,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a1111111-1111-1111-1111-111111111114'),
            'name': 'Dedicated Gamer',
            'description': 'Complete 100 games',
            'icon': 'military_tech',
            'criteria': {'total_games': 100},
            'points': 100,
            'badge_level': 'gold'
        },
        
        # Memory Game achievements
        {
            'id': uuid.UUID('a2222222-2222-2222-2222-222222222225'),
            'name': 'Memory Novice',
            'description': 'Complete 5 memory games',
            'icon': 'psychology',
            'criteria': {'memory_games_completed': 5},
            'points': 20,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a2222222-2222-2222-2222-222222222226'),
            'name': 'Memory Champion',
            'description': 'Complete 25 memory games',
            'icon': 'auto_awesome',
            'criteria': {'memory_games_completed': 25},
            'points': 50,
            'badge_level': 'silver'
        },
        
        # Word Scramble achievements
        {
            'id': uuid.UUID('a3333333-3333-3333-3333-333333333336'),
            'name': 'Word Wizard',
            'description': 'Complete 10 word scramble games',
            'icon': 'spellcheck',
            'criteria': {'word_games_completed': 10},
            'points': 30,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a3333333-3333-3333-3333-333333333337'),
            'name': 'Vocabulary Master',
            'description': 'Complete 25 word scramble games',
            'icon': 'library_books',
            'criteria': {'word_games_completed': 25},
            'points': 60,
            'badge_level': 'silver'
        },
        
        # Reaction Time achievements  
        {
            'id': uuid.UUID('a4444444-4444-4444-4444-444444444447'),
            'name': 'Quick Reflex',
            'description': 'Complete 10 reaction games',
            'icon': 'flash_on',
            'criteria': {'reaction_games_completed': 10},
            'points': 25,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a4444444-4444-4444-4444-444444444448'),
            'name': 'Lightning Fast',
            'description': 'Complete 25 reaction games',
            'icon': 'electric_bolt',
            'criteria': {'reaction_games_completed': 25},
            'points': 50,
            'badge_level': 'silver'
        },
        
        # Score-based achievements
        {
            'id': uuid.UUID('a5555555-5555-5555-5555-555555555558'),
            'name': 'High Achiever',
            'description': 'Score over 500 points in any game',
            'icon': 'star',
            'criteria': {'max_score': 500},
            'points': 30,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a5555555-5555-5555-5555-555555555559'),
            'name': 'Score Champion',
            'description': 'Score over 1000 points in any game',
            'icon': 'emoji_events',
            'criteria': {'max_score': 1000},
            'points': 60,
            'badge_level': 'silver'
        },
    ]
    
    for achievement_data in new_achievements:
        # Check if achievement already exists
        existing = Achievement.query.filter_by(id=achievement_data['id']).first()
        if not existing:
            achievement = Achievement(**achievement_data)
            db.session.add(achievement)
            print(f"Added achievement: {achievement.name}")
        else:
            print(f"Achievement already exists: {achievement_data['name']}")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        print('Adding new achievements to database...')
        add_new_achievements()
        db.session.commit()
        print('Done!')