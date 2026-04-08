"""
Achievement routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.achievement import Achievement, UserAchievement

# Create blueprint
bp = Blueprint('achievements', __name__, url_prefix='/api/achievements')

@bp.route('/', methods=['GET'])
def get_achievements():
    """Get all available achievements."""
    try:
        achievements = Achievement.get_active_achievements()
        return jsonify([achievement.to_dict() for achievement in achievements]), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get achievements: {str(e)}'}), 500

@bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_achievements():
    """Get user's earned achievements."""
    try:
        user_id = get_jwt_identity()
        user_achievements = UserAchievement.get_user_achievements(user_id)
        
        result = []
        for user_achievement in user_achievements:
            achievement_data = user_achievement.achievement.to_dict()
            achievement_data['earned_at'] = user_achievement.earned_at.isoformat() if user_achievement.earned_at else None
            achievement_data['metadata'] = user_achievement.achievement_metadata or {}
            result.append(achievement_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user achievements: {str(e)}'}), 500

@bp.route('/user/stats', methods=['GET'])
@jwt_required()
def get_user_achievement_stats():
    """Get user achievement statistics."""
    try:
        user_id = get_jwt_identity()
        
        # Get user achievements
        user_achievements = UserAchievement.get_user_achievements(user_id)
        
        # Get all achievements
        all_achievements = Achievement.get_active_achievements()
        
        # Calculate stats
        total_achievements = len(all_achievements)
        earned_achievements = len(user_achievements)
        completion_percentage = (earned_achievements / total_achievements * 100) if total_achievements > 0 else 0
        
        # Calculate total points
        total_points = sum(ua.achievement.points for ua in user_achievements)
        
        # Group by badge level
        badge_counts = {'bronze': 0, 'silver': 0, 'gold': 0, 'platinum': 0}
        for user_achievement in user_achievements:
            badge_level = user_achievement.achievement.badge_level
            if badge_level in badge_counts:
                badge_counts[badge_level] += 1
        
        return jsonify({
            'total_achievements': total_achievements,
            'earned_achievements': earned_achievements,
            'completion_percentage': round(completion_percentage, 2),
            'total_points': total_points,
            'badge_counts': badge_counts
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get achievement stats: {str(e)}'}), 500

@bp.route('/leaderboard', methods=['GET'])
def get_achievement_leaderboard():
    """Get achievement leaderboard."""
    try:
        from sqlalchemy import func
        from app.database import db
        from app.models.user import User
        
        # Get top users by total achievement points
        query = db.session.query(
            User.id,
            User.first_name,
            User.last_name,
            User.email,
            func.sum(Achievement.points).label('total_points'),
            func.count(UserAchievement.id).label('achievement_count')
        ).select_from(User)\
         .join(UserAchievement, User.id == UserAchievement.user_id)\
         .join(Achievement, UserAchievement.achievement_id == Achievement.id)\
         .group_by(User.id, User.first_name, User.last_name, User.email)\
         .order_by(func.sum(Achievement.points).desc())\
         .limit(10)
        
        results = query.all()
        
        leaderboard = []
        for rank, result in enumerate(results, 1):
            leaderboard.append({
                'rank': rank,
                'user_id': str(result.id),
                'name': f"{result.first_name} {result.last_name}" if result.first_name and result.last_name else result.email.split('@')[0],
                'total_points': int(result.total_points) if result.total_points else 0,
                'achievement_count': result.achievement_count
            })
        
        return jsonify(leaderboard), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get achievement leaderboard: {str(e)}'}), 500