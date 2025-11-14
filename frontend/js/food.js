class FoodPage {
    constructor() {
        this.api = new FoodAPI();
        this.loadFoods();
        this.loadReminders();
        this.setupForm();
        // Refresh reminders every minute
        setInterval(() => this.loadReminders(), 60000);
    }

    async loadFoods() {
        const foods = await this.api.getFoods();
        this.renderFoods(foods);
    }

    async loadReminders() {
        const reminders = await this.api.getReminders();
        this.renderReminders(reminders);
    }

    renderReminders(reminders) {
        const remindersSection = document.getElementById('reminders-section');
        const remindersList = document.getElementById('reminders-list');
        
        if (reminders.length === 0) {
            remindersSection.style.display = 'none';
            return;
        }
        
        remindersSection.style.display = 'block';
        remindersList.innerHTML = reminders.map(reminder => {
            const priorityClass = reminder.priority === 'high' ? 'expiry-high' : 'expiry-medium';
            return `
                <div class="reminder-item ${priorityClass}">
                    <strong>${reminder.food.name}</strong> - 
                    Expires in ${reminder.daysUntilExpiry} day(s) 
                    (${new Date(reminder.expiryDate).toLocaleDateString()})
                    <br>
                    <small>Storage: ${reminder.food.storageType} | Quantity: ${reminder.food.quantity} ${reminder.food.unit}</small>
                </div>
            `;
        }).join('');
        
        // Show browser notification if there are high priority reminders
        const highPriority = reminders.filter(r => r.priority === 'high');
        if (highPriority.length > 0 && Notification.permission === 'granted') {
            new Notification(`Fridgy: ${highPriority.length} food item(s) expiring today!`, {
                body: highPriority.map(r => r.food.name).join(', '),
                icon: '/image/logo.png'
            });
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                alert('Notifications enabled! You will be notified when food is expiring.');
            }
        } else {
            alert('Notifications are not supported in this browser.');
        }
    }

    renderFoods(foods) {
        const container = document.getElementById('food-list');
        container.innerHTML = foods.map(food => {
            const daysUntil = this.getDaysUntilExpiry(food.expiryDate);
            const purchaseDate = food.purchaseDate ? new Date(food.purchaseDate).toLocaleDateString() : 'N/A';
            const duration = food.purchaseDate && food.expiryDate ? 
                Math.ceil((new Date(food.expiryDate) - new Date(food.purchaseDate)) / (1000 * 60 * 60 * 24)) : 'N/A';
            
            return `
            <div class="card food-card ${this.getExpiryClass(food.expiryDate)}">
                <div class="food-header">
                    <div>
                        <strong>${food.name}</strong>
                        <div>Storage: ${food.storageType} | Category: ${food.category}</div>
                        <div>Quantity: ${food.quantity} ${food.unit}</div>
                        <div>Purchased: ${purchaseDate} | Expires: ${new Date(food.expiryDate).toLocaleDateString()}</div>
                        <div>Duration: ${duration} days | Days until expiry: ${daysUntil}</div>
                        ${daysUntil <= 3 ? `<div class="expiry-warning">Expiring soon!</div>` : ''}
                    </div>
                    <button class="delete-btn" onclick="foodPage.deleteFood('${food.id}')">Delete</button>
                </div>
            </div>
        `;
        }).join('');
    }

    getExpiryClass(expiryDate) {
        const days = this.getDaysUntilExpiry(expiryDate);
        return days <= 3 ? 'expiring' : '';
    }

    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    }

    showAddForm() {
        const form = document.getElementById('add-form');
        if (form) {
            form.classList.remove('hidden');
            // Set default date values
            const today = new Date().toISOString().split('T')[0];
            const purchaseDateInput = document.getElementById('food-purchase-date');
            const expiryDateInput = document.getElementById('food-expiry');
            if (purchaseDateInput && !purchaseDateInput.value) {
                purchaseDateInput.value = today;
            }
            if (expiryDateInput && !expiryDateInput.value) {
                // Set expiry to 7 days from now
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 7);
                expiryDateInput.value = expiryDate.toISOString().split('T')[0];
            }
            // Focus on first input
            const firstInput = document.getElementById('food-name');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

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
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Adding...';
                
                // Remove any existing messages
                this.removeMessages();
                
                const food = {
                    name: document.getElementById('food-name').value.trim(),
                    storageType: document.getElementById('food-storage').value,
                    category: document.getElementById('food-category').value,
                    quantity: parseInt(document.getElementById('food-quantity').value) || 1,
                    unit: document.getElementById('food-unit').value.trim(),
                    purchaseDate: document.getElementById('food-purchase-date')?.value || new Date().toISOString().split('T')[0],
                    expiryDate: document.getElementById('food-expiry').value,
                    nutrition: {
                        calories: parseFloat(document.getElementById('food-calories')?.value || 0),
                        protein: parseFloat(document.getElementById('food-protein')?.value || 0),
                        carbs: parseFloat(document.getElementById('food-carbs')?.value || 0),
                        fats: parseFloat(document.getElementById('food-fats')?.value || 0),
                        saturatedFats: parseFloat(document.getElementById('food-saturated-fats')?.value || 0),
                        sodium: parseFloat(document.getElementById('food-sodium')?.value || 0),
                        cholesterol: parseFloat(document.getElementById('food-cholesterol')?.value || 0),
                        fiber: parseFloat(document.getElementById('food-fiber')?.value || 0),
                        sugar: parseFloat(document.getElementById('food-sugar')?.value || 0)
                    }
                };

                // Validate required fields
                if (!food.name || !food.unit || !food.expiryDate) {
                    throw new Error('Please fill in all required fields (Name, Unit, Expiry Date)');
                }

                const result = await this.api.addFood(food);
                this.showMessage('Food added successfully!', 'success');
                await this.loadFoods();
                await this.loadReminders();
                this.hideForm();
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Error adding food:', error);
                this.showMessage(error.message || 'Failed to add food. Please check your connection and try again.', 'error');
                
                // Reset button
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
        
        const form = document.getElementById('food-form');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
        } else {
            const container = document.querySelector('.container');
            if (container) {
                container.insertBefore(messageDiv, container.firstChild);
            }
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    removeMessages() {
        document.querySelectorAll('.message').forEach(msg => msg.remove());
    }

    hideForm() {
        document.getElementById('add-form').classList.add('hidden');
        document.getElementById('food-form').reset();
    }

    async deleteFood(id) {
        await this.api.deleteFood(id);
        this.loadFoods();
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const foodPage = new FoodPage();
        window.foodPage = foodPage;
    });
} else {
    const foodPage = new FoodPage();
    window.foodPage = foodPage;
}