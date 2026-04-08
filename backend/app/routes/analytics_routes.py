from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.services.analytics_service import AnalyticsService
import logging

logger = logging.getLogger(__name__)

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_analytics():
    """Get comprehensive analytics for the current user"""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        # Validate days parameter
        if days < 1 or days > 365:
            return jsonify({
                'success': False,
                'error': 'Days parameter must be between 1 and 365'
            }), 400
        
        analytics = AnalyticsService.get_user_analytics(user_id, days)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch analytics'
        }), 500

@analytics_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_specific_user_analytics(user_id):
    """Get analytics for a specific user (caregiver access)"""
    try:
        caregiver_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        # Validate days parameter
        if days < 1 or days > 365:
            return jsonify({
                'success': False,
                'error': 'Days parameter must be between 1 and 365'
            }), 400
        
        # TODO: Add authorization check to ensure caregiver has access to this user
        # For now, we'll allow access to any user for demonstration
        
        analytics = AnalyticsService.get_user_analytics(user_id, days)
        
        if not analytics:
            return jsonify({
                'success': False,
                'error': 'User not found or no data available'
            }), 404
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user analytics for {user_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch analytics'
        }), 500

@analytics_bp.route('/system', methods=['GET'])
@jwt_required()
def get_system_analytics():
    """Get system-wide analytics (admin access)"""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        # Validate days parameter
        if days < 1 or days > 365:
            return jsonify({
                'success': False,
                'error': 'Days parameter must be between 1 and 365'
            }), 400
        
        # TODO: Add admin authorization check
        # For now, we'll allow access for demonstration
        
        analytics = AnalyticsService.get_system_analytics(days)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting system analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch system analytics'
        }), 500

@analytics_bp.route('/export', methods=['GET'])
@jwt_required()
def export_user_data():
    """Export user analytics data in various formats"""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        format_type = request.args.get('format', 'json')
        
        # Validate parameters
        if days < 1 or days > 365:
            return jsonify({
                'success': False,
                'error': 'Days parameter must be between 1 and 365'
            }), 400
        
        if format_type not in ['json', 'csv']:
            return jsonify({
                'success': False,
                'error': 'Format must be json or csv'
            }), 400
        
        analytics = AnalyticsService.get_user_analytics(user_id, days)
        
        if format_type == 'csv':
            # Convert to CSV format
            csv_data = AnalyticsService.convert_to_csv(analytics)
            response = make_response(csv_data)
            response.headers['Content-Type'] = 'text/csv'
            response.headers['Content-Disposition'] = f'attachment; filename=analytics_{user_id}_{days}days.csv'
            return response
        
        # Default JSON format
        return jsonify({
            'success': True,
            'analytics': analytics,
            'export_info': {
                'generated_at': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'period_days': days,
                'format': format_type
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error exporting user data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to export data'
        }), 500

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    """Get summarized analytics for dashboard display"""
    try:
        user_id = get_jwt_identity()
        
        # Get quick 7-day and 30-day summaries
        weekly_analytics = AnalyticsService.get_user_analytics(user_id, 7)
        monthly_analytics = AnalyticsService.get_user_analytics(user_id, 30)
        
        # Extract key metrics for dashboard
        dashboard_data = {
            'weekly_summary': {
                'total_game_sessions': weekly_analytics.get('games', {}).get('total_sessions', 0),
                'total_therapy_sessions': weekly_analytics.get('therapy', {}).get('total_sessions', 0),
                'achievements_earned': weekly_analytics.get('achievements', {}).get('achievements_earned_period', 0),
                'engagement_score': weekly_analytics.get('progress', {}).get('engagement_score', 0),
                'activity_trend': weekly_analytics.get('progress', {}).get('activity_trend', 'stable')
            },
            'monthly_summary': {
                'total_game_sessions': monthly_analytics.get('games', {}).get('total_sessions', 0),
                'average_score': monthly_analytics.get('games', {}).get('average_score', 0),
                'total_therapy_hours': monthly_analytics.get('therapy', {}).get('total_time_hours', 0),
                'mood_improvement_rate': monthly_analytics.get('therapy', {}).get('mood_improvement', {}).get('improvement_rate', 0),
                'activity_consistency': monthly_analytics.get('progress', {}).get('activity_consistency_percent', 0)
            },
            'insights': monthly_analytics.get('summary', {}).get('insights', []),
            'recommendations': monthly_analytics.get('summary', {}).get('recommendations', []),
            'strengths': monthly_analytics.get('summary', {}).get('areas_of_strength', []),
            'improvements': monthly_analytics.get('summary', {}).get('areas_for_improvement', [])
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard summary'
        }), 500

@analytics_bp.route('/compare', methods=['GET'])
@jwt_required()
def compare_periods():
    """Compare analytics between two time periods"""
    try:
        user_id = get_jwt_identity()
        period1_days = request.args.get('period1', 30, type=int)
        period2_days = request.args.get('period2', 30, type=int)
        
        # Validate parameters
        if period1_days < 1 or period1_days > 365 or period2_days < 1 or period2_days > 365:
            return jsonify({
                'success': False,
                'error': 'Period days must be between 1 and 365'
            }), 400
        
        # Get analytics for both periods
        period1_analytics = AnalyticsService.get_user_analytics(user_id, period1_days)
        
        # Calculate period2 start date (period1_days ago from period1 start)
        period1_start = datetime.utcnow() - timedelta(days=period1_days)
        period2_start = period1_start - timedelta(days=period2_days)
        period2_end = period1_start
        
        # Custom analytics for period2
        period2_analytics = AnalyticsService.get_user_analytics_custom_period(
            user_id, period2_start, period2_end
        )
        
        # Calculate comparison metrics
        comparison = {
            'period1': {
                'days': period1_days,
                'game_sessions': period1_analytics.get('games', {}).get('total_sessions', 0),
                'therapy_sessions': period1_analytics.get('therapy', {}).get('total_sessions', 0),
                'engagement_score': period1_analytics.get('progress', {}).get('engagement_score', 0)
            },
            'period2': {
                'days': period2_days,
                'game_sessions': period2_analytics.get('games', {}).get('total_sessions', 0),
                'therapy_sessions': period2_analytics.get('therapy', {}).get('total_sessions', 0),
                'engagement_score': period2_analytics.get('progress', {}).get('engagement_score', 0)
            }
        }
        
        # Calculate percentage changes
        comparison['changes'] = {
            'game_sessions_change': AnalyticsService.calculate_percentage_change(
                comparison['period2']['game_sessions'],
                comparison['period1']['game_sessions']
            ),
            'therapy_sessions_change': AnalyticsService.calculate_percentage_change(
                comparison['period2']['therapy_sessions'],
                comparison['period1']['therapy_sessions']
            ),
            'engagement_change': AnalyticsService.calculate_percentage_change(
                comparison['period2']['engagement_score'],
                comparison['period1']['engagement_score']
            )
        }
        
        return jsonify({
            'success': True,
            'comparison': comparison
        }), 200
        
    except Exception as e:
        logger.error(f"Error comparing periods: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to compare periods'
        }), 500

@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """Get trend analysis for user performance"""
    try:
        user_id = get_jwt_identity()
        metric = request.args.get('metric', 'performance')  # performance, activity, mood
        period_days = request.args.get('days', 30, type=int)
        
        if period_days < 7 or period_days > 365:
            return jsonify({
                'success': False,
                'error': 'Period must be between 7 and 365 days'
            }), 400
        
        trends = AnalyticsService.get_trend_analysis(user_id, metric, period_days)
        
        return jsonify({
            'success': True,
            'trends': trends
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting trends: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch trends'
        }), 500