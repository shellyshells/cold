import json
import os
import uuid
from datetime import datetime, timedelta

DATA_FILE = 'food_data.json'

def _get_data_file():
    """Return the path to the data file.

    Priority:
    - If `backend.app.DATA_FILE` exists (tests set this via monkeypatch), use it.
    - Otherwise use module-level DATA_FILE (defaults to file in current folder).
    """
    # Try to read an override from the backend package (if available).
    try:
        # Import lazily to avoid circular imports at module import time.
        import backend.app as app_mod
        return getattr(app_mod, 'DATA_FILE', DATA_FILE)
    except Exception:
        # If import fails (running outside package), fall back to local DATA_FILE
        return DATA_FILE

def load_data():
    try:
        data_file = _get_data_file()
        if not os.path.exists(data_file):
            sample_data = {
                "foods": [
                    {
                        "id": "1",
                        "name": "Milk",
                        "storageType": "fridge",
                        "quantity": 1,
                        "unit": "bottle",
                        "purchaseDate": datetime.now().isoformat(),
                        "expiryDate": "2024-12-15",
                        "category": "dairy",
                        "nutrition": {
                            "calories": 150,
                            "protein": 8,
                            "carbs": 12,
                            "fats": 8,
                            "saturatedFats": 5,
                            "sodium": 120,
                            "cholesterol": 30,
                            "fiber": 0,
                            "sugar": 12
                        }
                    },
                    {
                        "id": "2", 
                        "name": "Apples",
                        "storageType": "shelf",
                        "quantity": 5,
                        "unit": "pieces",
                        "purchaseDate": datetime.now().isoformat(),
                        "expiryDate": "2024-12-20",
                        "category": "fruits",
                        "nutrition": {
                            "calories": 95,
                            "protein": 0.5,
                            "carbs": 25,
                            "fats": 0.3,
                            "saturatedFats": 0.1,
                            "sodium": 2,
                            "cholesterol": 0,
                            "fiber": 4,
                            "sugar": 19
                        }
                    }
                ],
                "recipes": [],
                "meals": [],
                "healthMetrics": [],
                "sharedRecipes": [],
                "foodAddictions": [],
                "steps": []
            }
            save_data(sample_data)
            return sample_data

        with open(data_file, 'r') as f:
            data = json.load(f)
            if 'steps' not in data:
                data['steps'] = []
                save_data(data)
            return data
    except json.JSONDecodeError:
        # Return a safe default structure if file is corrupted
        default = {"foods": [], "recipes": [], "meals": [], "healthMetrics": [], "sharedRecipes": [], "foodAddictions": [], "steps": []}
        save_data(default)
        return default
    except Exception:
        # On other errors (permission, etc.) return an empty structure to keep the API up
        return {"foods": [], "recipes": [], "meals": [], "healthMetrics": [], "sharedRecipes": [], "foodAddictions": [], "steps": []}

def save_data(data):
    try:
        data_file = _get_data_file()
        # Ensure directory exists (for absolute temp paths used in tests)
        dirpath = os.path.dirname(data_file)
        if dirpath and not os.path.exists(dirpath):
            os.makedirs(dirpath, exist_ok=True)
        with open(data_file, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception:
        raise

def generate_id():
    return uuid.uuid4().hex