from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail
from blueprints.sentiment import sentiment_bp
from blueprints.influencer import influencer_bp
from blueprints.network import network_bp
from blueprints.send import send_bp
from blueprints.dash import dash_bp
from blueprints.recom import recom_bp
from blueprints.auth import auth
import os
from dotenv import load_dotenv
import sys # Import sys to check paths
import logging
from flask_jwt_extended import JWTManager
from datetime import timedelta

# Print Python paths for debugging imports
print("--- Python sys.path ---")
for path in sys.path:
    print(path)
print("----------------------")


# --- Load .env file ---
# Load from the directory where app.py is located
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    print(f"--- Loaded .env from {dotenv_path} ---")
else:
    print(f"--- Warning: .env file not found at {dotenv_path} ---")
# --- End .env loading ---


def create_app():
    print("--- Creating Flask App ---")
    app = Flask(__name__)
    # Configure CORS to permit any origin (localhost, 127.0.0.1, etc.)
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    print("--- CORS Initialized (Allowing *) ---")

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

    # --- Flask-Mail Configuration ---
    # (Keep your existing mail config)
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USERNAME'] = os.getenv('FROM_EMAIL')
    app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASSWORD')
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() in ['true', '1', 't']
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() in ['true', '1', 't']
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('FROM_EMAIL')
    if app.config['MAIL_USERNAME'] and app.config['MAIL_PASSWORD']:
        print("--- Mail Config Loaded ---")
    else:
        print("--- Warning: Mail credentials not found in .env ---")

    # Initialize Flask-Mail
    mail = Mail(app)
    print("--- Flask-Mail Initialized ---")

    # Configure JWT
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') or 'dev-only-change-me'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
    jwt = JWTManager(app)

    # Register blueprints
    print("--- Registering Blueprints ---")
    app.register_blueprint(sentiment_bp, url_prefix='/sentiment')
    app.register_blueprint(influencer_bp, url_prefix='/influencer')
    app.register_blueprint(network_bp, url_prefix='/network')
    app.register_blueprint(send_bp, url_prefix='/send')
    app.register_blueprint(dash_bp, url_prefix='/dash')
    app.register_blueprint(recom_bp, url_prefix='/recommendations')
    app.register_blueprint(auth, url_prefix='/auth')
    print("--- All Blueprints Registered ---")

    @app.route('/')
    def home():
        youtube_key_loaded = bool(os.getenv("YOUTUBE_API_KEY")) # Check env var only
        return jsonify({
            "message": "InsightSphere API",
            "status": "Running",
            "youtube_api_configured": youtube_key_loaded
        })

    @app.route('/ping')
    def ping():
        return jsonify({"status": "ok"}), 200

    print("--- Flask App Creation Complete ---")
    return app

if __name__ == '__main__':
    # Create graphs directory if it doesn't exist
    if not os.path.exists("graphs"):
        print("--- Creating 'graphs' directory ---")
        os.makedirs("graphs")

    # Check API key status based on .env only at startup
    if not os.getenv("YOUTUBE_API_KEY"):
        print("********************************************************")
        print("WARNING: YOUTUBE_API_KEY not set in the .env file!")
        print("If not hardcoded elsewhere, dashboard features may fail.")
        print("********************************************************")

    app = create_app()

    # --- Print Registered Routes ---
    print("\n--- Registered URL Rules ---")
    with app.app_context(): # Use app context to access url_map
        for rule in app.url_map.iter_rules():
            print(f"Endpoint: {rule.endpoint}, Path: {rule.rule}, Methods: {','.join(rule.methods)}")
    print("--------------------------\n")
    # --- End Print Routes ---

    logger = logging.getLogger(__name__)
    logger.info("Starting Flask server...")
    try:
        # Use host='0.0.0.0' to be accessible on your network
        app.run(debug=False, port=5000, host='0.0.0.0', threaded=True)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")