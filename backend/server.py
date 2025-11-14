from flask import send_from_directory
import os
import sys

# Ensure backend package is importable when running this script from project root
THIS_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(THIS_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import the Flask app created in backend.app
try:
    # Preferred when running as part of package
    from backend.app import app
except Exception:
    # Fallback if running directly from backend/ as script
    from app import app

# Serve the frontend files (resolve absolute path)
FRONTEND_DIR = os.path.abspath(os.path.join(THIS_DIR, '..', 'frontend'))

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

if __name__ == '__main__':
    app.run(debug=True, port=8080)