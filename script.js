// Rymentz 2025 - Code corrigé
document.addEventListener('DOMContentLoaded', () => {
    // --- Theme colors from CSS ---
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
    const btcColor = rootStyles.getPropertyValue('--btc-color').trim();
    const textColor = rootStyles.getPropertyValue('--text-color').trim();
    const gridColor = 'rgba(255, 255, 255, 0.15)';

    // --- DOM Elements & Constants ---
    const KASPA_MAX_SUPPLY = 28700000000;
    const BITCOIN_MAX_SUPPLY = 21000000;
    const kaspaAmountInput = document.getElementById('kaspa-amount');
    const kaspaSlider = document.getElementById('kaspa-slider');
    const btcEquivalentDiv = document.getElementById('btc-equivalent');
    const copyButton = document.getElementById('copy-button');
    const donationAddress = document.getElementById('donation-addr').textContent;
    const langSwitcher = document.getElementById('lang-switcher');

    let emissionChart = null; // To hold the chart instance

    // --- Internationalization (i18n) Logic ---
    const detectBrowserLanguage = () => {
        const browserLang = navigator.language || navigator.languages[0];
        const languageCode = browserLang.substring(0, 2).toLowerCase();
        const availableLanguages = Object.keys(translations);
        if (availableLanguages.includes(languageCode)) {
            return languageCode;
        }
        return 'en';
    };

    const setLanguage = (lang) => {
        document.documentElement.lang = lang;
        const translation = translations[lang];

        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            if (translation[key]) {
                if (element.tagName === 'INPUT' && element.placeholder) {
                    element.placeholder = translation[key];
                } else {
                    element.innerHTML = translation[key]; // Use innerHTML to support <strong> tags
                }
            }
        });
        
        if(emissionChart) {
            updateChartLanguage(lang);
        }
    };

    langSwitcher.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });

    // --- Calculator Logic ---
    function calculateEquivalent(kaspaAmount) {
        if (isNaN(kaspaAmount) || kaspaAmount <= 0) {
            btcEquivalentDiv.textContent = '0.00 BTC';
            return;
        }
        const userShare = kaspaAmount / KASPA_MAX_SUPPLY;
        const equivalentBtc = userShare * BITCOIN_MAX_SUPPLY;
        btcEquivalentDiv.textContent = `${equivalentBtc.toLocaleString('en-US', { maximumFractionDigits: 8 })} BTC`;
    }

    kaspaAmountInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value.replace(/,/g, ''));
        if (!isNaN(value)) kaspaSlider.value = value;
        calculateEquivalent(value);
    });

    kaspaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        kaspaAmountInput.value = value.toLocaleString('en-US', { useGrouping: false });
        calculateEquivalent(value);
    });

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(donationAddress).then(() => {
            const originalTextKey = copyButton.getAttribute('data-i18n-key');
            const lang = document.documentElement.lang;
            copyButton.textContent = translations[lang].copyButtonCopied;
            setTimeout(() => {
                copyButton.textContent = translations[lang][originalTextKey];
            }, 2000);
        }).catch(err => {
            console.error('Error copying address: ', err);
        });
    });

    // --- Chart Logic (CORRECTED) ---
    const ctx = document.getElementById('emissionChart').getContext('2d');
    const startChartYear = 2009;
    // MODIFICATION : Étendre la date de fin pour montrer la courbe complète de Bitcoin
    const endChartYear = 2145;

    /**
     * CORRECTED: Generates Bitcoin emission data based on halving epochs.
     * This is more accurate than a time-based simulation.
     */
    function generateBitcoinData() {
        const data = [];
        const genesisDate = new Date('2009-01-03');
        let cumulativeSupply = 0;
        let blockHeight = 0;
        
        data.push({ x: genesisDate.getTime(), y: 0 });

        const halvings = [
            { endBlock: 210000, reward: 50, approxDate: new Date('2012-11-28') },
            { endBlock: 420000, reward: 25, approxDate: new Date('2016-07-09') },
            { endBlock: 630000, reward: 12.5, approxDate: new Date('2020-05-11') },
            { endBlock: 840000, reward: 6.25, approxDate: new Date('2024-04-20') },
            { endBlock: 1050000, reward: 3.125, approxDate: new Date('2028-04-01') },
            { endBlock: 1260000, reward: 1.5625, approxDate: new Date('2032-04-01') },
            { endBlock: 1470000, reward: 0.78125, approxDate: new Date('2036-04-01') },
        ];

        let lastDate = genesisDate;
        
        for (const h of halvings) {
            const blocksInEpoch = h.endBlock - blockHeight;
            cumulativeSupply += blocksInEpoch * h.reward;
            blockHeight = h.endBlock;
            data.push({ x: h.approxDate.getTime(), y: (cumulativeSupply / BITCOIN_MAX_SUPPLY) * 100 });
            lastDate = h.approxDate;
        }

        while (cumulativeSupply < BITCOIN_MAX_SUPPLY) {
            const lastReward = data.length > 1 ? halvings[halvings.length-1].reward / Math.pow(2, data.length - halvings.length) : 0.00000001;
            if(lastReward < 0.00000001) break;
            
            cumulativeSupply += 210000 * lastReward;
            if (cumulativeSupply > BITCOIN_MAX_SUPPLY) {
                cumulativeSupply = BITCOIN_MAX_SUPPLY;
            }
             
            const nextDate = new Date(lastDate);
            nextDate.setFullYear(lastDate.getFullYear() + 4);
            data.push({ x: nextDate.getTime(), y: (cumulativeSupply / BITCOIN_MAX_SUPPLY) * 100 });
            lastDate = nextDate;
        }
        
        data.push({ x: new Date('2140-01-01').getTime(), y: 100 });

        return data;
    }

    /**
     * CORRECTED: Generates Kaspa emission data based on its two-phase monetary policy.
     * This is more robust and calculates the supply month-by-month.
     */
    function generateKaspaData() {
        const data = [];
        const startDate = new Date('2021-11-07T00:00:00Z');
        const phase2Date = new Date('2022-05-08T00:00:00Z');
        
        data.push({ x: startDate.getTime(), y: 0 });

        let cumulativeSupply = 0;
        let currentDate = new Date(startDate);
        
        // Phase 1: Pre-deflationary (500 KAS/sec)
        const phase1Seconds = (phase2Date.getTime() - startDate.getTime()) / 1000;
        const phase1Supply = phase1Seconds * 500;
        cumulativeSupply += phase1Supply;
        
        data.push({ x: phase2Date.getTime(), y: (cumulativeSupply / KASPA_MAX_SUPPLY) * 100 });
        
        currentDate = new Date(phase2Date);
        
        // Phase 2: Chromatic (monthly reduction)
        const initialChromaticReward = 440; // KAS per second
        const monthlyReductionFactor = Math.pow(0.5, 1/12);
        let monthCounter = 0;

        while (cumulativeSupply < KASPA_MAX_SUPPLY) {
            const rewardThisMonth = initialChromaticReward * Math.pow(monthlyReductionFactor, monthCounter);
            
            if (rewardThisMonth < 0.001) {
                break;
            }

            const nextMonthDate = new Date(currentDate);
            nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
            
            const secondsInMonth = (nextMonthDate.getTime() - currentDate.getTime()) / 1000;
            cumulativeSupply += secondsInMonth * rewardThisMonth;
            
            if (currentDate.getUTCMonth() === 11) {
                 data.push({ x: currentDate.getTime(), y: (cumulativeSupply / KASPA_MAX_SUPPLY) * 100 });
            }

            currentDate = nextMonthDate;
            monthCounter++;
        }
        
        cumulativeSupply = KASPA_MAX_SUPPLY;
        data.push({ x: currentDate.getTime(), y: 100 });
        data.push({ x: new Date('2140-01-01').getTime(), y: 100 });
        return data;
    }

    const bitcoinData = generateBitcoinData();
    const kaspaData = generateKaspaData();

    function createChart() {
        const lang = document.documentElement.lang || 'en';
        // MODIFICATION : Ajout de 'fill: true' et ajustement de 'tension' pour un meilleur visuel
        emissionChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: translations[lang].chartLabelKaspa,
                    data: kaspaData,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(0, 240, 224, 0.1)',
                    borderWidth: 3, pointRadius: 1, pointHoverRadius: 6, tension: 0.1, fill: true
                }, {
                    label: translations[lang].chartLabelBitcoin,
                    data: bitcoinData,
                    borderColor: btcColor,
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 3, pointRadius: 1, pointHoverRadius: 6, tension: 0.4, fill: true
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { 
                        type: 'time', 
                        time: { unit: 'year', tooltipFormat: 'yyyy' }, 
                        title: { display: true, text: 'Year', color: textColor, font: { size: 14, weight: '600' } }, 
                        ticks: { color: textColor, major: { enabled: true }, source: 'auto' }, 
                        grid: { color: gridColor }, 
                        min: new Date(startChartYear, 0, 1).getTime(), 
                        max: new Date(endChartYear, 11, 31).getTime() 
                    },
                    y: { 
                        title: { display: true, text: '% of Max Supply in Circulation', color: textColor, font: { size: 14, weight: '600' } }, 
                        ticks: { color: textColor, callback: (value) => value.toFixed(0) + '%' }, 
                        grid: { color: gridColor }, 
                        min: 0, 
                        max: 100 
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: textColor, font: { size: 14 } } },
                    tooltip: {
                        mode: 'x', intersect: false,
                        callbacks: {
                            title: (tooltipItems) => translations[document.documentElement.lang].chartTooltipTitle + new Date(tooltipItems[0].parsed.x).getFullYear(),
                            label: (context) => { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null && context.parsed.y !== undefined) { label += context.parsed.y.toFixed(2) + '%'; } return label; }
                        }
                    }
                }
            }
        });
    }

    function updateChartLanguage(lang) {
        if (!emissionChart) return;
        const chartTranslations = translations[lang];
        emissionChart.data.datasets[0].label = chartTranslations.chartLabelKaspa;
        emissionChart.data.datasets[1].label = chartTranslations.chartLabelBitcoin;
        // MODIFICATION : Assurer que les titres des axes sont aussi traduits
        emissionChart.options.scales.x.title.text = chartTranslations.chartXAxisLabel || 'Year';
        emissionChart.options.scales.y.title.text = chartTranslations.chartYAxisLabel || '% of Max Supply in Circulation';
        emissionChart.update();
    }

    // --- Initializations ---
    calculateEquivalent(parseFloat(kaspaSlider.value));
    kaspaAmountInput.value = parseFloat(kaspaSlider.value).toLocaleString('en-US', { useGrouping: false });
    
    const browserLanguage = detectBrowserLanguage();
    // MODIFICATION : S'assurer que le menu déroulant reflète la langue détectée
    langSwitcher.value = browserLanguage;
    setLanguage(browserLanguage);
    
    createChart();
});