class HealthPage {
    constructor() {
        this.api = new FoodAPI();
        if (typeof window.Chart === 'undefined') {
            this.showChartLibError();
            this.charts = {};
            this.currentTab = 'metrics';
            this.setupForms();
            this.loadData();
            return;
        }
        this.charts = {};
        this.currentTab = 'metrics';
        this.loadData();
        this.setupForms();
    }

    showChartLibError() {
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
            Chart.js was not loaded. Serve the frontend via HTTP or ensure the CDN script is reachable.
        `;
        document.body.appendChild(div);
    }

    showTab(tabName, event) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        if (event && event.target) {
            event.target.classList.add('active');
        } else {
            // Find the button and activate it
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                    btn.classList.add('active');
                }
            });
        }
        
        this.currentTab = tabName;
        this.loadData();
    }

    async loadData() {
        if (this.currentTab === 'metrics') {
            await this.loadMetrics();
        } else if (this.currentTab === 'steps') {
            await this.loadSteps();
        } else if (this.currentTab === 'addictions') {
            await this.loadAddictions();
        }
    }

    async loadMetrics() {
        const metrics = await this.api.getHealthMetrics();
        this.renderMetrics(metrics);
        
        // Load trends
        const weightTrends = await this.api.getHealthMetricsTrends('weight', 30);
        const bmiTrends = await this.api.getHealthMetricsTrends('bmi', 30);
        const cholesterolTrends = await this.api.getHealthMetricsTrends('cholesterol', 30);
        
        this.updateWeightChart(weightTrends);
        this.updateBMIChart(bmiTrends);
        this.updateCholesterolChart(cholesterolTrends);
    }

    async loadSteps() {
        const today = new Date().toISOString().split('T')[0];
        const stepsData = await this.api.getSteps(today);
        
        document.getElementById('today-steps').textContent = stepsData.total || 0;
        
        // Load steps for chart (last 30 days)
        const allSteps = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const daySteps = await this.api.getSteps(dateStr);
            allSteps.push({
                date: dateStr,
                steps: daySteps.total || 0
            });
        }
        allSteps.reverse();
        this.updateStepsChart(allSteps);
    }

    async loadAddictions() {
        const analysis = await this.api.analyzeAddictions(30);
        this.renderAddictionAnalysis(analysis);
        
        // Update charts
        this.updateSugarChart(analysis.sugarTracking);
        this.updateFatChart(analysis.fatTracking);
        this.renderFoodFrequency(analysis.foodFrequency);
    }

    renderMetrics(metrics) {
        const container = document.getElementById('metrics-list');
        if (metrics.length === 0) {
            container.innerHTML = '<p>No health metrics recorded yet.</p>';
            return;
        }
        
        // Sort by date
        metrics.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = metrics.slice(0, 10).map(metric => {
            const date = new Date(metric.date).toLocaleDateString();
            return `
                <div class="card" style="margin: 0.5rem 0;">
                    <strong>${metric.type.toUpperCase()}:</strong> ${metric.value} 
                    <small>(${date})</small>
                    <button class="delete-btn" onclick="healthPage.deleteMetric('${metric.id}')" style="float: right;">Delete</button>
                </div>
            `;
        }).join('');
    }

    updateWeightChart(trends) {
        const ctx = document.getElementById('weight-chart');
        if (!ctx || trends.length === 0) return;
        
        if (this.charts.weight) {
            this.charts.weight.destroy();
        }
        
        const labels = trends.map(t => new Date(t.date).toLocaleDateString());
        const values = trends.map(t => t.value);
        
        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight (kg)',
                    data: values,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
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
        if (!ctx || trends.length === 0) return;
        
        if (this.charts.bmi) {
            this.charts.bmi.destroy();
        }
        
        const labels = trends.map(t => new Date(t.date).toLocaleDateString());
        const values = trends.map(t => t.value);
        
        this.charts.bmi = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'BMI',
                    data: values,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
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
        if (!ctx || trends.length === 0) return;
        
        if (this.charts.cholesterol) {
            this.charts.cholesterol.destroy();
        }
        
        const labels = trends.map(t => new Date(t.date).toLocaleDateString());
        const values = trends.map(t => t.value);
        
        this.charts.cholesterol = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cholesterol (mg/dL)',
                    data: values,
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.2)',
                    tension: 0.1
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

    updateStepsChart(stepsData) {
        const ctx = document.getElementById('steps-chart');
        if (!ctx) return;
        
        if (this.charts.steps) {
            this.charts.steps.destroy();
        }
        
        const labels = stepsData.map(s => new Date(s.date).toLocaleDateString());
        const steps = stepsData.map(s => s.steps);
        
        this.charts.steps = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Steps',
                    data: steps,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateSugarChart(sugarData) {
        const ctx = document.getElementById('sugar-chart');
        if (!ctx || !sugarData || sugarData.length === 0) return;
        
        if (this.charts.sugar) {
            this.charts.sugar.destroy();
        }
        
        const labels = sugarData.map(s => new Date(s.date).toLocaleDateString());
        const values = sugarData.map(s => s.amount);
        
        this.charts.sugar = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sugar (g)',
                    data: values,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateFatChart(fatData) {
        const ctx = document.getElementById('fat-chart');
        if (!ctx || !fatData || fatData.length === 0) return;
        
        if (this.charts.fat) {
            this.charts.fat.destroy();
        }
        
        const labels = fatData.map(f => new Date(f.date).toLocaleDateString());
        const values = fatData.map(f => f.amount);
        
        this.charts.fat = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Fat (g)',
                    data: values,
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderAddictionAnalysis(analysis) {
        const container = document.getElementById('addiction-analysis');
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <div class="stat-card">
                    <h3>${analysis.averageSugar.toFixed(1)}g</h3>
                    <p>Average Daily Sugar</p>
                </div>
                <div class="stat-card">
                    <h3>${analysis.averageFat.toFixed(1)}g</h3>
                    <p>Average Daily Fat</p>
                </div>
            </div>
            <p style="margin-top: 1rem;">Analysis period: Last ${analysis.period} days</p>
        `;
    }

