"""
Authentication service using PostgreSQL database
"""
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import db
from app.models.user import User
from app.models.patient import Patient
from app.models.caregiver import Caregiver
from app.models.session import UserSession
import uuid
import secrets

class AuthService:
    @staticmethod
    def register_user(email, password, user_type='patient', **user_data):
        """Register a new user."""
        try:
            # Check if user already exists
            if User.find_by_email(email):
                return {'error': 'User with this email already exists'}, 400
            
            # Create user
            user = User(email=email, password=password, user_type=user_type, **user_data)
            db.session.add(user)
            db.session.flush()  # Get the user ID
            
            # Create patient or caregiver profile
            if user_type == 'patient':
                patient = Patient(user_id=user.id)
                db.session.add(patient)
            elif user_type == 'caregiver':
                caregiver = Caregiver(user_id=user.id)
                db.session.add(caregiver)
            
            db.session.commit()
            
            # Generate tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            # Create session
            session = AuthService._create_session(user.id, access_token, refresh_token)
            
            return {
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': str(session.id)
            }, 201
            
        except Exception as e:
            db.session.rollback()
            return {'error': f'Registration failed: {str(e)}'}, 500
    
    @staticmethod
    def login_user(email, password, user_agent=None, ip_address=None):
        """Authenticate a user."""
        try:
            # Find user
            user = User.find_by_email(email)
            if not user or not user.check_password(password):
                return {'error': 'Invalid email or password'}, 401
            
            if not user.is_active:
                return {'error': 'Account is deactivated'}, 401
            
            # Generate tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            # Create session
            session = AuthService._create_session(
                user.id, access_token, refresh_token, user_agent, ip_address
            )
            
            return {
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': str(session.id)
            }, 200
            
        except Exception as e:
            return {'error': f'Login failed: {str(e)}'}, 500
    
    @staticmethod
    def logout_user(session_token):
        """Logout a user and revoke session."""
        try:
            session = UserSession.find_by_token(session_token)
            if session:
                session.revoke()
                return {'message': 'Logged out successfully'}, 200
            return {'error': 'Session not found'}, 404
        except Exception as e:
            return {'error': f'Logout failed: {str(e)}'}, 500
    
    @staticmethod
    def refresh_token(refresh_token):
        """Refresh access token."""
        try:
            session = UserSession.find_by_refresh_token(refresh_token)
            if not session or session.is_expired or not session.is_active:
                return {'error': 'Invalid or expired refresh token'}, 401
            
            user = User.find_by_id(session.user_id)
            if not user or not user.is_active:
                return {'error': 'User not found or inactive'}, 401
            
            # Generate new access token
            new_access_token = create_access_token(identity=str(user.id))
            
            # Update session
            session.session_token = new_access_token
            session.update_activity()
            
            return {
                'access_token': new_access_token,
                'user': user.to_dict()
            }, 200
            
        except Exception as e:
            return {'error': f'Token refresh failed: {str(e)}'}, 500
    
    @staticmethod
    def get_user_profile(user_id):
        """Get user profile with associated data."""
        try:
            user = User.find_by_id(user_id)
            if not user:
                return {'error': 'User not found'}, 404
            
            profile_data = user.to_dict()
            
            # Add type-specific profile data
            if user.user_type == 'patient' and user.patient:
                profile_data['patient_profile'] = user.patient.to_dict()
            elif user.user_type == 'caregiver' and user.caregiver:
                profile_data['caregiver_profile'] = user.caregiver.to_dict()
            
            return profile_data, 200
            
        except Exception as e:
            return {'error': f'Failed to get profile: {str(e)}'}, 500
    
    @staticmethod
    def update_user_profile(user_id, update_data):
        """Update user profile."""
        try:
            user = User.find_by_id(user_id)
            if not user:
                return {'error': 'User not found'}, 404
            
            # Update user fields
            for key, value in update_data.items():
                if hasattr(user, key) and key not in ['id', 'password_hash', 'email']:
                    setattr(user, key, value)
            
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return user.to_dict(), 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': f'Profile update failed: {str(e)}'}, 500
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """Change user password."""
        try:
            user = User.find_by_id(user_id)
            if not user:
                return {'error': 'User not found'}, 404
            
            if not user.check_password(current_password):
                return {'error': 'Current password is incorrect'}, 401
            
            user.set_password(new_password)
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {'message': 'Password changed successfully'}, 200
            
        except Exception as e:
            db.session.rollback()
            return {'error': f'Password change failed: {str(e)}'}, 500
    
    @staticmethod
    def _create_session(user_id, access_token, refresh_token, user_agent=None, ip_address=None):
        """Create a user session."""
        expires_at = datetime.utcnow() + timedelta(days=30)  # Refresh token expiry
        
        session = UserSession(
            user_id=user_id,
            session_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        db.session.add(session)
        db.session.commit()
        
        return session
    
    @staticmethod
    def cleanup_expired_sessions():
        """Clean up expired sessions."""
        return UserSession.cleanup_expired_sessions()
    
    @staticmethod
    def get_user_sessions(user_id):
        """Get active sessions for a user."""
        try:
            sessions = UserSession.query.filter_by(
                user_id=user_id, is_active=True
            ).order_by(UserSession.last_activity.desc()).all()
            
            return [session.to_dict() for session in sessions], 200
        except Exception as e:
            return {'error': f'Failed to get sessions: {str(e)}'}, 500