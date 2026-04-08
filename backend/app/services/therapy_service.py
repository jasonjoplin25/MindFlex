from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, desc, func, asc
from app.models.therapy import (
    SoundCategory, TherapySound, TherapySession, 
    UserSoundPreference, TherapyProgram, ProgramEnrollment
)
from app.models.user import User
from app.database import db
import logging

logger = logging.getLogger(__name__)

class TherapyService:
    """Service for sound therapy operations"""
    
    @staticmethod
    def get_sound_categories(include_inactive: bool = False) -> List[Dict[str, Any]]:
        """Get all sound therapy categories"""
        try:
            query = db.session.query(SoundCategory)
            
            if not include_inactive:
                query = query.filter(SoundCategory.is_active == True)
            
            categories = query.order_by(SoundCategory.display_order, SoundCategory.name).all()
            
            result = []
            for category in categories:
                # Get sound count for this category
                sound_count = db.session.query(func.count(TherapySound.id)).filter(
                    and_(
                        TherapySound.category_id == category.id,
                        TherapySound.is_active == True
                    )
                ).scalar() or 0
                
                result.append({
                    'id': category.id,
                    'name': category.name,
                    'description': category.description,
                    'color_theme': category.color_theme,
                    'icon': category.icon,
                    'display_order': category.display_order,
                    'sound_count': sound_count
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting sound categories: {str(e)}")
            return []
    
    @staticmethod
    def get_therapy_sounds(category_id: str = None) -> List[Dict[str, Any]]:
        """Get therapy sounds, optionally filtered by category"""
        try:
            query = db.session.query(TherapySound).filter(TherapySound.is_active == True)
            
            if category_id:
                query = query.filter(TherapySound.category_id == category_id)
            
            sounds = query.order_by(TherapySound.name).all()
            
            result = []
            for sound in sounds:
                # Get category info
                category = db.session.query(SoundCategory).filter(
                    SoundCategory.id == sound.category_id
                ).first()
                
                result.append({
                    'id': sound.id,
                    'name': sound.name,
                    'description': sound.description,
                    'category': {
                        'id': category.id if category else None,
                        'name': category.name if category else None,
                        'color_theme': category.color_theme if category else None
                    },
                    'filename': sound.filename,
                    'duration_seconds': sound.duration_seconds,
                    'audio_format': sound.audio_format,
                    'frequency_range': sound.frequency_range,
                    'therapeutic_benefits': sound.therapeutic_benefits or [],
                    'recommended_duration': sound.recommended_duration,
                    'volume_level': sound.volume_level,
                    'tags': sound.tags or [],
                    'difficulty_level': sound.difficulty_level,
                    'is_premium': sound.is_premium,
                    'play_count': sound.play_count,
                    'rating': sound.rating
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting therapy sounds: {str(e)}")
            return []
    
    @staticmethod
    def get_sound_details(sound_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific sound"""
        try:
            sound = db.session.query(TherapySound).filter(
                and_(
                    TherapySound.id == sound_id,
                    TherapySound.is_active == True
                )
            ).first()
            
            if not sound:
                return None
            
            # Get category info
            category = db.session.query(SoundCategory).filter(
                SoundCategory.id == sound.category_id
            ).first()
            
            return {
                'id': sound.id,
                'name': sound.name,
                'description': sound.description,
                'category': {
                    'id': category.id if category else None,
                    'name': category.name if category else None,
                    'color_theme': category.color_theme if category else None,
                    'description': category.description if category else None
                },
                'filename': sound.filename,
                'duration_seconds': sound.duration_seconds,
                'file_size': sound.file_size,
                'audio_format': sound.audio_format,
                'frequency_range': sound.frequency_range,
                'therapeutic_benefits': sound.therapeutic_benefits or [],
                'recommended_duration': sound.recommended_duration,
                'volume_level': sound.volume_level,
                'tags': sound.tags or [],
                'difficulty_level': sound.difficulty_level,
                'is_premium': sound.is_premium,
                'play_count': sound.play_count,
                'rating': sound.rating,
                'created_at': sound.created_at.isoformat() if sound.created_at else None,
                'updated_at': sound.updated_at.isoformat() if sound.updated_at else None
            }
            
        except Exception as e:
            logger.error(f"Error getting sound details: {str(e)}")
            return None
    
    @staticmethod
    def start_therapy_session(user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Start a new therapy session"""
        try:
            sound_id = data.get('sound_id')
            
            # Verify sound exists
            sound = db.session.query(TherapySound).filter(
                and_(
                    TherapySound.id == sound_id,
                    TherapySound.is_active == True
                )
            ).first()
            
            if not sound:
                return None
            
            # Create new session
            session = TherapySession(
                user_id=user_id,
                sound_id=sound_id,
                volume_level=data.get('volume_level', sound.volume_level),
                playback_speed=data.get('playback_speed', 1.0),
                mood_before=data.get('mood_before'),
                time_of_day=data.get('time_of_day'),
                environment=data.get('environment'),
                device_type=data.get('device_type')
            )
            
            db.session.add(session)
            db.session.commit()
            
            return {
                'id': session.id,
                'user_id': session.user_id,
                'sound_id': session.sound_id,
                'started_at': session.started_at.isoformat(),
                'volume_level': session.volume_level,
                'playback_speed': session.playback_speed
            }
            
        except Exception as e:
            logger.error(f"Error starting therapy session: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def end_therapy_session(session_id: str, user_id: str, data: Dict[str, Any]) -> bool:
        """End a therapy session and record results"""
        try:
            session = db.session.query(TherapySession).filter(
                and_(
                    TherapySession.id == session_id,
                    TherapySession.user_id == user_id
                )
            ).first()
            
            if not session:
                return False
            
            # Update session with completion data
            session.ended_at = datetime.utcnow()
            session.duration_seconds = data.get('duration_seconds')
            session.completed = data.get('completed', True)
            session.mood_after = data.get('mood_after')
            session.effectiveness_rating = data.get('effectiveness_rating')
            session.notes = data.get('notes')
            session.interrupted = data.get('interrupted', False)
            session.interruption_count = data.get('interruption_count', 0)
            
            # Update sound play count
            sound = db.session.query(TherapySound).filter(
                TherapySound.id == session.sound_id
            ).first()
            if sound:
                sound.play_count = (sound.play_count or 0) + 1
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error ending therapy session: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def get_user_sessions(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's therapy session history"""
        try:
            sessions = db.session.query(TherapySession).filter(
                TherapySession.user_id == user_id
            ).order_by(desc(TherapySession.started_at)).limit(limit).all()
            
            result = []
            for session in sessions:
                # Get sound info
                sound = db.session.query(TherapySound).filter(
                    TherapySound.id == session.sound_id
                ).first()
                
                result.append({
                    'id': session.id,
                    'sound': {
                        'id': sound.id if sound else None,
                        'name': sound.name if sound else None,
                    },
                    'started_at': session.started_at.isoformat(),
                    'ended_at': session.ended_at.isoformat() if session.ended_at else None,
                    'duration_seconds': session.duration_seconds,
                    'completed': session.completed,
                    'mood_before': session.mood_before,
                    'mood_after': session.mood_after,
                    'effectiveness_rating': session.effectiveness_rating,
                    'notes': session.notes
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {str(e)}")
            return []
    
    @staticmethod
    def get_user_preferences(user_id: str) -> Dict[str, Any]:
        """Get user's sound therapy preferences"""
        try:
            preferences = db.session.query(UserSoundPreference).filter(
                UserSoundPreference.user_id == user_id
            ).first()
            
            if not preferences:
                return {
                    'favorite_categories': [],
                    'favorite_sounds': [],
                    'blocked_sounds': [],
                    'default_volume': 0.7,
                    'default_duration': 600,
                    'auto_repeat': False,
                    'fade_in_out': True,
                    'stress_level': None,
                    'primary_goals': [],
                    'listening_times': [],
                    'hearing_sensitivity': 'normal',
                    'frequency_preferences': []
                }
            
            return {
                'id': preferences.id,
                'favorite_categories': preferences.favorite_categories or [],
                'favorite_sounds': preferences.favorite_sounds or [],
                'blocked_sounds': preferences.blocked_sounds or [],
                'default_volume': preferences.default_volume,
                'default_duration': preferences.default_duration,
                'auto_repeat': preferences.auto_repeat,
                'fade_in_out': preferences.fade_in_out,
                'stress_level': preferences.stress_level,
                'primary_goals': preferences.primary_goals or [],
                'listening_times': preferences.listening_times or [],
                'hearing_sensitivity': preferences.hearing_sensitivity,
                'frequency_preferences': preferences.frequency_preferences or []
            }
            
        except Exception as e:
            logger.error(f"Error getting user preferences: {str(e)}")
            return {}
    
    @staticmethod
    def update_user_preferences(user_id: str, data: Dict[str, Any]) -> bool:
        """Update user's sound therapy preferences"""
        try:
            preferences = db.session.query(UserSoundPreference).filter(
                UserSoundPreference.user_id == user_id
            ).first()
            
            if not preferences:
                preferences = UserSoundPreference(user_id=user_id)
                db.session.add(preferences)
            
            # Update preferences
            for field, value in data.items():
                if hasattr(preferences, field):
                    setattr(preferences, field, value)
            
            preferences.updated_at = datetime.utcnow()
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def get_therapy_recommendations(user_id: str) -> List[Dict[str, Any]]:
        """Get personalized therapy recommendations for user"""
        try:
            # Get user's recent sessions for analysis
            recent_sessions = db.session.query(TherapySession).filter(
                and_(
                    TherapySession.user_id == user_id,
                    TherapySession.completed == True,
                    TherapySession.started_at >= datetime.utcnow() - timedelta(days=30)
                )
            ).order_by(desc(TherapySession.started_at)).limit(10).all()
            
            # Get user preferences
            preferences = TherapyService.get_user_preferences(user_id)
            
            # Simple recommendation logic
            recommendations = []
            
            # If user has no recent sessions, recommend popular sounds
            if not recent_sessions:
                popular_sounds = db.session.query(TherapySound).filter(
                    TherapySound.is_active == True
                ).order_by(desc(TherapySound.play_count)).limit(5).all()
                
                for sound in popular_sounds:
                    recommendations.append({
                        'sound_id': sound.id,
                        'name': sound.name,
                        'reason': 'Popular with other users',
                        'confidence': 0.7
                    })
            else:
                # Recommend sounds from effective categories
                effective_categories = []
                for session in recent_sessions:
                    if session.effectiveness_rating and session.effectiveness_rating >= 4:
                        sound = db.session.query(TherapySound).filter(
                            TherapySound.id == session.sound_id
                        ).first()
                        if sound and sound.category_id not in effective_categories:
                            effective_categories.append(sound.category_id)
                
                # Find new sounds from effective categories
                for category_id in effective_categories[:3]:
                    category_sounds = db.session.query(TherapySound).filter(
                        and_(
                            TherapySound.category_id == category_id,
                            TherapySound.is_active == True,
                            TherapySound.id.notin_([s.sound_id for s in recent_sessions])
                        )
                    ).order_by(desc(TherapySound.rating)).limit(2).all()
                    
                    for sound in category_sounds:
                        recommendations.append({
                            'sound_id': sound.id,
                            'name': sound.name,
                            'reason': 'Similar to your effective sessions',
                            'confidence': 0.9
                        })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting therapy recommendations: {str(e)}")
            return []
    
    @staticmethod
    def get_therapy_analytics(user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user's therapy analytics and progress"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get sessions in period
            sessions = db.session.query(TherapySession).filter(
                and_(
                    TherapySession.user_id == user_id,
                    TherapySession.started_at >= start_date,
                    TherapySession.completed == True
                )
            ).all()
            
            if not sessions:
                return {
                    'total_sessions': 0,
                    'total_minutes': 0,
                    'average_effectiveness': 0,
                    'mood_improvement_rate': 0,
                    'most_used_category': None,
                    'progress_trend': 'no_data'
                }
            
            total_sessions = len(sessions)
            total_seconds = sum([s.duration_seconds for s in sessions if s.duration_seconds])
            total_minutes = total_seconds // 60
            
            # Calculate effectiveness
            effectiveness_ratings = [s.effectiveness_rating for s in sessions if s.effectiveness_rating]
            avg_effectiveness = sum(effectiveness_ratings) / len(effectiveness_ratings) if effectiveness_ratings else 0
            
            # Calculate mood improvement
            mood_sessions = [s for s in sessions if s.mood_before and s.mood_after]
            mood_improvements = 0
            if mood_sessions:
                mood_values = {'very_negative': 1, 'negative': 2, 'neutral': 3, 'positive': 4, 'very_positive': 5}
                for session in mood_sessions:
                    before_val = mood_values.get(session.mood_before, 3)
                    after_val = mood_values.get(session.mood_after, 3)
                    if after_val > before_val:
                        mood_improvements += 1
            
            mood_improvement_rate = (mood_improvements / len(mood_sessions) * 100) if mood_sessions else 0
            
            # Most used category
            category_counts = {}
            for session in sessions:
                sound = db.session.query(TherapySound).filter(
                    TherapySound.id == session.sound_id
                ).first()
                if sound:
                    category = db.session.query(SoundCategory).filter(
                        SoundCategory.id == sound.category_id
                    ).first()
                    if category:
                        category_counts[category.name] = category_counts.get(category.name, 0) + 1
            
            most_used_category = max(category_counts, key=category_counts.get) if category_counts else None
            
            # Simple progress trend
            if len(sessions) >= 5:
                recent_effectiveness = [s.effectiveness_rating for s in sessions[:5] if s.effectiveness_rating]
                older_effectiveness = [s.effectiveness_rating for s in sessions[5:10] if s.effectiveness_rating]
                
                if recent_effectiveness and older_effectiveness:
                    recent_avg = sum(recent_effectiveness) / len(recent_effectiveness)
                    older_avg = sum(older_effectiveness) / len(older_effectiveness)
                    
                    if recent_avg > older_avg * 1.1:
                        progress_trend = 'improving'
                    elif recent_avg < older_avg * 0.9:
                        progress_trend = 'declining'
                    else:
                        progress_trend = 'stable'
                else:
                    progress_trend = 'stable'
            else:
                progress_trend = 'insufficient_data'
            
            return {
                'total_sessions': total_sessions,
                'total_minutes': total_minutes,
                'average_effectiveness': round(avg_effectiveness, 2),
                'mood_improvement_rate': round(mood_improvement_rate, 1),
                'most_used_category': most_used_category,
                'progress_trend': progress_trend,
                'sessions_with_mood_data': len(mood_sessions)
            }
            
        except Exception as e:
            logger.error(f"Error getting therapy analytics: {str(e)}")
            return {}
    
    # Additional methods for program management...
    @staticmethod
    def get_therapy_programs() -> List[Dict[str, Any]]:
        """Get available therapy programs"""
        try:
            programs = db.session.query(TherapyProgram).filter(
                TherapyProgram.is_active == True
            ).order_by(TherapyProgram.name).all()
            
            result = []
            for program in programs:
                result.append({
                    'id': program.id,
                    'name': program.name,
                    'description': program.description,
                    'total_sessions': program.total_sessions,
                    'duration_days': program.duration_days,
                    'sessions_per_day': program.sessions_per_day,
                    'session_duration': program.session_duration,
                    'difficulty_progression': program.difficulty_progression,
                    'therapeutic_focus': program.therapeutic_focus,
                    'created_by': program.created_by,
                    'is_premium': program.is_premium,
                    'recommended_for': program.recommended_for or []
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting therapy programs: {str(e)}")
            return []
    
    @staticmethod
    def enroll_in_program(user_id: str, program_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Enroll user in a therapy program"""
        try:
            # Check if program exists
            program = db.session.query(TherapyProgram).filter(
                and_(
                    TherapyProgram.id == program_id,
                    TherapyProgram.is_active == True
                )
            ).first()
            
            if not program:
                return None
            
            # Check if user is already enrolled
            existing_enrollment = db.session.query(ProgramEnrollment).filter(
                and_(
                    ProgramEnrollment.user_id == user_id,
                    ProgramEnrollment.program_id == program_id,
                    ProgramEnrollment.is_active == True
                )
            ).first()
            
            if existing_enrollment:
                return {
                    'id': existing_enrollment.id,
                    'message': 'Already enrolled in this program'
                }
            
            # Create enrollment
            enrollment = ProgramEnrollment(
                user_id=user_id,
                program_id=program_id,
                initial_mood_assessment=data.get('initial_mood_assessment')
            )
            
            db.session.add(enrollment)
            db.session.commit()
            
            return {
                'id': enrollment.id,
                'program_id': program_id,
                'started_at': enrollment.started_at.isoformat(),
                'current_session': enrollment.current_session
            }
            
        except Exception as e:
            logger.error(f"Error enrolling in program: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def get_user_enrollments(user_id: str) -> List[Dict[str, Any]]:
        """Get user's therapy program enrollments"""
        try:
            enrollments = db.session.query(ProgramEnrollment).filter(
                ProgramEnrollment.user_id == user_id
            ).order_by(desc(ProgramEnrollment.started_at)).all()
            
            result = []
            for enrollment in enrollments:
                program = db.session.query(TherapyProgram).filter(
                    TherapyProgram.id == enrollment.program_id
                ).first()
                
                result.append({
                    'id': enrollment.id,
                    'program': {
                        'id': program.id if program else None,
                        'name': program.name if program else None,
                        'total_sessions': program.total_sessions if program else None
                    },
                    'started_at': enrollment.started_at.isoformat(),
                    'completed_at': enrollment.completed_at.isoformat() if enrollment.completed_at else None,
                    'current_session': enrollment.current_session,
                    'total_sessions_completed': enrollment.total_sessions_completed,
                    'completion_percentage': enrollment.completion_percentage,
                    'is_active': enrollment.is_active
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user enrollments: {str(e)}")
            return []
    
    @staticmethod
    def update_program_progress(enrollment_id: str, user_id: str, data: Dict[str, Any]) -> bool:
        """Update progress in a therapy program enrollment"""
        try:
            enrollment = db.session.query(ProgramEnrollment).filter(
                and_(
                    ProgramEnrollment.id == enrollment_id,
                    ProgramEnrollment.user_id == user_id
                )
            ).first()
            
            if not enrollment:
                return False
            
            # Update progress
            enrollment.current_session = data.get('current_session', enrollment.current_session)
            enrollment.total_sessions_completed = data.get('total_sessions_completed', enrollment.total_sessions_completed)
            enrollment.last_session_date = datetime.utcnow()
            
            # Calculate completion percentage
            program = db.session.query(TherapyProgram).filter(
                TherapyProgram.id == enrollment.program_id
            ).first()
            
            if program:
                enrollment.completion_percentage = (enrollment.total_sessions_completed / program.total_sessions) * 100
                
                # Check if program is completed
                if enrollment.total_sessions_completed >= program.total_sessions:
                    enrollment.completed_at = datetime.utcnow()
                    enrollment.is_active = False
            
            enrollment.updated_at = datetime.utcnow()
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating program progress: {str(e)}")
            db.session.rollback()
            return False