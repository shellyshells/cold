class TrackerPage {
    constructor() {
        this.api = new FoodAPI();
        this.loadMeals();
        this.loadDailyNutrition();
        this.setupForm();
        this.setupDateSelector();
        this.checkRecipeParam();
    }

    async checkRecipeParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('recipe');
        if (recipeId) {
            try {
                const recipe = await this.api.getRecipe(recipeId);
                if (recipe) {
                    this.prefillRecipe(recipe);
                }
            } catch (error) {
                console.error('Error loading recipe:', error);
            }
        }
    }

    prefillRecipe(recipe) {
        // Show the form
        this.showAddForm();
        
        // Pre-fill foods from recipe ingredients
        const ingredients = recipe.ingredients || [];
        const customFoodsInput = document.getElementById('meal-foods-custom');
        if (customFoodsInput && ingredients.length > 0) {
            customFoodsInput.value = ingredients.join(', ');
        }
        
        // Set meal name if available
        const mealNameInput = document.getElementById('meal-name');
        if (mealNameInput) {
            mealNameInput.value = recipe.name;
        }
    }

    setupDateSelector() {
        const dateInput = document.getElementById('nutrition-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
            dateInput.addEventListener('change', () => {
                this.loadDailyNutrition();
            });
        }
    }

    async loadMeals() {
        const meals = await this.api.getMeals();
        this.renderMeals(meals);
    }

    async loadDailyNutrition() {
        const dateInput = document.getElementById('nutrition-date');
        const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        const nutrition = await this.api.getDailyNutrition(date);
        this.renderDailyNutrition(nutrition);
    }

    renderMeals(meals) {
        const container = document.getElementById('meals-list');
        if (meals.length === 0) {
            container.innerHTML = '<div class="card">No meals logged yet. Log your first meal!</div>';
            return;
        }

        // Sort by date and time
        meals.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateB - dateA;
            }
            return (b.time || '').localeCompare(a.time || '');
        });

        container.innerHTML = meals.map(meal => {
            const date = new Date(meal.date).toLocaleDateString();
            const time = meal.time || 'N/A';
            const nutrition = meal.nutrition || {};
            
            return `
            <div class="card meal-card">
                <div class="meal-header">
                    <div>
                        <strong>${meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : 'Meal'}</strong>
                        <div>Date: ${date} | Time: ${time}</div>
                    </div>
                    <button class="delete-btn" onclick="trackerPage.deleteMeal('${meal.id}')">Delete</button>
                </div>
                <div class="meal-foods">
                    <strong>Foods:</strong> ${Array.isArray(meal.foods) ? meal.foods.map(f => typeof f === 'string' ? f : f.name || f.id).join(', ') : 'N/A'}
                </div>
                <div class="meal-nutrition">
                    <strong>Nutrition:</strong>
                    <div class="nutrition-grid">
                        <span>Calories: ${nutrition.calories || 0} kcal</span>
                        <span>Protein: ${nutrition.protein || 0}g</span>
                        <span>Carbs: ${nutrition.carbs || 0}g</span>
                        <span>Fats: ${nutrition.fats || 0}g</span>
                        <span>Saturated Fats: ${nutrition.saturatedFats || 0}g</span>
                        <span>Sodium: ${nutrition.sodium || 0}mg</span>
                        <span>Cholesterol: ${nutrition.cholesterol || 0}mg</span>
                        <span>Fiber: ${nutrition.fiber || 0}g</span>
                        <span>Sugar: ${nutrition.sugar || 0}g</span>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    renderDailyNutrition(nutrition) {
        const container = document.getElementById('daily-nutrition');
        if (!container) return;

        const totals = nutrition.totals || {};
        const byMealType = nutrition.byMealType || {};

        container.innerHTML = `
            <div class="card">
                <h3>Daily Nutrition Summary - ${nutrition.date}</h3>
                <div class="nutrition-summary">
                    <div class="nutrition-totals">
                        <h4>Totals</h4>
                        <div class="nutrition-grid">
                            <div><strong>Calories:</strong> ${totals.calories || 0} kcal</div>
                            <div><strong>Protein:</strong> ${totals.protein || 0}g</div>
                            <div><strong>Carbs:</strong> ${totals.carbs || 0}g</div>
                            <div><strong>Fats:</strong> ${totals.fats || 0}g</div>
                            <div><strong>Saturated Fats:</strong> ${totals.saturatedFats || 0}g</div>
                            <div><strong>Sodium:</strong> ${totals.sodium || 0}mg</div>
                            <div><strong>Cholesterol:</strong> ${totals.cholesterol || 0}mg</div>
                            <div><strong>Fiber:</strong> ${totals.fiber || 0}g</div>
                            <div><strong>Sugar:</strong> ${totals.sugar || 0}g</div>
                        </div>
                    </div>
                    <div class="nutrition-by-meal">
                        <h4>By Meal Type</h4>
                        ${Object.entries(byMealType).map(([type, values]) => `
                            <div class="meal-type-nutrition">
                                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong>
                                <div class="nutrition-grid-small">
                                    <span>Cal: ${values.calories || 0}</span>
                                    <span>P: ${values.protein || 0}g</span>
                                    <span>C: ${values.carbs || 0}g</span>
                                    <span>F: ${values.fats || 0}g</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    showAddForm() {
        const form = document.getElementById('add-form');
        if (form) {
            form.classList.remove('hidden');
            // Set default date and time
            const dateInput = document.getElementById('meal-date');
            const timeInput = document.getElementById('meal-time');
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
            if (timeInput) timeInput.value = new Date().toTimeString().slice(0, 5);
            this.loadFoodsForSelection();
        }
    }

    async loadFoodsForSelection() {
        const foods = await this.api.getFoods();
        const foodSelect = document.getElementById('meal-foods-select');
        if (foodSelect) {
            foodSelect.innerHTML = '<option value="">Select foods...</option>' +
                foods.map(food => `<option value="${food.id}">${food.name} (${food.quantity} ${food.unit})</option>`).join('');
        }
    }

    setupForm() {
        const form = document.getElementById('meal-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Logging...';
                
                const selectedFoodIds = Array.from(document.getElementById('meal-foods-select')?.selectedOptions || [])
                    .map(opt => opt.value)
                    .filter(id => id);
                
                const customFoods = document.getElementById('meal-foods-custom')?.value
                    .split(',')
                    .map(f => f.trim())
                    .filter(f => f) || [];

                if (selectedFoodIds.length === 0 && customFoods.length === 0) {
                    throw new Error('Please select foods or enter custom foods');
                }

                const foods = await this.api.getFoods();
                const selectedFoods = foods.filter(f => selectedFoodIds.includes(f.id));
                const allFoods = [...selectedFoods.map(f => ({ id: f.id, name: f.name, quantity: 1 })), ...customFoods];

                const meal = {
                    mealType: document.getElementById('meal-type').value,
                    foods: allFoods,
                    date: document.getElementById('meal-date')?.value || new Date().toISOString().split('T')[0],
                    time: document.getElementById('meal-time')?.value || new Date().toTimeString().slice(0, 5)
                };

                await this.api.addMeal(meal);
                this.showMessage('Meal logged successfully!', 'success');
                await this.loadMeals();
                await this.loadDailyNutrition();
                this.hideForm();
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Error adding meal:', error);
                this.showMessage(error.message || 'Failed to log meal. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    hideForm() {
        document.getElementById('add-form').classList.add('hidden');
        const form = document.getElementById('meal-form');
        if (form) {
            form.reset();
            // Reset date and time to current
            const dateInput = document.getElementById('meal-date');
            const timeInput = document.getElementById('meal-time');
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
            if (timeInput) timeInput.value = new Date().toTimeString().slice(0, 5);
        }
    }

    showMessage(message, type = 'success') {
        this.removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
        }
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    removeMessages() {
        document.querySelectorAll('.message').forEach(msg => msg.remove());
    }

    async deleteMeal(id) {
        await this.api.deleteMeal(id);
        this.loadMeals();
        this.loadDailyNutrition();
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const trackerPage = new TrackerPage();
        window.trackerPage = trackerPage;
    });
} else {
    const trackerPage = new TrackerPage();
    window.trackerPage = trackerPage;
}

