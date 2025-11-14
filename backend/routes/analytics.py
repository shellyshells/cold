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


@analytics_bp.route('/stats', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_stats():
    """Get comprehensive statistics for dashboard."""
    if request.method == 'GET':
        try:
            days = int(request.args.get('days', 30))
        except Exception:
            days = 30
            
        data = load_data()
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Food statistics
        foods = data['foods']
        today = datetime.now()
        expiring_soon = [f for f in foods if 
                        datetime.fromisoformat(f.get('expiryDate', '9999-12-31')) <= 
                        today + timedelta(days=3)]
        
        # Meal statistics
        meals = [m for m in data['meals'] if m.get('date', '') >= cutoff_date]
        
        # Nutrition aggregation
        total_nutrition = {
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
        
        for meal in meals:
            nutrition = meal.get('nutrition', {})
            for key in total_nutrition:
                total_nutrition[key] += nutrition.get(key, 0)
        
        # Calculate averages
        avg_nutrition = {k: v / len(meals) if meals else 0 
                        for k, v in total_nutrition.items()}
        
        # Health metrics
        health_metrics = [h for h in data['healthMetrics'] 
                         if h.get('date', '') >= cutoff_date]
        
        # Steps statistics
        steps_data = data.get('steps', [])
        recent_steps = [s for s in steps_data if s.get('date', '') >= cutoff_date]
        total_steps = sum(s.get('steps', 0) for s in recent_steps)
        avg_steps = total_steps / len(recent_steps) if recent_steps else 0
        
        return jsonify({
            "period": days,
            "foods": {
                "total": len(foods),
                "expiringSoon": len(expiring_soon),
                "byStorage": {
                    "fridge": len([f for f in foods if f.get('storageType') == 'fridge']),
                    "shelf": len([f for f in foods if f.get('storageType') == 'shelf']),
                    "freezer": len([f for f in foods if f.get('storageType') == 'freezer'])
                }
            },
            "meals": {
                "total": len(meals),
                "byType": {
                    "breakfast": len([m for m in meals if m.get('mealType') == 'breakfast']),
                    "lunch": len([m for m in meals if m.get('mealType') == 'lunch']),
                    "dinner": len([m for m in meals if m.get('mealType') == 'dinner']),
                    "snacks": len([m for m in meals if m.get('mealType') == 'snacks'])
                }
            },
            "nutrition": {
                "total": total_nutrition,
                "average": avg_nutrition
            },
            "healthMetrics": {
                "count": len(health_metrics),
                "entries": health_metrics[-10:] if health_metrics else []
            },
            "steps": {
                "total": total_steps,
                "average": avg_steps,
                "entries": len(recent_steps)
            },
            "recipes": {
                "total": len(data['recipes']),
                "shared": len(data['sharedRecipes'])
            }
        })


@analytics_bp.route('/reminders', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_reminders():
    """Get food expiry reminders for items expiring soon."""
    if request.method == 'GET':
        data = load_data()
        foods = data['foods']
        today = datetime.now()
        
        reminders = []
        for food in foods:
            try:
                expiry_date = datetime.fromisoformat(food.get('expiryDate', '9999-12-31'))
                days_until = (expiry_date - today).days
                
                if days_until <= 3 and days_until >= 0:
                    priority = 'high' if days_until == 0 else 'medium'
                    reminders.append({
                        "food": food,
                        "daysUntilExpiry": days_until,
                        "expiryDate": food.get('expiryDate'),
                        "priority": priority
                    })
            except Exception:
                continue
        
        # Sort by days until expiry
        reminders.sort(key=lambda x: x['daysUntilExpiry'])
        return jsonify(reminders)