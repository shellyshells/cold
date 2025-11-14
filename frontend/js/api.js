/**
 * API wrapper class for Fridgy backend communication.
 * 
 * Handles all HTTP requests to the backend API with error handling,
 * connection checking, and user-friendly error messages.
 * 
 * Follows DRY principle - all API calls go through this single class.
 */

class FoodAPI {
    constructor() {
        // Auto-detect API URL based on environment
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
            this.baseUrl = 'http://localhost:8080/api';
        } else {
            this.baseUrl = `${protocol}//${hostname}:8080/api`;
        }
        
        this.checkConnection();
    }

    /**
     * Check if backend API is accessible.
     * Shows error message to user if connection fails.
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (response.ok) {
                console.log('✅ API connection successful');
                return true;
            }
        } catch (error) {
            console.error('❌ API connection failed:', error);
            console.error('Make sure backend is running: python backend/app.py');
            this.showConnectionError();
            return false;
        }
    }

    /**
     * Display connection error message to user.
     * Only shows once to avoid multiple error boxes.
     */
    showConnectionError() {
        if (document.getElementById('api-connection-error')) {
            return;
        }
        
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
            <small>Make sure backend is running: <code>cd backend && python app.py</code></small>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }

    /**
     * Safe fetch wrapper with error handling.
     * Converts network errors into user-friendly messages.
     */
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
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') || 
                error.name === 'TypeError') {
                this.showConnectionError();
                throw new Error('Cannot connect to server');
            }
            throw error;
        }
    }

    /**
     * Get all food items from inventory.
     */
    async getFoods() {
        try {
            const response = await fetch(`${this.baseUrl}/foods`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching foods:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showConnectionError();
            }
            return [];
        }
    }

    /**
     * Add new food item to inventory.
     */
    async addFood(food) {
        try {
            const response = await fetch(`${this.baseUrl}/foods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(food)
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ 
                    error: 'Failed to add food' 
                }));
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                this.showConnectionError();
                throw new Error('Cannot connect to server');
            }
            throw error;
        }
    }

    /**
     * Delete food item from inventory.
     */
    async deleteFood(id) {
        await fetch(`${this.baseUrl}/foods/${id}`, { method: 'DELETE' });
    }

    /**
     * Update existing food item.
     */
    async updateFood(id, food) {
        return await this.safeFetch(`${this.baseUrl}/foods/${id}`, {
            method: 'PUT',
            body: JSON.stringify(food)
        });
    }

    /**
     * Get all recipes.
     */
    async getRecipes() {
        try {
            return await this.safeFetch(`${this.baseUrl}/recipes`);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            return [];
        }
    }

    /**
     * Add new recipe.
     */
    async addRecipe(recipe) {
        return await this.safeFetch(`${this.baseUrl}/recipes`, {
            method: 'POST',
            body: JSON.stringify(recipe)
        });
    }

    /**
     * Delete recipe.
     */
    async deleteRecipe(id) {
        await fetch(`${this.baseUrl}/recipes/${id}`, { method: 'DELETE' });
    }

    /**
     * Get recipe recommendations based on available ingredients.
     */
    async getRecommendations() {
        try {
            return await this.safeFetch(`${this.baseUrl}/recommendations`);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }

    /**
     * Get statistics for dashboard.
     */
    async getStats(days = 30) {
        try {
            return await this.safeFetch(`${this.baseUrl}/stats?days=${days}`);
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                period: days,
                foods: { total: 0, expiringSoon: 0, byStorage: {} },
                meals: { total: 0, byType: {} },
                nutrition: { total: {}, average: {} }
            };
        }
    }

    /**
     * Get food expiry reminders.
     */
    async getReminders() {
        try {
            return await this.safeFetch(`${this.baseUrl}/reminders`);
        } catch (error) {
            console.error('Error fetching reminders:', error);
            return [];
        }
    }
}