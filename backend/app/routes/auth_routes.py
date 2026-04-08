"""
Authentication routes
"""
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, ValidationError
from app.services.auth_service import AuthService
from app.utils.file_upload import save_profile_image, delete_profile_image, get_profile_image_url
import os

# Create blueprint
bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Validation schemas
class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 6)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    user_type = fields.Str(load_default='patient', validate=lambda x: x in ['patient', 'caregiver'])
    date_of_birth = fields.Date(load_default=None)

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=lambda x: len(x) >= 6)

class UpdateProfileSchema(Schema):
    first_name = fields.Str()
    last_name = fields.Str()
    date_of_birth = fields.Date()
    bio = fields.Str()
    profile_image = fields.Str()

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        schema = RegisterSchema()
        data = schema.load(request.json)
        
        result, status_code = AuthService.register_user(**data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@bp.route('/login', methods=['POST'])
def login():
    """Login a user."""
    try:
        schema = LoginSchema()
        data = schema.load(request.json)
        
        # Get client info
        user_agent = request.headers.get('User-Agent')
        ip_address = request.remote_addr
        
        result, status_code = AuthService.login_user(
            data['email'], 
            data['password'], 
            user_agent, 
            ip_address
        )
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout a user."""
    try:
        # Get token from request
        token = get_jwt()['jti'] if get_jwt() else None
        
        result, status_code = AuthService.logout_user(token)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500

@bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token."""
    try:
        refresh_token = request.json.get('refresh_token')
        if not refresh_token:
            return jsonify({'error': 'Refresh token required'}), 400
        
        result, status_code = AuthService.refresh_token(refresh_token)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Token refresh failed: {str(e)}'}), 500

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile."""
    try:
        user_id = get_jwt_identity()
        result, status_code = AuthService.get_user_profile(user_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    try:
        schema = UpdateProfileSchema()
        data = schema.load(request.json)
        
        user_id = get_jwt_identity()
        result, status_code = AuthService.update_user_profile(user_id, data)
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Profile update failed: {str(e)}'}), 500

@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    try:
        schema = ChangePasswordSchema()
        data = schema.load(request.json)
        
        user_id = get_jwt_identity()
        result, status_code = AuthService.change_password(
            user_id, 
            data['current_password'], 
            data['new_password']
        )
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Password change failed: {str(e)}'}), 500


@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get user's active sessions."""
    try:
        user_id = get_jwt_identity()
        result, status_code = AuthService.get_user_sessions(user_id)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get sessions: {str(e)}'}), 500

@bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify if current token is valid."""
    try:
        user_id = get_jwt_identity()
        result, status_code = AuthService.get_user_profile(user_id)
        if status_code == 200:
            return jsonify({'valid': True, 'user': result}), 200
        else:
            return jsonify({'valid': False}), 401
            
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401

@bp.route('/upload-profile-image', methods=['POST'])
@jwt_required()
def upload_profile_image():
    """Upload a profile image for the current user."""
    try:
        user_id = get_jwt_identity()
        
        # Check if file is in request
        if 'profile_image' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['profile_image']
        
        # Save the image
        result = save_profile_image(file)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        # Get current user to delete old image
        user_profile, _ = AuthService.get_user_profile(user_id)
        old_image = user_profile.get('profile_image')
        
        # Update user profile with new image filename
        update_data = {'profile_image': result['filename']}
        updated_user, status_code = AuthService.update_user_profile(user_id, update_data)
        
        if status_code != 200:
            # If profile update fails, delete the uploaded file
            delete_profile_image(result['filename'])
            return jsonify({'error': 'Failed to update profile'}), 500
        
        # Delete old image if it exists
        if old_image:
            delete_profile_image(old_image)
        
        # Add the image URL to the response
        updated_user['profile_image_url'] = get_profile_image_url(result['filename'])
        
        return jsonify(updated_user), 200
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500