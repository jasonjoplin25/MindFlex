"""
Admin routes for managing achievements, users, and system settings
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.achievement import Achievement, UserAchievement
from app.models.user import User
from app.models.game import Game, GameSession
from app.database import db
from functools import wraps

# Create blueprint
bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(f):
    """Decorator to require admin access."""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Achievement Management Routes
@bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_all_achievements():
    """Get all achievements with detailed stats (available to all authenticated users)."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        achievements = Achievement.query.all()
        result = []
        
        for achievement in achievements:
            achievement_data = achievement.to_dict()
            
            # Add basic stats for all users
            earned_count = UserAchievement.query.filter_by(achievement_id=achievement.id).count()
            
            # Add detailed admin stats only for admins
            if user and user.user_type == 'admin':
                total_users = User.query.count()
                achievement_data.update({
                    'earned_by_users': earned_count,
                    'total_users': total_users,
                    'earn_rate': round((earned_count / total_users * 100) if total_users > 0 else 0, 2)
                })
            else:
                achievement_data.update({
                    'earned_by_users': earned_count
                })
            
            result.append(achievement_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get achievements: {str(e)}'}), 500

@bp.route('/achievements/<achievement_id>', methods=['PUT'])
@admin_required
def update_achievement(achievement_id):
    """Update achievement details."""
    try:
        achievement = Achievement.query.get(achievement_id)
        if not achievement:
            return jsonify({'error': 'Achievement not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['name', 'description', 'icon', 'criteria', 'points', 'badge_level', 'is_active']
        for field in allowed_fields:
            if field in data:
                setattr(achievement, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Achievement updated successfully',
            'achievement': achievement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update achievement: {str(e)}'}), 500

@bp.route('/achievements', methods=['POST'])
@admin_required
def create_achievement():
    """Create a new achievement."""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'criteria']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        achievement = Achievement(
            name=data['name'],
            criteria=data['criteria'],
            description=data.get('description', ''),
            icon=data.get('icon', ''),
            points=data.get('points', 10),
            badge_level=data.get('badge_level', 'bronze'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(achievement)
        db.session.commit()
        
        return jsonify({
            'message': 'Achievement created successfully',
            'achievement': achievement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create achievement: {str(e)}'}), 500

@bp.route('/achievements/<achievement_id>', methods=['DELETE'])
@admin_required
def delete_achievement(achievement_id):
    """Delete an achievement."""
    try:
        achievement = Achievement.query.get(achievement_id)
        if not achievement:
            return jsonify({'error': 'Achievement not found'}), 404
        
        # Check if any users have earned this achievement
        user_achievements = UserAchievement.query.filter_by(achievement_id=achievement_id).count()
        if user_achievements > 0:
            return jsonify({
                'error': f'Cannot delete achievement. {user_achievements} users have earned it. Deactivate instead.'
            }), 400
        
        db.session.delete(achievement)
        db.session.commit()
        
        return jsonify({'message': 'Achievement deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete achievement: {str(e)}'}), 500

@bp.route('/achievements/<achievement_id>/award/<user_id>', methods=['POST'])
@admin_required
def award_achievement_to_user(achievement_id, user_id):
    """Manually award an achievement to a user."""
    try:
        achievement = Achievement.query.get(achievement_id)
        user = User.query.get(user_id)
        
        if not achievement:
            return jsonify({'error': 'Achievement not found'}), 404
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user already has this achievement
        existing = UserAchievement.query.filter_by(
            user_id=user_id, 
            achievement_id=achievement_id
        ).first()
        
        if existing:
            return jsonify({'error': 'User already has this achievement'}), 400
        
        user_achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement_id
        )
        
        db.session.add(user_achievement)
        db.session.commit()
        
        return jsonify({
            'message': f'Achievement "{achievement.name}" awarded to {user.full_name or user.email}'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to award achievement: {str(e)}'}), 500

# User Management Routes
@bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users with stats."""
    try:
        users = User.query.all()
        result = []
        
        for user in users:
            user_data = user.to_dict()
            
            # Add user stats
            total_games = GameSession.query.filter_by(player_id=user.id, completed=True).count()
            total_achievements = UserAchievement.query.filter_by(user_id=user.id).count()
            
            user_data.update({
                'total_games_completed': total_games,
                'total_achievements_earned': total_achievements
            })
            
            result.append(user_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@bp.route('/users/<user_id>/achievements', methods=['GET'])
@jwt_required()
def get_user_achievements(user_id):
    """Get all achievements for a specific user (users can view their own, admins can view any)."""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Users can only view their own achievements unless they're admin
        if str(current_user_id) != str(user_id) and (not current_user or current_user.user_type != 'admin'):
            return jsonify({'error': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_achievements = UserAchievement.get_user_achievements(user_id)
        
        result = []
        for ua in user_achievements:
            achievement_data = ua.achievement.to_dict()
            achievement_data['earned_at'] = ua.earned_at.isoformat() if ua.earned_at else None
            achievement_data['metadata'] = ua.achievement_metadata or {}
            result.append(achievement_data)
        
        return jsonify({
            'user': user.to_dict(),
            'achievements': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user achievements: {str(e)}'}), 500

# System Stats Routes
@bp.route('/stats', methods=['GET'])
@admin_required
def get_system_stats():
    """Get overall system statistics."""
    try:
        total_users = User.query.count()
        total_games = Game.query.count()
        total_achievements = Achievement.query.filter_by(is_active=True).count()
        total_sessions = GameSession.query.filter_by(completed=True).count()
        total_user_achievements = UserAchievement.query.count()
        
        # Recent activity (last 7 days)
        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(days=7)
        
        recent_users = User.query.filter(User.created_at >= cutoff).count()
        recent_sessions = GameSession.query.filter(
            GameSession.completed_at >= cutoff,
            GameSession.completed == True
        ).count()
        recent_achievements = UserAchievement.query.filter(
            UserAchievement.earned_at >= cutoff
        ).count()
        
        return jsonify({
            'totals': {
                'users': total_users,
                'games': total_games,
                'achievements': total_achievements,
                'completed_sessions': total_sessions,
                'earned_achievements': total_user_achievements
            },
            'recent_7_days': {
                'new_users': recent_users,
                'completed_sessions': recent_sessions,
                'earned_achievements': recent_achievements
            },
            'averages': {
                'sessions_per_user': round(total_sessions / total_users, 2) if total_users > 0 else 0,
                'achievements_per_user': round(total_user_achievements / total_users, 2) if total_users > 0 else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get system stats: {str(e)}'}), 500

@bp.route('/recalculate-achievements', methods=['POST'])
@admin_required
def recalculate_all_achievements():
    """Recalculate achievements for all users."""
    try:
        from app.services.game_service import GameService
        
        # Get all completed sessions
        sessions = GameSession.query.filter_by(completed=True).all()
        achievements_awarded = 0
        
        for session in sessions:
            achievements_earned = GameService._check_achievements(session)
            achievements_awarded += len(achievements_earned)
        
        return jsonify({
            'message': f'Recalculation complete. {achievements_awarded} achievements were awarded.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to recalculate achievements: {str(e)}'}), 500