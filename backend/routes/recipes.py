from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from backend.data_service import load_data, save_data, generate_id

recipes_bp = Blueprint('recipes', __name__)

@recipes_bp.route('/recipes', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def handle_recipes():
    if request.method == 'GET':
        data = load_data()
        return jsonify(data['recipes'])
    
    elif request.method == 'POST':
        data = load_data()
        new_recipe = request.get_json()
        new_recipe['id'] = generate_id()
        data['recipes'].append(new_recipe)
        save_data(data)
        return jsonify(new_recipe), 201

@recipes_bp.route('/recipes/<recipe_id>', methods=['DELETE', 'GET', 'PUT', 'OPTIONS'])
@cross_origin()
def handle_recipe(recipe_id):
    if request.method == 'DELETE':
        data = load_data()
        data['recipes'] = [r for r in data['recipes'] if r['id'] != recipe_id]
        save_data(data)
        return jsonify({"message": "Recipe deleted"})
    
    elif request.method == 'GET':
        data = load_data()
        recipe = next((r for r in data['recipes'] if r['id'] == recipe_id), None)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        return jsonify(recipe)
    
    elif request.method == 'PUT':
        data = load_data()
        updated_recipe = request.get_json()
        for i, recipe in enumerate(data['recipes']):
            if recipe['id'] == recipe_id:
                data['recipes'][i].update(updated_recipe)
                save_data(data)
                return jsonify(data['recipes'][i])
        return jsonify({"error": "Recipe not found"}), 404

@recipes_bp.route('/recipes/<recipe_id>/share', methods=['POST', 'OPTIONS'])
@cross_origin()
def share_recipe(recipe_id):
    if request.method == 'POST':
        data = load_data()
        recipe = next((r for r in data['recipes'] if r['id'] == recipe_id), None)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404
        
        share_data = request.get_json()
        shared_recipe = {
            "id": generate_id(),
            "recipeId": recipe_id,
            "recipe": recipe,
            "sharedBy": share_data.get('sharedBy', 'Anonymous'),
            "sharedAt": datetime.now().isoformat(),
            "isPublic": share_data.get('isPublic', True)
        }
        data['sharedRecipes'].append(shared_recipe)
        save_data(data)
        return jsonify(shared_recipe), 201

@recipes_bp.route('/recipes/shared', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_shared_recipes():
    if request.method == 'GET':
        data = load_data()
        public_recipes = [sr for sr in data['sharedRecipes'] if sr.get('isPublic', True)]
        return jsonify(public_recipes)