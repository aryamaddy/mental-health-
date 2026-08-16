// MindPulse Survey & ML Inference Logic

document.addEventListener('DOMContentLoaded', () => {
    
    // Application State Variables
    let currentStep = 1;
    const totalSteps = 3;
    let userName = 'Friend';
    let userAge = 20;
    let radarChartInstance = null;

    // DOM Elements - Screens
    const welcomeScreen = document.getElementById('welcome-screen');
    const surveyScreen = document.getElementById('survey-screen');
    const resultsScreen = document.getElementById('results-screen');
    const loadingOverlay = document.getElementById('loading-overlay');

    // DOM Elements - Forms & Inputs
    const registrationForm = document.getElementById('registration-form');
    const surveyForm = document.getElementById('survey-form');
    const userNameInput = document.getElementById('user_name');
    const regAgeInput = document.getElementById('reg_age');
    const displayUserName = document.getElementById('display-user-name');
    const resUserName = document.getElementById('res-user-name');

    // Progress Elements
    const progressFill = document.getElementById('progress-fill');
    const currentStepNum = document.getElementById('current-step-num');

    // Range Sliders & Value Display Sync
    const usageSlider = document.getElementById('Avg_Daily_Usage_Hours');
    const usageVal = document.getElementById('usage_val');
    
    const studySlider = document.getElementById('Study_Hours');
    const studyVal = document.getElementById('study_val');

    const activitySlider = document.getElementById('Physical_Activity_Hours');
    const activityVal = document.getElementById('activity_val');

    const sleepSlider = document.getElementById('Sleep_Hours_Per_Night');
    const sleepVal = document.getElementById('sleep_val');

    if (usageSlider && usageVal) {
        usageSlider.addEventListener('input', (e) => usageVal.textContent = parseFloat(e.target.value).toFixed(1));
    }
    if (studySlider && studyVal) {
        studySlider.addEventListener('input', (e) => studyVal.textContent = parseFloat(e.target.value).toFixed(1));
    }
    if (activitySlider && activityVal) {
        activitySlider.addEventListener('input', (e) => activityVal.textContent = parseFloat(e.target.value).toFixed(2));
    }
    if (sleepSlider && sleepVal) {
        sleepSlider.addEventListener('input', (e) => sleepVal.textContent = parseFloat(e.target.value).toFixed(1));
    }

    // 1. REGISTRATION FORM SUBMIT
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userName = userNameInput.value.trim() || 'Friend';
            userAge = parseInt(regAgeInput.value) || 20;

            if (displayUserName) displayUserName.textContent = userName;
            if (resUserName) resUserName.textContent = userName;

            // Transition Screen
            welcomeScreen.classList.remove('active-screen');
            welcomeScreen.classList.add('hidden-screen');
            
            surveyScreen.classList.remove('hidden-screen');
            surveyScreen.classList.add('active-screen');
            
            updateStepDisplay(1);
        });
    }

    // 2. STEP NAVIGATION LOGIC
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepDisplay(currentStep);
                }
            }
        });
    });

    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplay(currentStep);
            }
        });
    });

    function updateStepDisplay(step) {
        currentStep = step;
        
        // Update Step Containers
        const steps = document.querySelectorAll('.survey-step');
        steps.forEach(st => {
            const stepNum = parseInt(st.getAttribute('data-step'));
            if (stepNum === currentStep) {
                st.classList.add('active-step');
            } else {
                st.classList.remove('active-step');
            }
        });

        // Update Progress Fill %
        const percentage = Math.round((currentStep / totalSteps) * 100);
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (currentStepNum) currentStepNum.textContent = currentStep;
    }

    function validateCurrentStep(step) {
        const activeStepElement = document.querySelector(`.survey-step[data-step="${step}"]`);
        if (!activeStepElement) return true;

        const inputs = activeStepElement.querySelectorAll('input[required], select[required]');
        for (let input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }
        return true;
    }

    // 3. SURVEY FORM SUBMIT & ML API CALL
    if (surveyForm) {
        surveyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateCurrentStep(currentStep)) return;

            // Show Loading Spinner
            loadingOverlay.classList.remove('hidden');

            const payload = {
                name: userName,
                Age: userAge,
                Gender: document.getElementById('Gender').value,
                Country: document.getElementById('Country').value,
                Academic_Level: document.getElementById('Academic_Level').value,
                Most_Used_Platform: document.getElementById('Most_Used_Platform').value,
                Purpose_Of_Use: document.getElementById('Purpose_Of_Use').value,
                Avg_Daily_Usage_Hours: parseFloat(document.getElementById('Avg_Daily_Usage_Hours').value),
                Daily_Unlocks: parseInt(document.getElementById('Daily_Unlocks').value),
                Study_Hours: parseFloat(document.getElementById('Study_Hours').value),
                Physical_Activity_Hours: parseFloat(document.getElementById('Physical_Activity_Hours').value),
                Sleep_Hours_Per_Night: parseFloat(document.getElementById('Sleep_Hours_Per_Night').value),
                Stress_Level: document.getElementById('Stress_Level').value
            };

            try {
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    renderDashboardResults(result);
                } else {
                    alert(`Error: ${result.error || 'Failed to analyze survey model inputs.'}`);
                }

            } catch (err) {
                console.error("API error:", err);
                alert("Network error connecting to the ML backend server.");
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        });
    }

    // 4. RENDER DASHBOARD RESULTS & CHARTS
    function renderDashboardResults(result) {
        const data = result.data;

        // Transition Screen
        surveyScreen.classList.remove('active-screen');
        surveyScreen.classList.add('hidden-screen');

        resultsScreen.classList.remove('hidden-screen');
        resultsScreen.classList.add('active-screen');

        // Render Model Info
        const modelNameEl = document.getElementById('model-display-name');
        const modelTypeEl = document.getElementById('model-display-type');
        if (modelNameEl && result.model_name) {
            modelNameEl.textContent = result.model_name;
        }
        if (modelTypeEl && result.model_type) {
            modelTypeEl.textContent = result.model_type;
        }

        // Render Score Counter Animation
        const scoreNumEl = document.getElementById('score-display-num');
        const targetScore = data.score;
        animateNumber(scoreNumEl, 0, targetScore, 1200);

        // Render Circle SVG Progress Gauge
        const circle = document.getElementById('score-progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 42; // r=42 -> 263.89
            const strokeDashoffset = circumference - (targetScore / 10.0) * circumference;
            circle.style.strokeDasharray = `${circumference}`;
            circle.style.strokeDashoffset = `${strokeDashoffset}`;
            circle.style.stroke = data.status_color || '#a855f7';
        }

        // Render Status Badge & Summary
        const badgeEl = document.getElementById('status-badge');
        if (badgeEl) {
            badgeEl.textContent = data.badge_text;
            badgeEl.style.backgroundColor = `${data.status_color}22`;
            badgeEl.style.color = data.status_color;
            badgeEl.style.border = `1px solid ${data.status_color}55`;
        }

        const summaryEl = document.getElementById('summary-text');
        if (summaryEl) summaryEl.textContent = data.summary;

        // Render Recommendations Cards
        const tipsGrid = document.getElementById('recommendations-grid');
        if (tipsGrid) {
            tipsGrid.innerHTML = '';
            data.tips.forEach(tip => {
                const card = document.createElement('div');
                card.className = 'tip-card';
                card.innerHTML = `
                    <div class="tip-icon"><i class="fa-solid ${tip.icon}"></i></div>
                    <div class="tip-content">
                        <h4>${tip.title}</h4>
                        <p>${tip.desc}</p>
                    </div>
                `;
                tipsGrid.appendChild(card);
            });
        }

        // Render Chart.js Radar
        renderRadarChart(data.sub_scores);
    }

    function animateNumber(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = (progress * (end - start) + start).toFixed(1);
            element.textContent = currentVal;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function renderRadarChart(subScores) {
        const ctx = document.getElementById('wellnessRadarChart');
        if (!ctx) return;

        if (radarChartInstance) {
            radarChartInstance.destroy();
        }

        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Sleep Health', 'Digital Balance', 'Physical Vitality', 'Stress Resilience'],
                datasets: [{
                    label: 'Your Health Score (%)',
                    data: [
                        subScores.sleep_health || 50,
                        subScores.digital_detox || 50,
                        subScores.physical_vitality || 50,
                        subScores.stress_resilience || 50
                    ],
                    backgroundColor: 'rgba(168, 85, 247, 0.25)',
                    borderColor: '#a855f7',
                    borderWidth: 2,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: '#e5e7eb',
                            font: { family: 'Outfit', size: 12, weight: '500' }
                        },
                        ticks: {
                            color: '#9ca3af',
                            backdropColor: 'transparent',
                            stepSize: 20
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // 5. RETAKE BUTTON LOGIC
    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            resultsScreen.classList.remove('active-screen');
            resultsScreen.classList.add('hidden-screen');

            welcomeScreen.classList.remove('hidden-screen');
            welcomeScreen.classList.add('active-screen');

            if (surveyForm) surveyForm.reset();
            updateStepDisplay(1);
        });
    }

});
