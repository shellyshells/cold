class Dashboard {
    constructor() {
        this.api = new FoodAPI();
        // If Chart.js failed to load (e.g., CDN blocked or opened via file://), show a helpful message
        if (typeof window.Chart === 'undefined') {
            this.showChartLibError();
            return;
        }
        this.charts = {};
        this.loadData();
    }

    showChartLibError() {
        // Prevent multiple error messages
        if (document.getElementById('chart-lib-error')) return;
        const div = document.createElement('div');
        div.id = 'chart-lib-error';
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
            Chart.js was not loaded. If you're opening the HTML files directly, serve the frontend over HTTP (e.g., <code>cd frontend && python -m http.server 3000</code>) or ensure the CDN script is reachable.
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
            expiringList.innerHTML = '<p>No food items expiring soon!</p>';
        } else {
            expiringList.innerHTML = expiring.map(food => `
                <div class="food-item">
                    <strong>${food.name}</strong> - Expires in ${this.getDaysUntilExpiry(food.expiryDate)} days
                </div>
            `).join('');
        }
        
        // Update charts
        this.updateNutritionChart(nutritionTrends);
        this.updateCaloriesChart(nutritionTrends);
        this.updateMealsChart(stats);
        this.updateStorageChart(stats);
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
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Carbs (g)',
                        data: trends.map(t => t.carbs),
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    },
                    {
                        label: 'Fats (g)',
                        data: trends.map(t => t.fats),
                        borderColor: 'rgb(255, 205, 86)',
                        tension: 0.1
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
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
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
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 205, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
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

    updateStorageChart(stats) {
        const ctx = document.getElementById('storage-chart');
        if (!ctx) return;
        
        if (this.charts.storage) {
            this.charts.storage.destroy();
        }
        
        const storage = stats.foods.byStorage;
        
        this.charts.storage = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Fridge', 'Shelf', 'Freezer'],
                datasets: [{
                    data: [
                        storage.fridge,
                        storage.shelf,
                        storage.freezer
                    ],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(255, 205, 86, 0.5)',
                        'rgba(54, 162, 235, 0.5)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
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

    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    }
}

const dashboard = new Dashboard();