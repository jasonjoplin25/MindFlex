"""
Database seed functions for initial data
"""
import uuid
from app.database import db
from app.models.game import Game
from app.models.achievement import Achievement

def seed_games():
    """Seed the database with initial games."""
    games = [
        {
            'id': uuid.UUID('11111111-1111-1111-1111-111111111111'),
            'name': 'Memory Match',
            'description': 'Test and improve your visual memory by matching pairs of cards',
            'type': 'memory',
            'category': 'cognitive',
            'difficulty_levels': ['easy', 'medium', 'hard'],
            'avg_duration_seconds': 180,
            'instructions': 'Flip cards to find matching pairs. Remember the positions of cards you\'ve seen to make matches more efficiently.',
            'config': {
                'grid_sizes': {'easy': [3, 4], 'medium': [4, 4], 'hard': [4, 6]},
                'time_limits': {'easy': 300, 'medium': 240, 'hard': 180}
            }
        },
        {
            'id': uuid.UUID('22222222-2222-2222-2222-222222222222'),
            'name': 'Word Scramble',
            'description': 'Unscramble letters to form words and improve your verbal cognitive abilities',
            'type': 'word',
            'category': 'language',
            'difficulty_levels': ['easy', 'medium', 'hard'],
            'avg_duration_seconds': 240,
            'instructions': 'Unscramble the letters to form valid words. Use hints if you get stuck.',
            'config': {
                'word_lengths': {'easy': [4, 5], 'medium': [5, 7], 'hard': [6, 9]},
                'hint_system': True
            }
        },
        {
            'id': uuid.UUID('33333333-3333-3333-3333-333333333333'),
            'name': 'Pattern Recognition',
            'description': 'Identify and continue visual patterns to enhance visual-spatial memory',
            'type': 'pattern',
            'category': 'visual',
            'difficulty_levels': ['easy', 'medium', 'hard'],
            'avg_duration_seconds': 210,
            'instructions': 'Study the pattern and select the option that correctly continues it.',
            'config': {
                'pattern_types': ['sequence', 'rotation', 'color', 'shape'],
                'complexity': {'easy': 1, 'medium': 2, 'hard': 3}
            }
        },
        {
            'id': uuid.UUID('44444444-4444-4444-4444-444444444444'),
            'name': 'Math Challenge',
            'description': 'Solve arithmetic problems quickly to improve processing speed',
            'type': 'math',
            'category': 'numerical',
            'difficulty_levels': ['easy', 'medium', 'hard'],
            'avg_duration_seconds': 300,
            'instructions': 'Solve math problems before time runs out. Each correct answer adds time.',
            'config': {
                'operations': {
                    'easy': ['+', '-'],
                    'medium': ['+', '-', '*'],
                    'hard': ['+', '-', '*', '/']
                },
                'number_ranges': {
                    'easy': [1, 20],
                    'medium': [1, 100],
                    'hard': [1, 200]
                }
            }
        },
        {
            'id': uuid.UUID('55555555-5555-5555-5555-555555555555'),
            'name': 'Reaction Time',
            'description': 'Test and improve your reaction speed and attention',
            'type': 'reaction',
            'category': 'attention',
            'difficulty_levels': ['easy', 'medium', 'hard'],
            'avg_duration_seconds': 120,
            'instructions': 'Click as quickly as possible when the target appears. Avoid distractors.',
            'config': {
                'target_types': ['color', 'shape', 'text'],
                'distractor_count': {'easy': 0, 'medium': 2, 'hard': 4},
                'delay_range': {'easy': [2, 4], 'medium': [1, 3], 'hard': [0.5, 2]}
            }
        },
        {
            'id': uuid.UUID('66666666-6666-6666-6666-666666666666'),
            'name': 'Sequence Memory',
            'description': 'Remember and repeat sequences to enhance working memory',
            'type': 'sequence',
            'category': 'memory',
            'difficulty_levels': ['easy', 'medium', 'hard'],
            'avg_duration_seconds': 200,
            'instructions': 'Watch the sequence carefully, then repeat it in the same order.',
            'config': {
                'sequence_lengths': {'easy': [3, 4], 'medium': [4, 6], 'hard': [6, 8]},
                'playback_speed': {'easy': 1000, 'medium': 800, 'hard': 600}
            }
        }
    ]
    
    for game_data in games:
        # Check if game already exists
        existing_game = Game.query.filter_by(id=game_data['id']).first()
        if not existing_game:
            game = Game(**game_data)
            db.session.add(game)
            print(f"Added game: {game.name}")

