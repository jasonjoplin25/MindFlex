from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.caregiver_service import CaregiverService
from app.services.reminder_service import ReminderService
import logging

logger = logging.getLogger(__name__)

caregiver_bp = Blueprint('caregiver', __name__, url_prefix='/api/caregiver')

@caregiver_bp.route('/patients', methods=['GET'])
@jwt_required()
def get_caregiver_patients():
    """Get all patients for the current caregiver"""
    try:
        caregiver_id = get_jwt_identity()
        patients = CaregiverService.get_caregiver_patients(caregiver_id)
        
        return jsonify({
            'success': True,
            'patients': patients
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting caregiver patients: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch patients'
        }), 500

@caregiver_bp.route('/patients/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient_details(patient_id):
    """Get detailed information about a specific patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        logger.info(f"Getting patient details - Patient ID: {patient_id}, Caregiver ID: {caregiver_id}")
        
        patient_details = CaregiverService.get_patient_details(patient_id, caregiver_id)
        
        if not patient_details:
            return jsonify({
                'success': False,
                'error': 'Patient not found or access denied'
            }), 404
        
        return jsonify({
            'success': True,
            'patient': patient_details
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting patient details: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch patient details'
        }), 500

@caregiver_bp.route('/patients', methods=['POST'])
@jwt_required()
def add_patient():
    """Add a new patient to caregiver's care"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'age']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        
        result = CaregiverService.add_patient(caregiver_id, data)
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'Failed to add patient'
            }), 500
        
        return jsonify({
            'success': True,
            'patient': result,
            'message': 'Patient added successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding patient: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add patient'
        }), 500

@caregiver_bp.route('/patients/<patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    """Update patient information"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        
        success = CaregiverService.update_patient(patient_id, caregiver_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update patient or access denied'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Patient updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating patient: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update patient'
        }), 500

@caregiver_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_caregiver_stats():
    """Get dashboard statistics for caregiver"""
    try:
        caregiver_id = get_jwt_identity()
        
        stats = CaregiverService.get_caregiver_stats(caregiver_id)
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting caregiver stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch statistics'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/recommendations', methods=['GET'])
@jwt_required()
def get_care_recommendations(patient_id):
    """Generate AI-powered care recommendations for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        recommendations = CaregiverService.generate_care_recommendations(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating care recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate recommendations'
        }), 500

# Advanced AI-powered features

@caregiver_bp.route('/patients/<patient_id>/analyze', methods=['POST'])
@jwt_required()
def analyze_patient_data(patient_id):
    """Analyze patient data using AI"""
    try:
        caregiver_id = get_jwt_identity()
        
        analysis = CaregiverService.analyze_patient_data(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing patient data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze patient data'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/daily-plan', methods=['POST'])
@jwt_required()
def generate_daily_plan(patient_id):
    """Generate AI-powered daily care plan"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        plan = CaregiverService.generate_daily_plan(patient_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'plan': plan
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating daily plan: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate daily plan'
        }), 500

# Medication Management

@caregiver_bp.route('/patients/<patient_id>/medications', methods=['GET'])
@jwt_required()
def get_patient_medications(patient_id):
    """Get medications for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        medications = CaregiverService.get_patient_medications(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'medications': medications
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting patient medications: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch medications'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/medications', methods=['POST'])
@jwt_required()
def add_patient_medication(patient_id):
    """Add a new medication for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        medication = CaregiverService.add_patient_medication(patient_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'medication': medication
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding patient medication: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add medication'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/medications/<medication_id>', methods=['PUT'])
@jwt_required()
def update_patient_medication(patient_id, medication_id):
    """Update a patient's medication"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        medication = CaregiverService.update_patient_medication(patient_id, medication_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'medication': medication
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating patient medication: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update medication'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/medications/<medication_id>', methods=['DELETE'])
@jwt_required()
def delete_patient_medication(patient_id, medication_id):
    """Delete a patient's medication"""
    try:
        caregiver_id = get_jwt_identity()
        
        success = CaregiverService.delete_patient_medication(patient_id, medication_id, caregiver_id)
        
        return jsonify({
            'success': success
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting patient medication: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete medication'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/optimize-medications', methods=['POST'])
@jwt_required()
def optimize_medications(patient_id):
    """Optimize medication schedule using AI"""
    try:
        caregiver_id = get_jwt_identity()
        
        optimization = CaregiverService.optimize_medications(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'optimization': optimization
        }), 200
        
    except Exception as e:
        logger.error(f"Error optimizing medications: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to optimize medications'
        }), 500

# Appointment Management

