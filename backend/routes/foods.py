"""API routes for food storage management.

Handles CRUD operations for food items in inventory.
Each food item tracks storage location, quantity, expiry dates, and nutrition.
"""

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from backend.data_service import load_data, save_data, generate_id


# Create Blueprint for food-related routes
foods_bp = Blueprint('foods', __name__)


@foods_bp.route('/foods', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def handle_foods():
    """Handle GET and POST requests for foods collection.
    
    GET: Returns all food items
    POST: Creates a new food item
    
    Returns:
        JSON response with food data or created food item
    """
    if request.method == 'GET':
        data = load_data()
        return jsonify(data['foods'])
    
    elif request.method == 'POST':
        data = load_data()
        new_food = request.get_json()
        
        # Generate unique ID for new food item
        new_food['id'] = generate_id()
        
        data['foods'].append(new_food)
        save_data(data)
        
        return jsonify(new_food), 201


@foods_bp.route('/foods/<food_id>', methods=['DELETE', 'PUT', 'OPTIONS'])
@cross_origin()
def handle_food(food_id):
    """Handle operations on individual food items.
    
    DELETE: Remove a food item by ID
    PUT: Update an existing food item
    
    Args:
        food_id: Unique identifier for the food item
        
    Returns:
        JSON response with success message or updated food item
    """
    if request.method == 'DELETE':
        data = load_data()
        
        # Filter out the food item to delete
        data['foods'] = [f for f in data['foods'] if f['id'] != food_id]
        
        save_data(data)
        return jsonify({"message": "Food deleted"})
    
    elif request.method == 'PUT':
        data = load_data()
        updated_food = request.get_json()
        
        # Find and update the food item
        for i, food in enumerate(data['foods']):
            if food['id'] == food_id:
                data['foods'][i].update(updated_food)
                save_data(data)
                return jsonify(data['foods'][i])
        
        return jsonify({"error": "Food not found"}), 404
