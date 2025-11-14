"""Data persistence layer for Fridgy application.

This module handles all file I/O operations for storing and retrieving
application data in JSON format. It provides a clean interface for
data operations while keeping the file handling logic centralized.

Functions follow the DRY principle - single source of truth for data access.
"""

import json
import os
import uuid
from datetime import datetime


# Module-level constant for data file location
DATA_FILE = 'food_data.json'


def _get_data_file():
    """Get the path to the data file with fallback logic.
    
    Checks for overridden DATA_FILE in app module (used by tests),
    otherwise uses module-level DATA_FILE constant.
    
    Returns:
        str: Path to the data file
    """
    try:
        import backend.app as app_mod
        return getattr(app_mod, 'DATA_FILE', DATA_FILE)
    except Exception:
        return DATA_FILE


def load_data():
    """Load application data from JSON file.
    
    Creates initial sample data if file doesn't exist.
    Returns empty structure if file is corrupted or inaccessible.
    
    Returns:
        dict: Application data containing foods, recipes, meals, etc.
    """
    try:
        data_file = _get_data_file()
        
        if not os.path.exists(data_file):
            # Initialize with sample data for first-time users
            sample_data = {
                "foods": [],
                "recipes": [],
                "meals": [],
                "healthMetrics": [],
                "sharedRecipes": [],
                "steps": []
            }
            save_data(sample_data)
            return sample_data

        with open(data_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
            # Ensure all expected keys exist
            if 'steps' not in data:
                data['steps'] = []
                save_data(data)
            
            return data
            
    except json.JSONDecodeError as error:
        # Log but don't expose details - return safe default
        print(f"JSON decode error: {error}")
        default = {
            "foods": [],
            "recipes": [],
            "meals": [],
            "healthMetrics": [],
            "sharedRecipes": [],
            "steps": []
        }
        save_data(default)
        return default
        
    except Exception as error:
        print(f"Error loading data: {error}")
        return {
            "foods": [],
            "recipes": [],
            "meals": [],
            "healthMetrics": [],
            "sharedRecipes": [],
            "steps": []
        }


def save_data(data):
    """Save application data to JSON file.
    
    Creates directory if it doesn't exist. Uses indent for readability.
    
    Args:
        data: Dictionary containing application data
        
    Raises:
        Exception: If file write operation fails
    """
    try:
        data_file = _get_data_file()
        
        # Ensure parent directory exists
        dirpath = os.path.dirname(data_file)
        if dirpath and not os.path.exists(dirpath):
            os.makedirs(dirpath, exist_ok=True)
        
        with open(data_file, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2)
            
    except Exception as error:
        print(f"Error saving data: {error}")
        raise


def generate_id():
    """Generate a unique identifier for new records.
    
    Uses UUID4 for guaranteed uniqueness across distributed systems.
    
    Returns:
        str: Hexadecimal UUID string
    """
    return uuid.uuid4().hex
