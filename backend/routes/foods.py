from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from backend.data_service import load_data, save_data, generate_id

foods_bp = Blueprint('foods', __name__)

@foods_bp.route('/foods', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def handle_foods():
    if request.method == 'GET':
        data = load_data()
        return jsonify(data['foods'])
    
    elif request.method == 'POST':
        data = load_data()
        new_food = request.get_json()
        new_food['id'] = generate_id()
        data['foods'].append(new_food)
        save_data(data)
        return jsonify(new_food), 201

@foods_bp.route('/foods/<food_id>', methods=['DELETE', 'PUT', 'OPTIONS'])
@cross_origin()
def handle_food(food_id):
    if request.method == 'DELETE':
        data = load_data()
        data['foods'] = [f for f in data['foods'] if f['id'] != food_id]
        save_data(data)
        return jsonify({"message": "Food deleted"})
    
    elif request.method == 'PUT':
        data = load_data()
        updated_food = request.get_json()
        for i, food in enumerate(data['foods']):
            if food['id'] == food_id:
                data['foods'][i].update(updated_food)
                save_data(data)
                return jsonify(data['foods'][i])
        return jsonify({"error": "Food not found"}), 404


# Reminders endpoint: returns food items that are expiring soon
@foods_bp.route('/reminders', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_reminders():
    try:
        days_window = int(request.args.get('days', 7))
    except Exception:
        days_window = 7

    data = load_data()
    foods = data.get('foods', [])
    reminders = []

    from datetime import datetime

    today = datetime.now().date()
    for f in foods:
        expiry = f.get('expiryDate')
        if not expiry:
            continue
        # Try parsing date in ISO formats (date or datetime)
        try:
            if 'T' in expiry:
                exp_dt = datetime.fromisoformat(expiry).date()
            else:
                exp_dt = datetime.fromisoformat(expiry).date()
        except Exception:
            try:
                exp_dt = datetime.strptime(expiry, '%Y-%m-%d').date()
            except Exception:
                # skip unparseable dates
                continue

        days_until = (exp_dt - today).days
        if days_until <= days_window:
            priority = 'high' if days_until <= 3 else 'medium'
            reminders.append({
                'food': f,
                'expiryDate': exp_dt.isoformat(),
                'daysUntilExpiry': days_until,
                'priority': priority
            })

    # sort by days until expiry (soonest first)
    reminders.sort(key=lambda r: r['daysUntilExpiry'])
    return jsonify(reminders)