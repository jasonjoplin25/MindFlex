"""
File upload utilities for MindFlex
"""
import os
import uuid
import mimetypes
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_image_file(filename):
    """Check if a file has an allowed image extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def get_file_extension(filename):
    """Get the file extension from filename."""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def generate_unique_filename(filename):
    """Generate a unique filename while preserving the extension."""
    ext = get_file_extension(filename)
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{ext}" if ext else unique_id

def save_profile_image(file):
    """
    Save a profile image and return the filename.
    
    Args:
        file: FileStorage object from Flask request
        
    Returns:
        dict: Success dict with filename or error dict
    """
    try:
        # Check if file is provided
        if not file or file.filename == '':
            return {'error': 'No file provided'}
        
        # Check file type
        if not allowed_image_file(file.filename):
            return {'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'}
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        
        if file_length > MAX_FILE_SIZE:
            return {'error': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB'}
        
        # Verify MIME type
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type or not mime_type.startswith('image/'):
            return {'error': 'Invalid image file'}
        
        # Generate unique filename
        filename = generate_unique_filename(file.filename)
        
        # Ensure upload directory exists
        upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'profile_images')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        return {'filename': filename, 'path': file_path}
        
    except Exception as e:
        return {'error': f'Error saving file: {str(e)}'}

def delete_profile_image(filename):
    """
    Delete a profile image file.
    
    Args:
        filename: The filename to delete
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not filename:
            return True  # Nothing to delete
            
        upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'profile_images')
        file_path = os.path.join(upload_dir, filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return True  # File doesn't exist, consider it deleted
        
    except Exception as e:
        print(f"Error deleting profile image {filename}: {e}")
        return False

def get_profile_image_url(filename):
    """
    Get the URL for a profile image.
    
    Args:
        filename: The image filename
        
    Returns:
        str: The URL to access the image
    """
    if not filename:
        return None
    return f"/api/uploads/profile_images/{filename}"