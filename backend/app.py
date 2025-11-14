"""Main Flask application setup for Fridgy backend.

This module initializes the Flask app, configures CORS, logging,
and registers all route blueprints.
"""

from flask import Flask
from flask_cors import CORS
import logging
import os

# Data file configuration - can be overridden for testing
DATA_FILE = os.path.join(os.path.dirname(__file__), 'food_data.json')

# Flask app initialization
app = Flask(__name__)

# Configure CORS for frontend communication
# Allow all origins in development - should be restricted in production
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure logging with structured format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
)
logger = logging.getLogger('fridgy')


@app.errorhandler(Exception)
def handle_uncaught_exceptions(error):
    """Catch-all error handler for unexpected exceptions.
    
    Logs the full stack trace and returns a generic error message
    to avoid exposing internal details to the client.
    
    Args:
        error: The exception that was raised
        
    Returns:
        tuple: JSON error response and 500 status code
    """
    logger.exception('Unhandled exception occurred: %s', error)
    return {"error": "Internal server error"}, 500


if __name__ == '__main__':
    logger.info('Starting Fridgy backend server on port 8080')
    app.run(debug=False, port=8080, host='0.0.0.0')
