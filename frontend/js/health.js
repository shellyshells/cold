/**
 * Health metrics page controller.
 * 
 * Manages health metric tracking with trend visualization.
 */

class HealthPage {
    constructor() {
        this.api = new FoodAPI();
        
        if (typeof window.Chart === 'undefined') {
            this.showChartLibError();
            this.charts = {};
            this.loadMetrics();
            this.setupForm();
            return;
        }
        
        this.charts = {};
        this.loadMetrics();
        this.setupForm();
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
            <small>Chart.js library failed to load.</small>
        `;
        document.body.appendChild(div);
    }

    async loadMetrics() {
        const metrics = await this.api.getHealthMetrics();
        this.renderMetrics(metrics);
        
        // Load trends for each metric type
        const weightTrends = await this.api.getHealthMetricsTrends('weight', 30);
        const bmiTrends = await this.api.getHealthMetricsTrends('bmi', 30);
        const cholesterolTrends = await this.api.getHealthMetricsTrends('cholesterol', 30);
        
        this.updateWeightChart(weightTrends);
        this.updateBMIChart(bmiTrends);
        this.updateCholesterolChart(cholesterolTrends);
    }

    renderMetrics(metrics) {
        const container = document.getElementById('metrics-list');
        
        if (metrics.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light);">No health metrics recorded yet.</p>';
            return;
        }
        
        // Sort by date (newest first)
        metrics.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = metrics.slice(0, 10).map(metric => {
            const date = new Date(metric.date).toLocaleDateString();
            return `
                <div style="display: flex; justify-content: space-between; align-items: center;
                           padding: 0.75rem; background: var(--light-bg); 
                           border-radius: 8px; margin: 0.5rem 0;">
                    <div>
                        <strong>${metric.type.toUpperCase()}:</strong> ${metric.value}
                        <small style="color: var(--text-light); margin-left: 1rem;">${date}</small>
                    </div>
                    <button class="delete-btn" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;"
                            onclick="healthPage.deleteMetric('${metric.id}')">
                        Delete
                    </button>
                </div>
            `;
        }).join('');
    }

    updateWeightChart(trends) {
        const ctx = document.getElementById('weight-chart');
        if (!ctx || !trends || trends.length === 0) return;
        
        if (this.charts.weight) {
            this.charts.weight.destroy();
        }
        
        // Filter out null values
        const validTrends = trends.filter(t => t.value !== null);
        const labels = validTrends.map(t => new Date(t.date).toLocaleDateString());
        const values = validTrends.map(t => t.value);
        
        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight (kg)',
                    data: values,
                    borderColor: 'rgb(46, 204, 113)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    updateBMIChart(trends) {
        const ctx = document.getElementById('bmi-chart');
        if (!ctx || !trends || trends.length === 0) return;
        
        if (this.charts.bmi) {
            this.charts.bmi.destroy();
        }
        
        const validTrends = trends.filter(t => t.value !== null);
        const labels = validTrends.map(t => new Date(t.date).toLocaleDateString());
        const values = validTrends.map(t => t.value);
        
        this.charts.bmi = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'BMI',
                    data: values,
                    borderColor: 'rgb(52, 152, 219)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    updateCholesterolChart(trends) {
        const ctx = document.getElementById('cholesterol-chart');
        if (!ctx || !trends || trends.length === 0) return;
        
        if (this.charts.cholesterol) {
            this.charts.cholesterol.destroy();
        }
        
        const validTrends = trends.filter(t => t.value !== null);
        const labels = validTrends.map(t => new Date(t.date).toLocaleDateString());
        const values = validTrends.map(t => t.value);
        
        this.charts.cholesterol = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cholesterol (mg/dL)',
                    data: values,
                    borderColor: 'rgb(231, 76, 60)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    showAddForm() {
        document.getElementById('add-form').classList.remove('hidden');
        document.getElementById('metric-date').value = new Date().toISOString().split('T')[0];
        setTimeout(() => document.getElementById('metric-value').focus(), 100);
    }

    hideForm() {
        document.getElementById('add-form').classList.add('hidden');
        document.getElementById('health-form').reset();
    }

    setupForm() {
        const form = document.getElementById('health-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Adding...';
                
                const metric = {
                    type: document.getElementById('metric-type').value,
                    value: parseFloat(document.getElementById('metric-value').value),
                    date: document.getElementById('metric-date').value
                };
                
                await this.api.addHealthMetric(metric);
                this.showMessage('Health metric added successfully!', 'success');
                await this.loadMetrics();
                this.hideForm();
                
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Error adding metric:', error);
                this.showMessage(error.message || 'Failed to add metric', 'error');
                
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

    async deleteMetric(id) {
        if (confirm('Delete this metric?')) {
            await this.api.deleteHealthMetric(id);
            this.loadMetrics();
        }
    }
}

// Add missing API methods
FoodAPI.prototype.getHealthMetrics = async function() {
    try {
        return await this.safeFetch(`${this.baseUrl}/health-metrics`);
    } catch (error) {
        console.error('Error fetching health metrics:', error);
        return [];
    }
};

FoodAPI.prototype.addHealthMetric = async function(metric) {
    return await this.safeFetch(`${this.baseUrl}/health-metrics`, {
        method: 'POST',
        body: JSON.stringify(metric)
    });
};

FoodAPI.prototype.deleteHealthMetric = async function(id) {
    await fetch(`${this.baseUrl}/health-metrics/${id}`, { method: 'DELETE' });
};

FoodAPI.prototype.getHealthMetricsTrends = async function(type = 'weight', days = 30) {
    try {
        return await this.safeFetch(`${this.baseUrl}/health-metrics/trends?type=${type}&days=${days}`);
    } catch (error) {
        console.error('Error fetching health metrics trends:', error);
        return [];
    }
};

const healthPage = new HealthPage();