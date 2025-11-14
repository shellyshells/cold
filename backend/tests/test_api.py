"""
Integration tests for Fridgy API endpoints.

Tests use a temporary data file to avoid affecting production data.
"""

import json
import pytest
import backend.app as app_mod
from backend.app import app as flask_app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """Create a test client with isolated data file."""
    # Use temporary file for test data
    data_file = tmp_path / "test_data.json"
    monkeypatch.setattr(app_mod, "DATA_FILE", str(data_file))

    with flask_app.test_client() as client:
        yield client


def test_health_check(client):
    """Test that health endpoint returns OK status."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'ok'


def test_add_and_get_food(client):
    """Test adding a food item and retrieving it."""
    new_food = {
        "name": "Test Milk",
        "storageType": "fridge",
        "quantity": 1,
        "unit": "liter"
    }
    
    # Add food
    response = client.post('/api/foods', json=new_food)
    assert response.status_code == 201
    created = response.get_json()
    assert 'id' in created
    assert created['name'] == 'Test Milk'

    # Get all foods
    response = client.get('/api/foods')
    foods = response.get_json()
    assert any(f['id'] == created['id'] for f in foods)


def test_delete_food(client):
    """Test deleting a food item."""
    # First add a food
    new_food = {"name": "ToDelete", "storageType": "fridge", "quantity": 1}
    response = client.post('/api/foods', json=new_food)
    created = response.get_json()
    food_id = created['id']

    # Delete it
    response = client.delete(f"/api/foods/{food_id}")
    assert response.status_code == 200

    # Verify it's gone
    response = client.get('/api/foods')
    foods = response.get_json()
    assert all(f['id'] != food_id for f in foods)


def test_update_food(client):
    """Test updating a food item."""
    # Add food
    response = client.post('/api/foods', 
                          json={"name": "Updatable", "quantity": 1})
    created = response.get_json()
    food_id = created['id']

    # Update it
    response = client.put(f"/api/foods/{food_id}", json={"quantity": 5})
    assert response.status_code == 200
    updated = response.get_json()
    assert updated.get('quantity') == 5


def test_meal_nutrition_calculation(client):
    """Test that meal nutrition is calculated from foods."""
    # Add a food with nutrition
    food = {
        "name": "Banana",
        "quantity": 1,
        "nutrition": {
            "calories": 100,
            "protein": 1,
            "carbs": 25,
            "fats": 0.5
        }
    }
    response = client.post('/api/foods', json=food)
    created_food = response.get_json()

    # Create meal with 2 bananas
    meal = {
        "mealType": "breakfast",
        "foods": [{"id": created_food['id'], "quantity": 2}]
    }
    response = client.post('/api/meals', json=meal)
    assert response.status_code == 201
    created_meal = response.get_json()
    
    # Check nutrition was calculated
    assert created_meal['nutrition']['calories'] == 200
    assert created_meal['nutrition']['protein'] == 2


def test_recipe_recommendations(client):
    """Test recipe recommendation matching."""
    # Add foods
    client.post('/api/foods', json={"name": "Tomato", "quantity": 2})
    client.post('/api/foods', json={"name": "Pasta", "quantity": 1})
    
    # Add recipe
    recipe = {
        "name": "Tomato Pasta",
        "ingredients": ["Tomato", "Pasta", "Olive Oil"],
        "cookTime": 20
    }
    client.post('/api/recipes', json=recipe)

    # Get recommendations
    response = client.get('/api/recommendations')
    assert response.status_code == 200
    recommendations = response.get_json()
    assert isinstance(recommendations, list)
    
    if len(recommendations) > 0:
        # Should have match score
        assert 'matchScore' in recommendations[0]