@caregiver_bp.route('/patients/<patient_id>/appointments', methods=['GET'])
@jwt_required()
def get_patient_appointments(patient_id):
    """Get appointments for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        appointments = CaregiverService.get_patient_appointments(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'appointments': appointments
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting patient appointments: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch appointments'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/appointments', methods=['POST'])
@jwt_required()
def add_patient_appointment(patient_id):
    """Add a new appointment for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        appointment = CaregiverService.add_patient_appointment(patient_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'appointment': appointment
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding patient appointment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add appointment'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/appointments/<appointment_id>', methods=['PUT'])
@jwt_required()
def update_patient_appointment(patient_id, appointment_id):
    """Update a patient's appointment"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        appointment = CaregiverService.update_patient_appointment(patient_id, appointment_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'appointment': appointment
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating patient appointment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update appointment'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/appointments/<appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_patient_appointment(patient_id, appointment_id):
    """Delete a patient's appointment"""
    try:
        caregiver_id = get_jwt_identity()
        
        success = CaregiverService.delete_patient_appointment(patient_id, appointment_id, caregiver_id)
        
        return jsonify({
            'success': success
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting patient appointment: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete appointment'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/appointments/<appointment_id>/status', methods=['PATCH'])
@jwt_required()
def update_appointment_status(patient_id, appointment_id):
    """Update appointment status"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        success = CaregiverService.update_appointment_status(patient_id, appointment_id, caregiver_id, data.get('status'))
        
        return jsonify({
            'success': success
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating appointment status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update appointment status'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/appointments/<appointment_id>/summary', methods=['PATCH'])
@jwt_required()
def update_appointment_summary(patient_id, appointment_id):
    """Update appointment summary"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        result = CaregiverService.update_appointment_summary(patient_id, appointment_id, caregiver_id, data.get('summary'))
        
        if result:
            return jsonify({
                'success': True,
                'appointment': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update appointment summary'
            }), 500
        
    except Exception as e:
        logger.error(f"Error updating appointment summary: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update appointment summary'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/appointments/<appointment_id>/prepare', methods=['POST'])
@jwt_required()
def generate_appointment_preparation(patient_id, appointment_id):
    """Generate AI-powered appointment preparation guide"""
    try:
        caregiver_id = get_jwt_identity()
        
        preparation = CaregiverService.generate_appointment_preparation(patient_id, appointment_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'preparation': preparation
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating appointment preparation: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate appointment preparation'
        }), 500

# Mood Tracking

@caregiver_bp.route('/patients/<patient_id>/mood-tracking', methods=['GET'])
@jwt_required()
def get_mood_tracking(patient_id):
    """Get mood tracking data for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        mood_entries = CaregiverService.get_mood_tracking(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'mood_entries': mood_entries
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting mood tracking: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch mood tracking data'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/mood-tracking', methods=['POST'])
@jwt_required()
def add_mood_entry(patient_id):
    """Add a new mood entry for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        mood_entry = CaregiverService.add_mood_entry(patient_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'mood_entry': mood_entry
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding mood entry: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add mood entry'
        }), 500

# Notes Management

@caregiver_bp.route('/patients/<patient_id>/notes', methods=['GET'])
@jwt_required()
def get_patient_notes(patient_id):
    """Get notes for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        notes = CaregiverService.get_patient_notes(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'notes': notes
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting patient notes: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch notes'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/notes', methods=['POST'])
@jwt_required()
def add_patient_note(patient_id):
    """Add a new note for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        note = CaregiverService.add_patient_note(patient_id, caregiver_id, data)
        
        return jsonify({
            'success': True,
            'note': note
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding patient note: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add note'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/notes/<note_id>', methods=['PUT'])
@jwt_required()
def update_patient_note(patient_id, note_id):
    """Update a note for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        note = CaregiverService.update_patient_note(patient_id, note_id, caregiver_id, data)
        
        if note:
            return jsonify({
                'success': True,
                'note': note
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Note not found or access denied'
            }), 404
        
    except Exception as e:
        logger.error(f"Error updating patient note: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update note'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/notes/<note_id>', methods=['DELETE'])
@jwt_required()
def delete_patient_note(patient_id, note_id):
    """Delete a note for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        
        success = CaregiverService.delete_patient_note(patient_id, note_id, caregiver_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Note deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Note not found or access denied'
            }), 404
        
    except Exception as e:
        logger.error(f"Error deleting patient note: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete note'
        }), 500

