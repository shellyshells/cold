class FoodAPI {
    constructor() {
        // Try to detect the API URL automatically
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port || (protocol === 'https:' ? '443' : '80');

        // If served from file:// (no hostname) or running on localhost, default to the local backend.
        // This covers cases where the user opens the HTML files directly from the filesystem.
        if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
            this.baseUrl = 'http://localhost:8080/api';
        } else {
            // Use the same origin but point to port 8080 where the backend runs
            this.baseUrl = `${protocol}//${hostname}:8080/api`;
        }
        
        // Check connection on initialization
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (response.ok) {
                console.log('✅ API connection successful');
                return true;
            }
        } catch (error) {
            console.error('❌ API connection failed:', error);
            console.error('Make sure the backend server is running on http://localhost:8080');
            this.showConnectionError();
            return false;
        }
    }

    showConnectionError() {
        // Prevent multiple error messages
        if (document.getElementById('api-connection-error')) {
            return;
        }
        
        // Show a visible error message to the user
        const errorDiv = document.createElement('div');
        errorDiv.id = 'api-connection-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 90%;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <strong>Cannot connect to API server</strong><br>
            <small>Make sure the backend server is running: <code>cd backend && python app.py</code></small>
        `;
        document.body.appendChild(errorDiv);
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }

    async safeFetch(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
                this.showConnectionError();
                throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:8080');
            }
            throw error;
        }
    }

    async getFoods() {
        try {
            const response = await fetch(`${this.baseUrl}/foods`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching foods:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
            }
            // Return empty array if API is not available
            return [];
        }
    }

    async addFood(food) {
        try {
            const response = await fetch(`${this.baseUrl}/foods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(food)
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to add food' }));
                throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
                throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:8080');
            }
            throw error;
        }
    }

    async deleteFood(id) {
        await fetch(`${this.baseUrl}/foods/${id}`, { method: 'DELETE' });
    }

    async getRecipes() {
        try {
            const response = await fetch(`${this.baseUrl}/recipes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching recipes:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
            }
            return [];
        }
    }

    async addRecipe(recipe) {
        try {
            const response = await fetch(`${this.baseUrl}/recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipe)
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to add recipe' }));
                throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
                throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:8080');
            }
            throw error;
        }
    }

    async deleteRecipe(id) {
        await fetch(`${this.baseUrl}/recipes/${id}`, { method: 'DELETE' });
    }

    async getMeals() {
        try {
            const response = await fetch(`${this.baseUrl}/meals`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching meals:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
            }
            return [];
        }
    }

    async addMeal(meal) {
        try {
            const response = await fetch(`${this.baseUrl}/meals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meal)
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to add meal' }));
                throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
                throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:8080');
            }
            throw error;
        }
    }

    async getRecommendations() {
        try {
            return await this.safeFetch(`${this.baseUrl}/recommendations`);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }

    async updateFood(id, food) {
        return await this.safeFetch(`${this.baseUrl}/foods/${id}`, {
            method: 'PUT',
            body: JSON.stringify(food)
        });
    }

    async deleteMeal(id) {
        try {
            await fetch(`${this.baseUrl}/meals/${id}`, { method: 'DELETE' });
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
            }
            throw error;
        }
    }

    async getDailyNutrition(date) {
        try {
            return await this.safeFetch(`${this.baseUrl}/nutrition/daily?date=${date}`);
        } catch (error) {
            console.error('Error fetching daily nutrition:', error);
            return { date, totals: {}, byMealType: {}, meals: [] };
        }
    }

    async getHealthMetrics() {
        try {
            return await this.safeFetch(`${this.baseUrl}/health-metrics`);
        } catch (error) {
            console.error('Error fetching health metrics:', error);
            return [];
        }
    }

    async addHealthMetric(metric) {
        return await this.safeFetch(`${this.baseUrl}/health-metrics`, {
            method: 'POST',
            body: JSON.stringify(metric)
        });
    }

    async deleteHealthMetric(id) {
        try {
            await fetch(`${this.baseUrl}/health-metrics/${id}`, { method: 'DELETE' });
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showConnectionError();
            }
            throw error;
        }
    }

    async getSteps(date) {
        try {
            return await this.safeFetch(`${this.baseUrl}/steps?date=${date}`);
        } catch (error) {
            console.error('Error fetching steps:', error);
            return { date, total: 0, entries: [] };
        }
    }

    async addSteps(steps) {
        return await this.safeFetch(`${this.baseUrl}/steps`, {
            method: 'POST',
            body: JSON.stringify(steps)
        });
    }

    async getFoodAddictions() {
        try {
            return await this.safeFetch(`${this.baseUrl}/food-addictions`);
        } catch (error) {
            console.error('Error fetching food addictions:', error);
            return [];
        }
    }

    async analyzeAddictions(days = 30) {
        try {
            return await this.safeFetch(`${this.baseUrl}/food-addictions/analyze?days=${days}`);
        } catch (error) {
            console.error('Error analyzing addictions:', error);
            return {
                sugarTracking: [],
                fatTracking: [],
                averageSugar: 0,
                averageFat: 0,
                foodFrequency: {},
                period: days
            };
        }
    }

    async shareRecipe(recipeId, shareData) {
        return await this.safeFetch(`${this.baseUrl}/recipes/${recipeId}/share`, {
            method: 'POST',
            body: JSON.stringify(shareData)
        });
    }

    async getSharedRecipes() {
        try {
            return await this.safeFetch(`${this.baseUrl}/recipes/shared`);
        } catch (error) {
            console.error('Error fetching shared recipes:', error);
            return [];
        }
    }

    async getStats(days = 30) {
        try {
            return await this.safeFetch(`${this.baseUrl}/stats?days=${days}`);
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                period: days,
                foods: { total: 0, expiringSoon: 0, byStorage: { fridge: 0, shelf: 0, freezer: 0 } },
                meals: { total: 0, byType: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 } },
                nutrition: { total: {}, average: {} },
                healthMetrics: { count: 0, entries: [] },
                steps: { total: 0, average: 0, entries: 0 },
                recipes: { total: 0, shared: 0 },
                addictions: { trackedDays: 0 }
            };
        }
    }

    async getReminders() {
        try {
            return await this.safeFetch(`${this.baseUrl}/reminders`);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            return [];
        }
    }

    async getNutritionTrends(days = 30) {
        try {
            return await this.safeFetch(`${this.baseUrl}/nutrition/trends?days=${days}`);
        } catch (error) {
            console.error('Error fetching nutrition trends:', error);
            return [];
        }
    }

    async getRecipe(recipeId) {
        try {
            return await this.safeFetch(`${this.baseUrl}/recipes/${recipeId}`);
        } catch (error) {
            console.error('Error fetching recipe:', error);
            throw error;
        }
    }

    async updateRecipe(recipeId, recipe) {
        return await this.safeFetch(`${this.baseUrl}/recipes/${recipeId}`, {
            method: 'PUT',
            body: JSON.stringify(recipe)
        });
    }

    async getHealthMetricsTrends(type = 'weight', days = 30) {
        try {
            return await this.safeFetch(`${this.baseUrl}/health-metrics/trends?type=${type}&days=${days}`);
        } catch (error) {
            console.error('Error fetching health metrics trends:', error);
            return [];
        }
    }

    async syncGoogleFitSteps(stepsData) {
        return await this.safeFetch(`${this.baseUrl}/google-fit/steps`, {
            method: 'POST',
            body: JSON.stringify(stepsData)
        });
    }
}