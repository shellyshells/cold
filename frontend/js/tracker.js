/**
 * Meal tracker page controller.
 * 
 * Handles meal logging with automatic nutrition calculation
 * and daily nutrition summaries.
 */

class TrackerPage {
    constructor() {
        this.api = new FoodAPI();
        this.loadMeals();
        this.loadDailyNutrition();
        this.setupForm();
        this.setupDateSelector();
    }

    setupDateSelector() {
        const dateInput = document.getElementById('nutrition-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
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

        // Sort by date and time (newest first)
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
            
            // Format foods list
            let foodsList = 'N/A';
            if (Array.isArray(meal.foods)) {
                foodsList = meal.foods.map(f => 
                    typeof f === 'string' ? f : (f.name || f.id)
                ).join(', ');
            }
            
            return `
                <div class="card meal-card">
                    <div class="meal-header">
                        <div>
                            <span class="meal-type">${meal.mealType || 'meal'}</span>
                            <div style="margin-top: 0.5rem; color: var(--text-light);">
                                📅 ${date} at ${time}
                            </div>
                        </div>
                        <button class="delete-btn" onclick="trackerPage.deleteMeal('${meal.id}')">
                            Delete
                        </button>
                    </div>
                    
                    <div class="meal-foods">
                        <strong>Foods:</strong> ${foodsList}
                    </div>
                    
                    <div class="meal-nutrition">
                        <strong>Nutrition:</strong>
                        <div class="nutrition-grid">
                            <span>🔥 ${nutrition.calories || 0} kcal</span>
                            <span>🥩 Protein: ${nutrition.protein || 0}g</span>
                            <span>🍞 Carbs: ${nutrition.carbs || 0}g</span>
                            <span>🧈 Fats: ${nutrition.fats || 0}g</span>
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
            <div class="nutrition-summary">
                <div class="nutrition-totals">
                    <h4>📊 Daily Totals</h4>
                    <div style="margin-top: 1rem;">
                        <div><strong>Calories:</strong> ${totals.calories || 0} kcal</div>
                        <div><strong>Protein:</strong> ${totals.protein || 0}g</div>
                        <div><strong>Carbs:</strong> ${totals.carbs || 0}g</div>
                        <div><strong>Fats:</strong> ${totals.fats || 0}g</div>
                    </div>
                </div>
                
                <div class="nutrition-by-meal">
                    <h4>🍽️ By Meal Type</h4>
                    <div style="margin-top: 1rem;">
                        ${Object.entries(byMealType).map(([type, values]) => `
                            <div style="margin-bottom: 0.5rem;">
                                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong>
                                ${values.calories || 0} kcal
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    showAddForm() {
        const form = document.getElementById('add-form');
        form.classList.remove('hidden');
        
        // Set default date and time
        const dateInput = document.getElementById('meal-date');
        const timeInput = document.getElementById('meal-time');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (timeInput) timeInput.value = new Date().toTimeString().slice(0, 5);
        
        this.loadFoodsForSelection();
    }

    async loadFoodsForSelection() {
        const foods = await this.api.getFoods();
        const foodSelect = document.getElementById('meal-foods-select');
        if (foodSelect) {
            foodSelect.innerHTML = '<option value="">Select foods...</option>' +
                foods.map(food => 
                    `<option value="${food.id}">${food.name} (${food.quantity} ${food.unit})</option>`
                ).join('');
        }
    }

    hideForm() {
        document.getElementById('add-form').classList.add('hidden');
        const form = document.getElementById('meal-form');
        if (form) form.reset();
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
                
                // Get selected food IDs
                const selectedFoodIds = Array.from(
                    document.getElementById('meal-foods-select').selectedOptions
                ).map(opt => opt.value).filter(id => id);
                
                // Get custom foods
                const customFoods = document.getElementById('meal-foods-custom').value
                    .split(',')
                    .map(f => f.trim())
                    .filter(f => f);

                if (selectedFoodIds.length === 0 && customFoods.length === 0) {
                    throw new Error('Please select foods or enter custom foods');
                }

                // Build foods array
                const foods = await this.api.getFoods();
                const selectedFoods = foods.filter(f => selectedFoodIds.includes(f.id));
                const allFoods = [
                    ...selectedFoods.map(f => ({ id: f.id, name: f.name, quantity: 1 })),
                    ...customFoods
                ];

                const meal = {
                    mealType: document.getElementById('meal-type').value,
                    foods: allFoods,
                    date: document.getElementById('meal-date').value || 
                          new Date().toISOString().split('T')[0],
                    time: document.getElementById('meal-time').value || 
                          new Date().toTimeString().slice(0, 5)
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
                this.showMessage(error.message || 'Failed to log meal', 'error');
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    showMessage(message, type = 'success') {
        this.removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }

    removeMessages() {
        document.querySelectorAll('.message').forEach(msg => msg.remove());
    }

    async deleteMeal(id) {
        if (confirm('Delete this meal?')) {
            await this.api.deleteMeal(id);
            this.loadMeals();
            this.loadDailyNutrition();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.trackerPage = new TrackerPage();
    });
} else {
    window.trackerPage = new TrackerPage();
}