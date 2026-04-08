"""
Seeding script for therapy data - sound categories, sounds, and programs
"""

from sqlalchemy.orm import Session
from app.models.therapy import SoundCategory, TherapySound, TherapyProgram
from app.services.database import get_db
import logging
import uuid

logger = logging.getLogger(__name__)

def seed_therapy_data():
    """Seed the database with initial therapy data"""
    try:
        db = next(get_db())
        
        # Clear existing data (be careful in production)
        db.query(TherapyProgram).delete()
        db.query(TherapySound).delete()
        db.query(SoundCategory).delete()
        db.commit()
        
        # Seed sound categories
        categories_data = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Nature Sounds',
                'description': 'Calming sounds from nature to reduce stress and promote relaxation',
                'color_theme': '#4CAF50',
                'icon': 'nature',
                'display_order': 1
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Binaural Beats',
                'description': 'Frequency-based sounds for cognitive enhancement and focus',
                'color_theme': '#2196F3',
                'icon': 'waves',
                'display_order': 2
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'White Noise',
                'description': 'Consistent background sounds for concentration and sleep',
                'color_theme': '#9E9E9E',
                'icon': 'volume',
                'display_order': 3
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Meditation',
                'description': 'Guided meditation and mindfulness exercises',
                'color_theme': '#9C27B0',
                'icon': 'meditation',
                'display_order': 4
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Music Therapy',
                'description': 'Therapeutic music for emotional and cognitive well-being',
                'color_theme': '#FF9800',
                'icon': 'music',
                'display_order': 5
            }
        ]
        
        categories = []
        for cat_data in categories_data:
            category = SoundCategory(**cat_data)
            categories.append(category)
            db.add(category)
        
        db.commit()
        logger.info(f"Seeded {len(categories)} sound categories")
        
        # Seed therapy sounds
        sounds_data = []
        
        # Nature Sounds
        nature_cat_id = categories[0].id
        sounds_data.extend([
            {
                'name': 'Ocean Waves',
                'description': 'Gentle ocean waves washing against the shore',
                'category_id': nature_cat_id,
                'filename': 'nature/ocean_waves.mp3',
                'duration_seconds': 1800,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['stress_relief', 'sleep_improvement', 'anxiety_reduction'],
                'recommended_duration': 30,
                'tags': ['ocean', 'waves', 'relaxing', 'sleep'],
                'difficulty_level': 'beginner'
            },
            {
                'name': 'Forest Rain',
                'description': 'Soft rainfall in a peaceful forest setting',
                'category_id': nature_cat_id,
                'filename': 'nature/forest_rain.mp3',
                'duration_seconds': 2400,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['stress_relief', 'concentration', 'mood_improvement'],
                'recommended_duration': 25,
                'tags': ['rain', 'forest', 'nature', 'calming'],
                'difficulty_level': 'beginner'
            },
            {
                'name': 'Mountain Stream',
                'description': 'Babbling brook flowing through mountain valleys',
                'category_id': nature_cat_id,
                'filename': 'nature/mountain_stream.mp3',
                'duration_seconds': 2100,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['relaxation', 'focus', 'stress_relief'],
                'recommended_duration': 20,
                'tags': ['water', 'stream', 'mountains', 'peaceful'],
                'difficulty_level': 'beginner'
            }
        ])
        
        # Binaural Beats
        binaural_cat_id = categories[1].id
        sounds_data.extend([
            {
                'name': 'Alpha Waves (10Hz)',
                'description': 'Alpha frequency for relaxed focus and creativity',
                'category_id': binaural_cat_id,
                'filename': 'binaural/alpha_10hz.mp3',
                'duration_seconds': 3600,
                'frequency_range': '10Hz',
                'therapeutic_benefits': ['focus_enhancement', 'creativity', 'relaxation'],
                'recommended_duration': 30,
                'tags': ['alpha', 'focus', 'creativity', 'binaural'],
                'difficulty_level': 'intermediate'
            },
            {
                'name': 'Theta Waves (6Hz)',
                'description': 'Theta frequency for deep meditation and memory',
                'category_id': binaural_cat_id,
                'filename': 'binaural/theta_6hz.mp3',
                'duration_seconds': 3600,
                'frequency_range': '6Hz',
                'therapeutic_benefits': ['deep_relaxation', 'memory_enhancement', 'meditation'],
                'recommended_duration': 45,
                'tags': ['theta', 'meditation', 'memory', 'deep'],
                'difficulty_level': 'advanced'
            },
            {
                'name': 'Beta Waves (20Hz)',
                'description': 'Beta frequency for alertness and concentration',
                'category_id': binaural_cat_id,
                'filename': 'binaural/beta_20hz.mp3',
                'duration_seconds': 3600,
                'frequency_range': '20Hz',
                'therapeutic_benefits': ['alertness', 'concentration', 'cognitive_boost'],
                'recommended_duration': 20,
                'tags': ['beta', 'alertness', 'concentration', 'energy'],
                'difficulty_level': 'intermediate'
            }
        ])
        
        # White Noise
        white_noise_cat_id = categories[2].id
        sounds_data.extend([
            {
                'name': 'Pure White Noise',
                'description': 'Classic white noise for masking distractions',
                'category_id': white_noise_cat_id,
                'filename': 'white_noise/pure_white.mp3',
                'duration_seconds': 3600,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['concentration', 'sleep_improvement', 'tinnitus_relief'],
                'recommended_duration': 60,
                'tags': ['white_noise', 'focus', 'sleep', 'masking'],
                'difficulty_level': 'beginner'
            },
            {
                'name': 'Pink Noise',
                'description': 'Balanced pink noise for better sleep quality',
                'category_id': white_noise_cat_id,
                'filename': 'white_noise/pink_noise.mp3',
                'duration_seconds': 3600,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['sleep_improvement', 'memory_consolidation', 'relaxation'],
                'recommended_duration': 480,
                'tags': ['pink_noise', 'sleep', 'memory', 'gentle'],
                'difficulty_level': 'beginner'
            }
        ])
        
        # Meditation
        meditation_cat_id = categories[3].id
        sounds_data.extend([
            {
                'name': 'Breathing Meditation',
                'description': 'Guided breathing exercise for mindfulness',
                'category_id': meditation_cat_id,
                'filename': 'meditation/breathing_guide.mp3',
                'duration_seconds': 900,
                'frequency_range': 'Voice',
                'therapeutic_benefits': ['stress_relief', 'anxiety_reduction', 'mindfulness'],
                'recommended_duration': 15,
                'tags': ['breathing', 'guided', 'mindfulness', 'anxiety'],
                'difficulty_level': 'beginner'
            },
            {
                'name': 'Body Scan Meditation',
                'description': 'Progressive body relaxation technique',
                'category_id': meditation_cat_id,
                'filename': 'meditation/body_scan.mp3',
                'duration_seconds': 1800,
                'frequency_range': 'Voice',
                'therapeutic_benefits': ['deep_relaxation', 'body_awareness', 'stress_relief'],
                'recommended_duration': 30,
                'tags': ['body_scan', 'relaxation', 'progressive', 'awareness'],
                'difficulty_level': 'intermediate'
            }
        ])
        
        # Music Therapy
        music_cat_id = categories[4].id
        sounds_data.extend([
            {
                'name': 'Classical Therapy',
                'description': 'Carefully selected classical music for cognitive stimulation',
                'category_id': music_cat_id,
                'filename': 'music/classical_therapy.mp3',
                'duration_seconds': 2700,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['cognitive_stimulation', 'mood_improvement', 'memory_support'],
                'recommended_duration': 45,
                'tags': ['classical', 'cognitive', 'memory', 'stimulation'],
                'difficulty_level': 'intermediate'
            },
            {
                'name': 'Ambient Healing',
                'description': 'Soft ambient music for emotional healing',
                'category_id': music_cat_id,
                'filename': 'music/ambient_healing.mp3',
                'duration_seconds': 2400,
                'frequency_range': '20Hz-20kHz',
                'therapeutic_benefits': ['emotional_healing', 'stress_relief', 'comfort'],
                'recommended_duration': 40,
                'tags': ['ambient', 'healing', 'emotional', 'gentle'],
                'difficulty_level': 'beginner'
            }
        ])
        
        # Create therapy sounds
        sounds = []
        for sound_data in sounds_data:
            sound = TherapySound(
                id=str(uuid.uuid4()),
                **sound_data
            )
            sounds.append(sound)
            db.add(sound)
        
        db.commit()
        logger.info(f"Seeded {len(sounds)} therapy sounds")
        
        # Seed therapy programs
        programs_data = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Stress Relief Program',
                'description': 'A 7-day program focused on reducing stress and promoting relaxation',
                'total_sessions': 7,
                'duration_days': 7,
                'sessions_per_day': 1,
                'session_duration': 20,
                'sound_sequence': [s.id for s in sounds[:3]],  # Use first 3 nature sounds
                'difficulty_progression': 'static',
                'therapeutic_focus': 'stress_relief',
                'created_by': 'MindFlex Therapy Team',
                'recommended_for': ['stress', 'anxiety', 'tension']
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Focus Enhancement Program',
                'description': 'A 14-day program to improve concentration and cognitive focus',
                'total_sessions': 14,
                'duration_days': 14,
                'sessions_per_day': 2,
                'session_duration': 25,
                'sound_sequence': [s.id for s in sounds[3:6]],  # Use binaural beats
                'difficulty_progression': 'gradual',
                'therapeutic_focus': 'focus_enhancement',
                'created_by': 'MindFlex Therapy Team',
                'recommended_for': ['attention', 'concentration', 'productivity']
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Sleep Improvement Program',
                'description': 'A 10-day program designed to improve sleep quality and duration',
                'total_sessions': 10,
                'duration_days': 10,
                'sessions_per_day': 1,
                'session_duration': 60,
                'sound_sequence': [s.id for s in sounds[6:8]],  # Use white/pink noise
                'difficulty_progression': 'static',
                'therapeutic_focus': 'sleep_improvement',
                'created_by': 'MindFlex Therapy Team',
                'recommended_for': ['insomnia', 'sleep_quality', 'rest']
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Mindfulness Journey',
                'description': 'A 21-day comprehensive mindfulness and meditation program',
                'total_sessions': 21,
                'duration_days': 21,
                'sessions_per_day': 1,
                'session_duration': 30,
                'sound_sequence': [s.id for s in sounds[8:10]],  # Use meditation sounds
                'difficulty_progression': 'gradual',
                'therapeutic_focus': 'mindfulness',
                'created_by': 'MindFlex Therapy Team',
                'recommended_for': ['anxiety', 'mindfulness', 'spiritual_growth']
            }
        ]
        
        programs = []
        for program_data in programs_data:
            program = TherapyProgram(**program_data)
            programs.append(program)
            db.add(program)
        
        db.commit()
        logger.info(f"Seeded {len(programs)} therapy programs")
        
        logger.info("Therapy data seeding completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error seeding therapy data: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == '__main__':
    import sys
    sys.path.append('/home/jason/MindFlex/MindFlex/backend')
    from app.database import init_db
    from config import config
    import os
    
    # Initialize database
    os.environ.setdefault('FLASK_ENV', 'development')
    config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Create a minimal Flask app for database initialization
    from flask import Flask
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    init_db(app)
    
    # Seed therapy data
    success = seed_therapy_data()
    if success:
        print("Therapy data seeded successfully!")
    else:
        print("Failed to seed therapy data.")
        sys.exit(1)