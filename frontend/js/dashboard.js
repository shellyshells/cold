/**
 * Dashboard page controller.
 * 
 * Displays statistics and charts for food, meals, and nutrition data.
 * Uses Chart.js for data visualization.
 */

class Dashboard {
    constructor() {
        this.api = new FoodAPI();
        
        // Check if Chart.js loaded
        if (typeof window.Chart === 'undefined') {
            this.showChartLibError();
            return;
        }
        
        this.charts = {};
        this.loadData();
    }

    showChartLibError() {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 110px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
        `;
        div.innerHTML = `
            <strong>Charts disabled</strong><br>
            <small>Chart.js library failed to load. Check your internet connection.</small>
        `;
        document.body.appendChild(div);
    }

    async loadData() {
        const days = parseInt(document.getElementById('period-select').value) || 30;
        
        // Load stats
        const stats = await this.api.getStats(days);
        const foods = await this.api.getFoods();
        const nutritionTrends = await this.api.getNutritionTrends(days);
        
        // Update stat cards
        document.getElementById('total-foods').textContent = stats.foods.total;
        document.getElementById('expiring-soon').textContent = stats.foods.expiringSoon;
        document.getElementById('total-meals').textContent = stats.meals.total;
        document.getElementById('total-recipes').textContent = stats.recipes.total;
        
        // Update expiring list
        const expiring = foods.filter(food => {
            const expiry = new Date(food.expiryDate);
            const today = new Date();
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 3 && diffDays >= 0;
        });
        
        const expiringList = document.getElementById('expiring-list');
        if (expiring.length === 0) {
            expiringList.innerHTML = '<p style="color: var(--text-light);">No food items expiring soon! ✅</p>';
        } else {
            expiringList.innerHTML = expiring.map(food => `
                <div style="padding: 0.5rem; border-left: 4px solid #f39c12; 
                           margin: 0.5rem 0; background: #fff9e6; border-radius: 4px;">
                    <strong>${food.name}</strong> - Expires in ${this.getDaysUntilExpiry(food.expiryDate)} day(s)
                </div>
            `).join('');
        }
        
        // Update charts
        this.updateCaloriesChart(nutritionTrends);
        this.updateNutritionChart(nutritionTrends);
        this.updateMealsChart(stats);
    }

    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    }

    updateCaloriesChart(trends) {
        const ctx = document.getElementById('calories-chart');
        if (!ctx) return;
        
        if (this.charts.calories) {
            this.charts.calories.destroy();
        }
        
        const labels = trends.map(t => new Date(t.date).toLocaleDateString());
        const calories = trends.map(t => t.calories);
        
        this.charts.calories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Calories',
                    data: calories,
                    backgroundColor: 'rgba(46, 204, 113, 0.5)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateNutritionChart(trends) {
        const ctx = document.getElementById('nutrition-chart');
        if (!ctx) return;
        
        if (this.charts.nutrition) {
            this.charts.nutrition.destroy();
        }
        
        const labels = trends.map(t => new Date(t.date).toLocaleDateString());
        
        this.charts.nutrition = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Protein (g)',
                        data: trends.map(t => t.protein),
                        borderColor: 'rgb(231, 76, 60)',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Carbs (g)',
                        data: trends.map(t => t.carbs),
                        borderColor: 'rgb(52, 152, 219)',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Fats (g)',
                        data: trends.map(t => t.fats),
                        borderColor: 'rgb(241, 196, 15)',
                        backgroundColor: 'rgba(241, 196, 15, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateMealsChart(stats) {
        const ctx = document.getElementById('meals-chart');
        if (!ctx) return;
        
        if (this.charts.meals) {
            this.charts.meals.destroy();
        }
        
        const mealTypes = stats.meals.byType;
        
        this.charts.meals = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
                datasets: [{
                    data: [
                        mealTypes.breakfast,
                        mealTypes.lunch,
                        mealTypes.dinner,
                        mealTypes.snacks
                    ],
                    backgroundColor: [
                        'rgba(231, 76, 60, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(241, 196, 15, 0.8)'
                    ],
                    borderColor: [
                        'rgb(231, 76, 60)',
                        'rgb(52, 152, 219)',
                        'rgb(155, 89, 182)',
                        'rgb(241, 196, 15)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
}

// Add missing API method
FoodAPI.prototype.getNutritionTrends = async function(days = 30) {
    try {
        return await this.safeFetch(`${this.baseUrl}/nutrition/trends?days=${days}`);
    } catch (error) {
        console.error('Error fetching nutrition trends:', error);
        return [];
    }
};

const dashboard = new Dashboard();