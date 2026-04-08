import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import configuration
from config import config

# Import database
from app.database import init_db

# Initialize Flask app
def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize database
    init_db(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Configure CORS
    cors_origins = app.config['CORS_ORIGINS']
    CORS(app, 
         resources={r"/api/*": {"origins": cors_origins}}, 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    
    # Handle OPTIONS requests
    @app.before_request
    def handle_options_request():
        if request.method == 'OPTIONS':
            response = make_response()
            origin = request.headers.get('Origin')
            if origin in cors_origins or '*' in cors_origins:
                response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '3600')
            return response
    
    # Import and register blueprints
    from app.routes import auth_routes, game_routes, user_routes, achievement_routes, therapy_routes, caregiver_routes, llm_routes, analytics_routes, admin_routes, upload_routes, schedule_routes
    from app.routes.assessment_routes import assessment_bp

    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(game_routes.bp)
    app.register_blueprint(user_routes.bp)
    app.register_blueprint(achievement_routes.bp)
    app.register_blueprint(therapy_routes.therapy_bp)
    app.register_blueprint(caregiver_routes.caregiver_bp)
    app.register_blueprint(llm_routes.bp)
    app.register_blueprint(analytics_routes.analytics_bp)
    app.register_blueprint(admin_routes.bp)
    app.register_blueprint(upload_routes.bp)
    app.register_blueprint(schedule_routes.bp)
    app.register_blueprint(assessment_bp)
    
    return app

# Create app instance
app = create_app(os.environ.get('FLASK_ENV', 'development'))

@app.route('/')
def root():
    """Redirect root path to API documentation or health check."""
    return jsonify({
        "message": "MindFlex API Server",
        "status": "running",
        "health_check": "/api/health"
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API is running."""
    return jsonify({
        "status": "healthy",
        "version": "1.0.0"
    })

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Get port from environment variable or use 5000 as default
    port = int(os.environ.get('PORT', 5000))
    
    # Enable debug mode in development
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    # Run the app on all network interfaces
    app.run(
        host='0.0.0.0',  # Listen on all available interfaces
        port=port,
        debug=debug,
        use_reloader=debug  # Only use reloader in debug mode
    ) 