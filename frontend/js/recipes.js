/**
 * Recipes page controller.
 * 
 * Manages recipe CRUD operations and display.
 */

class RecipesPage {
    constructor() {
        this.api = new FoodAPI();
        this.loadRecipes();
        this.setupForm();
    }

    async loadRecipes() {
        const recipes = await this.api.getRecipes();
        this.renderRecipes(recipes);
    }

    renderRecipes(recipes) {
        const container = document.getElementById('recipes-list');
        
        if (recipes.length === 0) {
            container.innerHTML = '<div class="card">No recipes yet. Add your first recipe!</div>';
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="card recipe-card">
                <div class="recipe-header">
                    <div>
                        <h3>${recipe.name}</h3>
                        <div style="color: var(--text-light);">
                            Cook time: ${recipe.cookTime} minutes | Servings: ${recipe.servings || 'N/A'}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="recipesPage.deleteRecipe('${recipe.id}')">
                        Delete
                    </button>
                </div>
                <div class="recipe-ingredients">
                    <strong>Ingredients:</strong><br>
                    ${recipe.ingredients.map(ing => 
                        `<span class="ingredient-tag">${ing}</span>`
                    ).join('')}
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Instructions:</strong>
                    <p style="margin-top: 0.5rem; white-space: pre-line;">${recipe.instructions}</p>
                </div>
            </div>
        `).join('');
    }

    showAddForm() {
        document.getElementById('add-form').classList.remove('hidden');
        setTimeout(() => document.getElementById('recipe-name').focus(), 100);
    }

    hideForm() {
        document.getElementById('add-form').classList.add('hidden');
        document.getElementById('recipe-form').reset();
    }

    setupForm() {
        const form = document.getElementById('recipe-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Adding...';
                
                this.removeMessages();
                
                // BUG: Not filtering empty lines properly!
                const recipe = {
                    name: document.getElementById('recipe-name').value.trim(),
                    ingredients: document.getElementById('recipe-ingredients').value
                        .split('\n')
                        .map(i => i.trim())
                        .filter(i => i !== ''),
                    instructions: document.getElementById('recipe-instructions').value.trim(),
                    cookTime: parseInt(document.getElementById('recipe-time').value) || 0,
                    servings: parseInt(document.getElementById('recipe-servings').value) || 1
                };

                if (!recipe.name || !recipe.instructions) {
                    throw new Error('Please fill in all required fields');
                }

                await this.api.addRecipe(recipe);
                this.showMessage('Recipe added successfully!', 'success');
                await this.loadRecipes();
                this.hideForm();
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Error adding recipe:', error);
                this.showMessage(error.message || 'Failed to add recipe', 'error');
                
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

    async deleteRecipe(id) {
        if (confirm('Delete this recipe?')) {
            await this.api.deleteRecipe(id);
            this.loadRecipes();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.recipesPage = new RecipesPage();
    });
} else {
    window.recipesPage = new RecipesPage();
}