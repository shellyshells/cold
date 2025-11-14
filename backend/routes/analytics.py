"""API routes for analytics and recommendations.

Provides data analysis endpoints for nutrition trends, statistics,
and recipe recommendations based on available ingredients.
"""

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime, timedelta
from backend.data_service import load_data


analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/recommendations', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_recommendations():
    """Get recipe recommendations based on available food inventory."""
    if request.method == 'GET':
        data = load_data()
        foods = data['foods']
        recipes = data['recipes']
        
        recommendations = []
        for recipe in recipes:
            if 'ingredients' not in recipe:
                continue
                
            available_ingredients = [f['name'].lower() for f in foods]
            recipe_ingredients = [ing.lower() for ing in recipe.get('ingredients', [])]

            # Calculate match score
            matches = sum(1 for ing in recipe_ingredients 
                        if any(ing in avail or avail in ing 
                              for avail in available_ingredients))
            
            if matches > 0:
                recipe_copy = recipe.copy()
                recipe_copy['matchScore'] = matches / len(recipe_ingredients) if recipe_ingredients else 0
                recommendations.append(recipe_copy)
        
        # Sort by match score descending
        recommendations.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
        return jsonify(recommendations)


@analytics_bp.route('/nutrition/daily', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_daily_nutrition():
    """Get nutrition summary for a specific date."""
    if request.method == 'GET':
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        data = load_data()
        meals = [m for m in data['meals'] if m.get('date', '').startswith(date)]
        
        totals = {
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
        
        by_meal_type = {
            "breakfast": totals.copy(),
            "lunch": totals.copy(),
            "dinner": totals.copy(),
            "snacks": totals.copy()
        }
        
        for meal in meals:
            nutrition = meal.get('nutrition', {})
            meal_type = meal.get('mealType', 'snacks')
            if meal_type not in by_meal_type:
                meal_type = 'snacks'
            
            for key in totals:
                value = nutrition.get(key, 0)
                totals[key] += value
                by_meal_type[meal_type][key] += value
        
        return jsonify({
            "date": date,
            "totals": totals,
            "byMealType": by_meal_type,
            "meals": meals
        })


@analytics_bp.route('/nutrition/trends', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_nutrition_trends():
    """Get nutrition trends over specified number of days."""
    if request.method == 'GET':
        try:
            days = int(request.args.get('days', 30))
        except Exception:
            days = 30

        data = load_data()
        meals = data.get('meals', [])

        totals_per_day = {}
        for meal in meals:
            date = meal.get('date', '')
            if not date:
                continue
            date_key = date.split('T')[0]
            nutrition = meal.get('nutrition', {})
            
            if date_key not in totals_per_day:
                totals_per_day[date_key] = {
                    "calories": 0, 
                    "protein": 0, 
                    "carbs": 0, 
                    "fats": 0
                }
            
            for key in ["calories", "protein", "carbs", "fats"]:
                totals_per_day[date_key][key] += nutrition.get(key, 0)

        # Build list for requested days
        trends = []
        today = datetime.now()
        for i in range(days-1, -1, -1):
            day = (today - timedelta(days=i)).date()
            key = day.isoformat()
            values = totals_per_day.get(key, {
                "calories": 0, 
                "protein": 0, 
                "carbs": 0, 
                "fats": 0
            })
            trends.append({
                "date": key,
                "calories": values["calories"],
                "protein": values["protein"],
                "carbs": values["carbs"],
                "fats": values["fats"]
            })

        return jsonify(trends)