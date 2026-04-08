"""
User routes for profile and user management
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app.services.auth_service import AuthService
from app.models.user import User
from app.models.patient import Patient
from app.models.caregiver import Caregiver

# Create blueprint
bp = Blueprint('users', __name__, url_prefix='/api/users')

# Validation schemas
class UpdatePatientProfileSchema(Schema):
    emergency_contact_name = fields.Str()
    emergency_contact_phone = fields.Str()
    medical_conditions = fields.List(fields.Str())
    medications = fields.List(fields.Str())
    preferences = fields.Dict()

class UpdateCaregiverProfileSchema(Schema):
    license_number = fields.Str()
    specialty = fields.Str()
    organization = fields.Str()
    phone = fields.Str()

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user's complete profile."""
    try:
        user_id = get_jwt_identity()
        result, status_code = AuthService.get_user_profile(user_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user profile: {str(e)}'}), 500

@bp.route('/me/patient-profile', methods=['PUT'])
@jwt_required()
def update_patient_profile():
    """Update patient-specific profile."""
    try:
        schema = UpdatePatientProfileSchema()
        data = schema.load(request.json)
        
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user or user.user_type != 'patient':
            return jsonify({'error': 'User is not a patient'}), 403
        
        if not user.patient:
            return jsonify({'error': 'Patient profile not found'}), 404
        
        # Update patient fields
        for key, value in data.items():
            if hasattr(user.patient, key):
                setattr(user.patient, key, value)
        
        from app.database import db
        db.session.commit()
        
        return jsonify(user.patient.to_dict(include_medical=True)), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        from app.database import db
        db.session.rollback()
        return jsonify({'error': f'Failed to update patient profile: {str(e)}'}), 500

@bp.route('/me/caregiver-profile', methods=['PUT'])
@jwt_required()
def update_caregiver_profile():
    """Update caregiver-specific profile."""
    try:
        schema = UpdateCaregiverProfileSchema()
        data = schema.load(request.json)
        
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user or user.user_type != 'caregiver':
            return jsonify({'error': 'User is not a caregiver'}), 403
        
        if not user.caregiver:
            return jsonify({'error': 'Caregiver profile not found'}), 404
        
        # Update caregiver fields
        for key, value in data.items():
            if hasattr(user.caregiver, key):
                setattr(user.caregiver, key, value)
        
        from app.database import db
        db.session.commit()
        
        return jsonify(user.caregiver.to_dict()), 200
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        from app.database import db
        db.session.rollback()
        return jsonify({'error': f'Failed to update caregiver profile: {str(e)}'}), 500

@bp.route('/me/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user preferences."""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        preferences = {}
        if user.user_type == 'patient' and user.patient:
            preferences = user.patient.preferences or {}
        
        return jsonify(preferences), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get preferences: {str(e)}'}), 500

@bp.route('/me/preferences', methods=['PUT'])
@jwt_required()
def update_user_preferences():
    """Update user preferences."""
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        preferences = request.json or {}
        
        if user.user_type == 'patient' and user.patient:
            user.patient.preferences = {**(user.patient.preferences or {}), **preferences}
            from app.database import db
            db.session.commit()
            
            return jsonify(user.patient.preferences), 200
        else:
            return jsonify({'error': 'Preferences not available for this user type'}), 403
        
    except Exception as e:
        from app.database import db
        db.session.rollback()
        return jsonify({'error': f'Failed to update preferences: {str(e)}'}), 500