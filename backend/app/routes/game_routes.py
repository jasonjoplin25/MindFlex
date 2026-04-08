"""
Game routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from datetime import datetime
from app.services.game_service import GameService
import uuid

# Create blueprint
bp = Blueprint('games', __name__, url_prefix='/api/games')

# Validation schemas
class StartGameSchema(Schema):
    game_id = fields.UUID(required=True)
    difficulty = fields.Str(required=True, validate=lambda x: x in ['easy', 'medium', 'hard'])

class UpdateSessionSchema(Schema):
    score = fields.Int(load_default=None)
    duration_seconds = fields.Int(load_default=None)
    errors = fields.Int(load_default=None)
    session_data = fields.Dict(load_default=None)

class CompleteGameSchema(Schema):
    final_score = fields.Int(required=True)
    session_data = fields.Dict(load_default=None)

class SaveWinSchema(Schema):
    session_data = fields.Dict(required=True)

class CreateCustomMissionSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    grid_size = fields.Int(required=True)
    grid_data = fields.List(fields.List(fields.Raw()), required=True)  # 2D array
    animal_type = fields.Str(required=True)
    is_public = fields.Bool(load_default=False)

class UpdateCustomMissionSchema(Schema):
    name = fields.Str(load_default=None, validate=lambda x: x is None or len(x.strip()) > 0)
    grid_data = fields.List(fields.List(fields.Raw()), load_default=None)
    animal_type = fields.Str(load_default=None)
    is_public = fields.Bool(load_default=None)

@bp.route('/', methods=['GET'])
def get_games():
    """Get all available games."""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        result, status_code = GameService.get_all_games(include_inactive)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get games: {str(e)}'}), 500

@bp.route('/<game_id>', methods=['GET'])
def get_game(game_id):
    """Get a specific game by ID."""
    try:
        # Validate UUID
        uuid.UUID(game_id)
        
        result, status_code = GameService.get_game_by_id(game_id)
        return jsonify(result), status_code
        
    except ValueError:
        return jsonify({'error': 'Invalid game ID format'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to get game: {str(e)}'}), 500

@bp.route('/type/<game_type>', methods=['GET'])
def get_games_by_type(game_type):
    """Get games by type."""
    try:
        result, status_code = GameService.get_games_by_type(game_type)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get games by type: {str(e)}'}), 500

@bp.route('/sessions/start', methods=['POST'])
@jwt_required()
def start_game_session():
    """Start a new game session."""
    try:
        schema = StartGameSchema()
        data = schema.load(request.json)
        
        user_id = get_jwt_identity()
        result, status_code = GameService.start_game_session(
            user_id, 
            data['game_id'], 
            data['difficulty']
        )
        return jsonify(result), status_code
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to start game session: {str(e)}'}), 500

@bp.route('/sessions/<session_id>', methods=['PUT'])
@jwt_required()
def update_game_session(session_id):
    """Update a game session with progress."""
    try:
        # Validate UUID
        uuid.UUID(session_id)
        
        schema = UpdateSessionSchema()
        data = schema.load(request.json)
        
        result, status_code = GameService.update_game_session(session_id, data)
        return jsonify(result), status_code
        
    except ValueError:
        return jsonify({'error': 'Invalid session ID format'}), 400
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to update session: {str(e)}'}), 500

@bp.route('/sessions/<session_id>/complete', methods=['POST'])
@jwt_required()
def complete_game_session(session_id):
    """Complete a game session."""
    try:
        # Validate UUID
        uuid.UUID(session_id)
        
        schema = CompleteGameSchema()
        data = schema.load(request.json)
        
        result, status_code = GameService.complete_game_session(
            session_id, 
            data['final_score'], 
            data.get('session_data')
        )
        return jsonify(result), status_code
        
    except ValueError:
        return jsonify({'error': 'Invalid session ID format'}), 400
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to complete session: {str(e)}'}), 500

@bp.route('/history', methods=['GET'])
@jwt_required()
def get_user_game_history():
    """Get user's game history."""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)
        game_type = request.args.get('game_type')
        
        result, status_code = GameService.get_user_game_history(user_id, limit, game_type)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get game history: {str(e)}'}), 500

@bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get game leaderboard."""
    try:
        game_id = request.args.get('game_id')
        difficulty = request.args.get('difficulty')
        game_type = request.args.get('game_type')
        limit = request.args.get('limit', 10, type=int)
        
        # Validate game_id if provided
        if game_id:
            uuid.UUID(game_id)
        
        result, status_code = GameService.get_game_leaderboard(
            game_id, difficulty, limit, game_type
        )
        return jsonify(result), status_code
        
    except ValueError:
        return jsonify({'error': 'Invalid game ID format'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to get leaderboard: {str(e)}'}), 500

@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user game statistics."""
    try:
        user_id = get_jwt_identity()
        time_period_days = request.args.get('time_period_days', 30, type=int)
        
        result, status_code = GameService.get_user_stats(user_id, time_period_days)
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user stats: {str(e)}'}), 500

