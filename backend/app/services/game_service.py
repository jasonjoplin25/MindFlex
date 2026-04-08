"""
Game service using PostgreSQL database
"""
from datetime import datetime, timedelta
from sqlalchemy import desc, func
from app.database import db
from app.models.game import Game, GameSession
from app.models.user import User
from app.models.achievement import Achievement, UserAchievement

class GameService:
    @staticmethod
    def get_all_games(include_inactive=False):
        """Get all available games."""
        try:
            query = Game.query
            if not include_inactive:
                query = query.filter_by(is_active=True)
            
            games = query.order_by(Game.name).all()
            return [game.to_dict() for game in games], 200
        except Exception as e:
            return {'error': f'Failed to get games: {str(e)}'}, 500
    
    @staticmethod
    def get_game_by_id(game_id):
        """Get a specific game by ID."""
        try:
            game = Game.query.filter_by(id=game_id, is_active=True).first()
            if not game:
                return {'error': 'Game not found'}, 404
            
            return game.to_dict(), 200
        except Exception as e:
            return {'error': f'Failed to get game: {str(e)}'}, 500
    
    @staticmethod
    def get_games_by_type(game_type):
        """Get games by type."""
        try:
            games = Game.find_by_type(game_type)
            return [game.to_dict() for game in games], 200
        except Exception as e:
            return {'error': f'Failed to get games by type: {str(e)}'}, 500
    
    @staticmethod
    def start_game_session(player_id, game_id, difficulty):
        """Start a new game session."""
        try:
            # Validate game exists
            game = Game.query.filter_by(id=game_id, is_active=True).first()
            if not game:
                return {'error': 'Game not found'}, 404
            
            # Validate difficulty
            if difficulty not in game.difficulty_levels:
                return {'error': f'Invalid difficulty. Available: {game.difficulty_levels}'}, 400
            
            # Create session
            session = GameSession(
                player_id=player_id,
                game_id=game_id,
                difficulty=difficulty,
                duration_seconds=0
            )
            
            db.session.add(session)
            db.session.commit()
            
            response_data = session.to_dict()
            response_data['game'] = game.to_dict()
            response_data['game_config'] = game.get_config_for_difficulty(difficulty)
            
            return response_data, 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to start game session: {str(e)}'}, 500
    
    @staticmethod
    def update_game_session(session_id, update_data):
        """Update a game session with progress."""
        try:
            session = GameSession.query.filter_by(id=session_id).first()
            if not session:
                return {'error': 'Session not found'}, 404
            
            # Define allowed fields that can be updated
            allowed_fields = ['score', 'duration_seconds', 'errors', 'session_data']
            
            # Update only allowed fields
            for key, value in update_data.items():
                if key in allowed_fields and hasattr(session, key):
                    if key == 'session_data':
                        # Merge session_data instead of replacing
                        current_data = session.session_data or {}
                        if isinstance(value, dict):
                            session.session_data = {**current_data, **value}
                        else:
                            session.session_data = value
                    else:
                        setattr(session, key, value)
            
            db.session.commit()
            return session.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            print(f"Error updating session {session_id}: {str(e)}")  # For debugging
            return {'error': f'Failed to update session: {str(e)}'}, 500
    
    @staticmethod
    def complete_game_session(session_id, final_score, session_data=None):
        """Complete a game session and check for achievements."""
        try:
            session = GameSession.query.filter_by(id=session_id).first()
            if not session:
                return {'error': 'Session not found'}, 404
            
            # Calculate max possible score based on game type
            max_possible_score = GameService._calculate_max_possible_score(session, session_data)
            
            # Check if the game was won (from session_data metadata)
            game_won = False
            if session_data and isinstance(session_data, dict):
                game_won = session_data.get('game_won', False)
            
            # Complete session
            session.complete_session(final_score, session_data, max_possible_score, game_won)
            db.session.commit()
            
            # Check achievements
            achievements_earned = GameService._check_achievements(session)
            
            response_data = session.to_dict()
            response_data['achievements_earned'] = achievements_earned
            
            return response_data, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to complete session: {str(e)}'}, 500
    
    @staticmethod
    def save_game_win(session_id, session_data):
        """Auto-save a game win with current session data."""
        try:
            session = GameSession.query.filter_by(id=session_id).first()
            if not session:
                return {'error': 'Session not found'}, 404
            
            # Calculate current score and max possible score
            current_score = session.score
            max_possible_score = GameService._calculate_max_possible_score(session, session_data)
            
            # Mark as won and update session data
            session.game_won = True
            if session_data:
                current_data = session.session_data or {}
                session.session_data = {**current_data, **session_data, 'game_won': True}
            
            # Update max possible score if not set
            if not session.max_possible_score:
                session.max_possible_score = max_possible_score
            
            db.session.commit()
            
            response_data = session.to_dict()
            response_data['win_auto_saved'] = True
            
            return response_data, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to save win: {str(e)}'}, 500
    
    @staticmethod
    def get_user_game_history(user_id, limit=10, game_type=None):
        """Get user's game history."""
        try:
            query = GameSession.query.filter_by(player_id=user_id, completed=True)
            
            if game_type:
                query = query.join(Game).filter(Game.type == game_type)
            
            sessions = query.order_by(desc(GameSession.completed_at)).limit(limit).all()
            
            history = []
            for session in sessions:
                session_data = session.to_dict()
                session_data['game'] = session.game.to_dict()
                history.append(session_data)
            
            return history, 200
        except Exception as e:
            return {'error': f'Failed to get game history: {str(e)}'}, 500
    
    @staticmethod
    def get_game_leaderboard(game_id=None, difficulty=None, limit=10, game_type=None):
        """Get game leaderboard."""
        try:
            query = GameSession.query.filter_by(completed=True)
            
            if game_id:
                query = query.filter_by(game_id=game_id)
            if difficulty:
                query = query.filter_by(difficulty=difficulty)
            if game_type:
                query = query.join(Game).filter(Game.type == game_type)
            
            sessions = query.order_by(desc(GameSession.score)).limit(limit).all()
            
            leaderboard = []
            for session in sessions:
                entry = session.to_dict()
                entry['player'] = session.player.to_dict()
                entry['game'] = session.game.to_dict()
                leaderboard.append(entry)
            
            return leaderboard, 200
        except Exception as e:
            return {'error': f'Failed to get leaderboard: {str(e)}'}, 500
    
    @staticmethod
    def get_user_stats(user_id, time_period_days=30):
        """Get user statistics."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)
            
            # Get sessions within time period
            sessions = GameSession.query.filter(
                GameSession.player_id == user_id,
                GameSession.completed == True,
                GameSession.completed_at >= cutoff_date
            ).all()
            
            if not sessions:
                return {
                    'total_games': 0,
                    'average_score': 0,
                    'average_duration': 0,
                    'games_by_type': {},
                    'improvement_trend': 0,
                    'best_scores': {},
                    'max_score': 0,
                    'perfect_games': 0,
                    'best_score_percent': 0,
                    'memory_games_completed': 0,
                    'word_games_completed': 0,
                    'reaction_games_completed': 0,
                    'math_games_completed': 0,
                    'pattern_games_completed': 0,
                    'consecutive_days': 0,
                    'time_period_days': time_period_days
                }, 200
            
            # Calculate statistics
            total_games = len(sessions)
            total_score = sum(s.score for s in sessions)
            total_duration = sum(s.duration_seconds for s in sessions)
            average_score = total_score / total_games if total_games > 0 else 0
            average_duration = total_duration / total_games if total_games > 0 else 0
            
            # Games by type
            games_by_type = {}
            for session in sessions:
                game_type = session.game.type
                if game_type not in games_by_type:
                    games_by_type[game_type] = 0
                games_by_type[game_type] += 1
            
            # Best scores by game type
            best_scores = {}
            for session in sessions:
                game_type = session.game.type
                if game_type not in best_scores or session.score > best_scores[game_type]['score']:
                    best_scores[game_type] = {
                        'score': session.score,
                        'game_name': session.game.name,
                        'difficulty': session.difficulty,
                        'date': session.completed_at.isoformat() if session.completed_at else None
                    }
            
            # Calculate improvement trend (simple linear trend)
            improvement_trend = 0
            if total_games >= 4:
                sorted_sessions = sorted(sessions, key=lambda s: s.completed_at)
                midpoint = total_games // 2
                first_half = sorted_sessions[:midpoint]
                second_half = sorted_sessions[midpoint:]
                
                first_avg = sum(s.score for s in first_half) / len(first_half)
                second_avg = sum(s.score for s in second_half) / len(second_half)
                
                if first_avg > 0:
                    improvement_trend = ((second_avg - first_avg) / first_avg) * 100
            
            # Calculate additional achievement-relevant stats
            max_score = max(s.score for s in sessions) if sessions else 0
            perfect_games = len([s for s in sessions if s.errors == 0]) if sessions else 0
            
            # Calculate best score percentage (only for sessions that have max_possible_score)
            best_score_percent = 0
            if sessions:
                score_percentages = []
                for s in sessions:
                    if s.max_possible_score and s.max_possible_score > 0:
                        percentage = (s.score / s.max_possible_score) * 100
                        score_percentages.append(percentage)
                if score_percentages:
                    best_score_percent = max(score_percentages)
            
            # Count games by type for progress tracking
            memory_games = len([s for s in sessions if s.game.type == 'memory']) if sessions else 0
            word_games = len([s for s in sessions if s.game.type == 'word']) if sessions else 0
            reaction_games = len([s for s in sessions if s.game.type == 'reaction']) if sessions else 0
            math_games = len([s for s in sessions if s.game.type == 'math']) if sessions else 0
            pattern_games = len([s for s in sessions if s.game.type == 'pattern']) if sessions else 0
            
            # Get consecutive days for achievements
            achievement_context = GameService._get_user_achievement_context(user_id)
            consecutive_days = achievement_context.get('consecutive_days', 0)
            
            return {
                'total_games': total_games,
                'average_score': round(average_score, 2),
                'average_duration': round(average_duration, 2),
                'games_by_type': games_by_type,
                'improvement_trend': round(improvement_trend, 2),
                'best_scores': best_scores,
                'max_score': max_score,
                'perfect_games': perfect_games,
                'best_score_percent': round(best_score_percent, 2),
                'memory_games_completed': memory_games,
                'word_games_completed': word_games,
                'reaction_games_completed': reaction_games,
                'math_games_completed': math_games,
                'pattern_games_completed': pattern_games,
                'consecutive_days': consecutive_days,
                'time_period_days': time_period_days
            }, 200
            
        except Exception as e:
            return {'error': f'Failed to get user stats: {str(e)}'}, 500
    
    @staticmethod
    def _check_achievements(session):
        """Check if user earned any achievements from this session."""
        try:
            user_id = session.player_id
            achievements_earned = []
            
            # Get all active achievements
            achievements = Achievement.get_active_achievements()
            
            for achievement in achievements:
                # Skip if user already has this achievement
                if UserAchievement.user_has_achievement(user_id, achievement.id):
                    continue
                
                # Calculate score percentage
                score_percent = 0
                if session.max_possible_score and session.max_possible_score > 0:
                    score_percent = (session.score / session.max_possible_score) * 100
                
                # Prepare user data for checking criteria
                user_data = {
                    'game_type': session.game.type,
                    'score': session.score,
                    'score_percent': score_percent,
                    'min_score_percent': score_percent,  # For achievements using min_score_percent
                    'duration': session.duration_seconds,
                    'errors': session.errors,
                    'completed': session.completed,
                    'difficulty': session.difficulty
                }
                
                # Add additional context data
                user_data.update(GameService._get_user_achievement_context(user_id))
                
                # Check if criteria is met
                if achievement.check_criteria(user_data):
                    # Award achievement
                    user_achievement = UserAchievement(
                        user_id=user_id,
                        achievement_id=achievement.id,
                        metadata={'earned_from_session': str(session.id)}
                    )
                    db.session.add(user_achievement)
                    achievements_earned.append(achievement.to_dict())
            
            db.session.commit()
            return achievements_earned
            
        except Exception as e:
            db.session.rollback()
            print(f"Error checking achievements: {e}")
            return []
    
    @staticmethod
    def _get_user_achievement_context(user_id):
        """Get additional context for achievement checking."""
        try:
            # Get total games completed
            total_games = GameSession.query.filter_by(
                player_id=user_id, completed=True
            ).count()
            
            # Calculate consecutive days properly
            consecutive_days = 0
            
            # Get all completed sessions ordered by completion date
            all_sessions = GameSession.query.filter(
                GameSession.player_id == user_id,
                GameSession.completed == True,
                GameSession.completed_at != None
            ).order_by(GameSession.completed_at.desc()).all()
            
            if all_sessions:
                # Get unique dates when user played (most recent first)
                unique_dates = sorted(list(set(
                    s.completed_at.date() for s in all_sessions
                )), reverse=True)
                
                if unique_dates:
                    today = datetime.utcnow().date()
                    current_date = unique_dates[0]  # Most recent play date
                    
                    # Start counting from the most recent play date
                    for i, play_date in enumerate(unique_dates):
                        expected_date = unique_dates[0] - timedelta(days=i)
                        
                        if play_date == expected_date:
                            consecutive_days += 1
                        else:
                            break
                    
                    # If the most recent play date is not today or yesterday, reset to 0
                    days_since_last_play = (today - current_date).days
                    if days_since_last_play > 1:
                        consecutive_days = 0
            
            return {
                'games_completed': total_games,
                'consecutive_days': consecutive_days
            }
        except:
            return {'games_completed': 0, 'consecutive_days': 0}
    
    @staticmethod
    def _calculate_max_possible_score(session, session_data=None):
        """Calculate the maximum possible score for a game session."""
        try:
            game_type = session.game.type
            difficulty = session.difficulty
            
            # Define max possible scores for different game types and difficulties
            max_scores = {
                'memory': {
                    'easy': 1000,    # 3x4 grid, 6 pairs
                    'medium': 1600,  # 4x4 grid, 8 pairs  
                    'hard': 2400     # 4x6 grid, 12 pairs
                },
                'word': {
                    'easy': 1000,    # 10 words at 100 points each
                    'medium': 1500,  # 10 words at 150 points each
                    'hard': 2000     # 10 words at 200 points each
                },
                'reaction': {
                    'easy': 1000,    # 10 rounds at 100 points each (perfect timing)
                    'medium': 1000,  # Same rounds, same max score
                    'hard': 1000     # Same rounds, same max score
                },
                'math': {
                    'easy': 1000,    # 20 problems at 50 points each
                    'medium': 1500,  # 20 problems at 75 points each
                    'hard': 2000     # 20 problems at 100 points each
                },
                'pattern': {
                    'easy': 1000,    # 10 patterns at 100 points each
                    'medium': 1500,  # 10 patterns at 150 points each
                    'hard': 2000     # 10 patterns at 200 points each
                }
            }
            
            return max_scores.get(game_type, {}).get(difficulty, 1000)
            
        except Exception:
            # Fallback to default max score
            return 1000