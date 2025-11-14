from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime, timedelta
from backend.data_service import load_data, save_data, generate_id

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET', 'OPTIONS'])
@cross_origin()
def health_check():
    """Health check endpoint to verify API is running"""
    return jsonify({"status": "ok", "message": "API is running"}), 200

@health_bp.route('/health-metrics', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def handle_health_metrics():
    if request.method == 'GET':
        data = load_data()
        return jsonify(data['healthMetrics'])
    
    elif request.method == 'POST':
        data = load_data()
        new_metric = request.get_json()
        new_metric['id'] = generate_id()
        new_metric['date'] = datetime.now().isoformat()
        data['healthMetrics'].append(new_metric)
        save_data(data)
        return jsonify(new_metric), 201


@health_bp.route('/health-metrics/trends', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_health_metrics_trends():
    """Return time-series trend points for a given health metric type.

    Query params:
    - type: metric type string (e.g., 'weight', 'bmi', 'cholesterol')
    - days: number of days to include (default 30)
    """
    if request.method == 'GET':
        metric_type = request.args.get('type', 'weight')
        try:
            days = int(request.args.get('days', 30))
        except Exception:
            days = 30

        data = load_data()
        metrics = [m for m in data.get('healthMetrics', []) if m.get('type') == metric_type]

        # Build a map of date -> latest metric value for that date
        by_date = {}
        for m in metrics:
            d = m.get('date', '')
            if not d:
                continue
            # normalize to YYYY-MM-DD
            date_key = d.split('T')[0]
            # Keep the latest timestamp for the date
            if date_key not in by_date or m.get('date', '') > by_date[date_key]['date']:
                by_date[date_key] = { 'date': m.get('date'), 'value': m.get('value') }

        # Build list for the requested days (oldest -> newest)
        trends = []
        today = datetime.now()
        for i in range(days-1, -1, -1):
            day = (today - timedelta(days=i)).date()
            key = day.isoformat()
            if key in by_date:
                trends.append({ 'date': by_date[key]['date'], 'value': by_date[key]['value'] })
            else:
                # include a point with null value so charts keep the x-axis consistent
                trends.append({ 'date': key, 'value': None })

        return jsonify(trends)

@health_bp.route('/health-metrics/<metric_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_health_metric(metric_id):
    if request.method == 'DELETE':
        data = load_data()
        data['healthMetrics'] = [m for m in data['healthMetrics'] if m['id'] != metric_id]
        save_data(data)
        return jsonify({"message": "Metric deleted"})

@health_bp.route('/steps', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def handle_steps():
    if request.method == 'GET':
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        data = load_data()
        steps = [s for s in data.get('steps', []) if s.get('date', '').startswith(date)]
        total = sum(s.get('steps', 0) for s in steps)
        return jsonify({"date": date, "total": total, "entries": steps})
    
    elif request.method == 'POST':
        data = load_data()
        if 'steps' not in data:
            data['steps'] = []
        new_entry = request.get_json()
        new_entry['id'] = generate_id()
        new_entry['date'] = datetime.now().isoformat()
        data['steps'].append(new_entry)
        save_data(data)
        return jsonify(new_entry), 201