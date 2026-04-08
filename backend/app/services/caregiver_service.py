from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from app.models.user import User
from app.models.patient import Patient
from app.models.caregiver import Caregiver, CaregiverPatient
from app.models.game import GameSession, Game
from app.models.achievement import UserAchievement, Achievement
from app.models.medication import Medication, MedicationLog
from app.models.appointment import Appointment
from app.models.note import PatientNote
from app.models.mood_tracking import MoodEntry, MoodPattern
from app.models.patient_routine import PatientRoutine
from app.database import db
import logging

logger = logging.getLogger(__name__)

class CaregiverService:
    """Service for caregiver-specific operations and patient management"""
    
    @staticmethod
    def get_caregiver_patients(caregiver_id: str) -> List[Dict[str, Any]]:
        """Get all patients associated with a caregiver"""
        try:
            logger.info(f"Fetching patients for caregiver: {caregiver_id}")
            
            # Get caregiver record
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                logger.error(f"Caregiver not found: {caregiver_id}")
                return []
                
            logger.info(f"Found caregiver record: {caregiver.id}")
            
            # Get patients linked to this caregiver through the relationship table
            patients = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).all()
            
            logger.info(f"Found {len(patients)} patients for caregiver")
            
            result = []
            for patient in patients:
                # Get user info
                user = db.session.query(User).filter(User.id == patient.user_id).first()
                if not user:
                    continue
                
                # Get latest game session stats
                latest_session = db.session.query(GameSession).filter(
                    GameSession.player_id == user.id
                ).order_by(desc(GameSession.created_at)).first()
                
                # Get total sessions and average score
                total_sessions = db.session.query(func.count(GameSession.id)).filter(
                    GameSession.player_id == user.id,
                    GameSession.completed == True
                ).scalar() or 0
                
                avg_score = db.session.query(func.avg(GameSession.score)).filter(
                    GameSession.player_id == user.id,
                    GameSession.completed == True
                ).scalar() or 0
                
                # Calculate progress (based on sessions completed this month)
                month_start = datetime.now().replace(day=1)
                month_sessions = db.session.query(func.count(GameSession.id)).filter(
                    GameSession.player_id == user.id,
                    GameSession.created_at >= month_start
                ).scalar() or 0
                
                progress = min(100, (month_sessions / 20) * 100)  # Target: 20 sessions per month
                
                # Safe last active date
                last_active = 'Never'
                if latest_session and latest_session.created_at:
                    last_active = latest_session.created_at.strftime('%Y-%m-%d')
                
                result.append({
                    'id': str(patient.id),
                    'user_id': str(user.id),
                    'name': f"{user.first_name} {user.last_name}",
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'age': patient.age,
                    'gender': patient.gender,
                    'condition': patient.condition or 'Not specified',
                    'lastActive': last_active,
                    'progress': round(progress, 1),
                    'totalSessions': total_sessions,
                    'averageScore': round(avg_score, 0) if avg_score else 0,
                    'additionalNotes': patient.notes or '',
                    'mobility': patient.mobility_level or 'Good',
                    'created_at': patient.created_at.isoformat() if patient.created_at else None,
                    'updated_at': patient.updated_at.isoformat() if patient.updated_at else None
                })
                logger.info(f"Added patient to result: {user.email} ({patient.id})")
                
            logger.info(f"Returning {len(result)} patients for caregiver dashboard")
            return result
            
        except Exception as e:
            logger.error(f"Error getting caregiver patients: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    @staticmethod
    def get_patient_details(patient_id: str, caregiver_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific patient"""
        try:
            logger.info(f"Getting patient details for patient_id: {patient_id}, caregiver_id: {caregiver_id}")
            
            # Verify caregiver has access to this patient
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                logger.error(f"Caregiver not found: {caregiver_id}")
                return None
            
            # Verify caregiver has access to this patient through the relationship table
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                logger.error(f"Patient not found or no access: {patient_id}")
                return None
            
            # Get user info
            user = db.session.query(User).filter(User.id == patient.user_id).first()
            if not user:
                logger.error(f"User not found for patient: {patient_id}")
                return None
            
            logger.info(f"Found patient: {patient.id} with user: {user.id}")
            
            # Get ALL game history with game names
            game_sessions = db.session.query(GameSession, Game).join(
                Game, GameSession.game_id == Game.id
            ).filter(
                GameSession.player_id == user.id,
                GameSession.completed == True
            ).order_by(desc(GameSession.created_at)).all()
            
            logger.info(f"Found {len(game_sessions)} game sessions for user {user.id}")
            
            game_history = []
            for session, game in game_sessions:
                game_entry = {
                    'game_name': game.name if game else 'Unknown Game',
                    'score': session.score or 0,
                    'date': session.created_at.strftime('%Y-%m-%d'),
                    'duration': session.duration_seconds or 0,
                    'difficulty': session.difficulty or 'easy'
                }
                game_history.append(game_entry)
                logger.info(f"Game session: {game_entry}")
            
            logger.info(f"Total game history entries: {len(game_history)}")
            
            # Get achievements with achievement names
            achievements = db.session.query(UserAchievement, Achievement).join(
                Achievement, UserAchievement.achievement_id == Achievement.id
            ).filter(
                UserAchievement.user_id == user.id
            ).order_by(desc(UserAchievement.earned_at)).limit(5).all()
            
            achievement_list = []
            for user_achievement, achievement in achievements:
                achievement_list.append({
                    'name': achievement.name if achievement else 'Unknown Achievement',
                    'earned_at': user_achievement.earned_at.strftime('%Y-%m-%d')
                })
            
            # Parse JSON fields safely
            strengths = patient.strengths or []
            improvement_areas = patient.improvement_areas or []
            interests = patient.interests or []
            
            return {
                'id': str(patient.id),
                'user_id': str(user.id),
                'name': f"{user.first_name} {user.last_name}",
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'age': patient.age,
                'gender': patient.gender,
                'condition': patient.condition,
                'mobility': patient.mobility_level or 'Good',
                'strengths': strengths,
                'improvement_areas': improvement_areas,
                'interests': interests,
                'notes': patient.notes or '',
                'settings': patient.preferences or {},
                'additional_notes': patient.notes or '',
                'game_history': game_history,
                'achievements': achievement_list,
                'medications': CaregiverService._get_patient_medications_for_details(patient.id),
                'appointments': CaregiverService._get_patient_appointments_for_details(patient.id),
                'reported_symptoms': [],  # TODO: Implement symptom tracking
                'created_at': patient.created_at.isoformat() if patient.created_at else None,
                'updated_at': patient.updated_at.isoformat() if patient.updated_at else None
            }
            
        except Exception as e:
            logger.error(f"Error getting patient details: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    @staticmethod
    def add_patient(caregiver_id: str, patient_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a new patient to caregiver's care"""
        try:
            # Get caregiver record
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                logger.error(f"Caregiver not found: {caregiver_id}")
                return None
            
            # Create new user for patient if not exists
            existing_user = None
            if 'user_id' in patient_data:
                existing_user = db.session.query(User).filter(User.id == patient_data['user_id']).first()
            
            if not existing_user:
                # Create new user
                new_user = User(
                    email=patient_data.get('email', f"patient_{datetime.now().timestamp()}@mindflex.app"),
                    first_name=patient_data.get('first_name', ''),
                    last_name=patient_data.get('last_name', ''),
                    user_type='patient',
                    is_active=True
                )
                new_user.set_password('temporary123')  # Temporary password
                
                db.session.add(new_user)
                db.session.commit()
                db.session.refresh(new_user)
                user = new_user
            else:
                user = existing_user
            
            # Check if patient record exists for this user
            patient = db.session.query(Patient).filter(Patient.user_id == user.id).first()
            
            if not patient:
                # Create patient record
                patient = Patient(
                    user_id=user.id,
                    age=patient_data.get('age'),
                    gender=patient_data.get('gender'),
                    condition=patient_data.get('condition'),
                    mobility_level=patient_data.get('mobility', 'Good'),
                    notes=patient_data.get('notes', ''),
                    strengths=patient_data.get('strengths', []),
                    improvement_areas=patient_data.get('improvement_areas', []),
                    interests=patient_data.get('interests', [])
                )
                db.session.add(patient)
                db.session.flush()  # Get the patient ID
            
            # Create caregiver-patient relationship
            relationship = CaregiverPatient(
                caregiver_id=caregiver.id,
                patient_id=patient.id,
                relationship_type='primary',
                status='active'
            )
            
            db.session.add(relationship)
            db.session.commit()
            db.session.refresh(patient)
            
            return {
                'id': patient.id,
                'user_id': user.id,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'age': patient.age,
                'gender': patient.gender,
                'condition': patient.condition,
                'lastActive': 'Never',
                'progress': 0,
                'totalSessions': 0,
                'averageScore': 0,
                'created_at': patient.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error adding patient: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def update_patient(patient_id: str, caregiver_id: str, update_data: Dict[str, Any]) -> bool:
        """Update patient information"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Verify caregiver has access to this patient through the relationship table
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return False
            
            # Update patient fields
            for field, value in update_data.items():
                if hasattr(patient, field):
                    setattr(patient, field, value)
            
            patient.updated_at = datetime.utcnow()
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating patient: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def get_caregiver_stats(caregiver_id: str) -> Dict[str, Any]:
        """Get dashboard statistics for caregiver"""
        try:
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {}
            
            # Get patient count using relationship table
            total_patients = db.session.query(func.count(Patient.id)).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).scalar() or 0
            
            # Get active patients (had session in last 7 days)
            week_ago = datetime.utcnow() - timedelta(days=7)
            active_patients = db.session.query(func.count(func.distinct(GameSession.player_id))).filter(
                GameSession.created_at >= week_ago
            ).join(Patient, Patient.user_id == GameSession.player_id).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).scalar() or 0
            
            # Get total sessions for all patients
            total_sessions = db.session.query(func.count(GameSession.id)).filter(
                GameSession.completed == True
            ).join(Patient, Patient.user_id == GameSession.player_id).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).scalar() or 0
            
            # Get average score
            avg_score = db.session.query(func.avg(GameSession.score)).filter(
                GameSession.completed == True
            ).join(Patient, Patient.user_id == GameSession.player_id).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).scalar() or 0
            
            # Calculate overall progress (sessions this month vs target)
            month_start = datetime.now().replace(day=1)
            month_sessions = db.session.query(func.count(GameSession.id)).filter(
                GameSession.created_at >= month_start
            ).join(Patient, Patient.user_id == GameSession.player_id).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).scalar() or 0
            
            target_sessions = total_patients * 20  # 20 sessions per patient per month
            patient_progress = min(100, (month_sessions / max(target_sessions, 1)) * 100)
            
            return {
                'totalPatients': total_patients,
                'activePatients': active_patients,
                'totalSessions': total_sessions,
                'averageScore': round(avg_score, 0) if avg_score else 0,
                'patientProgress': round(patient_progress, 1),
                'pendingMedications': 0,  # TODO: Implement medication tracking
                'upcomingAppointments': 0,  # TODO: Implement appointment tracking
            }
            
        except Exception as e:
            logger.error(f"Error getting caregiver stats: {str(e)}")
            return {}
    
    @staticmethod
    def generate_care_recommendations(patient_id: str, caregiver_id: str) -> str:
        """Generate AI-powered care recommendations for a patient"""
        try:
            # Get patient details
            patient_details = CaregiverService.get_patient_details(patient_id, caregiver_id)
            if not patient_details:
                return "Unable to generate recommendations - patient not found."
            
            # Analyze game performance patterns
            game_history = patient_details.get('game_history', [])
            if not game_history:
                return "Not enough data to generate recommendations. Patient needs to complete more cognitive exercises."
            
            # Calculate performance metrics
            scores = [session['score'] for session in game_history]
            avg_score = sum(scores) / len(scores) if scores else 0
            recent_scores = scores[:5]  # Last 5 sessions
            trend = "improving" if len(recent_scores) >= 2 and recent_scores[0] > recent_scores[-1] else "declining" if len(recent_scores) >= 2 and recent_scores[0] < recent_scores[-1] else "stable"
            
            # Generate personalized recommendations
            recommendations = f"""
Based on {patient_details['first_name']}'s cognitive assessment data, here are personalized care recommendations:

**Performance Analysis:**
- Average cognitive score: {avg_score:.0f}/1000
- Recent performance trend: {trend}
- Total completed sessions: {len(game_history)}
- Current condition: {patient_details.get('condition', 'Not specified')}

**Recommended Care Approaches:**

1. **Cognitive Exercise Focus:**
"""
            
            if avg_score < 600:
                recommendations += """
   - Focus on foundational exercises to build confidence
   - Start with easier difficulty levels and gradually increase
   - Use shorter sessions (10-15 minutes) to prevent fatigue
   - Emphasize positive reinforcement and celebration of small wins"""
            elif avg_score < 800:
                recommendations += """
   - Maintain current exercise routine with gradual difficulty increases
   - Introduce variety in cognitive tasks to prevent plateauing
   - Target specific weak areas identified in assessment
   - Encourage 20-30 minute focused sessions"""
            else:
                recommendations += """
   - Challenge with advanced cognitive exercises
   - Focus on maintaining current high performance
   - Introduce complex multi-step problems
   - Consider mentoring other patients to build confidence"""
            
            recommendations += f"""

2. **Personalized Strategies:**
   - Strengths to leverage: {', '.join(patient_details.get('strengths', ['Visual memory', 'Social interaction']))}
   - Areas for improvement: {', '.join(patient_details.get('improvement_areas', ['Short-term memory', 'Sequential tasks']))}
   - Interests to incorporate: {', '.join(patient_details.get('interests', ['Music', 'Family activities']))}

3. **Daily Care Recommendations:**
   - Schedule cognitive exercises during peak alertness hours (typically morning)
   - Maintain consistent daily routine to reduce anxiety
   - Incorporate physical activity appropriate for mobility level: {patient_details.get('mobility', 'Good')}
   - Ensure adequate rest between challenging cognitive tasks

4. **Communication Strategies:**
   - Use clear, simple language and allow extra processing time
   - Provide visual cues to supplement verbal instructions
   - Break complex tasks into smaller, manageable steps
   - Maintain patient and encouraging demeanor

5. **Warning Signs to Monitor:**
   - Sudden drops in cognitive performance scores
   - Increased frustration or agitation during exercises
   - Changes in sleep patterns or appetite
   - Withdrawal from previously enjoyed activities
   - Any behavioral changes that seem out of character

6. **Next Steps:**
   - Continue current cognitive training program
   - Schedule regular progress reviews every 2 weeks
   - Consider adjusting difficulty levels based on performance trends
   - Explore additional therapeutic activities based on interests

**Note:** These recommendations are based on cognitive assessment data and should be considered alongside medical advice from healthcare professionals.
"""
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating care recommendations: {str(e)}")
            return "Unable to generate recommendations at this time. Please try again later."
    
    @staticmethod
    def search_users(query: str, caregiver_id: str) -> List[Dict[str, Any]]:
        """Search for existing users who can be added as patients"""
        try:
            logger.info(f"Searching users with query: '{query}' for caregiver: {caregiver_id}")
            
            # Get caregiver record
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                logger.error(f"Caregiver not found for user_id: {caregiver_id}")
                return []
            
            logger.info(f"Found caregiver: {caregiver.id}")
            
            # Get users already assigned to this caregiver through the relationship table
            existing_patient_user_ids = db.session.query(Patient.user_id).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).subquery()
            
            # First, let's search for the exact email to see if it exists at all
            exact_email_user = db.session.query(User).filter(User.email == query).first()
            if exact_email_user:
                logger.info(f"Found exact email match: {exact_email_user.email}, user_type: {exact_email_user.user_type}, is_active: {exact_email_user.is_active}")
            else:
                logger.info(f"No exact email match found for: {query}")
            
            # Search for active patient users
            base_query = db.session.query(User).filter(
                and_(
                    User.user_type == 'patient',  # Only search for patients
                    User.id != caregiver_id,  # Exclude current caregiver
                    User.is_active == True
                )
            )
            
            logger.info(f"Base query found {base_query.count()} patient users")
            
            # Add search criteria
            search_query = base_query.filter(
                or_(
                    User.first_name.ilike(f'%{query}%'),
                    User.last_name.ilike(f'%{query}%'),
                    User.email.ilike(f'%{query}%'),
                    func.concat(User.first_name, ' ', User.last_name).ilike(f'%{query}%')
                )
            )
            
            logger.info(f"Search query found {search_query.count()} matching users")
            
            # Let's first see all matching users before filtering
            all_matching_users = search_query.all()
            for user in all_matching_users:
                logger.info(f"Matching user: {user.email} ({user.first_name} {user.last_name}), user_type: {user.user_type}")
                
                # Check if this user is already a patient of this caregiver
                existing_relationship = db.session.query(CaregiverPatient).join(
                    Patient, CaregiverPatient.patient_id == Patient.id
                ).filter(
                    and_(
                        Patient.user_id == user.id, 
                        CaregiverPatient.caregiver_id == caregiver.id,
                        CaregiverPatient.status == 'active'
                    )
                ).first()
                if existing_relationship:
                    logger.info(f"  -> Already assigned to this caregiver")
                else:
                    logger.info(f"  -> Not assigned to this caregiver")
            
            # For now, let's be more inclusive - allow any user_type for debugging
            # Filter to only include users who are not already patients of this caregiver
            final_query = search_query.filter(
                ~User.id.in_(existing_patient_user_ids)
            )
            
            users = final_query.limit(10).all()  # Limit results to 10
            
            logger.info(f"Final query returned {len(users)} users after excluding existing patients")
            
            result = []
            for user in users:
                result.append({
                    'id': user.id,
                    'name': f"{user.first_name} {user.last_name}",
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'created_at': user.created_at.isoformat()
                })
                logger.info(f"Found user: {user.email} ({user.first_name} {user.last_name})")
            
            return result
            
        except Exception as e:
            logger.error(f"Error searching users: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    @staticmethod
    def add_existing_patient(caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add an existing user as a patient to caregiver's care"""
        try:
            # Get caregiver record
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                logger.error(f"Caregiver not found: {caregiver_id}")
                return {'error': 'Caregiver not found', 'code': 'CAREGIVER_NOT_FOUND'}
            
            # Get the existing user
            user_id = data.get('user_id')
            user = db.session.query(User).filter(
                and_(
                    User.id == user_id,
                    User.user_type == 'patient',
                    User.is_active == True
                )
            ).first()
            
            if not user:
                logger.error(f"Patient user not found: {user_id}")
                return {'error': 'Patient user not found or inactive', 'code': 'USER_NOT_FOUND'}
            
            # Check if patient record exists for this user
            existing_patient = db.session.query(Patient).filter(Patient.user_id == user_id).first()
            
            if existing_patient:
                # Check if already assigned to this caregiver
                existing_relationship = db.session.query(CaregiverPatient).filter(
                    and_(
                        CaregiverPatient.patient_id == existing_patient.id,
                        CaregiverPatient.caregiver_id == caregiver.id,
                        CaregiverPatient.status == 'active'
                    )
                ).first()
                
                if existing_relationship:
                    logger.error(f"Patient {user_id} already assigned to caregiver {caregiver_id}")
                    return {'error': 'Patient is already assigned to this caregiver', 'code': 'ALREADY_ASSIGNED'}
                    
                # Patient exists but not assigned to this caregiver - update and use existing record
                patient = existing_patient
                # Update patient details if provided
                if data.get('age'):
                    patient.age = data.get('age')
                if data.get('gender'):
                    patient.gender = data.get('gender')
                if data.get('condition'):
                    patient.condition = data.get('condition')
                if data.get('notes'):
                    patient.notes = data.get('notes')
                    
                logger.info(f"Using existing patient record: {patient.id}")
                    
            else:
                # Create new patient record
                logger.info("Creating new patient record")
                patient = Patient(user_id=user.id)
                
                # Set optional fields if provided
                if data.get('age'):
                    patient.age = data.get('age')
                if data.get('gender'):
                    patient.gender = data.get('gender')
                if data.get('condition'):
                    patient.condition = data.get('condition')
                if data.get('notes'):
                    patient.notes = data.get('notes')
                else:
                    patient.notes = ''
                    
                # Set defaults for required fields
                patient.mobility_level = 'Good'
                patient.strengths = []
                patient.improvement_areas = []
                patient.interests = []
                
                db.session.add(patient)
                db.session.flush()  # Get the ID without committing
                logger.info(f"Created patient record: {patient.id}")
            
            # Create the caregiver-patient relationship
            logger.info(f"Creating relationship between caregiver {caregiver.id} and patient {patient.id}")
            relationship = CaregiverPatient(
                caregiver_id=caregiver.id,
                patient_id=patient.id,
                relationship_type='primary',
                status='active'
            )
            
            db.session.add(relationship)
            
            # Commit all changes
            db.session.commit()
            logger.info("Successfully committed patient and relationship")
            
            # Get patient stats for response
            total_sessions = db.session.query(func.count(GameSession.id)).filter(
                GameSession.player_id == user.id,
                GameSession.completed == True
            ).scalar() or 0
            
            avg_score = db.session.query(func.avg(GameSession.score)).filter(
                GameSession.player_id == user.id,
                GameSession.completed == True
            ).scalar() or 0
            
            latest_session = db.session.query(GameSession).filter(
                GameSession.player_id == user.id
            ).order_by(desc(GameSession.completed_at)).first()
            
            # Safe handling of last active date
            last_active = 'Never'
            if latest_session and latest_session.completed_at:
                last_active = latest_session.completed_at.strftime('%Y-%m-%d')
            
            return {
                'id': str(patient.id),
                'user_id': str(user.id),
                'name': f"{user.first_name} {user.last_name}",
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'age': patient.age,
                'gender': patient.gender,
                'condition': patient.condition,
                'lastActive': last_active,
                'progress': 0,  # Will be calculated over time
                'totalSessions': total_sessions,
                'averageScore': round(avg_score, 0) if avg_score else 0,
                'created_at': patient.created_at.isoformat() if patient.created_at else None
            }
            
        except Exception as e:
            logger.error(f"Error adding existing patient: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return {'error': 'Internal server error occurred while adding patient', 'code': 'INTERNAL_ERROR'}
    
    # ==================== AI-POWERED FEATURES ====================
    
    @staticmethod
    def analyze_patient_data(patient_id: str, caregiver_id: str) -> Dict[str, Any]:
        """Analyze patient data using AI"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'error': 'Caregiver not found', 'success': False}
            
            # Get patient
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return {'error': 'Patient not found or access denied', 'success': False}
            
            # Get comprehensive patient details for AI analysis
            patient_details = CaregiverService.get_patient_details(patient_id, caregiver_id)
            if not patient_details:
                return {'error': 'Unable to fetch patient details for analysis', 'success': False}
            
            # Use AI/LLM service for analysis
            try:
                import requests
                
                # Get API base URL
                api_base_url = "http://localhost:5000/api"  # TODO: Make this configurable
                
                # Prepare patient data for LLM analysis
                llm_payload = {
                    'patient_data': patient_details,
                    'provider': 'local'  # Use local Ollama by default
                }
                
                # Call LLM analysis endpoint
                response = requests.post(
                    f"{api_base_url}/llm/analyze-patient",
                    json=llm_payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    llm_result = response.json()
                    if llm_result.get('status') == 'success':
                        return {
                            'success': True,
                            'analysis': llm_result.get('analysis', {})
                        }
                
                # If LLM analysis fails, fall back to rule-based analysis
                logger.warning("LLM analysis failed, using fallback analysis")
                
            except Exception as llm_error:
                logger.error(f"LLM analysis error: {str(llm_error)}")
                logger.warning("Using fallback analysis due to LLM error")
            
            # Fallback: Generate analysis based on available patient data
            game_history = patient_details.get('game_history', [])
            
            # Analyze game performance
            if game_history:
                scores = [session.get('score', 0) for session in game_history]
                avg_score = sum(scores) / len(scores) if scores else 0
                recent_scores = scores[:5]
                
                # Determine trend
                if len(recent_scores) >= 2:
                    if recent_scores[0] > recent_scores[-1]:
                        trend = "improving"
                    elif recent_scores[0] < recent_scores[-1]:
                        trend = "declining"
                    else:
                        trend = "stable"
                else:
                    trend = "insufficient data"
                
                # Generate strengths and improvement areas based on performance
                cognitive_strengths = []
                improvement_areas = []
                
                if avg_score > 700:
                    cognitive_strengths.extend(["Strong problem solving", "Good attention to detail"])
                elif avg_score > 500:
                    cognitive_strengths.extend(["Consistent performance", "Good learning ability"])
                else:
                    improvement_areas.extend(["Processing speed", "Attention span"])
                
                if trend == "improving":
                    cognitive_strengths.append("Shows improvement over time")
                elif trend == "declining":
                    improvement_areas.append("Recent performance decline needs attention")
                
                progress_summary = f"Patient {patient_details.get('first_name', 'Patient')} (Age: {patient_details.get('age', 'Unknown')}, Condition: {patient_details.get('condition', 'Not specified')}) has completed {len(game_history)} sessions with an average score of {avg_score:.0f}. Performance trend: {trend}."
                
            else:
                cognitive_strengths = ["Motivated to participate in cognitive training"]
                improvement_areas = ["Needs to complete initial assessments"]
                progress_summary = f"Patient {patient_details.get('first_name', 'Patient')} has not yet completed cognitive exercises. Initial assessment recommended."
            
            return {
                'success': True,
                'analysis': {
                    'progress_summary': progress_summary,
                    'cognitive_strengths': cognitive_strengths,
                    'improvement_areas': improvement_areas,
                    'recommendations': [
                        "Continue regular cognitive exercise routine",
                        "Monitor progress weekly",
                        "Adjust difficulty based on performance"
                    ],
                    'caregiver_tips': [
                        "Provide positive reinforcement",
                        "Maintain consistent daily routine",
                        "Ensure adequate rest between sessions"
                    ],
                    'follow_up': [
                        "Schedule follow-up assessment in 2 weeks",
                        "Monitor for any behavioral changes",
                        "Review medication effectiveness if applicable"
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing patient data: {str(e)}")
            return {'error': 'Failed to analyze patient data', 'success': False}
    
    @staticmethod
    def generate_daily_plan(patient_id: str, caregiver_id: str, constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered daily care plan"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'error': 'Caregiver not found', 'success': False}
            
            # Get patient
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return {'error': 'Patient not found or access denied', 'success': False}
            
            # Get user info
            user = db.session.query(User).filter(User.id == patient.user_id).first()
            if not user:
                return {'error': 'Patient user not found', 'success': False}
            
            # TODO: Implement actual AI plan generation
            # For now, return a structured plan based on patient data and constraints
            plan = {
                'morning_routine': [
                    "7:00 AM - Wake up, gentle orientation",
                    "7:30 AM - Medication with breakfast",
                    "8:00 AM - Personal hygiene",
                    "8:30 AM - Light exercises"
                ],
                'cognitive_exercises': [
                    "9:00 AM - Memory games (15 minutes)",
                    "11:00 AM - Pattern recognition (10 minutes)",
                    "2:00 PM - Problem solving activities (15 minutes)"
                ],
                'physical_activities': [
                    "9:30 AM - Walking (15 minutes)",
                    "3:30 PM - Stretching exercises",
                    "5:00 PM - Balance activities"
                ],
                'meals': [
                    "7:30 AM - Breakfast",
                    "12:00 PM - Lunch", 
                    "3:00 PM - Snack",
                    "6:00 PM - Dinner"
                ],
                'therapy_sessions': [
                    "10:30 AM - Cognitive therapy (20 minutes)",
                    "4:00 PM - Social interaction"
                ],
                'social_engagement': [
                    "1:00 PM - Family video call",
                    "7:00 PM - Conversation time"
                ],
                'evening_routine': [
                    "7:30 PM - Wind down activities",
                    "8:00 PM - Evening medication",
                    "9:00 PM - Relaxation time",
                    "9:30 PM - Bedtime preparation"
                ],
                'caregiver_breaks': [
                    "10:30 AM - 15 minute break",
                    "1:30 PM - 30 minute break",
                    "7:00 PM - Evening break"
                ]
            }
            
            return {
                'success': True,
                'plan': plan
            }
            
        except Exception as e:
            logger.error(f"Error generating daily plan: {str(e)}")
            return {'error': 'Failed to generate daily plan', 'success': False}
    
    @staticmethod
    def get_patient_context(patient_id: str, caregiver_id: str) -> Dict[str, Any]:
        """Get patient context for AI assistant"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'error': 'Caregiver not found', 'success': False}
            
            # Get patient
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return {'error': 'Patient not found or access denied', 'success': False}
            
            # Get user info
            user = db.session.query(User).filter(User.id == patient.user_id).first()
            if not user:
                return {'error': 'Patient user not found', 'success': False}
            
            # Gather comprehensive context data
            context = {
                'patient_info': {
                    'name': f"{user.first_name} {user.last_name}",
                    'age': patient.age,
                    'condition': patient.condition or 'Not specified',
                    'mobility_level': patient.mobility_level or 'Not specified',
                    'strengths': patient.strengths or [],
                    'improvement_areas': patient.improvement_areas or [],
                    'interests': patient.interests or []
                },
                'all_notes': [],
                'all_medications': [],
                'all_appointments': [],
                'all_mood_entries': [],
                'complete_game_data': {},
                'daily_plans': []
            }
            
            # Get ALL notes
            all_notes = db.session.query(PatientNote).filter(
                and_(
                    PatientNote.patient_id == patient.id,
                    PatientNote.caregiver_id == caregiver.id
                )
            ).order_by(PatientNote.created_at.desc()).all()
            
            context['all_notes'] = [
                {
                    'date': note.created_at.isoformat() if note.created_at else None,
                    'category': note.category,
                    'content': note.content,
                    'priority': getattr(note, 'priority', None)
                }
                for note in all_notes
            ]
            
            # Get ALL medications (active and inactive)
            all_medications = db.session.query(Medication).filter(
                Medication.patient_id == patient.id
            ).order_by(Medication.start_date.desc()).all()
            
            context['all_medications'] = [
                {
                    'name': med.name,
                    'generic_name': med.generic_name,
                    'dosage': med.dosage,
                    'frequency': med.frequency,
                    'times': med.times,
                    'status': med.status,
                    'start_date': med.start_date.isoformat() if med.start_date else None,
                    'end_date': med.end_date.isoformat() if med.end_date else None,
                    'prescriber': med.prescriber,
                    'side_effects': med.side_effects or [],
                    'contraindications': med.contraindications or []
                }
                for med in all_medications
            ]
            
            # Get ALL appointments
            all_appointments = db.session.query(Appointment).filter(
                Appointment.patient_id == patient.id
            ).order_by(Appointment.appointment_date.desc()).all()
            
            context['all_appointments'] = [
                {
                    'title': apt.title,
                    'type': apt.appointment_type,
                    'provider': apt.provider_name,
                    'specialty': apt.provider_specialty,
                    'date': apt.appointment_date.isoformat() if apt.appointment_date else None,
                    'location': apt.location,
                    'status': apt.status,
                    'priority': apt.priority,
                    'preparation_notes': apt.preparation_notes,
                    'summary': apt.summary,
                    'diagnosis_notes': apt.diagnosis_notes,
                    'treatment_plan': apt.treatment_plan,
                    'follow_up_required': apt.follow_up_required,
                    'follow_up_date': apt.follow_up_date.isoformat() if apt.follow_up_date else None
                }
                for apt in all_appointments
            ]
            
            # Get ALL mood entries
            all_moods = db.session.query(MoodEntry).filter(
                MoodEntry.patient_id == patient.id
            ).order_by(MoodEntry.entry_date.desc()).all()
            
            context['all_mood_entries'] = [
                {
                    'date': mood.entry_date.isoformat() if mood.entry_date else None,
                    'mood_rating': mood.mood_rating,
                    'energy_level': mood.energy_level,
                    'anxiety_level': mood.anxiety_level,
                    'sleep_quality': mood.sleep_quality,
                    'appetite': mood.appetite,
                    'social_interaction': mood.social_interaction,
                    'symptoms': mood.symptoms or [],
                    'factors': mood.factors or [],
                    'notes': mood.notes
                }
                for mood in all_moods
            ]
            
            # Get ALL game data and activity
            from app.models.game import GameSession, Game
            all_sessions = db.session.query(GameSession).filter(
                GameSession.user_id == patient.user_id
            ).order_by(GameSession.created_at.desc()).all()
            
            # Get game details
            games = db.session.query(Game).all()
            games_dict = {game.id: game.name for game in games}
            
            context['complete_game_data'] = {
                'total_sessions': len(all_sessions),
                'all_sessions': [
                    {
                        'game_name': games_dict.get(session.game_id, 'Unknown Game'),
                        'score': session.final_score,
                        'duration': session.duration_seconds,
                        'difficulty': session.difficulty,
                        'completed': session.completed,
                        'date': session.created_at.isoformat() if session.created_at else None,
                        'session_data': session.session_data
                    }
                    for session in all_sessions
                ],
                'games_played': list(set(games_dict.get(session.game_id, 'Unknown') for session in all_sessions)),
                'average_scores': {},
                'progress_trends': {}
            }
            
            # Calculate average scores and trends by game
            from collections import defaultdict
            scores_by_game = defaultdict(list)
            for session in all_sessions:
                game_name = games_dict.get(session.game_id, 'Unknown')
                if session.final_score is not None:
                    scores_by_game[game_name].append(session.final_score)
            
            for game_name, scores in scores_by_game.items():
                if scores:
                    context['complete_game_data']['average_scores'][game_name] = sum(scores) / len(scores)
                    context['complete_game_data']['progress_trends'][game_name] = {
                        'best_score': max(scores),
                        'latest_scores': scores[:5],  # Last 5 scores
                        'total_sessions': len(scores)
                    }
            
            # Get ALL daily plans and routines
            all_routines = db.session.query(PatientRoutine).filter(
                PatientRoutine.patient_id == patient.id
            ).order_by(PatientRoutine.created_at.desc()).all()
            
            context['daily_plans'] = [
                {
                    'routine_type': routine.routine_type,
                    'activities': routine.activities,
                    'date': routine.created_at.isoformat() if routine.created_at else None,
                    'notes': getattr(routine, 'notes', None)
                }
                for routine in all_routines
            ]
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting patient context: {str(e)}")
            return {'error': 'Failed to get patient context', 'success': False}
    
    # ==================== MEDICATION MANAGEMENT ====================
    
    @staticmethod
    def get_patient_medications(patient_id: str, caregiver_id: str) -> List[Dict[str, Any]]:
        """Get all medications for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return []
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return []
            
            # Get medications for this patient
            medications = db.session.query(Medication).filter(
                and_(
                    Medication.patient_id == patient_id,
                    Medication.status == 'active'
                )
            ).order_by(Medication.name).all()
            
            result = []
            for medication in medications:
                # Get latest medication log to determine last taken and next due
                latest_log = db.session.query(MedicationLog).filter(
                    MedicationLog.medication_id == medication.id,
                    MedicationLog.status == 'given'
                ).order_by(desc(MedicationLog.administered_time)).first()
                
                # Get next scheduled dose
                next_scheduled = db.session.query(MedicationLog).filter(
                    MedicationLog.medication_id == medication.id,
                    MedicationLog.status == 'scheduled',
                    MedicationLog.scheduled_time > datetime.utcnow()
                ).order_by(MedicationLog.scheduled_time).first()
                
                medication_data = medication.to_dict()
                medication_data.update({
                    'last_taken': latest_log.administered_time.strftime('%Y-%m-%d %H:%M') if latest_log and latest_log.administered_time else 'Never',
                    'next_due': next_scheduled.scheduled_time.strftime('%Y-%m-%d %H:%M') if next_scheduled else 'Not scheduled'
                })
                
                result.append(medication_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting patient medications: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    @staticmethod
    def add_patient_medication(patient_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a medication for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return None
            
            # Create new medication
            medication = Medication(
                patient_id=patient_id,
                caregiver_id=caregiver.id,
                name=data.get('name'),
                generic_name=data.get('generic_name'),
                dosage=data.get('dosage'),
                unit=data.get('unit', 'mg'),
                frequency=data.get('frequency'),
                route=data.get('route', 'oral'),
                times=data.get('times', [data.get('time', '08:00')]) if isinstance(data.get('times'), list) else [data.get('time', '08:00')],
                instructions=data.get('instructions', ''),
                prescriber=data.get('prescriber'),
                prescription_number=data.get('prescription_number'),
                refills_remaining=data.get('refills_remaining', 0),
                side_effects=data.get('side_effects', []),
                contraindications=data.get('contraindications', [])
            )
            
            db.session.add(medication)
            db.session.commit()
            db.session.refresh(medication)
            
            # Create initial scheduled doses for the next 30 days
            CaregiverService._create_medication_schedule(medication)
            
            return medication.to_dict()
            
        except Exception as e:
            logger.error(f"Error adding patient medication: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def update_patient_medication(patient_id: str, medication_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a patient medication"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Get medication and verify access
            medication = db.session.query(Medication).filter(
                and_(
                    Medication.id == medication_id,
                    Medication.patient_id == patient_id,
                    Medication.caregiver_id == caregiver.id
                )
            ).first()
            
            if not medication:
                return None
            
            # Update medication fields
            if 'name' in data:
                medication.name = data['name']
            if 'generic_name' in data:
                medication.generic_name = data['generic_name']
            if 'dosage' in data:
                medication.dosage = data['dosage']
            if 'unit' in data:
                medication.unit = data['unit']
            if 'frequency' in data:
                medication.frequency = data['frequency']
            if 'route' in data:
                medication.route = data['route']
            if 'times' in data:
                medication.times = data['times'] if isinstance(data['times'], list) else [data['times']]
            if 'instructions' in data:
                medication.instructions = data['instructions']
            if 'status' in data:
                medication.status = data['status']
            if 'prescriber' in data:
                medication.prescriber = data['prescriber']
            if 'prescription_number' in data:
                medication.prescription_number = data['prescription_number']
            if 'refills_remaining' in data:
                medication.refills_remaining = data['refills_remaining']
            if 'side_effects' in data:
                medication.side_effects = data['side_effects']
            if 'contraindications' in data:
                medication.contraindications = data['contraindications']
            
            medication.updated_at = datetime.utcnow()
            
            # If times changed, recreate schedule
            if 'times' in data and data['times'] != medication.times:
                # Delete future scheduled doses
                db.session.query(MedicationLog).filter(
                    and_(
                        MedicationLog.medication_id == medication_id,
                        MedicationLog.status == 'scheduled',
                        MedicationLog.scheduled_time > datetime.utcnow()
                    )
                ).delete()
                
                # Create new schedule
                CaregiverService._create_medication_schedule(medication)
            
            db.session.commit()
            
            return medication.to_dict()
            
        except Exception as e:
            logger.error(f"Error updating patient medication: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def delete_patient_medication(patient_id: str, medication_id: str, caregiver_id: str) -> bool:
        """Delete a patient medication"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Get medication and verify access
            medication = db.session.query(Medication).filter(
                and_(
                    Medication.id == medication_id,
                    Medication.patient_id == patient_id,
                    Medication.caregiver_id == caregiver.id
                )
            ).first()
            
            if not medication:
                return False
            
            # Soft delete by setting status to 'discontinued'
            medication.status = 'discontinued'
            medication.end_date = datetime.utcnow()
            medication.updated_at = datetime.utcnow()
            
            # Cancel future scheduled doses
            db.session.query(MedicationLog).filter(
                and_(
                    MedicationLog.medication_id == medication_id,
                    MedicationLog.status == 'scheduled',
                    MedicationLog.scheduled_time > datetime.utcnow()
                )
            ).update({'status': 'cancelled'})
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error deleting patient medication: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def optimize_medications(patient_id: str, caregiver_id: str) -> Dict[str, Any]:
        """Generate medication optimization recommendations"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'error': 'Caregiver not found', 'success': False}
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return {'error': 'Patient not found or access denied', 'success': False}
            
            # TODO: Implement actual AI optimization
            # For now, return sample optimization recommendations
            return {
                'success': True,
                'optimization': {
                    'recommendations': [
                        'Consider adjusting Donepezil timing to evening to reduce side effects',
                        'Monitor for drug interactions between current medications',
                        'Ensure adequate spacing between doses'
                    ],
                    'interactions': [
                        'No significant interactions detected'
                    ],
                    'timing_suggestions': [
                        'Donepezil: Take with dinner instead of breakfast',
                        'Memantine: Maintain current schedule'
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Error optimizing medications: {str(e)}")
            return {'error': 'Failed to optimize medications', 'success': False}
    
    # ==================== APPOINTMENT MANAGEMENT ====================
    
    @staticmethod
    def get_patient_appointments(patient_id: str, caregiver_id: str) -> List[Dict[str, Any]]:
        """Get all appointments for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return []
            
            # Verify patient access and get appointments
            appointments = db.session.query(Appointment).join(
                Patient, Appointment.patient_id == Patient.id
            ).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Appointment.patient_id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).order_by(Appointment.appointment_date).all()
            
            return [appointment.to_dict() for appointment in appointments]
            
        except Exception as e:
            logger.error(f"Error getting patient appointments: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    @staticmethod
    def add_patient_appointment(patient_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add an appointment for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return None
            
            # Parse date and time into a single datetime
            appointment_date_str = f"{data.get('date')} {data.get('time', '09:00')}"
            appointment_datetime = datetime.strptime(appointment_date_str, '%Y-%m-%d %H:%M')
            
            # Create new appointment
            appointment = Appointment(
                patient_id=patient.id,
                caregiver_id=caregiver.id,
                title=data.get('title', ''),
                appointment_type=data.get('type', 'consultation'),
                appointment_date=appointment_datetime,
                duration_minutes=data.get('duration', 30),
                location=data.get('location', ''),
                provider_name=data.get('doctor', ''),
                provider_specialty=data.get('specialty', ''),
                preparation_notes=data.get('notes', ''),
                status='upcoming'
            )
            
            db.session.add(appointment)
            db.session.commit()
            db.session.refresh(appointment)
            
            return appointment.to_dict()
            
        except Exception as e:
            logger.error(f"Error adding patient appointment: {str(e)}")
            return None
    
    @staticmethod
    def update_patient_appointment(patient_id: str, appointment_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a patient appointment"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return None
            
            # Get the existing appointment
            appointment = db.session.query(Appointment).filter(
                and_(
                    Appointment.id == appointment_id,
                    Appointment.patient_id == patient.id,
                    Appointment.caregiver_id == caregiver.id
                )
            ).first()
            
            if not appointment:
                return None
            
            # Parse date and time if provided
            if data.get('date') and data.get('time'):
                appointment_date_str = f"{data.get('date')} {data.get('time')}"
                appointment.appointment_date = datetime.strptime(appointment_date_str, '%Y-%m-%d %H:%M')
            
            # Update appointment fields
            if 'title' in data:
                appointment.title = data['title']
            if 'doctor' in data:
                appointment.provider_name = data['doctor']
            if 'specialty' in data:
                appointment.provider_specialty = data['specialty']
            if 'location' in data:
                appointment.location = data['location']
            if 'notes' in data:
                appointment.preparation_notes = data['notes']
            if 'status' in data:
                appointment.status = data['status']
            if 'type' in data:
                appointment.appointment_type = data['type']
            
            appointment.updated_at = datetime.utcnow()
            
            db.session.commit()
            db.session.refresh(appointment)
            
            return appointment.to_dict()
            
        except Exception as e:
            logger.error(f"Error updating patient appointment: {str(e)}")
            return None
    
    @staticmethod
    def delete_patient_appointment(patient_id: str, appointment_id: str, caregiver_id: str) -> bool:
        """Delete a patient appointment"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return False
            
            # Get the appointment to delete
            appointment = db.session.query(Appointment).filter(
                and_(
                    Appointment.id == appointment_id,
                    Appointment.patient_id == patient.id,
                    Appointment.caregiver_id == caregiver.id
                )
            ).first()
            
            if not appointment:
                return False
            
            # Delete the appointment
            db.session.delete(appointment)
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting patient appointment: {str(e)}")
            return False
    
    @staticmethod
    def update_appointment_status(patient_id: str, appointment_id: str, caregiver_id: str, status: str) -> bool:
        """Update appointment status"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return False
            
            # Get the existing appointment
            appointment = db.session.query(Appointment).filter(
                and_(
                    Appointment.id == appointment_id,
                    Appointment.patient_id == patient.id,
                    Appointment.caregiver_id == caregiver.id
                )
            ).first()
            
            if not appointment:
                return False
            
            # Update appointment status
            appointment.status = status
            appointment.updated_at = datetime.utcnow()
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error updating appointment status: {str(e)}")
            return False
    
    @staticmethod
    def update_appointment_summary(patient_id: str, appointment_id: str, caregiver_id: str, summary: str) -> Optional[Dict[str, Any]]:
        """Update appointment summary"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return False
            
            # Get the existing appointment
            appointment = db.session.query(Appointment).filter(
                and_(
                    Appointment.id == appointment_id,
                    Appointment.patient_id == patient.id,
                    Appointment.caregiver_id == caregiver.id
                )
            ).first()
            
            if not appointment:
                return False
            
            # Update appointment summary
            appointment.summary = summary
            appointment.updated_at = datetime.utcnow()
            
            db.session.commit()
            db.session.refresh(appointment)
            
            return appointment.to_dict()
            
        except Exception as e:
            logger.error(f"Error updating appointment summary: {str(e)}")
            return None
    
    @staticmethod
    def generate_appointment_preparation(patient_id: str, appointment_id: str, caregiver_id: str) -> Dict[str, Any]:
        """Generate AI preparation for appointments"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'error': 'Caregiver not found', 'success': False}
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return {'error': 'Patient not found or access denied', 'success': False}
            
            # TODO: Implement actual AI preparation
            # For now, return sample preparation
            return {
                'success': True,
                'preparation': {
                    'questions_to_ask': [
                        'How has the patient been sleeping?',
                        'Any changes in mood or behavior?',
                        'Medication compliance status?'
                    ],
                    'documents_needed': [
                        'Recent medication list',
                        'Cognitive assessment results',
                        'Progress notes'
                    ],
                    'key_concerns': [
                        'Memory decline progression',
                        'Medication effectiveness',
                        'Safety concerns'
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating appointment preparation: {str(e)}")
            return {'error': 'Failed to generate preparation', 'success': False}
    
    # ==================== MOOD TRACKING ====================
    
    @staticmethod
    def get_mood_tracking(patient_id: str, caregiver_id: str) -> List[Dict[str, Any]]:
        """Get mood tracking data for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return []
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return []
            
            # Get mood entries from database
            mood_entries = db.session.query(MoodEntry).filter(
                MoodEntry.patient_id == patient.id
            ).order_by(desc(MoodEntry.observation_datetime)).all()
            
            # Transform to match frontend expectations
            result = []
            for entry in mood_entries:
                result.append({
                    'id': str(entry.id),
                    'mood': entry.mood,
                    'notes': entry.notes or '',
                    'symptoms': entry.triggers or [],  # Map triggers to symptoms for frontend
                    'factors': entry.interventions_used or [],  # Map interventions to factors
                    'timestamp': entry.observation_datetime.isoformat() if entry.observation_datetime else None
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting mood tracking: {str(e)}")
            return []
    
    @staticmethod
    def add_mood_entry(patient_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a mood entry for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return None
            
            # Parse timestamp if it's a string
            timestamp = data.get('timestamp')
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except:
                    timestamp = datetime.utcnow()
            elif timestamp is None:
                timestamp = datetime.utcnow()
            
            # Get caregiver ID for the entry
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            
            # Create a new mood entry in the database using the existing model structure
            mood_entry = MoodEntry(
                patient_id=patient.id,
                caregiver_id=caregiver.id,
                mood=data.get('mood', 'neutral'),
                notes=data.get('notes', ''),
                triggers=data.get('symptoms', []),  # Map symptoms to triggers
                interventions_used=data.get('factors', []),  # Map factors to interventions
                observation_datetime=timestamp
            )
            
            db.session.add(mood_entry)
            db.session.commit()
            
            # Return in the format the frontend expects
            return {
                'id': str(mood_entry.id),
                'mood': mood_entry.mood,
                'notes': mood_entry.notes or '',
                'symptoms': mood_entry.triggers or [],
                'factors': mood_entry.interventions_used or [],
                'timestamp': mood_entry.observation_datetime.isoformat() if mood_entry.observation_datetime else None
            }
            
        except Exception as e:
            logger.error(f"Error adding mood entry: {str(e)}")
            return None
    
    # ==================== PATIENT NOTES ====================
    
    @staticmethod
    def get_patient_notes(patient_id: str, caregiver_id: str) -> List[Dict[str, Any]]:
        """Get all notes for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return []
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return []
            
            # Get actual notes from database
            notes = db.session.query(PatientNote).filter(
                PatientNote.patient_id == patient_id
            ).order_by(desc(PatientNote.created_at)).all()
            
            result = []
            for note in notes:
                result.append({
                    'id': str(note.id),
                    'date': note.created_at.strftime('%Y-%m-%d'),
                    'time': note.created_at.strftime('%H:%M'),
                    'type': note.note_type or 'observation',
                    'category': note.category or 'general',
                    'content': note.content,
                    'urgency': note.urgency or 'normal',
                    'tags': note.tags or []
                })
                
            return result
            
        except Exception as e:
            logger.error(f"Error getting patient notes: {str(e)}")
            return []
    
    @staticmethod
    def add_patient_note(patient_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a note for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return None
            
            # Create actual note in database
            note = PatientNote(
                patient_id=patient_id,
                caregiver_id=caregiver.id,
                content=data.get('content', ''),
                note_type=data.get('type', 'observation'),
                category=data.get('category', 'general'),
                urgency=data.get('urgency', 'normal'),
                tags=data.get('tags', []),
                created_at=datetime.now()
            )
            
            db.session.add(note)
            db.session.commit()
            
            return {
                'id': str(note.id),
                'date': note.created_at.strftime('%Y-%m-%d'),
                'time': note.created_at.strftime('%H:%M'),
                'type': note.note_type,
                'category': note.category,
                'content': note.content,
                'urgency': note.urgency,
                'tags': note.tags
            }
            
        except Exception as e:
            logger.error(f"Error adding patient note: {str(e)}")
            return None
    
    @staticmethod
    def update_patient_note(patient_id: str, note_id: str, caregiver_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a note for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return None
            
            # Find and update the note
            note = db.session.query(PatientNote).filter(
                and_(
                    PatientNote.id == note_id,
                    PatientNote.patient_id == patient_id,
                    PatientNote.caregiver_id == caregiver.id
                )
            ).first()
            
            if not note:
                return None
                
            # Update note fields
            note.content = data.get('content', note.content)
            note.note_type = data.get('type', note.note_type)
            note.category = data.get('category', note.category)
            note.urgency = data.get('urgency', note.urgency)
            note.tags = data.get('tags', note.tags)
            
            db.session.commit()
            
            return {
                'id': str(note.id),
                'date': note.created_at.strftime('%Y-%m-%d'),
                'time': note.created_at.strftime('%H:%M'),
                'type': note.note_type,
                'category': note.category,
                'content': note.content,
                'urgency': note.urgency,
                'tags': note.tags
            }
            
        except Exception as e:
            logger.error(f"Error updating patient note: {str(e)}")
            return None
    
    @staticmethod
    def delete_patient_note(patient_id: str, note_id: str, caregiver_id: str) -> bool:
        """Delete a note for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return False
            
            # Find and delete the note
            note = db.session.query(PatientNote).filter(
                and_(
                    PatientNote.id == note_id,
                    PatientNote.patient_id == patient_id,
                    PatientNote.caregiver_id == caregiver.id
                )
            ).first()
            
            if not note:
                return False
                
            db.session.delete(note)
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting patient note: {str(e)}")
            return False
    
    # ==================== HELPER METHODS ====================
    
    @staticmethod
    def _create_medication_schedule(medication: Medication, days_ahead: int = 30):
        """Create scheduled medication logs for the next N days"""
        try:
            current_date = datetime.now().date()
            
            for day in range(days_ahead):
                schedule_date = current_date + timedelta(days=day)
                
                # Create schedule for each time in the medication times
                for time_str in medication.times:
                    try:
                        # Parse time string (format: "HH:MM")
                        hour, minute = map(int, time_str.split(':'))
                        schedule_datetime = datetime.combine(schedule_date, datetime.min.time().replace(hour=hour, minute=minute))
                        
                        # Only create future schedules
                        if schedule_datetime > datetime.now():
                            med_log = MedicationLog(
                                medication_id=medication.id,
                                patient_id=medication.patient_id,
                                scheduled_time=schedule_datetime,
                                status='scheduled'
                            )
                            db.session.add(med_log)
                    
                    except ValueError as e:
                        logger.error(f"Error parsing time {time_str}: {str(e)}")
                        continue
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error creating medication schedule: {str(e)}")
            db.session.rollback()
    
    @staticmethod
    def setup_caregiver_patient_relationships():
        """Fix missing caregiver-patient relationships for existing data"""
        try:
            # Find all caregivers
            caregivers = db.session.query(Caregiver).all()
            
            for caregiver in caregivers:
                logger.info(f"Setting up relationships for caregiver: {caregiver.id}")
                
                # Get user for this caregiver
                caregiver_user = db.session.query(User).filter(User.id == caregiver.user_id).first()
                if not caregiver_user:
                    continue
                
                # Find patients that might belong to this caregiver
                # For now, assign all patients to all caregivers (can be refined later)
                patients = db.session.query(Patient).all()
                
                for patient in patients:
                    # Check if relationship already exists
                    existing = db.session.query(CaregiverPatient).filter(
                        and_(
                            CaregiverPatient.caregiver_id == caregiver.id,
                            CaregiverPatient.patient_id == patient.id
                        )
                    ).first()
                    
                    if not existing:
                        # Create relationship
                        relationship = CaregiverPatient(
                            caregiver_id=caregiver.id,
                            patient_id=patient.id,
                            relationship_type='primary',
                            status='active'
                        )
                        db.session.add(relationship)
                        logger.info(f"Created relationship: caregiver {caregiver.id} -> patient {patient.id}")
            
            db.session.commit()
            logger.info("Successfully set up caregiver-patient relationships")
            
        except Exception as e:
            logger.error(f"Error setting up caregiver-patient relationships: {str(e)}")
            db.session.rollback()
    
    @staticmethod
    def debug_caregiver_data(caregiver_id: str):
        """Debug function to check caregiver data"""
        try:
            logger.info(f"=== DEBUG CAREGIVER DATA for {caregiver_id} ===")
            
            # Check if user exists
            user = db.session.query(User).filter(User.id == caregiver_id).first()
            logger.info(f"User found: {user.email if user else 'NOT FOUND'} - Role: {user.user_type if user else 'N/A'}")
            
            # Check if caregiver record exists
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            logger.info(f"Caregiver record found: {caregiver.id if caregiver else 'NOT FOUND'}")
            
            if caregiver:
                # Check relationships
                relationships = db.session.query(CaregiverPatient).filter(
                    CaregiverPatient.caregiver_id == caregiver.id
                ).all()
                logger.info(f"Caregiver-patient relationships: {len(relationships)}")
                
                for rel in relationships:
                    patient = db.session.query(Patient).filter(Patient.id == rel.patient_id).first()
                    patient_user = db.session.query(User).filter(User.id == patient.user_id).first() if patient else None
                    logger.info(f"  -> Patient {rel.patient_id} ({patient_user.email if patient_user else 'NO USER'}) - Status: {rel.status}")
            
            # Check all patients in system
            all_patients = db.session.query(Patient).all()
            logger.info(f"Total patients in system: {len(all_patients)}")
            
            # Check all caregivers in system  
            all_caregivers = db.session.query(Caregiver).all()
            logger.info(f"Total caregivers in system: {len(all_caregivers)}")
            
        except Exception as e:
            logger.error(f"Error debugging caregiver data: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
    
    @staticmethod
    def get_patient_routines(patient_id: str, caregiver_id: str, routine_type: str) -> List[Dict[str, Any]]:
        """Get routine activities for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return []

            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()

            if not patient:
                return []

            # Get routines from database
            routines = db.session.query(PatientRoutine).filter(
                and_(
                    PatientRoutine.patient_id == patient_id,
                    PatientRoutine.caregiver_id == caregiver.id,
                    PatientRoutine.routine_type == routine_type
                )
            ).order_by(PatientRoutine.scheduled_time).all()

            logger.info(f"Found {len(routines)} routines for patient {patient_id}, type: {routine_type}")
            return [routine.to_dict() for routine in routines]
            
        except Exception as e:
            logger.error(f"Error getting patient routines: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    @staticmethod
    def save_patient_routine(patient_id: str, caregiver_id: str, routine_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save routine activities for a patient"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return None

            # Verify patient access
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()

            if not patient:
                return None

            routine_type = routine_data.get('routine_type')
            activities = routine_data.get('activities', [])
            
            logger.info(f"Saving {len(activities)} activities for patient {patient_id}, routine type: {routine_type}")

            # Delete existing routines for this type to replace them
            db.session.query(PatientRoutine).filter(
                and_(
                    PatientRoutine.patient_id == patient_id,
                    PatientRoutine.caregiver_id == caregiver.id,
                    PatientRoutine.routine_type == routine_type
                )
            ).delete()
            
            # Save new routines
            saved_routines = []
            for activity_data in activities:
                try:
                    # Parse the scheduled time
                    scheduled_time_str = activity_data.get('scheduled_time', '08:00')
                    if scheduled_time_str:
                        # Convert string time to time object
                        from datetime import datetime as dt
                        scheduled_time = dt.strptime(scheduled_time_str, '%H:%M').time()
                    else:
                        scheduled_time = dt.strptime('08:00', '%H:%M').time()
                    
                    routine = PatientRoutine(
                        patient_id=patient_id,
                        caregiver_id=caregiver.id,
                        routine_type=routine_type,
                        name=activity_data.get('name', ''),
                        description=activity_data.get('description', ''),
                        scheduled_time=scheduled_time,
                        duration_minutes=activity_data.get('duration_minutes', 30),
                        priority=activity_data.get('priority', 'normal'),
                        is_required=activity_data.get('is_required', True),
                        completion_status=activity_data.get('completion_status', 'pending'),
                        notes=activity_data.get('notes', '')
                    )
                    
                    # Handle completed_at if activity is completed
                    if activity_data.get('completed_at'):
                        routine.completed_at = datetime.fromisoformat(activity_data['completed_at'].replace('Z', '+00:00'))
                    
                    db.session.add(routine)
                    db.session.flush()  # Get the ID
                    saved_routines.append(routine.to_dict())
                    
                except Exception as activity_error:
                    logger.error(f"Error saving activity {activity_data.get('name', 'Unknown')}: {str(activity_error)}")
                    continue
            
            db.session.commit()
            logger.info(f"Successfully saved {len(saved_routines)} routine activities")
            
            return {
                'id': f"routine_batch_{datetime.now().timestamp()}",
                'patient_id': patient_id,
                'routine_type': routine_type,
                'activities': saved_routines,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error saving patient routine: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return None
    
    @staticmethod
    def update_patient_settings(patient_id: str, caregiver_id: str, settings_data: Dict[str, Any]) -> bool:
        """Update patient settings and information"""
        try:
            # Verify caregiver has access
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return False
            
            # Verify caregiver has access to this patient through the relationship table
            patient = db.session.query(Patient).join(
                CaregiverPatient, Patient.id == CaregiverPatient.patient_id
            ).filter(
                and_(
                    Patient.id == patient_id,
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not patient:
                return False
            
            # Get the user associated with this patient
            user = db.session.query(User).filter(User.id == patient.user_id).first()
            if not user:
                return False
            
            # Update user information if provided
            if 'first_name' in settings_data:
                user.first_name = settings_data['first_name']
            if 'last_name' in settings_data:
                user.last_name = settings_data['last_name']
            
            # Update patient information
            if 'age' in settings_data:
                patient.age = settings_data['age']
            if 'gender' in settings_data:
                patient.gender = settings_data['gender']
            if 'condition' in settings_data:
                patient.condition = settings_data['condition']
            if 'additional_notes' in settings_data:
                patient.notes = settings_data['additional_notes']
            
            # Handle settings data
            settings = settings_data.get('settings', {})
            if settings:
                # Update the preferences field with the settings
                current_preferences = patient.preferences or {}
                current_preferences.update(settings)
                patient.preferences = current_preferences
            
            patient.updated_at = datetime.utcnow()
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error updating patient settings: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return False
    
    @staticmethod
    def _get_patient_medications_for_details(patient_id: str) -> List[Dict[str, Any]]:
        """Get medications for patient details view"""
        try:
            medications = db.session.query(Medication).filter(
                and_(
                    Medication.patient_id == patient_id,
                    Medication.status == 'active'
                )
            ).order_by(Medication.name).all()
            
            result = []
            for med in medications:
                result.append({
                    'id': str(med.id),
                    'name': med.name,
                    'generic_name': med.generic_name,
                    'dosage': med.dosage,
                    'frequency': med.frequency,
                    'times': med.times or [],
                    'route': med.route,
                    'prescriber': med.prescriber,
                    'start_date': med.start_date.isoformat() if med.start_date else None,
                    'status': med.status
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting patient medications for details: {str(e)}")
            return []
    
    @staticmethod
    def _get_patient_appointments_for_details(patient_id: str) -> List[Dict[str, Any]]:
        """Get appointments for patient details view"""
        try:
            appointments = db.session.query(Appointment).filter(
                Appointment.patient_id == patient_id
            ).order_by(Appointment.appointment_date.desc()).limit(10).all()
            
            result = []
            for apt in appointments:
                result.append({
                    'id': str(apt.id),
                    'title': apt.title,
                    'date': apt.appointment_date.isoformat() if apt.appointment_date else None,
                    'provider_name': apt.provider_name,
                    'appointment_type': apt.appointment_type,
                    'status': apt.status,
                    'location': apt.location
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting patient appointments for details: {str(e)}")
            return []