@caregiver_bp.route('/search-users', methods=['GET'])
@jwt_required()
def search_users():
    """Search for existing users to add as patients"""
    try:
        caregiver_id = get_jwt_identity()
        query = request.args.get('query', '').strip()
        
        logger.info(f"Search users endpoint called with query: '{query}' by caregiver: {caregiver_id}")
        
        if len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Search query must be at least 2 characters'
            }), 400
        
        users = CaregiverService.search_users(query, caregiver_id)
        
        logger.info(f"Search returned {len(users)} users")
        
        return jsonify({
            'success': True,
            'users': users,
            'debug': {
                'query': query,
                'caregiver_id': caregiver_id,
                'result_count': len(users)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching users: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'Failed to search users'
        }), 500

@caregiver_bp.route('/add-existing-patient', methods=['POST'])
@jwt_required()
def add_existing_patient():
    """Add an existing user as a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('user_id'):
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        result = CaregiverService.add_existing_patient(caregiver_id, data)
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'Failed to add existing patient'
            }), 500
        
        # Check if result is an error response
        if isinstance(result, dict) and 'error' in result:
            status_code = 400  # Default to 400 for client errors
            if result.get('code') == 'INTERNAL_ERROR':
                status_code = 500
            elif result.get('code') == 'ALREADY_ASSIGNED':
                status_code = 409  # Conflict
                
            return jsonify({
                'success': False,
                'error': result['error'],
                'code': result.get('code', 'UNKNOWN')
            }), status_code
        
        return jsonify({
            'success': True,
            'patient': result,
            'message': 'Patient added successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding existing patient: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to add existing patient'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/settings', methods=['PUT'])
@jwt_required()
def update_patient_settings(patient_id):
    """Update patient settings"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Settings data is required'
            }), 400
        
        success = CaregiverService.update_patient_settings(patient_id, caregiver_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Patient settings updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update patient settings or access denied'
            }), 404
        
    except Exception as e:
        logger.error(f"Error updating patient settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update patient settings'
        }), 500

@caregiver_bp.route('/debug/setup-relationships', methods=['POST'])
@jwt_required()
def debug_setup_relationships():
    """Debug endpoint to fix missing caregiver-patient relationships"""
    try:
        caregiver_id = get_jwt_identity()
        
        # Debug current data
        CaregiverService.debug_caregiver_data(caregiver_id)
        
        # Fix relationships
        CaregiverService.setup_caregiver_patient_relationships()
        
        # Debug after fix
        CaregiverService.debug_caregiver_data(caregiver_id)
        
        return jsonify({
            'success': True,
            'message': 'Relationships setup completed. Check logs for details.'
        }), 200
        
    except Exception as e:
        logger.error(f"Error setting up relationships: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to setup relationships'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/routines/<routine_type>', methods=['GET'])
@jwt_required()
def get_patient_routines(patient_id, routine_type):
    """Get patient routine activities for a specific routine type"""
    try:
        caregiver_id = get_jwt_identity()
        
        routines = CaregiverService.get_patient_routines(patient_id, caregiver_id, routine_type)
        
        return jsonify({
            'success': True,
            'routines': routines
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting patient routines: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get patient routines'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/routines', methods=['POST'])
@jwt_required()
def save_patient_routine(patient_id):
    """Save patient routine activities"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.get_json()
        
        result = CaregiverService.save_patient_routine(patient_id, caregiver_id, data)
        
        if result:
            return jsonify({
                'success': True,
                'routine': result,
                'message': 'Routine saved successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save routine'
            }), 500
        
    except Exception as e:
        logger.error(f"Error saving patient routine: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to save routine'
        }), 500

@caregiver_bp.route('/patients/<patient_id>/context', methods=['GET'])
@jwt_required()
def get_patient_context(patient_id):
    """Get patient context for AI assistant"""
    try:
        caregiver_id = get_jwt_identity()
        
        context = CaregiverService.get_patient_context(patient_id, caregiver_id)
        
        return jsonify({
            'success': True,
            'context': context
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting patient context: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get patient context'
        }), 500


# ==================== REMINDER ROUTES ====================

@caregiver_bp.route('/patients/<patient_id>/reminders', methods=['GET'])
@jwt_required()
def get_patient_reminders(patient_id):
    """Get all reminders for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        result = ReminderService.get_patient_reminders(patient_id, caregiver_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error getting patient reminders: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get patient reminders'
        }), 500


@caregiver_bp.route('/patients/<patient_id>/reminders', methods=['POST'])
@jwt_required()
def create_patient_reminder(patient_id):
    """Create a new reminder for a patient"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Reminder data is required'
            }), 400
        
        result = ReminderService.create_reminder(patient_id, caregiver_id, data)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating patient reminder: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create reminder'
        }), 500


@caregiver_bp.route('/patients/<patient_id>/reminders/<reminder_id>', methods=['PUT'])
@jwt_required()
def update_patient_reminder(patient_id, reminder_id):
    """Update an existing reminder"""
    try:
        caregiver_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Reminder data is required'
            }), 400
        
        result = ReminderService.update_reminder(patient_id, caregiver_id, reminder_id, data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error updating patient reminder: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update reminder'
        }), 500


@caregiver_bp.route('/patients/<patient_id>/reminders/<reminder_id>', methods=['DELETE'])
@jwt_required()
def delete_patient_reminder(patient_id, reminder_id):
    """Delete a reminder"""
    try:
        caregiver_id = get_jwt_identity()
        result = ReminderService.delete_reminder(patient_id, caregiver_id, reminder_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error deleting patient reminder: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete reminder'
        }), 500


@caregiver_bp.route('/patients/<patient_id>/reminders/<reminder_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_patient_reminder(patient_id, reminder_id):
    """Toggle reminder active status"""
    try:
        caregiver_id = get_jwt_identity()
        result = ReminderService.toggle_reminder(patient_id, caregiver_id, reminder_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error toggling patient reminder: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to toggle reminder'
        }), 500