@bp.route('/sessions/<session_id>/save-win', methods=['POST'])
@jwt_required()
def save_game_win(session_id):
    """Auto-save a game win without requiring score submission."""
    try:
        # Validate UUID
        uuid.UUID(session_id)
        
        schema = SaveWinSchema()
        data = schema.load(request.json)
        
        result, status_code = GameService.save_game_win(session_id, data['session_data'])
        return jsonify(result), status_code
        
    except ValueError:
        return jsonify({'error': 'Invalid session ID format'}), 400
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to save win: {str(e)}'}), 500

# Custom Mission Endpoints

@bp.route('/missions', methods=['POST'])
@jwt_required()
def create_custom_mission():
    """Create a new custom mission."""
    try:
        user_id = get_jwt_identity()
        schema = CreateCustomMissionSchema()
        data = schema.load(request.json)
        
        from app.models.game import CustomMission
        from app.database import db
        
        # Create new custom mission
        mission = CustomMission(
            name=data['name'].strip(),
            creator_id=user_id,
            grid_size=data['grid_size'],
            grid_data=data['grid_data'],
            animal_type=data['animal_type'],
            is_public=data.get('is_public', False)
        )
        
        db.session.add(mission)
        db.session.commit()
        
        return jsonify({
            'message': 'Custom mission created successfully',
            'mission': mission.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to create custom mission: {str(e)}'}), 500

@bp.route('/missions', methods=['GET'])
@jwt_required()
def get_user_custom_missions():
    """Get user's custom missions."""
    try:
        user_id = get_jwt_identity()
        include_public = request.args.get('include_public', 'false').lower() == 'true'
        
        from app.models.game import CustomMission
        
        # Get user's missions
        user_missions = CustomMission.get_user_missions(user_id)
        missions_data = [mission.to_dict() for mission in user_missions]
        
        # Optionally include public missions from other users
        if include_public:
            public_missions = CustomMission.get_public_missions()
            # Filter out user's own public missions to avoid duplicates
            other_public = [m.to_dict() for m in public_missions if str(m.creator_id) != str(user_id)]
            missions_data.extend(other_public)
        
        return jsonify({
            'missions': missions_data,
            'count': len(missions_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get custom missions: {str(e)}'}), 500

@bp.route('/missions/<mission_id>', methods=['GET'])
@jwt_required()
def get_custom_mission(mission_id):
    """Get a specific custom mission."""
    try:
        user_id = get_jwt_identity()
        uuid.UUID(mission_id)
        
        from app.models.game import CustomMission
        
        mission = CustomMission.query.filter_by(id=mission_id).first()
        if not mission:
            return jsonify({'error': 'Custom mission not found'}), 404
            
        # Check if user has access (owner or public mission)
        if str(mission.creator_id) != str(user_id) and not mission.is_public:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'mission': mission.to_dict()
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid mission ID format'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to get custom mission: {str(e)}'}), 500

@bp.route('/missions/<mission_id>', methods=['PUT'])
@jwt_required()
def update_custom_mission(mission_id):
    """Update a custom mission."""
    try:
        user_id = get_jwt_identity()
        uuid.UUID(mission_id)
        
        schema = UpdateCustomMissionSchema()
        data = schema.load(request.json)
        
        from app.models.game import CustomMission
        from app.database import db
        
        mission = CustomMission.query.filter_by(id=mission_id, creator_id=user_id).first()
        if not mission:
            return jsonify({'error': 'Custom mission not found or access denied'}), 404
        
        # Update fields
        if 'name' in data and data['name']:
            mission.name = data['name'].strip()
        if 'grid_data' in data and data['grid_data']:
            mission.grid_data = data['grid_data']
        if 'animal_type' in data and data['animal_type']:
            mission.animal_type = data['animal_type']
        if 'is_public' in data:
            mission.is_public = data['is_public']
        
        mission.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Custom mission updated successfully',
            'mission': mission.to_dict()
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid mission ID format'}), 400
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to update custom mission: {str(e)}'}), 500

@bp.route('/missions/<mission_id>', methods=['DELETE'])
@jwt_required()
def delete_custom_mission(mission_id):
    """Delete a custom mission."""
    try:
        user_id = get_jwt_identity()
        uuid.UUID(mission_id)
        
        from app.models.game import CustomMission
        from app.database import db
        
        mission = CustomMission.query.filter_by(id=mission_id, creator_id=user_id).first()
        if not mission:
            return jsonify({'error': 'Custom mission not found or access denied'}), 404
        
        db.session.delete(mission)
        db.session.commit()
        
        return jsonify({
            'message': 'Custom mission deleted successfully'
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid mission ID format'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to delete custom mission: {str(e)}'}), 500

@bp.route('/missions/migrate-from-localStorage', methods=['POST'])
@jwt_required()
def migrate_localStorage_missions():
    """Migrate missions from localStorage to database."""
    try:
        user_id = get_jwt_identity()
        missions_data = request.json.get('missions', [])
        
        if not missions_data:
            return jsonify({'error': 'No missions data provided'}), 400
        
        from app.models.game import CustomMission
        from app.database import db
        
        migrated_count = 0
        errors = []
        
        for mission_data in missions_data:
            try:
                # Extract animal type from grid data
                animal_type = 'turtle'  # default
                grid_data = mission_data.get('grid', [])
                
                # Scan grid to find animal type
                animal_types = [
                    'turtle', 'ladybug', 'spider', 'butterfly', 'bee', 'feather', 'penguin',
                    'flamingo', 'owl', 'parrot', 'swan', 'lobster', 'lizard', 'squirrel',
                    'rabbit', 'hedgehog', 'mouse', 'skunk', 'cat', 'monkey', 'poodle'
                ]
                
                for row in grid_data:
                    for cell in row:
                        if cell in animal_types:
                            animal_type = cell
                            break
                    if animal_type != 'turtle':
                        break
                
                # Create mission
                mission = CustomMission(
                    name=mission_data.get('name', 'Migrated Mission'),
                    creator_id=user_id,
                    grid_size=mission_data.get('gridSize', len(grid_data)),
                    grid_data=grid_data,
                    animal_type=animal_type,
                    is_public=False
                )
                
                db.session.add(mission)
                migrated_count += 1
                
            except Exception as e:
                errors.append(f"Failed to migrate mission '{mission_data.get('name', 'Unknown')}': {str(e)}")
        
        if migrated_count > 0:
            db.session.commit()
        
        return jsonify({
            'message': f'Migration completed. {migrated_count} missions migrated.',
            'migrated_count': migrated_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Migration failed: {str(e)}'}), 500


# Mission Progress Endpoints

class SaveMissionProgressSchema(Schema):
    campaign_type = fields.Str(required=True, validate=lambda x: x in ['easy', 'medium', 'hard'])
    mission_number = fields.Int(required=True, validate=lambda x: 1 <= x <= 10)
    score = fields.Int(load_default=0)
    duration_seconds = fields.Int(load_default=0)
    session_data = fields.Dict(load_default=None)

@bp.route('/mission-progress', methods=['POST'])
@jwt_required()
def save_mission_progress():
    """Save or update mission progress for a user."""
    try:
        user_id = get_jwt_identity()
        schema = SaveMissionProgressSchema()
        data = schema.load(request.json)
        
        from app.models.game import MissionProgress
        from app.database import db
        
        # Create or update mission progress
        progress = MissionProgress.create_or_update_progress(
            user_id=user_id,
            campaign_type=data['campaign_type'],
            mission_number=data['mission_number'],
            score=data.get('score', 0),
            duration_seconds=data.get('duration_seconds', 0),
            session_data=data.get('session_data')
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Mission progress saved successfully',
            'progress': progress.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': 'Validation error', 'details': e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save mission progress: {str(e)}'}), 500

@bp.route('/mission-progress', methods=['GET'])
@jwt_required()
def get_mission_progress():
    """Get user's mission progress."""
    try:
        user_id = get_jwt_identity()
        campaign_type = request.args.get('campaign_type')
        
        from app.models.game import MissionProgress
        
        if campaign_type:
            # Get progress for specific campaign
            progress_list = MissionProgress.get_user_campaign_progress(user_id, campaign_type)
        else:
            # Get all progress
            progress_list = MissionProgress.get_user_all_progress(user_id)
        
        # Convert to dict and organize by campaign
        progress_data = {}
        for progress in progress_list:
            campaign = progress.campaign_type
            if campaign not in progress_data:
                progress_data[campaign] = []
            progress_data[campaign].append(progress.to_dict())
        
        return jsonify({
            'progress': progress_data,
            'total_missions': len(progress_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get mission progress: {str(e)}'}), 500

@bp.route('/mission-progress/check/<campaign_type>/<int:mission_number>', methods=['GET'])
@jwt_required()
def check_mission_completed(campaign_type, mission_number):
    """Check if a specific mission is completed."""
    try:
        user_id = get_jwt_identity()
        
        # Validate parameters
        if campaign_type not in ['easy', 'medium', 'hard']:
            return jsonify({'error': 'Invalid campaign type'}), 400
        if not (1 <= mission_number <= 10):
            return jsonify({'error': 'Invalid mission number'}), 400
        
        from app.models.game import MissionProgress
        
        is_completed = MissionProgress.is_mission_completed(user_id, campaign_type, mission_number)
        completed_count = MissionProgress.get_completed_missions_count(user_id, campaign_type)
        
        return jsonify({
            'completed': is_completed,
            'campaign_progress': {
                'campaign_type': campaign_type,
                'completed_missions': completed_count,
                'total_missions': 10
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to check mission status: {str(e)}'}), 500