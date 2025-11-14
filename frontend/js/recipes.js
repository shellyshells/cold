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

    async loadRecommendations() {
        const recommendations = await this.api.getRecommendations();
        const section = document.getElementById('recommendations-section');
        const list = document.getElementById('recommendations-list');
        
        if (recommendations.length === 0) {
            list.innerHTML = '<p>No recipe recommendations available. Add more foods to your inventory!</p>';
            section.style.display = 'block';
            return;
        }
        
        list.innerHTML = recommendations.map(recipe => {
            const matchPercent = Math.round((recipe.matchScore || 0) * 100);
            return `
                <div class="card recipe-card">
                    <div class="recipe-header">
                        <div>
                            <h3>${recipe.name}</h3>
                            <div>Cook time: ${recipe.cookTime} minutes | Match: ${matchPercent}%</div>
                        </div>
                        <button class="btn" onclick="recipesPage.useRecipe('${recipe.id}')">Use Recipe</button>
                    </div>
                    <div class="recipe-ingredients">
                        <strong>Ingredients:</strong>
                        ${recipe.ingredients.map(ing => 
                            `<span class="ingredient-tag">${ing}</span>`
                        ).join('')}
                    </div>
                    <div><strong>Instructions:</strong> ${recipe.instructions}</div>
                    <button class="btn btn-secondary" onclick="recipesPage.shareRecipe('${recipe.id}')">Share Recipe</button>
                </div>
            `;
        }).join('');
        
        section.style.display = 'block';
    }

    async loadSharedRecipes() {
        const sharedRecipes = await this.api.getSharedRecipes();
        const section = document.getElementById('shared-recipes-section');
        const list = document.getElementById('shared-recipes-list');
        
        if (sharedRecipes.length === 0) {
            list.innerHTML = '<p>No shared recipes available yet.</p>';
            section.style.display = 'block';
            return;
        }
        
        list.innerHTML = sharedRecipes.map(shared => {
            const recipe = shared.recipe || shared;
            return `
                <div class="card recipe-card">
                    <div class="recipe-header">
                        <div>
                            <h3>${recipe.name}</h3>
                            <div>Shared by: ${shared.sharedBy || 'Anonymous'} on ${new Date(shared.sharedAt).toLocaleDateString()}</div>
                            <div>Cook time: ${recipe.cookTime} minutes</div>
                        </div>
                        <button class="btn" onclick="recipesPage.addSharedRecipe('${recipe.id || shared.recipeId}')">Add to My Recipes</button>
                    </div>
                    <div class="recipe-ingredients">
                        <strong>Ingredients:</strong>
                        ${recipe.ingredients.map(ing => 
                            `<span class="ingredient-tag">${ing}</span>`
                        ).join('')}
                    </div>
                    <div><strong>Instructions:</strong> ${recipe.instructions}</div>
                </div>
            `;
        }).join('');
        
        section.style.display = 'block';
    }

    async shareRecipe(recipeId) {
        const sharedBy = prompt('Enter your name (optional):') || 'Anonymous';
        const isPublic = confirm('Make this recipe public to the community?');
        
        try {
            await this.api.shareRecipe(recipeId, {
                sharedBy: sharedBy,
                isPublic: isPublic
            });
            alert('Recipe shared successfully!');
        } catch (error) {
            alert('Error sharing recipe: ' + error.message);
        }
    }

    async useRecipe(recipeId) {
        // Add recipe ingredients to meal tracker
        const recipe = await this.api.getRecipe(recipeId);
        if (recipe) {
            if (confirm(`Use recipe "${recipe.name}" in meal tracker?`)) {
                // Redirect to tracker with recipe pre-filled
                window.location.href = `tracker.html?recipe=${recipeId}`;
            }
        }
    }

    async addSharedRecipe(recipeId) {
        try {
            const recipe = await this.api.getRecipe(recipeId);
            if (recipe) {
                // Add to local recipes
                await this.api.addRecipe(recipe);
                alert('Recipe added to your collection!');
                this.loadRecipes();
            }
        } catch (error) {
            // If recipe doesn't exist locally, get from shared
            const sharedRecipes = await this.api.getSharedRecipes();
            const shared = sharedRecipes.find(sr => (sr.recipe || {}).id === recipeId || sr.recipeId === recipeId);
            if (shared) {
                await this.api.addRecipe(shared.recipe || shared);
                alert('Recipe added to your collection!');
                this.loadRecipes();
            }
        }
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
                        <div>Cook time: ${recipe.cookTime} minutes | Servings: ${recipe.servings || 'N/A'}</div>
                    </div>
                    <div>
                        <button class="btn btn-secondary" onclick="recipesPage.shareRecipe('${recipe.id}')" style="margin-right: 0.5rem;">Share</button>
                        <button class="delete-btn" onclick="recipesPage.deleteRecipe('${recipe.id}')">Delete</button>
                    </div>
                </div>
                <div class="recipe-ingredients">
                    <strong>Ingredients:</strong>
                    ${recipe.ingredients.map(ing => 
                        `<span class="ingredient-tag">${ing}</span>`
                    ).join('')}
                </div>
                <div><strong>Instructions:</strong> ${recipe.instructions}</div>
                <button class="btn" onclick="recipesPage.useRecipe('${recipe.id}')" style="margin-top: 0.5rem;">Use in Meal Tracker</button>
            </div>
        `).join('');
    }

    showAddForm() {
        const form = document.getElementById('add-form');
        if (form) {
            form.classList.remove('hidden');
            // Focus on first input
            const firstInput = document.getElementById('recipe-name');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    setupForm() {
        const form = document.getElementById('recipe-form');
        if (!form) {
            console.error('Recipe form not found');
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
                
                const recipe = {
                    name: document.getElementById('recipe-name').value.trim(),
                    ingredients: document.getElementById('recipe-ingredients').value.split('\n').filter(i => i.trim() !== ''),
                    instructions: document.getElementById('recipe-instructions').value.trim(),
                    cookTime: parseInt(document.getElementById('recipe-time').value) || 0,
                    servings: parseInt(document.getElementById('recipe-servings').value) || 1
                };

                // Validate required fields
                if (!recipe.name) {
                    throw new Error('Recipe name is required');
                }
                if (recipe.ingredients.length === 0) {
                    throw new Error('Please add at least one ingredient');
                }
                if (!recipe.instructions) {
                    throw new Error('Instructions are required');
                }
                if (!recipe.cookTime || recipe.cookTime <= 0) {
                    throw new Error('Cook time must be greater than 0');
                }

                const result = await this.api.addRecipe(recipe);
                this.showMessage('Recipe added successfully!', 'success');
                await this.loadRecipes();
                this.hideForm();
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Error adding recipe:', error);
                this.showMessage(error.message || 'Failed to add recipe. Please check your connection and try again.', 'error');
                
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
        
        const form = document.getElementById('recipe-form');
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
        document.getElementById('recipe-form').reset();
    }

    async deleteRecipe(id) {
        await this.api.deleteRecipe(id);
        this.loadRecipes();
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const recipesPage = new RecipesPage();
        window.recipesPage = recipesPage;
    });
} else {
    const recipesPage = new RecipesPage();
    window.recipesPage = recipesPage;
}