 // Rymentz 2025 
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
        // Récupérer la langue du navigateur
        const browserLang = navigator.language || navigator.languages[0];
        // Extraire le code de langue (ex: "fr-FR" -> "fr")
        const languageCode = browserLang.substring(0, 2).toLowerCase();
        
        // Vérifier si la langue est disponible dans les traductions
        const availableLanguages = Object.keys(translations);
        
        if (availableLanguages.includes(languageCode)) {
            return languageCode;
        }
        
        // Retourner l'anglais par défaut si la langue n'est pas trouvée
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
        const value = parseFloat(e.target.value);
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

    // --- Chart Logic (Corrected & Original Functions Restored) ---
    const ctx = document.getElementById('emissionChart').getContext('2d');
    const startChartYear = 2009;
    const endChartYear = new Date().getFullYear() + 50;

    function generateBitcoinData() {
        const data = [];
        const genesisDate = new Date('2009-01-03T18:15:05Z');
        data.push({ x: genesisDate.getTime(), y: 0 }); // Starting point at zero

        let cumulativeSupply = 0;
        let blockHeight = 0;
        const blocksPerDay = 144;

        const halvings = [
            { untilBlock: 210000, reward: 50 }, { untilBlock: 420000, reward: 25 },
            { untilBlock: 630000, reward: 12.5 }, { untilBlock: 840000, reward: 6.25 },
            { untilBlock: 1050000, reward: 3.125 }, { untilBlock: 1260000, reward: 1.5625 },
            { untilBlock: 1470000, reward: 0.78125 }, { untilBlock: 1680000, reward: 0.390625 },
        ];

        for (let year = startChartYear; year <= endChartYear; year++) {
            if (year < genesisDate.getFullYear()) continue;
            
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
            const daysInYear = (year === genesisDate.getFullYear()) ? 363 : (isLeap ? 366 : 365);
            const blocksInYear = daysInYear * blocksPerDay;
            
            let emissionThisYear = 0;
            let blocksProcessedInYear = 0;

            while (blocksProcessedInYear < blocksInYear) {
                let currentReward = 0;
                let nextHalvingBlock = Infinity;

                for (const h of halvings) {
                    if (blockHeight < h.untilBlock) {
                        currentReward = h.reward;
                        nextHalvingBlock = h.untilBlock;
                        break;
                    }
                }
                if (currentReward === 0) currentReward = 0.1953125; 

                const blocksToNextHalving = nextHalvingBlock - blockHeight;
                const blocksLeftInYear = blocksInYear - blocksProcessedInYear;
                const blocksToProcess = Math.min(blocksToNextHalving, blocksLeftInYear);

                emissionThisYear += blocksToProcess * currentReward;
                blockHeight += blocksToProcess;
                blocksProcessedInYear += blocksToProcess;
            }

            cumulativeSupply += emissionThisYear;
            if (cumulativeSupply > BITCOIN_MAX_SUPPLY) cumulativeSupply = BITCOIN_MAX_SUPPLY;
            
            data.push({ x: new Date(year, 11, 31).getTime(), y: (cumulativeSupply / BITCOIN_MAX_SUPPLY) * 100 });
        }
        return data;
    }

    function generateKaspaData() {
        const data = [];
        const kaspaStartDate = new Date('2021-11-07T00:00:00Z');
        const phase2Date = new Date('2022-05-08T00:00:00Z');
        data.push({ x: kaspaStartDate.getTime(), y: 0 }); // Starting point at zero

        let cumulativeSupply = 0;

        // This logic is complex and precise, iterating month by month to build the curve.
        for (let year = kaspaStartDate.getFullYear(); year <= endChartYear; year++) {
            let yearlyCumulative = cumulativeSupply; // Keep track of supply at start of year for the data point
            for (let month = 0; month < 12; month++) {
                const startOfMonth = new Date(Date.UTC(year, month, 1));
                const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
                
                if (endOfMonth < kaspaStartDate) continue;

                const calcStart = startOfMonth > kaspaStartDate ? startOfMonth : kaspaStartDate;
                
                if (calcStart > endOfMonth) continue;

                if (endOfMonth < phase2Date) { // Entirely in Phase 1
                    cumulativeSupply += ((endOfMonth - calcStart) / 1000) * 500;
                } else if (calcStart >= phase2Date) { // Entirely in Phase 2
                    const monthsSincePhase2 = (calcStart.getUTCFullYear() - phase2Date.getUTCFullYear()) * 12 + (calcStart.getUTCMonth() - phase2Date.getUTCMonth());
                    const reward = 440 * Math.pow(0.5, monthsSincePhase2 / 12);
                    cumulativeSupply += ((endOfMonth - calcStart) / 1000) * reward;
                } else { // Contains the transition (May 2022)
                    cumulativeSupply += ((phase2Date - calcStart) / 1000) * 500;
                    const monthsSincePhase2 = (phase2Date.getUTCFullYear() - phase2Date.getUTCFullYear()) * 12 + (phase2Date.getUTCMonth() - phase2Date.getUTCMonth());
                    const reward = 440 * Math.pow(0.5, monthsSincePhase2 / 12);
                    cumulativeSupply += ((endOfMonth - phase2Date) / 1000) * reward;
                }
            }
            
            let finalSupply = cumulativeSupply;
            if (finalSupply > KASPA_MAX_SUPPLY) finalSupply = KASPA_MAX_SUPPLY;
            
            data.push({ x: new Date(year, 11, 31).getTime(), y: (finalSupply / KASPA_MAX_SUPPLY) * 100 });
        }
        return data;
    }

    const bitcoinData = generateBitcoinData();
    const kaspaData = generateKaspaData();

    function createChart() {
        const lang = document.documentElement.lang || 'en';
        emissionChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: translations[lang].chartLabelKaspa,
                    data: kaspaData,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(0, 240, 224, 0.1)',
                    borderWidth: 3, pointRadius: 1, pointHoverRadius: 6, tension: 0.1
                }, {
                    label: translations[lang].chartLabelBitcoin,
                    data: bitcoinData,
                    borderColor: btcColor,
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 3, pointRadius: 1, pointHoverRadius: 6, tension: 0.1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'time', time: { unit: 'year', tooltipFormat: 'yyyy' }, title: { display: true, text: 'Year', color: textColor, font: { size: 14, weight: '600' } }, ticks: { color: textColor, major: { enabled: true }, source: 'auto' }, grid: { color: gridColor }, min: new Date(startChartYear, 0, 1).getTime(), max: new Date(endChartYear, 11, 31).getTime() },
                    y: { title: { display: true, text: '% of Max Supply in Circulation', color: textColor, font: { size: 14, weight: '600' } }, ticks: { color: textColor, callback: (value) => value.toFixed(0) + '%' }, grid: { color: gridColor }, min: 0, max: 100 }
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
        emissionChart.data.datasets[0].label = translations[lang].chartLabelKaspa;
        emissionChart.data.datasets[1].label = translations[lang].chartLabelBitcoin;
        emissionChart.update();
    }

    // --- Initializations ---
    calculateEquivalent(parseFloat(kaspaSlider.value));
    kaspaAmountInput.value = parseFloat(kaspaSlider.value).toLocaleString('en-US', { useGrouping: false });
    
    // Détection automatique de la langue du navigateur
    const browserLanguage = detectBrowserLanguage();
    setLanguage(browserLanguage);
    
    // Mettre à jour le sélecteur de langue pour refléter la langue détectée
    langSwitcher.value = browserLanguage;
    
    createChart();
});