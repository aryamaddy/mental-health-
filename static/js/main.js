// ═══════════════════════════════════════════════════════
// MindPulse – Premium Survey & ML Inference Logic
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    // ─── State ───
    let currentStep = 1;
    const totalSteps = 3;
    let userName = 'Friend';
    let userAge = 20;
    let radarChartInstance = null;

    // ─── DOM Elements ───
    const welcomeScreen = document.getElementById('welcome-screen');
    const surveyScreen = document.getElementById('survey-screen');
    const resultsScreen = document.getElementById('results-screen');
    const loadingOverlay = document.getElementById('loading-overlay');
    const registrationForm = document.getElementById('registration-form');
    const surveyForm = document.getElementById('survey-form');
    const userNameInput = document.getElementById('user_name');
    const regAgeInput = document.getElementById('reg_age');
    const displayUserName = document.getElementById('display-user-name');
    const resUserName = document.getElementById('res-user-name');
    const progressFill = document.getElementById('progress-fill');
    const userAvatar = document.getElementById('user-avatar');
    const stepPills = document.querySelectorAll('.step-pill');

    // ─── Floating Particles Generator ───
    function createParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        const count = window.innerWidth < 768 ? 15 : 35;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (8 + Math.random() * 15) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
            p.style.opacity = (0.2 + Math.random() * 0.4).toString();
            container.appendChild(p);
        }
    }
    createParticles();

    // ─── Range Slider Sync ───
    const sliders = [
        { id: 'Avg_Daily_Usage_Hours', valId: 'usage_val', decimals: 1 },
        { id: 'Study_Hours', valId: 'study_val', decimals: 1 },
        { id: 'Physical_Activity_Hours', valId: 'activity_val', decimals: 1 },
        { id: 'Sleep_Hours_Per_Night', valId: 'sleep_val', decimals: 1 }
    ];

    sliders.forEach(({ id, valId, decimals }) => {
        const slider = document.getElementById(id);
        const display = document.getElementById(valId);
        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = parseFloat(e.target.value).toFixed(decimals);
                // Update gradient fill on range track
                const pct = ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
                e.target.style.background = `linear-gradient(90deg, rgba(99,102,241,0.5) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
                // Update 24-hour time budget
                updateTimeBudget();
            });
            // Init gradient on load
            const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
            slider.style.background = `linear-gradient(90deg, rgba(99,102,241,0.5) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
        }
    });

    // ─── 24-Hour Time Budget Calculator ───
    function updateTimeBudget() {
        const social = parseFloat(document.getElementById('Avg_Daily_Usage_Hours')?.value || 4);
        const sleep = parseFloat(document.getElementById('Sleep_Hours_Per_Night')?.value || 7);
        const study = parseFloat(document.getElementById('Study_Hours')?.value || 4.5);
        const activity = parseFloat(document.getElementById('Physical_Activity_Hours')?.value || 1.5);
        
        const used = social + sleep + study + activity;
        const free = Math.max(0, 24 - used);
        const isOverflow = used > 24;

        // Update bar segments (as % of 24)
        const toPercent = (val) => ((val / 24) * 100).toFixed(2) + '%';
        
        const tbSocial = document.getElementById('tb-social');
        const tbSleep = document.getElementById('tb-sleep');
        const tbStudy = document.getElementById('tb-study');
        const tbActivity = document.getElementById('tb-activity');
        const tbFree = document.getElementById('tb-free');

        if (tbSocial) tbSocial.style.width = toPercent(social);
        if (tbSleep) tbSleep.style.width = toPercent(sleep);
        if (tbStudy) tbStudy.style.width = toPercent(study);
        if (tbActivity) tbActivity.style.width = toPercent(activity);
        if (tbFree) tbFree.style.width = isOverflow ? '0%' : toPercent(free);

        // Update legend values
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val.toFixed(1) + 'h';
        };
        setVal('tb-social-val', social);
        setVal('tb-sleep-val', sleep);
        setVal('tb-study-val', study);
        setVal('tb-activity-val', activity);
        setVal('tb-free-val', free);

        // Update remaining text
        const remainEl = document.getElementById('time-remaining');
        if (remainEl) {
            if (isOverflow) {
                remainEl.innerHTML = `Overflow: <strong>-${(used - 24).toFixed(1)}h</strong>`;
                remainEl.classList.add('overflow');
            } else {
                remainEl.innerHTML = `Daily Work/Free: <strong>${free.toFixed(1)}h</strong>`;
                remainEl.classList.remove('overflow');
            }
        }

        // Warning
        const warningEl = document.getElementById('time-warning');
        if (warningEl) {
            warningEl.classList.toggle('hidden', !isOverflow);
        }

        // Disable submit button if overflow
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = isOverflow;
            submitBtn.style.opacity = isOverflow ? '0.4' : '1';
            submitBtn.style.cursor = isOverflow ? 'not-allowed' : 'pointer';
        }
    }

    // Initialize on load
    updateTimeBudget();

    // ═══════════════════════════════════════════════════
    // 1. REGISTRATION FORM
    // ═══════════════════════════════════════════════════
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userName = userNameInput.value.trim() || 'Friend';
            userAge = parseInt(regAgeInput.value) || 20;

            if (displayUserName) displayUserName.textContent = userName;
            if (resUserName) resUserName.textContent = userName;
            if (userAvatar) userAvatar.textContent = userName.charAt(0).toUpperCase();

            // Transition
            switchScreen(welcomeScreen, surveyScreen);
            updateStepDisplay(1);
        });
    }

    // ═══════════════════════════════════════════════════
    // 2. STEP NAVIGATION
    // ═══════════════════════════════════════════════════
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep(currentStep) && currentStep < totalSteps) {
                currentStep++;
                updateStepDisplay(currentStep);
            }
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplay(currentStep);
            }
        });
    });

    function updateStepDisplay(step) {
        currentStep = step;

        // Show/hide steps
        document.querySelectorAll('.survey-step').forEach(st => {
            const num = parseInt(st.getAttribute('data-step'));
            st.classList.toggle('active-step', num === currentStep);
        });

        // Progress bar
        const pct = Math.round((currentStep / totalSteps) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;

        // Step pills
        stepPills.forEach(pill => {
            const pillNum = parseInt(pill.getAttribute('data-pill'));
            pill.classList.remove('active', 'completed');
            if (pillNum === currentStep) pill.classList.add('active');
            else if (pillNum < currentStep) pill.classList.add('completed');
        });
    }

    function validateCurrentStep(step) {
        const el = document.querySelector(`.survey-step[data-step="${step}"]`);
        if (!el) return true;
        const inputs = el.querySelectorAll('input[required], select[required]');
        for (let input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }
        return true;
    }

    // ═══════════════════════════════════════════════════
    // 3. SURVEY SUBMIT & ML API CALL
    // ═══════════════════════════════════════════════════
    if (surveyForm) {
        surveyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateCurrentStep(currentStep)) return;

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

    // ═══════════════════════════════════════════════════
    // 4. RENDER DASHBOARD
    // ═══════════════════════════════════════════════════
    function renderDashboardResults(result) {
        const data = result.data;

        switchScreen(surveyScreen, resultsScreen);

        // Model Info
        const modelNameEl = document.getElementById('model-display-name');
        const modelTypeEl = document.getElementById('model-display-type');
        if (modelNameEl && result.model_name) modelNameEl.textContent = result.model_name;
        if (modelTypeEl && result.model_type) modelTypeEl.textContent = result.model_type;

        // Score Animation
        const scoreNumEl = document.getElementById('score-display-num');
        const targetScore = data.score;
        animateNumber(scoreNumEl, 0, targetScore, 1500);

        // Circle SVG Progress
        const circle = document.getElementById('score-progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 50; // r=50 -> 314.16
            const offset = circumference - (targetScore / 10.0) * circumference;
            circle.style.strokeDasharray = `${circumference}`;
            // Delay slightly for animation effect
            requestAnimationFrame(() => {
                circle.style.strokeDashoffset = `${offset}`;
            });
        }

        // Status Badge
        const badgeEl = document.getElementById('status-badge');
        if (badgeEl) {
            badgeEl.textContent = data.badge_text;
            badgeEl.style.backgroundColor = `${data.status_color}18`;
            badgeEl.style.color = data.status_color;
            badgeEl.style.border = `1px solid ${data.status_color}40`;
        }

        // Summary
        const summaryEl = document.getElementById('summary-text');
        if (summaryEl) summaryEl.textContent = data.summary;

        // Recommendations
        const tipsGrid = document.getElementById('recommendations-grid');
        if (tipsGrid) {
            tipsGrid.innerHTML = '';
            data.tips.forEach((tip, i) => {
                const card = document.createElement('div');
                card.className = 'tip-card';
                card.style.animationDelay = `${i * 0.1}s`;
                card.style.animation = `screenIn 0.5s var(--ease-out) ${i * 0.1}s both`;
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

        // Radar Chart
        renderRadarChart(data.sub_scores);
    }

    function animateNumber(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = (eased * (end - start) + start).toFixed(1);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function renderRadarChart(subScores) {
        const ctx = document.getElementById('wellnessRadarChart');
        if (!ctx) return;
        if (radarChartInstance) radarChartInstance.destroy();

        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Sleep Health', 'Digital Balance', 'Physical Vitality', 'Stress Resilience'],
                datasets: [{
                    label: 'Your Score (%)',
                    data: [
                        subScores.sleep_health || 50,
                        subScores.digital_detox || 50,
                        subScores.physical_vitality || 50,
                        subScores.stress_resilience || 50
                    ],
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderColor: '#6366f1',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#a855f7',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                        grid: { color: 'rgba(255, 255, 255, 0.06)', lineWidth: 1 },
                        pointLabels: {
                            color: '#94a3b8',
                            font: { family: 'Outfit', size: 12, weight: '600' }
                        },
                        ticks: {
                            color: '#64748b',
                            backdropColor: 'transparent',
                            stepSize: 20,
                            font: { size: 10 }
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(12, 17, 29, 0.95)',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderWidth: 1,
                        titleFont: { family: 'Outfit', weight: '600' },
                        bodyFont: { family: 'Inter' },
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // 5. RETAKE
    // ═══════════════════════════════════════════════════
    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            switchScreen(resultsScreen, welcomeScreen);
            if (surveyForm) surveyForm.reset();
            currentStep = 1;
            // Reset slider visuals
            sliders.forEach(({ id }) => {
                const slider = document.getElementById(id);
                if (slider) {
                    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
                    slider.style.background = `linear-gradient(90deg, rgba(99,102,241,0.5) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
                }
            });
        });
    }

    // ─── Helpers ───
    function switchScreen(from, to) {
        from.classList.remove('active-screen');
        from.classList.add('hidden-screen');
        to.classList.remove('hidden-screen');
        to.classList.add('active-screen');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ─── Navbar Scroll Effect ───
    const navbar = document.getElementById('navbar');
    if (navbar) {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (scrollY > 50) {
                navbar.style.background = 'rgba(6, 8, 15, 0.92)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
            } else {
                navbar.style.background = 'rgba(6, 8, 15, 0.7)';
                navbar.style.boxShadow = 'none';
            }
            lastScroll = scrollY;
        });
    }
});
