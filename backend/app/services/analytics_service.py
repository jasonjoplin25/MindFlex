from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, desc, func, extract
from app.models.user import User
from app.models.game import Game, GameSession  
from app.models.achievement import Achievement, UserAchievement
from app.database import db
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for comprehensive analytics and reporting"""
    
    @staticmethod
    def get_user_analytics(user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive analytics for a specific user"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Game analytics
            game_stats = AnalyticsService._get_game_analytics(user_id, start_date, end_date)
            
            # Achievement analytics
            achievement_stats = AnalyticsService._get_achievement_analytics(user_id, start_date, end_date)
            
            # Overall progress metrics
            progress_stats = AnalyticsService._get_progress_metrics(user_id, start_date, end_date)
            
            # For compatibility with frontend, create mock therapy data
            therapy_stats = {
                'total_sessions': 0,
                'total_time_hours': 0,
                'average_effectiveness': 0,
                'mood_improvement': {
                    'improvement_rate': 0,
                    'sessions_with_improvement': 0,
                    'total_mood_sessions': 0
                }
            }
            
            return {
                'user_id': user_id,
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'games': game_stats,
                'therapy': therapy_stats,
                'achievements': achievement_stats,
                'progress': progress_stats,
                'summary': AnalyticsService._generate_summary_insights(game_stats, achievement_stats, progress_stats)
            }
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {str(e)}")
            return AnalyticsService._get_empty_analytics(user_id, days)
    
    @staticmethod
    def _get_game_analytics(user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get detailed game analytics for user"""
        try:
            # Total sessions in period
            total_sessions = db.session.query(func.count(GameSession.id)).filter(
                GameSession.player_id == user_id,
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            ).scalar() or 0
            
            # Get all completed sessions for calculations
            sessions = GameSession.query.filter(
                GameSession.player_id == user_id,
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            ).all()
            
            if not sessions:
                return {
                    'total_sessions': 0,
                    'total_time_hours': 0,
                    'average_score': 0,
                    'highest_score': 0,
                    'average_duration_minutes': 0,
                    'games_by_type': {},
                    'daily_activity': [],
                    'performance_trend': 'stable',
                    'improvement_rate': 0
                }
            
            # Calculate basic stats
            total_time_seconds = sum(s.duration_seconds or 0 for s in sessions)
            total_time_hours = total_time_seconds / 3600
            total_score = sum(s.score or 0 for s in sessions)
            average_score = total_score / total_sessions if total_sessions > 0 else 0
            highest_score = max(s.score or 0 for s in sessions)
            average_duration_minutes = (total_time_seconds / total_sessions / 60) if total_sessions > 0 else 0
            
            # Games by type
            games_by_type = {}
            for session in sessions:
                game_type = session.game.type
                if game_type not in games_by_type:
                    games_by_type[game_type] = {
                        'count': 0,
                        'total_score': 0,
                        'average_score': 0,
                        'total_time_minutes': 0
                    }
                games_by_type[game_type]['count'] += 1
                games_by_type[game_type]['total_score'] += session.score or 0
                games_by_type[game_type]['total_time_minutes'] += (session.duration_seconds or 0) / 60
            
            # Calculate averages for each type
            for game_type in games_by_type:
                count = games_by_type[game_type]['count']
                games_by_type[game_type]['average_score'] = games_by_type[game_type]['total_score'] / count
            
            # Daily activity (sessions per day)
            daily_activity = []
            current_date = start_date.date()
            end_date_only = end_date.date()
            
            while current_date <= end_date_only:
                day_sessions = len([s for s in sessions if s.completed_at.date() == current_date])
                daily_activity.append({
                    'date': current_date.isoformat(),
                    'sessions': day_sessions,
                    'total_score': sum(s.score or 0 for s in sessions if s.completed_at.date() == current_date)
                })
                current_date += timedelta(days=1)
            
            # Performance trend calculation
            if len(sessions) >= 4:
                sorted_sessions = sorted(sessions, key=lambda s: s.completed_at)
                midpoint = len(sorted_sessions) // 2
                first_half = sorted_sessions[:midpoint]
                second_half = sorted_sessions[midpoint:]
                
                first_avg = sum(s.score or 0 for s in first_half) / len(first_half)
                second_avg = sum(s.score or 0 for s in second_half) / len(second_half)
                
                if first_avg > 0:
                    improvement_rate = ((second_avg - first_avg) / first_avg) * 100
                    if improvement_rate > 10:
                        performance_trend = 'improving'
                    elif improvement_rate < -10:
                        performance_trend = 'declining'
                    else:
                        performance_trend = 'stable'
                else:
                    performance_trend = 'stable'
                    improvement_rate = 0
            else:
                performance_trend = 'stable'
                improvement_rate = 0
            
            return {
                'total_sessions': total_sessions,
                'total_time_hours': round(total_time_hours, 2),
                'average_score': round(average_score, 2),
                'highest_score': highest_score,
                'average_duration_minutes': round(average_duration_minutes, 2),
                'games_by_type': games_by_type,
                'daily_activity': daily_activity,
                'performance_trend': performance_trend,
                'improvement_rate': round(improvement_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting game analytics: {str(e)}")
            return {
                'total_sessions': 0,
                'total_time_hours': 0,
                'average_score': 0,
                'highest_score': 0,
                'average_duration_minutes': 0,
                'games_by_type': {},
                'daily_activity': [],
                'performance_trend': 'stable',
                'improvement_rate': 0
            }
    
    @staticmethod
    def _get_achievement_analytics(user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get achievement analytics for user"""
        try:
            # Total achievements earned in period
            achievements_earned_period = UserAchievement.query.filter(
                UserAchievement.user_id == user_id,
                UserAchievement.earned_at >= start_date,
                UserAchievement.earned_at <= end_date
            ).count()
            
            # Total achievements earned overall
            total_achievements_earned = UserAchievement.query.filter(
                UserAchievement.user_id == user_id
            ).count()
            
            # Total achievements available
            total_achievements_available = Achievement.query.filter(
                Achievement.is_active == True
            ).count()
            
            # Achievement completion rate
            completion_rate = (total_achievements_earned / total_achievements_available * 100) if total_achievements_available > 0 else 0
            
            # Recent achievements
            recent_achievements = UserAchievement.query.filter(
                UserAchievement.user_id == user_id
            ).order_by(UserAchievement.earned_at.desc()).limit(5).all()
            
            recent_list = []
            for ua in recent_achievements:
                recent_list.append({
                    'name': ua.achievement.name,
                    'description': ua.achievement.description,
                    'points': ua.achievement.points,
                    'earned_at': ua.earned_at.isoformat() if ua.earned_at else None,
                    'badge_level': ua.achievement.badge_level
                })
            
            return {
                'achievements_earned_period': achievements_earned_period,
                'total_achievements_earned': total_achievements_earned,
                'total_achievements_available': total_achievements_available,
                'completion_rate': round(completion_rate, 2),
                'recent_achievements': recent_list
            }
            
        except Exception as e:
            logger.error(f"Error getting achievement analytics: {str(e)}")
            return {
                'achievements_earned_period': 0,
                'total_achievements_earned': 0,
                'total_achievements_available': 0,
                'completion_rate': 0,
                'recent_achievements': []
            }
    
    @staticmethod
    def _get_progress_metrics(user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Calculate overall progress metrics"""
        try:
            period_days = (end_date - start_date).days
            
            # Activity consistency (days with activity)
            active_days_query = db.session.query(
                func.count(func.distinct(func.date(GameSession.completed_at)))
            ).filter(
                GameSession.player_id == user_id,
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            )
            
            active_days = active_days_query.scalar() or 0
            activity_consistency_percent = (active_days / period_days * 100) if period_days > 0 else 0
            
            # Engagement score based on sessions per active day
            total_sessions = GameSession.query.filter(
                GameSession.player_id == user_id,
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            ).count()
            
            sessions_per_day = total_sessions / active_days if active_days > 0 else 0
            
            # Normalize engagement score (0-100)
            # 1 session per day = 20 points, 3+ sessions per day = 100 points
            engagement_score = min(100, sessions_per_day * 33.33)
            
            # Activity trend
            if period_days >= 7:
                # Compare first half vs second half
                midpoint = start_date + timedelta(days=period_days // 2)
                
                first_half_sessions = GameSession.query.filter(
                    GameSession.player_id == user_id,
                    GameSession.completed_at >= start_date,
                    GameSession.completed_at <= midpoint,
                    GameSession.completed == True
                ).count()
                
                second_half_sessions = GameSession.query.filter(
                    GameSession.player_id == user_id,
                    GameSession.completed_at > midpoint,
                    GameSession.completed_at <= end_date,
                    GameSession.completed == True
                ).count()
                
                if first_half_sessions == 0 and second_half_sessions > 0:
                    activity_trend = 'increasing'
                elif first_half_sessions > 0:
                    change_rate = ((second_half_sessions - first_half_sessions) / first_half_sessions) * 100
                    if change_rate > 20:
                        activity_trend = 'increasing'
                    elif change_rate < -20:
                        activity_trend = 'decreasing'
                    else:
                        activity_trend = 'stable'
                else:
                    activity_trend = 'stable'
            else:
                activity_trend = 'stable'
            
            return {
                'active_days': active_days,
                'activity_consistency_percent': round(activity_consistency_percent, 2),
                'engagement_score': round(engagement_score, 2),
                'activity_trend': activity_trend,
                'sessions_per_active_day': round(sessions_per_day, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting progress metrics: {str(e)}")
            return {
                'active_days': 0,
                'activity_consistency_percent': 0,
                'engagement_score': 0,
                'activity_trend': 'stable',
                'sessions_per_active_day': 0
            }
    
    @staticmethod
    def _generate_summary_insights(game_stats: Dict, achievement_stats: Dict, progress_stats: Dict) -> Dict[str, Any]:
        """Generate summary insights and recommendations"""
        insights = []
        recommendations = []
        areas_of_strength = []
        areas_for_improvement = []
        
        # Analyze game performance
        if game_stats['total_sessions'] > 0:
            if game_stats['improvement_rate'] > 15:
                insights.append("Your performance is improving significantly!")
                areas_of_strength.append("Performance improvement")
            elif game_stats['improvement_rate'] < -15:
                insights.append("Your recent performance shows room for improvement.")
                areas_for_improvement.append("Performance consistency")
                recommendations.append("Try focusing on easier difficulty levels to build confidence.")
            
            if game_stats['average_score'] > 500:
                areas_of_strength.append("High scoring performance")
            
            # Analyze game variety
            game_types_played = len(game_stats['games_by_type'])
            if game_types_played >= 3:
                areas_of_strength.append("Good game variety")
            else:
                recommendations.append("Try exploring different types of cognitive games.")
        
        # Analyze activity consistency
        if progress_stats['activity_consistency_percent'] > 70:
            insights.append("Excellent activity consistency!")
            areas_of_strength.append("Regular engagement")
        elif progress_stats['activity_consistency_percent'] < 30:
            insights.append("Consider establishing a more regular practice routine.")
            areas_for_improvement.append("Activity consistency")
            recommendations.append("Try setting a daily reminder to play at least one game.")
        
        # Analyze engagement
        if progress_stats['engagement_score'] > 70:
            areas_of_strength.append("High engagement level")
        elif progress_stats['engagement_score'] < 40:
            areas_for_improvement.append("Engagement level")
            recommendations.append("Try shorter, more frequent sessions to build momentum.")
        
        # Achievement progress
        if achievement_stats['completion_rate'] > 50:
            areas_of_strength.append("Achievement progress")
        elif achievement_stats['achievements_earned_period'] == 0:
            recommendations.append("Focus on earning some achievements to track your progress.")
        
        return {
            'insights': insights,
            'recommendations': recommendations,
            'areas_of_strength': areas_of_strength,
            'areas_for_improvement': areas_for_improvement
        }
    
    @staticmethod
    def _get_empty_analytics(user_id: str, days: int) -> Dict[str, Any]:
        """Return empty analytics structure for error cases"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        return {
            'user_id': user_id,
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'games': {
                'total_sessions': 0,
                'total_time_hours': 0,
                'average_score': 0,
                'highest_score': 0,
                'average_duration_minutes': 0,
                'games_by_type': {},
                'daily_activity': [],
                'performance_trend': 'stable',
                'improvement_rate': 0
            },
            'therapy': {
                'total_sessions': 0,
                'total_time_hours': 0,
                'average_effectiveness': 0,
                'mood_improvement': {
                    'improvement_rate': 0,
                    'sessions_with_improvement': 0,
                    'total_mood_sessions': 0
                }
            },
            'achievements': {
                'achievements_earned_period': 0,
                'total_achievements_earned': 0,
                'total_achievements_available': 0,
                'completion_rate': 0,
                'recent_achievements': []
            },
            'progress': {
                'active_days': 0,
                'activity_consistency_percent': 0,
                'engagement_score': 0,
                'activity_trend': 'stable',
                'sessions_per_active_day': 0
            },
            'summary': {
                'insights': [],
                'recommendations': [],
                'areas_of_strength': [],
                'areas_for_improvement': []
            }
        }
    
    @staticmethod
    def get_system_analytics(days: int = 30) -> Dict[str, Any]:
        """Get system-wide analytics"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Total users and sessions
            total_users = User.query.count()
            total_sessions = GameSession.query.filter(
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            ).count()
            
            # Active users in period
            active_users = db.session.query(
                func.count(func.distinct(GameSession.player_id))
            ).filter(
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            ).scalar() or 0
            
            return {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'users': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'engagement_rate': (active_users / total_users * 100) if total_users > 0 else 0
                },
                'sessions': {
                    'total_sessions': total_sessions,
                    'sessions_per_user': total_sessions / active_users if active_users > 0 else 0
                }
            }
        except Exception as e:
            logger.error(f"Error getting system analytics: {str(e)}")
            return {
                'users': {'total_users': 0, 'active_users': 0, 'engagement_rate': 0},
                'sessions': {'total_sessions': 0, 'sessions_per_user': 0}
            }
    
    @staticmethod
    def get_user_analytics_custom_period(user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get analytics for a custom time period"""
        try:
            game_stats = AnalyticsService._get_game_analytics(user_id, start_date, end_date)
            achievement_stats = AnalyticsService._get_achievement_analytics(user_id, start_date, end_date)
            progress_stats = AnalyticsService._get_progress_metrics(user_id, start_date, end_date)
            
            return {
                'user_id': user_id,
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': (end_date - start_date).days
                },
                'games': game_stats,
                'achievements': achievement_stats,
                'progress': progress_stats
            }
        except Exception as e:
            logger.error(f"Error getting custom period analytics: {str(e)}")
            return AnalyticsService._get_empty_analytics(user_id, (end_date - start_date).days)
    
    @staticmethod
    def calculate_percentage_change(old_value: float, new_value: float) -> float:
        """Calculate percentage change between two values"""
        if old_value == 0:
            return 100.0 if new_value > 0 else 0.0
        return ((new_value - old_value) / old_value) * 100
    
    @staticmethod
    def get_trend_analysis(user_id: str, metric: str, period_days: int) -> Dict[str, Any]:
        """Get trend analysis for specific metrics"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=period_days)
            
            # Get sessions for trend analysis
            sessions = GameSession.query.filter(
                GameSession.player_id == user_id,
                GameSession.completed_at >= start_date,
                GameSession.completed_at <= end_date,
                GameSession.completed == True
            ).order_by(GameSession.completed_at).all()
            
            if not sessions:
                return {'data_points': [], 'trend': 'no_data'}
            
            if metric == 'performance':
                return AnalyticsService._get_performance_trend(sessions, period_days)
            elif metric == 'activity':
                return AnalyticsService._get_activity_trend(sessions, start_date, end_date)
            elif metric == 'mood':
                return AnalyticsService._get_mood_trend(sessions, period_days)
            else:
                return AnalyticsService._get_activity_trend(sessions, start_date, end_date)
            
        except Exception as e:
            logger.error(f"Error getting trend analysis: {str(e)}")
            return {'data_points': [], 'trend': 'no_data'}
    
    @staticmethod
    def _get_performance_trend(sessions: list, period_days: int) -> Dict[str, Any]:
        """Get performance trend data structured for frontend charts"""
        try:
            # Group sessions by week for better trend visualization
            weeks_data = {}
            
            for session in sessions:
                # Calculate week number from session date
                week_start = session.completed_at - timedelta(days=session.completed_at.weekday())
                week_key = week_start.strftime('%Y-W%W')
                period_label = f"Week {week_start.strftime('%m/%d')}"
                
                if week_key not in weeks_data:
                    weeks_data[week_key] = {
                        'period': period_label,
                        'scores': [],
                        'sessions': 0
                    }
                
                weeks_data[week_key]['scores'].append(session.score or 0)
                weeks_data[week_key]['sessions'] += 1
            
            # Calculate weekly averages
            data_points = []
            for week_key in sorted(weeks_data.keys()):
                data = weeks_data[week_key]
                avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
                
                data_points.append({
                    'period': data['period'],
                    'avg_score': round(avg_score, 2),
                    'total_sessions': data['sessions']
                })
            
            # Calculate trend
            if len(data_points) >= 2:
                first_score = data_points[0]['avg_score']
                last_score = data_points[-1]['avg_score']
                
                if first_score > 0:
                    change_percent = ((last_score - first_score) / first_score) * 100
                    if change_percent > 10:
                        trend = 'improving'
                    elif change_percent < -10:
                        trend = 'declining'
                    else:
                        trend = 'stable'
                else:
                    trend = 'stable'
            else:
                trend = 'stable'
            
            return {
                'data_points': data_points,
                'trend': trend,
                'metric': 'performance'
            }
            
        except Exception as e:
            logger.error(f"Error getting performance trend: {str(e)}")
            return {'data_points': [], 'trend': 'no_data'}
    
    @staticmethod
    def _get_activity_trend(sessions: list, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get activity trend data structured for frontend charts"""
        try:
            # Group by day for activity tracking
            daily_data = {}
            
            # Initialize all days in range
            current_date = start_date.date()
            end_date_only = end_date.date()
            
            while current_date <= end_date_only:
                daily_data[current_date.isoformat()] = {
                    'date': current_date.isoformat(),
                    'total_sessions': 0,
                    'total_score': 0
                }
                current_date += timedelta(days=1)
            
            # Fill in actual session data
            for session in sessions:
                date_key = session.completed_at.date().isoformat()
                if date_key in daily_data:
                    daily_data[date_key]['total_sessions'] += 1
                    daily_data[date_key]['total_score'] += session.score or 0
            
            # Convert to list sorted by date
            data_points = [daily_data[date_key] for date_key in sorted(daily_data.keys())]
            
            # Calculate trend
            if len(data_points) >= 7:
                # Compare first week vs last week
                first_week_sessions = sum(d['total_sessions'] for d in data_points[:7])
                last_week_sessions = sum(d['total_sessions'] for d in data_points[-7:])
                
                if first_week_sessions > 0:
                    change_percent = ((last_week_sessions - first_week_sessions) / first_week_sessions) * 100
                    if change_percent > 20:
                        trend = 'increasing'
                    elif change_percent < -20:
                        trend = 'decreasing'
                    else:
                        trend = 'stable'
                elif last_week_sessions > 0:
                    trend = 'increasing'
                else:
                    trend = 'stable'
            else:
                trend = 'stable'
            
            return {
                'data_points': data_points,
                'trend': trend,
                'metric': 'activity'
            }
            
        except Exception as e:
            logger.error(f"Error getting activity trend: {str(e)}")
            return {'data_points': [], 'trend': 'no_data'}
    
    @staticmethod
    def _get_mood_trend(sessions: list, period_days: int) -> Dict[str, Any]:
        """Get mood trend data (mock data since we don't have mood tracking in games)"""
        try:
            # Since this is a game app, we'll create mock mood data based on performance
            # Group by week
            weeks_data = {}
            
            for session in sessions:
                week_start = session.completed_at - timedelta(days=session.completed_at.weekday())
                week_key = week_start.strftime('%Y-W%W')
                week_label = f"Week {week_start.strftime('%m/%d')}"
                
                if week_key not in weeks_data:
                    weeks_data[week_key] = {
                        'week': week_label,
                        'scores': [],
                        'sessions': 0
                    }
                
                weeks_data[week_key]['scores'].append(session.score or 0)
                weeks_data[week_key]['sessions'] += 1
            
            # Create mock mood data based on performance
            data_points = []
            for week_key in sorted(weeks_data.keys()):
                data = weeks_data[week_key]
                avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
                
                # Mock mood scores based on performance (scale 1-10)
                # Higher game scores = better mood improvement
                base_mood = 5.0  # Neutral starting mood
                performance_factor = min(avg_score / 100, 5.0)  # Scale to 0-5
                
                avg_mood_before = round(base_mood + (performance_factor * 0.2), 1)
                avg_mood_after = round(base_mood + (performance_factor * 0.8), 1)
                
                data_points.append({
                    'week': data['week'],
                    'avg_mood_before': avg_mood_before,
                    'avg_mood_after': avg_mood_after,
                    'sessions': data['sessions']
                })
            
            return {
                'data_points': data_points,
                'trend': 'improving' if len(data_points) > 0 else 'no_data',
                'metric': 'mood'
            }
            
        except Exception as e:
            logger.error(f"Error getting mood trend: {str(e)}")
            return {'data_points': [], 'trend': 'no_data'}
    
    @staticmethod
    def convert_to_csv(analytics: Dict[str, Any]) -> str:
        """Convert analytics data to CSV format"""
        try:
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers and basic info
            writer.writerow(['MindFlex Analytics Export'])
            writer.writerow(['Generated:', datetime.utcnow().isoformat()])
            writer.writerow(['User ID:', analytics.get('user_id', 'Unknown')])
            writer.writerow(['Period:', f"{analytics.get('period', {}).get('days', 0)} days"])
            writer.writerow([])
            
            # Game statistics
            writer.writerow(['=== GAME STATISTICS ==='])
            games = analytics.get('games', {})
            writer.writerow(['Total Sessions:', games.get('total_sessions', 0)])
            writer.writerow(['Average Score:', games.get('average_score', 0)])
            writer.writerow(['Highest Score:', games.get('highest_score', 0)])
            writer.writerow(['Total Play Time (hours):', games.get('total_time_hours', 0)])
            writer.writerow([])
            
            # Achievement statistics
            writer.writerow(['=== ACHIEVEMENT STATISTICS ==='])
            achievements = analytics.get('achievements', {})
            writer.writerow(['Achievements Earned (Period):', achievements.get('achievements_earned_period', 0)])
            writer.writerow(['Total Achievements Earned:', achievements.get('total_achievements_earned', 0)])
            writer.writerow(['Completion Rate (%):', achievements.get('completion_rate', 0)])
            writer.writerow([])
            
            # Progress metrics
            writer.writerow(['=== PROGRESS METRICS ==='])
            progress = analytics.get('progress', {})
            writer.writerow(['Activity Consistency (%):', progress.get('activity_consistency_percent', 0)])
            writer.writerow(['Engagement Score:', progress.get('engagement_score', 0)])
            writer.writerow(['Activity Trend:', progress.get('activity_trend', 'stable')])
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error converting to CSV: {str(e)}")
            return "Error generating CSV export"