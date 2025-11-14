"""API routes for meal tracking.

Handles meal logging with automatic nutrition calculation from food items.
"""

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime
from backend.data_service import load_data, save_data, generate_id


meals_bp = Blueprint('meals', __name__)


@meals_bp.route('/meals', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def handle_meals():
    """Handle meal collection operations with nutrition calculation."""
    if request.method == 'GET':
        data = load_data()
        return jsonify(data['meals'])
    
    elif request.method == 'POST':
        data = load_data()
        new_meal = request.get_json()
        new_meal['id'] = generate_id()

        # Set timestamps if not provided
        if 'date' not in new_meal:
            new_meal['date'] = datetime.now().isoformat()
        if 'time' not in new_meal:
            new_meal['time'] = datetime.now().strftime('%H:%M')

        # Calculate nutrition if not provided
        if 'nutrition' not in new_meal or not new_meal['nutrition']:
            nutrition = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "saturatedFats": 0,
                "sodium": 0,
                "cholesterol": 0,
                "fiber": 0,
                "sugar": 0
            }

            # Sum nutrition from all foods in the meal
            if 'foods' in new_meal:
                foods_list = new_meal['foods']
                for food_item in foods_list:
                    # Handle both string and object food references
                    if isinstance(food_item, str):
                        food = next((f for f in data['foods'] 
                                   if f['name'].lower() == food_item.lower()), None)
                    else:
                        food_id = food_item.get('id') or food_item.get('foodId')
                        food_name = food_item.get('name')
                        if food_id:
                            food = next((f for f in data['foods'] 
                                       if f['id'] == food_id), None)
                        elif food_name:
                            food = next((f for f in data['foods'] 
                                       if f['name'].lower() == food_name.lower()), None)
                        else:
                            food = None
                    
                    if food and 'nutrition' in food:
                        quantity = food_item.get('quantity', 1) if isinstance(food_item, dict) else 1
                        food_nutrition = food['nutrition']
                        for key in nutrition:
                            nutrition[key] += food_nutrition.get(key, 0) * quantity
            
            new_meal['nutrition'] = nutrition
        
        data['meals'].append(new_meal)
        save_data(data)
        return jsonify(new_meal), 201


@meals_bp.route('/meals/<meal_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_meal(meal_id):
    """Delete a specific meal entry."""
    if request.method == 'DELETE':
        data = load_data()
        data['meals'] = [m for m in data['meals'] if m['id'] != meal_id]
        save_data(data)
        return jsonify({"message": "Meal deleted"})