    renderFoodFrequency(foodFrequency) {
        const container = document.getElementById('food-frequency-list');
        if (!foodFrequency || Object.keys(foodFrequency).length === 0) {
            container.innerHTML = '<p>No food frequency data available.</p>';
            return;
        }
        
        const sorted = Object.entries(foodFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        container.innerHTML = sorted.map(([food, count]) => `
            <div class="card" style="margin: 0.5rem 0;">
                <strong>${food}:</strong> Consumed ${count} time(s)
            </div>
        `).join('');
    }

    setupForms() {
        // Metric form
        const metricForm = document.getElementById('metric-form');
        if (metricForm) {
            metricForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const metric = {
                    type: document.getElementById('metric-type').value,
                    value: parseFloat(document.getElementById('metric-value').value),
                    date: document.getElementById('metric-date').value || new Date().toISOString().split('T')[0]
                };
                
                await this.api.addHealthMetric(metric);
                this.loadMetrics();
                this.hideAddMetricForm();
            });
        }
        
        // Steps form
        const stepsForm = document.getElementById('steps-form');
        if (stepsForm) {
            stepsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const steps = {
                    steps: parseInt(document.getElementById('steps-value').value),
                    date: document.getElementById('steps-date').value || new Date().toISOString().split('T')[0]
                };
                
                await this.api.addSteps(steps);
                this.loadSteps();
                this.hideAddStepsForm();
            });
        }
    }

    showAddMetricForm() {
        document.getElementById('add-metric-form').classList.remove('hidden');
        document.getElementById('metric-date').value = new Date().toISOString().split('T')[0];
    }

    hideAddMetricForm() {
        document.getElementById('add-metric-form').classList.add('hidden');
        document.getElementById('metric-form').reset();
    }

    showAddStepsForm() {
        document.getElementById('add-steps-form').classList.remove('hidden');
        document.getElementById('steps-date').value = new Date().toISOString().split('T')[0];
    }

    hideAddStepsForm() {
        document.getElementById('add-steps-form').classList.add('hidden');
        document.getElementById('steps-form').reset();
    }

    async deleteMetric(id) {
        if (confirm('Delete this metric?')) {
            await this.api.deleteHealthMetric(id);
            this.loadMetrics();
        }
    }

    async analyzeAddictions() {
        await this.loadAddictions();
    }

}

const healthPage = new HealthPage();

