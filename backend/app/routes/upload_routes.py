"""
Upload and file serving routes
"""
from flask import Blueprint, send_from_directory, current_app, abort
import os

# Create blueprint
bp = Blueprint('uploads', __name__, url_prefix='/api/uploads')

@bp.route('/profile_images/<filename>')
def serve_profile_image(filename):
    """Serve profile images."""
    try:
        upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'profile_images')
        
        # Security check - ensure filename doesn't contain path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            abort(404)
        
        # Check if file exists
        file_path = os.path.join(upload_dir, filename)
        if not os.path.exists(file_path):
            abort(404)
        
        return send_from_directory(upload_dir, filename)
        
    except Exception as e:
        abort(404)