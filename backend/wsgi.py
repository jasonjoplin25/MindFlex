"""
WSGI entry point for the MindFlex application.
This file is used by gunicorn to run the application.
"""
import os
import sys
import importlib.util

# Get the absolute path to the app.py file
app_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.py')

# Load app.py as a module
spec = importlib.util.spec_from_file_location("app_module", app_path)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

# Get the Flask application object
app = app_module.app

# For local testing
if __name__ == "__main__":
    # Get the port from environment variable (Render sets PORT)
    port = int(os.environ.get('PORT', 10000))
    
    print(f"Starting Flask app on port {port}")
    
    # Run the app on the specified port
    app.run(host='0.0.0.0', port=port) 