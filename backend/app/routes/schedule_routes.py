"""
Schedule item routes for AAC Communication System
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app.models.schedule_item import ScheduleItem
from app.models.user import User
from app.database import db
from datetime import datetime

# Create blueprint
bp = Blueprint('schedule', __name__, url_prefix='/api/schedule')

# Validation schemas
class ScheduleItemSchema(Schema):
    emoji = fields.Str(required=True, validate=lambda x: len(x) <= 10)
    text = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    time = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    order_index = fields.Int(load_default=0)

class UpdateScheduleItemSchema(Schema):
    emoji = fields.Str(validate=lambda x: len(x) <= 10)
    text = fields.Str(validate=lambda x: len(x.strip()) > 0)
    time = fields.Str(validate=lambda x: len(x.strip()) > 0)
    completed = fields.Bool()
    order_index = fields.Int()

@bp.route('/', methods=['GET'])
@jwt_required()
def get_schedule_items():
    """Get all schedule items for the current user."""
    try:
        user_id = get_jwt_identity()
        
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get schedule items ordered by order_index
        schedule_items = ScheduleItem.query.filter_by(user_id=user_id).order_by(ScheduleItem.order_index).all()
        
        return jsonify([item.to_dict() for item in schedule_items]), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get schedule items: {str(e)}'}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_schedule_item():
    """Create a new schedule item."""
    try:
        user_id = get_jwt_identity()
        
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Validate request data
        schema = ScheduleItemSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return jsonify({'error': 'Validation error', 'details': e.messages}), 400
        
        # Create new schedule item
        schedule_item = ScheduleItem(
            user_id=user_id,
            emoji=data['emoji'],
            text=data['text'],
            time=data['time'],
            order_index=data['order_index']
        )
        
        db.session.add(schedule_item)
        db.session.commit()
        
        return jsonify(schedule_item.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create schedule item: {str(e)}'}), 500

@bp.route('/<item_id>', methods=['PUT'])
@jwt_required()
def update_schedule_item(item_id):
    """Update a schedule item."""
    try:
        user_id = get_jwt_identity()
        
        # Find the schedule item
        schedule_item = ScheduleItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not schedule_item:
            return jsonify({'error': 'Schedule item not found'}), 404
        
        # Validate request data
        schema = UpdateScheduleItemSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return jsonify({'error': 'Validation error', 'details': e.messages}), 400
        
        # Update fields
        for field, value in data.items():
            if hasattr(schedule_item, field):
                setattr(schedule_item, field, value)
        
        schedule_item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(schedule_item.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update schedule item: {str(e)}'}), 500

@bp.route('/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule_item(item_id):
    """Delete a schedule item."""
    try:
        user_id = get_jwt_identity()
        
        # Find the schedule item
        schedule_item = ScheduleItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not schedule_item:
            return jsonify({'error': 'Schedule item not found'}), 404
        
        db.session.delete(schedule_item)
        db.session.commit()
        
        return jsonify({'message': 'Schedule item deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete schedule item: {str(e)}'}), 500

@bp.route('/<item_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_schedule_item(item_id):
    """Toggle the completed status of a schedule item."""
    try:
        user_id = get_jwt_identity()
        
        # Find the schedule item
        schedule_item = ScheduleItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not schedule_item:
            return jsonify({'error': 'Schedule item not found'}), 404
        
        # Toggle completed status
        schedule_item.completed = not schedule_item.completed
        schedule_item.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(schedule_item.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to toggle schedule item: {str(e)}'}), 500

@bp.route('/reorder', methods=['PUT'])
@jwt_required()
def reorder_schedule_items():
    """Reorder schedule items by updating their order_index."""
    try:
        user_id = get_jwt_identity()
        
        # Expect a list of item IDs in the desired order
        item_ids = request.json.get('item_ids', [])
        if not item_ids:
            return jsonify({'error': 'item_ids list is required'}), 400
        
        # Update order_index for each item
        for index, item_id in enumerate(item_ids):
            schedule_item = ScheduleItem.query.filter_by(id=item_id, user_id=user_id).first()
            if schedule_item:
                schedule_item.order_index = index
                schedule_item.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Return updated list
        schedule_items = ScheduleItem.query.filter_by(user_id=user_id).order_by(ScheduleItem.order_index).all()
        return jsonify([item.to_dict() for item in schedule_items]), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to reorder schedule items: {str(e)}'}), 500