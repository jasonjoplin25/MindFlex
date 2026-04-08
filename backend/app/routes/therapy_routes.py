from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.therapy_service import TherapyService
import logging

logger = logging.getLogger(__name__)

therapy_bp = Blueprint('therapy', __name__, url_prefix='/api/therapy')

@therapy_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_sound_categories():
    """Get all available sound therapy categories"""
    try:
        categories = TherapyService.get_sound_categories()
        
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting sound categories: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch sound categories'
        }), 500

@therapy_bp.route('/sounds', methods=['GET'])
@jwt_required()
def get_therapy_sounds():
    """Get therapy sounds, optionally filtered by category"""
    try:
        category_id = request.args.get('category_id')
        sounds = TherapyService.get_therapy_sounds(category_id)
        
        return jsonify({
            'success': True,
            'sounds': sounds
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting therapy sounds: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch therapy sounds'
        }), 500

@therapy_bp.route('/sounds/<sound_id>', methods=['GET'])
@jwt_required()
def get_sound_details(sound_id):
    """Get detailed information about a specific sound"""
    try:
        sound_details = TherapyService.get_sound_details(sound_id)
        
        if not sound_details:
            return jsonify({
                'success': False,
                'error': 'Sound not found'
            }), 404
        
        return jsonify({
            'success': True,
            'sound': sound_details
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting sound details: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch sound details'
        }), 500

@therapy_bp.route('/sessions', methods=['POST'])
@jwt_required()
def start_therapy_session():
    """Start a new therapy session"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('sound_id'):
            return jsonify({
                'success': False,
                'error': 'sound_id is required'
            }), 400
        
        session = TherapyService.start_therapy_session(user_id, data)
        
        if not session:
            return jsonify({
                'success': False,
                'error': 'Failed to start therapy session'
            }), 500
        
        return jsonify({
            'success': True,
            'session': session
        }), 201
        
    except Exception as e:
        logger.error(f"Error starting therapy session: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to start therapy session'
        }), 500

@therapy_bp.route('/sessions/<session_id>', methods=['PUT'])
@jwt_required()
def end_therapy_session(session_id):
    """End a therapy session and record results"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        success = TherapyService.end_therapy_session(session_id, user_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to end session or access denied'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Session ended successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error ending therapy session: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to end therapy session'
        }), 500

@therapy_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    """Get user's therapy session history"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 20, type=int)
        
        sessions = TherapyService.get_user_sessions(user_id, limit)
        
        return jsonify({
            'success': True,
            'sessions': sessions
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user sessions: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch therapy sessions'
        }), 500

@therapy_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user's sound therapy preferences"""
    try:
        user_id = get_jwt_identity()
        preferences = TherapyService.get_user_preferences(user_id)
        
        return jsonify({
            'success': True,
            'preferences': preferences
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch preferences'
        }), 500

@therapy_bp.route('/preferences', methods=['POST'])
@jwt_required()
def update_user_preferences():
    """Update user's sound therapy preferences"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        success = TherapyService.update_user_preferences(user_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update preferences'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Preferences updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update preferences'
        }), 500

@therapy_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_therapy_recommendations():
    """Get personalized therapy recommendations for user"""
    try:
        user_id = get_jwt_identity()
        recommendations = TherapyService.get_therapy_recommendations(user_id)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting therapy recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate recommendations'
        }), 500

@therapy_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_therapy_analytics():
    """Get user's therapy analytics and progress"""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        analytics = TherapyService.get_therapy_analytics(user_id, days)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting therapy analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch analytics'
        }), 500

@therapy_bp.route('/programs', methods=['GET'])
@jwt_required()
def get_therapy_programs():
    """Get available therapy programs"""
    try:
        programs = TherapyService.get_therapy_programs()
        
        return jsonify({
            'success': True,
            'programs': programs
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting therapy programs: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch therapy programs'
        }), 500

@therapy_bp.route('/programs/<program_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_in_program(program_id):
    """Enroll user in a therapy program"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        enrollment = TherapyService.enroll_in_program(user_id, program_id, data)
        
        if not enrollment:
            return jsonify({
                'success': False,
                'error': 'Failed to enroll in program or program not found'
            }), 404
        
        return jsonify({
            'success': True,
            'enrollment': enrollment
        }), 201
        
    except Exception as e:
        logger.error(f"Error enrolling in program: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to enroll in program'
        }), 500

@therapy_bp.route('/enrollments', methods=['GET'])
@jwt_required()
def get_user_enrollments():
    """Get user's therapy program enrollments"""
    try:
        user_id = get_jwt_identity()
        enrollments = TherapyService.get_user_enrollments(user_id)
        
        return jsonify({
            'success': True,
            'enrollments': enrollments
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user enrollments: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch enrollments'
        }), 500

@therapy_bp.route('/enrollments/<enrollment_id>/progress', methods=['PUT'])
@jwt_required()
def update_program_progress(enrollment_id):
    """Update progress in a therapy program enrollment"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        success = TherapyService.update_program_progress(enrollment_id, user_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update progress or access denied'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Progress updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating program progress: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update progress'
        }), 500