def seed_achievements():
    """Seed the database with initial achievements."""
    achievements = [
        # General achievements
        {
            'id': uuid.UUID('a1111111-1111-1111-1111-111111111111'),
            'name': 'First Steps',
            'description': 'Complete your first game',
            'icon': 'trophy',
            'criteria': {'total_games': 1},
            'points': 10,
            'badge_level': 'bronze'
        },
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
            'id': uuid.UUID('a2222222-2222-2222-2222-222222222222'),
            'name': 'Memory Novice',
            'description': 'Complete 5 memory games',
            'icon': 'psychology',
            'criteria': {'memory_games_completed': 5},
            'points': 20,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a2222222-2222-2222-2222-222222222223'),
            'name': 'Memory Master',
            'description': 'Complete 25 memory games',
            'icon': 'brain',
            'criteria': {'memory_games_completed': 25},
            'points': 50,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a2222222-2222-2222-2222-222222222224'),
            'name': 'Memory Expert',
            'description': 'Complete 50 memory games',
            'icon': 'auto_awesome',
            'criteria': {'memory_games_completed': 50},
            'points': 100,
            'badge_level': 'gold'
        },
        
        # Word Scramble achievements
        {
            'id': uuid.UUID('a3333333-3333-3333-3333-333333333333'),
            'name': 'Word Wizard',
            'description': 'Complete 10 word scramble games',
            'icon': 'spellcheck',
            'criteria': {'word_games_completed': 10},
            'points': 30,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a3333333-3333-3333-3333-333333333334'),
            'name': 'Vocabulary Master',
            'description': 'Complete 25 word scramble games',
            'icon': 'library_books',
            'criteria': {'word_games_completed': 25},
            'points': 60,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a3333333-3333-3333-3333-333333333335'),
            'name': 'Linguist',
            'description': 'Complete 50 word scramble games',
            'icon': 'translate',
            'criteria': {'word_games_completed': 50},
            'points': 120,
            'badge_level': 'gold'
        },
        
        # Reaction Time achievements
        {
            'id': uuid.UUID('a4444444-4444-4444-4444-444444444444'),
            'name': 'Quick Reflex',
            'description': 'Complete 10 reaction games',
            'icon': 'flash_on',
            'criteria': {'reaction_games_completed': 10},
            'points': 25,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a4444444-4444-4444-4444-444444444445'),
            'name': 'Speed Demon',
            'description': 'Complete 25 reaction games',
            'icon': 'bolt',
            'criteria': {'reaction_games_completed': 25},
            'points': 50,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a4444444-4444-4444-4444-444444444446'),
            'name': 'Lightning Fast',
            'description': 'Complete 50 reaction games',
            'icon': 'electric_bolt',
            'criteria': {'reaction_games_completed': 50},
            'points': 100,
            'badge_level': 'gold'
        },
        
        # Score-based achievements
        {
            'id': uuid.UUID('a5555555-5555-5555-5555-555555555555'),
            'name': 'High Achiever',
            'description': 'Score over 500 points in any game',
            'icon': 'star',
            'criteria': {'max_score': 500},
            'points': 30,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a5555555-5555-5555-5555-555555555556'),
            'name': 'Score Champion',
            'description': 'Score over 1000 points in any game',
            'icon': 'emoji_events',
            'criteria': {'max_score': 1000},
            'points': 60,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a5555555-5555-5555-5555-555555555557'),
            'name': 'Record Breaker',
            'description': 'Score over 2000 points in any game',
            'icon': 'workspace_premium',
            'criteria': {'max_score': 2000},
            'points': 120,
            'badge_level': 'gold'
        },
        
        # Accuracy achievements
        {
            'id': uuid.UUID('a6666666-6666-6666-6666-666666666666'),
            'name': 'Perfectionist',
            'description': 'Complete a game with no errors',
            'icon': 'done_all',
            'criteria': {'perfect_games': 1},
            'points': 40,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a6666666-6666-6666-6666-666666666667'),
            'name': 'Flawless Master',
            'description': 'Complete 5 games with no errors',
            'icon': 'verified',
            'criteria': {'perfect_games': 5},
            'points': 80,
            'badge_level': 'gold'
        },
        
        # Streak achievements
        {
            'id': uuid.UUID('a7777777-7777-7777-7777-777777777777'),
            'name': 'Daily Player',
            'description': 'Play games for 3 consecutive days',
            'icon': 'event_repeat',
            'criteria': {'consecutive_days': 3},
            'points': 30,
            'badge_level': 'bronze'
        },
        {
            'id': uuid.UUID('a7777777-7777-7777-7777-777777777778'),
            'name': 'Streak Champion',
            'description': 'Play games for 7 consecutive days',
            'icon': 'calendar_today',
            'criteria': {'consecutive_days': 7},
            'points': 60,
            'badge_level': 'silver'
        },
        {
            'id': uuid.UUID('a7777777-7777-7777-7777-777777777779'),
            'name': 'Dedication Master',
            'description': 'Play games for 30 consecutive days',
            'icon': 'schedule',
            'criteria': {'consecutive_days': 30},
            'points': 200,
            'badge_level': 'gold'
        }
    ]
    
    for achievement_data in achievements:
        # Check if achievement already exists
        existing_achievement = Achievement.query.filter_by(id=achievement_data['id']).first()
        if not existing_achievement:
            achievement = Achievement(**achievement_data)
            db.session.add(achievement)
            print(f"Added achievement: {achievement.name}")