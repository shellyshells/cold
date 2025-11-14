from flask import Flask
from flask_cors import CORS
import logging
import os

# Allow tests to override the data file by setting this variable
# Tests monkeypatch `backend.app.DATA_FILE` to isolate file I/O.
DATA_FILE = os.path.join(os.path.dirname(__file__), 'food_data.json')

# Import blueprints using package-qualified names so `import backend.app` works
from backend.routes.foods import foods_bp
from backend.routes.recipes import recipes_bp
from backend.routes.meals import meals_bp
from backend.routes.health import health_bp
from backend.routes.analytics import analytics_bp

# Create the Flask application
app = Flask(__name__)

# Configure CORS to allow all origins and methods
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
)
logger = logging.getLogger('fridgy')

# Register blueprints
app.register_blueprint(foods_bp, url_prefix='/api')
app.register_blueprint(recipes_bp, url_prefix='/api')
app.register_blueprint(meals_bp, url_prefix='/api')
app.register_blueprint(health_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')

@app.errorhandler(Exception)
def handle_uncaught_exceptions(e):
    """Return JSON for uncaught exceptions and log the stack trace."""
    logger.exception('Unhandled exception: %s', e)
    return {"error": "Internal server error"}, 500

if __name__ == '__main__':
    logger.info('Starting Fridgy backend on port 8080')
    app.run(debug=False, port=8080, host='0.0.0.0')