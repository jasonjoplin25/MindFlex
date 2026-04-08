#!/usr/bin/env python3
"""
Fix achievements by updating them through the admin API or direct database access
"""
import requests
import json

def update_high_scorer_achievement():
    """Update High Scorer achievement to use proper score percentage calculation."""
    
    # The High Scorer achievement ID (from the database query result)
    achievement_id = "117a0997-6707-46f4-bd24-96094ee99a14"
    
    # New criteria - keep percentage-based but make it achievable
    new_criteria = {
        "min_score_percent": 75  # 75% instead of 90% to make it more achievable
    }
    
    # For now, update directly via database since we'd need admin token for API
    import sys
    sys.path.append('.')
    
    try:
        import app as app_module
        from app.database import db
        from app.models.achievement import Achievement
        
        app = app_module.create_app()
        with app.app_context():
            achievement = Achievement.query.get(achievement_id)
            if achievement:
                achievement.criteria = new_criteria
                achievement.description = "Achieve a score above 75% in any game"
                db.session.commit()
                print(f"Updated High Scorer achievement: {achievement.name}")
                print(f"New criteria: {achievement.criteria}")
            else:
                print("High Scorer achievement not found")
                
    except Exception as e:
        print(f"Error updating achievement: {e}")

def add_missing_achievements():
    """Add achievements for math and pattern games."""
    import sys
    sys.path.append('.')
    import uuid
    
    try:
        import app as app_module
        from app.database import db
        from app.models.achievement import Achievement
        
        app = app_module.create_app()
        with app.app_context():
            
            new_achievements = [
                {
                    'id': uuid.UUID('a8888888-8888-8888-8888-888888888888'),
                    'name': 'Math Novice',
                    'description': 'Complete 5 math games',
                    'icon': 'calculate',
                    'criteria': {'math_games_completed': 5},
                    'points': 25,
                    'badge_level': 'bronze'
                },
                {
                    'id': uuid.UUID('a9999999-9999-9999-9999-999999999999'),
                    'name': 'Pattern Recognition',
                    'description': 'Complete 10 pattern games',
                    'icon': 'grid_view',
                    'criteria': {'pattern_games_completed': 10},
                    'points': 30,
                    'badge_level': 'bronze'
                },
                {
                    'id': uuid.UUID('a1010101-1010-1010-1010-101010101010'),
                    'name': 'Score Achiever',
                    'description': 'Score over 500 points in any game',
                    'icon': 'star',
                    'criteria': {'max_score': 500},
                    'points': 25,
                    'badge_level': 'bronze'
                }
            ]
            
            for achievement_data in new_achievements:
                existing = Achievement.query.filter_by(id=achievement_data['id']).first()
                if not existing:
                    achievement = Achievement(**achievement_data)
                    db.session.add(achievement)
                    print(f"Added achievement: {achievement.name}")
                else:
                    print(f"Achievement already exists: {achievement_data['name']}")
            
            db.session.commit()
            print("Finished adding achievements")
            
    except Exception as e:
        print(f"Error adding achievements: {e}")

def recalculate_achievements():
    """Recalculate achievements for existing sessions."""
    import sys
    sys.path.append('.')
    
    try:
        import app as app_module
        from app.database import db
        from app.models.game import GameSession
        from app.services.game_service import GameService
        
        app = app_module.create_app()
        with app.app_context():
            
            # Get all completed sessions
            sessions = GameSession.query.filter_by(completed=True).all()
            achievements_awarded = 0
            
            print(f"Checking {len(sessions)} completed sessions...")
            
            for session in sessions:
                try:
                    achievements_earned = GameService._check_achievements(session)
                    achievements_awarded += len(achievements_earned)
                    if achievements_earned:
                        print(f"  Awarded {len(achievements_earned)} achievements for session {session.id}")
                except Exception as e:
                    print(f"  Error checking achievements for session {session.id}: {e}")
            
            print(f"Recalculation complete. {achievements_awarded} achievements were awarded.")
            
    except Exception as e:
        print(f"Error recalculating achievements: {e}")

if __name__ == '__main__':
    print("=== Fixing Achievements ===")
    
    print("\n1. Updating High Scorer achievement...")
    update_high_scorer_achievement()
    
    print("\n2. Adding missing achievements...")
    add_missing_achievements()
    
    print("\n3. Recalculating all achievements...")
    recalculate_achievements()
    
    print("\n=== Done ===")