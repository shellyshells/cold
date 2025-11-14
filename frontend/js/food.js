/**
 * Food storage page controller.
 * 
 * Handles food CRUD operations and expiry tracking.
 * Separates UI logic from API calls following separation of responsibilities.
 */

class FoodPage {
    constructor() {
        this.api = new FoodAPI();
        this.loadFoods();
        this.setupForm();
    }

    /**
     * Load all food items from API and render them.
     */
    async loadFoods() {
        const foods = await this.api.getFoods();
        this.renderFoods(foods);
    }

    /**
     * Render food items to the page.
     * Applies styling based on expiry date.
     */
    renderFoods(foods) {
        const container = document.getElementById('food-list');
        
        if (foods.length === 0) {
            container.innerHTML = '<div class="card">No food items yet. Add your first item!</div>';
            return;
        }

        container.innerHTML = foods.map(food => {
            const daysUntil = this.getDaysUntilExpiry(food.expiryDate);
            const purchaseDate = food.purchaseDate ? 
                new Date(food.purchaseDate).toLocaleDateString() : 'N/A';
            
            return `
                <div class="card food-card ${this.getExpiryClass(food.expiryDate)}">
                    <div class="food-header">
                        <div>
                            <strong style="font-size: 1.2rem;">${food.name}</strong>
                            <div style="margin-top: 0.5rem;">
                                <strong>Storage:</strong> ${food.storageType} | 
                                <strong>Category:</strong> ${food.category}
                            </div>
                            <div>
                                <strong>Quantity:</strong> ${food.quantity} ${food.unit}
                            </div>
                            <div style="margin-top: 0.5rem;">
                                <strong>Purchased:</strong> ${purchaseDate} | 
                                <strong>Expires:</strong> ${new Date(food.expiryDate).toLocaleDateString()}
                            </div>
                            <div style="color: var(--text-light);">
                                Days until expiry: ${daysUntil}
                            </div>
                            ${daysUntil <= 3 ? '<div class="expiry-warning">⚠️ Expiring soon!</div>' : ''}
                        </div>
                        <button class="delete-btn" onclick="foodPage.deleteFood('${food.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get CSS class based on expiry date.
     */
    getExpiryClass(expiryDate) {
        const days = this.getDaysUntilExpiry(expiryDate);
        return days <= 3 ? 'expiring' : '';
    }

    /**
     * Calculate days until expiry.
     */
    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    }

    /**
     * Show the add food form.
     */
    showAddForm() {
        const form = document.getElementById('add-form');
        form.classList.remove('hidden');
        
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('food-purchase-date').value = today;
        
        // Set expiry to 7 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        document.getElementById('food-expiry').value = expiryDate.toISOString().split('T')[0];
        
        // Focus first input
        setTimeout(() => document.getElementById('food-name').focus(), 100);
    }

    /**
     * Hide the add food form.
     */
    hideForm() {
        document.getElementById('add-form').classList.add('hidden');
        document.getElementById('food-form').reset();
    }

    /**
     * Setup form submission handler.
     */
    setupForm() {
        const form = document.getElementById('food-form');
        if (!form) {
            console.error('Food form not found');
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Adding...';
                
                this.removeMessages();
                
                const food = {
                    name: document.getElementById('food-name').value.trim(),
                    storageType: document.getElementById('food-storage').value,
                    category: document.getElementById('food-category').value,
                    quantity: parseInt(document.getElementById('food-quantity').value) || 1,
                    unit: document.getElementById('food-unit').value.trim(),
                    purchaseDate: document.getElementById('food-purchase-date').value || 
                                 new Date().toISOString().split('T')[0],
                    expiryDate: document.getElementById('food-expiry').value,
                    nutrition: {
                        calories: parseFloat(document.getElementById('food-calories').value || 0),
                        protein: parseFloat(document.getElementById('food-protein').value || 0),
                        carbs: parseFloat(document.getElementById('food-carbs').value || 0),
                        fats: parseFloat(document.getElementById('food-fats').value || 0)
                    }
                };

                // Validate required fields
                if (!food.name || !food.unit || !food.expiryDate) {
                    throw new Error('Please fill in all required fields');
                }

                await this.api.addFood(food);
                this.showMessage('Food added successfully!', 'success');
                await this.loadFoods();
                this.hideForm();
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Error adding food:', error);
                this.showMessage(error.message || 'Failed to add food', 'error');
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    /**
     * Show message to user.
     */
    showMessage(message, type = 'success') {
        this.removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }

    /**
     * Remove all messages.
     */
    removeMessages() {
        document.querySelectorAll('.message').forEach(msg => msg.remove());
    }

    /**
     * Delete food item.
     */
    async deleteFood(id) {
        if (confirm('Delete this food item?')) {
            await this.api.deleteFood(id);
            this.loadFoods();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.foodPage = new FoodPage();
    });
} else {
    window.foodPage = new FoodPage();
}