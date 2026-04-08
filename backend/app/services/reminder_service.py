import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, time
from sqlalchemy import and_, or_
from app.database import db
from app.models.reminder import Reminder, ReminderLog
from app.models.caregiver import Caregiver, CaregiverPatient
from app.models.patient import Patient
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReminderService:
    
    @staticmethod
    def get_patient_reminders(patient_id: str, caregiver_id: str) -> Dict[str, Any]:
        """Get all reminders for a specific patient"""
        try:
            # Verify caregiver has access to this patient
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'success': False, 'error': 'Caregiver not found'}
            
            # Verify caregiver-patient relationship
            relationship = db.session.query(CaregiverPatient).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.patient_id == patient_id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not relationship:
                return {'success': False, 'error': 'Access denied to patient reminders'}
            
            # Get all reminders for this patient created by this caregiver
            reminders = db.session.query(Reminder).filter(
                and_(
                    Reminder.patient_id == patient_id,
                    Reminder.caregiver_id == caregiver.id
                )
            ).order_by(Reminder.time).all()
            
            reminders_data = [reminder.to_dict() for reminder in reminders]
            
            return {
                'success': True,
                'reminders': reminders_data
            }
            
        except Exception as e:
            logger.error(f"Error getting patient reminders: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {'success': False, 'error': 'Failed to get reminders'}
    
    @staticmethod
    def create_reminder(patient_id: str, caregiver_id: str, reminder_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new reminder"""
        try:
            # Verify caregiver has access to this patient
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'success': False, 'error': 'Caregiver not found'}
            
            # Verify caregiver-patient relationship
            relationship = db.session.query(CaregiverPatient).filter(
                and_(
                    CaregiverPatient.caregiver_id == caregiver.id,
                    CaregiverPatient.patient_id == patient_id,
                    CaregiverPatient.status == 'active'
                )
            ).first()
            
            if not relationship:
                return {'success': False, 'error': 'Access denied to create patient reminders'}
            
            # Parse the time
            time_str = reminder_data.get('time', '09:00')
            if isinstance(time_str, str):
                try:
                    # Handle both HH:MM and HH:MM:SS formats
                    if len(time_str.split(':')) == 2:
                        parsed_time = datetime.strptime(time_str, '%H:%M').time()
                    else:
                        parsed_time = datetime.strptime(time_str, '%H:%M:%S').time()
                except ValueError:
                    parsed_time = time(9, 0)  # Default to 9:00 AM
            else:
                parsed_time = time(9, 0)
            
            # Create new reminder
            reminder = Reminder(
                patient_id=patient_id,
                caregiver_id=caregiver.id,
                type=reminder_data.get('type', 'App Notification'),
                message=reminder_data.get('message', 'Time for your daily brain training!'),
                time=parsed_time,
                active=reminder_data.get('active', True),
                recurring=reminder_data.get('recurring', True),
                days_of_week=reminder_data.get('days_of_week', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
            )
            
            db.session.add(reminder)
            db.session.commit()
            
            return {
                'success': True,
                'reminder': reminder.to_dict(),
                'message': 'Reminder created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating reminder: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return {'success': False, 'error': 'Failed to create reminder'}
    
    @staticmethod
    def update_reminder(patient_id: str, caregiver_id: str, reminder_id: str, reminder_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing reminder"""
        try:
            # Verify caregiver has access to this patient
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'success': False, 'error': 'Caregiver not found'}
            
            # Get the reminder and verify ownership
            reminder = db.session.query(Reminder).filter(
                and_(
                    Reminder.id == reminder_id,
                    Reminder.patient_id == patient_id,
                    Reminder.caregiver_id == caregiver.id
                )
            ).first()
            
            if not reminder:
                return {'success': False, 'error': 'Reminder not found or access denied'}
            
            # Parse the time
            time_str = reminder_data.get('time', reminder.time.strftime('%H:%M'))
            if isinstance(time_str, str):
                try:
                    if len(time_str.split(':')) == 2:
                        parsed_time = datetime.strptime(time_str, '%H:%M').time()
                    else:
                        parsed_time = datetime.strptime(time_str, '%H:%M:%S').time()
                except ValueError:
                    parsed_time = reminder.time  # Keep existing time if parse fails
            else:
                parsed_time = reminder.time
            
            # Update reminder fields
            reminder.type = reminder_data.get('type', reminder.type)
            reminder.message = reminder_data.get('message', reminder.message)
            reminder.time = parsed_time
            reminder.active = reminder_data.get('active', reminder.active)
            reminder.recurring = reminder_data.get('recurring', reminder.recurring)
            reminder.days_of_week = reminder_data.get('days_of_week', reminder.days_of_week)
            reminder.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'success': True,
                'reminder': reminder.to_dict(),
                'message': 'Reminder updated successfully'
            }
            
        except Exception as e:
            logger.error(f"Error updating reminder: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return {'success': False, 'error': 'Failed to update reminder'}
    
    @staticmethod
    def delete_reminder(patient_id: str, caregiver_id: str, reminder_id: str) -> Dict[str, Any]:
        """Delete a reminder"""
        try:
            # Verify caregiver has access to this patient
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'success': False, 'error': 'Caregiver not found'}
            
            # Get the reminder and verify ownership
            reminder = db.session.query(Reminder).filter(
                and_(
                    Reminder.id == reminder_id,
                    Reminder.patient_id == patient_id,
                    Reminder.caregiver_id == caregiver.id
                )
            ).first()
            
            if not reminder:
                return {'success': False, 'error': 'Reminder not found or access denied'}
            
            # Delete the reminder (logs will be cascade deleted)
            db.session.delete(reminder)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Reminder deleted successfully'
            }
            
        except Exception as e:
            logger.error(f"Error deleting reminder: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return {'success': False, 'error': 'Failed to delete reminder'}
    
    @staticmethod
    def toggle_reminder(patient_id: str, caregiver_id: str, reminder_id: str) -> Dict[str, Any]:
        """Toggle reminder active status"""
        try:
            # Verify caregiver has access to this patient
            caregiver = db.session.query(Caregiver).filter(Caregiver.user_id == caregiver_id).first()
            if not caregiver:
                return {'success': False, 'error': 'Caregiver not found'}
            
            # Get the reminder and verify ownership
            reminder = db.session.query(Reminder).filter(
                and_(
                    Reminder.id == reminder_id,
                    Reminder.patient_id == patient_id,
                    Reminder.caregiver_id == caregiver.id
                )
            ).first()
            
            if not reminder:
                return {'success': False, 'error': 'Reminder not found or access denied'}
            
            # Toggle active status
            reminder.active = not reminder.active
            reminder.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'success': True,
                'reminder': reminder.to_dict(),
                'message': f'Reminder {"activated" if reminder.active else "deactivated"} successfully'
            }
            
        except Exception as e:
            logger.error(f"Error toggling reminder: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.session.rollback()
            return {'success': False, 'error': 'Failed to toggle reminder'}
    
    @staticmethod
    def get_due_reminders() -> List[Dict[str, Any]]:
        """Get reminders that are due to be sent (for background task processing)"""
        try:
            # This would be used by a background task to find reminders to send
            now = datetime.now()
            current_time = now.time()
            current_day = now.strftime('%A')
            
            # Find active reminders for the current time and day
            due_reminders = db.session.query(Reminder).filter(
                and_(
                    Reminder.active == True,
                    Reminder.time <= current_time,
                    Reminder.days_of_week.contains([current_day])
                )
            ).all()
            
            return [reminder.to_dict() for reminder in due_reminders]
            
        except Exception as e:
            logger.error(f"Error getting due reminders: {str(e)}")
            return []