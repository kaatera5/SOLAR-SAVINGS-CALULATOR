document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('solar-form');
    const resultsPanel = document.getElementById('results');
    let savingsChart = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm()) {
            calculateSolarSavings();
        }
    });

    // Suppress native browser tooltips
    form.addEventListener('invalid', (e) => {
        e.preventDefault();
        validateForm();
    }, true);

    // Real-time validation
    document.getElementById('bill').addEventListener('input', () => {
        validateForm();
    });

    function validateForm() {
        const locationInput = document.getElementById('location');
        const billInput = document.getElementById('bill');
        const rateInput = document.getElementById('rate');
        const areaInput = document.getElementById('area');

        const billError = document.getElementById('bill-error');
        const formError = document.getElementById('form-error');

        // Reset all error states
        formError.classList.add('hidden');
        billError.classList.add('hidden');
        [locationInput, billInput, rateInput, areaInput].forEach(el => el.classList.remove('input-error'));

        // 1. Check for empty fields first
        const emptyFields = [locationInput, billInput, rateInput, areaInput].filter(el => !el.value.trim());
        if (emptyFields.length > 0) {
            emptyFields.forEach(el => el.classList.add('input-error'));
            formError.classList.remove('hidden');
            resultsPanel.classList.add('hidden');
            const detailedAnalysis = document.getElementById('detailed-analysis');
            if (detailedAnalysis) detailedAnalysis.classList.add('hidden');
            return false;
        }

        // 2. Check numeric range for bill
        const billVal = parseFloat(billInput.value);
        if (isNaN(billVal) || billVal < 100|| billVal > 100000) {
            billInput.classList.add('input-error');
            billError.classList.remove('hidden');
            resultsPanel.classList.add('hidden');
            const detailedAnalysis = document.getElementById('detailed-analysis');
            if (detailedAnalysis) detailedAnalysis.classList.add('hidden');
            return false;
        }

        return true;
    }

    function calculateSolarSavings() {
        // Step 1: Get Inputs
        const monthlyBill = parseFloat(document.getElementById('bill').value);
        const electricityRate = parseFloat(document.getElementById('rate').value);
        const roofArea = parseFloat(document.getElementById('area').value);
        const systemType = document.getElementById('system-type').value;

        // Step 2: Monthly Electricity Consumption
        // Units Consumed = Monthly Bill / Electricity Rate
        const monthlyUnits = monthlyBill / electricityRate;

        // Step 3: Required Solar System Size
        // 1 kW solar system produces about 120 units per month.
        // System Size (kW) = Monthly Units / 120
        let systemSize = monthlyUnits / 120;

        // Cap based on typical rooftop constraints if needed, but let's stick to the prompt formulas
        // Prompt says cost is 60,000 per kW
        const costPerKW = 60000;
        const totalCost = systemSize * costPerKW;

        // Step 4: Annual Savings
        // Annual Savings = Monthly Bill * 12
        const annualSavings = monthlyBill * 12;

        // Step 5: Payback Period
        // Payback Period = Installation Cost / Annual Savings
        const paybackPeriod = totalCost / annualSavings;

        // Step 6: Lifetime Savings (25 years)
        const lifetimeSavings = annualSavings * 25;

        // Step 7: Government Subsidy (Indian Rules)
        /*
        1–3 kW → 40% subsidy
        3–10 kW → 20% subsidy (for the incremental part in reality, but prompt implies flat tiered or simple)
        Interpretation: Let's follow a standard Indian tiered subsidy logic:
        Up to 3kW: 40%
        Above 3kW up to 10kW: 20%
        */
        let subsidyAmount = 0;
        if (systemSize <= 3) {
            subsidyAmount = totalCost * 0.40;
        } else {
            // Standard approach: 40% on first 3kW, 20% on the rest up to 10kW
            const firstTierCost = 3 * costPerKW;
            const remainingSize = Math.min(systemSize, 10) - 3;
            const remainingCost = remainingSize * costPerKW;

            subsidyAmount = (firstTierCost * 0.40) + (remainingCost * 0.20);
        }

        const finalCost = totalCost - subsidyAmount;

        // Step 8: Environmental Impact
        // 1 kW solar reduces 1 ton CO2 per year
        const co2Reduction = systemSize * 1;
        const treeEquivalent = co2Reduction * 30;

        // Step 9: EMI Calculator
        // Monthly EMI = Final Cost / 60 months
        const emi = finalCost / 60;

        // Update UI
        updateUI({
            systemSize: systemSize.toFixed(2),
            totalCost: totalCost,
            subsidy: subsidyAmount,
            finalCost: finalCost,
            annualSavings: annualSavings,
            payback: paybackPeriod.toFixed(1),
            lifetime: lifetimeSavings,
            co2: co2Reduction.toFixed(1),
            trees: Math.round(treeEquivalent),
            emi: emi,
            billBefore: monthlyBill,
            billAfter: monthlyBill * 0.08 // Approximate 8% of original bill
        });

        // Show results with animation
        resultsPanel.classList.remove('hidden');
        
        const impactSection = document.getElementById('impact-result');
        if (impactSection) impactSection.classList.remove('hidden');

        const comparisonSection = document.getElementById('bill-comparison-result');
        if (comparisonSection) comparisonSection.classList.remove('hidden');
        document.getElementById('detailed-analysis').classList.remove('hidden');
        resultsPanel.scrollIntoView({ behavior: 'smooth' });

        // Render Chart
        renderSavingsChart(annualSavings);
    }

    function updateUI(data) {
        document.getElementById('res-size').textContent = `${data.systemSize} kW`;
        document.getElementById('res-cost').textContent = `₹${formatCurrency(data.finalCost)}`;
        document.getElementById('res-subsidy').textContent = `Subsidy: ₹${formatCurrency(data.subsidy)}`;
        document.getElementById('res-annual').textContent = `₹${formatCurrency(data.annualSavings)}`;
        document.getElementById('res-payback').textContent = data.payback;
        document.getElementById('res-lifetime').textContent = `₹${formatCurrency(data.lifetime)}`;
        document.getElementById('res-co2').textContent = `${data.co2} Tons CO₂ saved/yr`;
        document.getElementById('res-trees').textContent = `${data.trees} Trees planted equiv.`;
        document.getElementById('res-emi').textContent = `₹${formatCurrency(data.emi)} /month`;
        document.getElementById('res-bill-before').innerHTML = `₹${formatCurrency(data.billBefore)} <span style="font-size: 1rem; font-weight: normal; opacity: 0.7;">/month</span>`;
        document.getElementById('res-bill-after').innerHTML = `₹${formatCurrency(data.billAfter)} <span style="font-size: 1rem; font-weight: normal; opacity: 0.9;">/month</span>`;
    }

    function formatCurrency(val) {
        return new Intl.NumberFormat('en-IN').format(Math.round(val));
    }

    function renderSavingsChart(annualSavings) {
        const ctx = document.getElementById('savingsChart').getContext('2d');

        if (savingsChart) {
            savingsChart.destroy();
        }

        const years = Array.from({ length: 26 }, (_, i) => i);
        const savingsData = years.map(y => y * annualSavings);

        savingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => `Year ${y}`),
                datasets: [{
                    label: 'Cumulative Savings (₹)',
                    data: savingsData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Savings: ₹${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '₹' + formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all other open items
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                    item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            if (isActive) {
                faqItem.classList.remove('active');
                button.setAttribute('aria-expanded', 'false');
            } else {
                faqItem.classList.add('active');
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Modal Logic
    const consultationBtns = document.querySelectorAll('.consultation-btn');
    const bookingModal = document.getElementById('booking-modal');
    const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    const bookingForm = document.getElementById('booking-form');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingSuccess = document.getElementById('booking-success');

    function openModal() {
        if (bookingModal) {
            bookingModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal() {
        if (bookingModal) {
            bookingModal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset form after a delay to keep it hidden during closing animation
            setTimeout(() => {
                if (bookingForm) bookingForm.reset();
                if (bookingFormContainer) bookingFormContainer.classList.remove('hidden');
                if (bookingSuccess) bookingSuccess.classList.add('hidden');
            }, 300);
        }
    }

    if (consultationBtns) {
        consultationBtns.forEach(btn => {
            btn.addEventListener('click', openModal);
        });
    }

    if (closeBtns) {
        closeBtns.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            closeModal();
        }
    });

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('booking-name').value;
            const phone = document.getElementById('booking-phone').value;
            const email = document.getElementById('booking-email').value;
            const date = document.getElementById('booking-date').value;
            const time = document.getElementById('booking-time').value;
            const consultationType = document.getElementById('consultation-type').value;

            try {
                const response = await fetch('http://localhost:5000/api/consultations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email, date, time, consultationType })
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message
                    bookingFormContainer.classList.add('hidden');
                    bookingSuccess.classList.remove('hidden');
                } else {
                    alert(data.message || 'An error occurred.');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Could not connect to the server. Is it running?');
            }
        });
    }

    // Roof Area Logic
    const roofForm = document.getElementById('roof-form');
    const roofResultContainer = document.getElementById('roof-result-container');
    const calcRoofArea = document.getElementById('calc-roof-area');
    const calcRoofKw = document.getElementById('calc-roof-kw');
    
    if (roofForm) {
        roofForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const length = parseFloat(document.getElementById('roof-length').value);
            const width = parseFloat(document.getElementById('roof-width').value);
            
            if (length > 0 && width > 0) {
                const area = length * width;
                const kw = (area / 100).toFixed(1);
                
                calcRoofArea.textContent = new Intl.NumberFormat('en-IN').format(area);
                calcRoofKw.textContent = kw;
                
                roofResultContainer.classList.remove('hidden');
                
                // Extra UX: auto-fill the calculator area input if the user decides to scroll up
                const mainAreaInput = document.getElementById('area');
                if (mainAreaInput) {
                    mainAreaInput.value = area;
                }
            }
        });
    }

});
