// TempoSwap DEX - Complete Functionality

// Global state
let app = {
    web3: null,
    account: null,
    networkId: null,
    isConnected: false,
    tokens: {
        INSDR: { symbol: 'INSDR', name: 'Airdrop Insiders', balance: '990001000', price: 0.1576, color: '#8b5cf6' },
        AlphaUSD: { symbol: 'AlphaUSD', name: 'Alpha USD', balance: '38999999.917545', price: 1.00, color: '#3b82f6' },
        BetaUSD: { symbol: 'BetaUSD', name: 'Beta USD', balance: '1000000', price: 1.00, color: '#10b981' },
        ThetaUSD: { symbol: 'ThetaUSD', name: 'Theta USD', balance: '1000000', price: 1.00, color: '#f59e0b' }
    },
    pools: [
        { pair: 'INSDR/AlphaUSD', tvl: 1245890, volume24h: 124589, apy: 12.45, fee: 0.3 },
        { pair: 'INSDR/BetaUSD', tvl: 890200, volume24h: 89000, apy: 10.12, fee: 0.3 },
        { pair: 'AlphaUSD/BetaUSD', tvl: 2150000, volume24h: 215000, apy: 5.25, fee: 0.05 }
    ],
    slippage: 1,
    currentPage: 'swap'
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing TempoSwap DEX...');
    
    // Initialize UI
    initUI();
    
    // Initialize Web3
    await initWeb3();
    
    // Load initial data
    loadInitialData();
    
    // Show main content
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        console.log('DEX initialized successfully');
    }, 1000);
});

// Initialize UI components
function initUI() {
    // Navigation
    initNavigation();
    
    // Swap functionality
    initSwap();
    
    // Liquidity functionality
    initLiquidity();
    
    // Analytics functionality
    initAnalytics();
    
    // Modals
    initModals();
    
    // Event listeners
    initEventListeners();
}

// Initialize navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected page
            showPage(page);
        });
    });
}

// Show page
function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`${page}Page`).classList.add('active');
    app.currentPage = page;
    
    // Load page-specific data
    switch(page) {
        case 'swap':
            updateSwapView();
            break;
        case 'liquidity':
            updateLiquidityView();
            break;
        case 'analytics':
            updateAnalyticsView();
            break;
    }
}

// Initialize Web3
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            app.web3 = new Web3(window.ethereum);
            console.log('Web3 initialized');
            
            // Get network ID
            app.networkId = await ethereum.request({ method: 'net_version' });
            console.log('Network ID:', app.networkId);
            
            // Check if connected to Tempo Testnet
            if (app.networkId !== '42429') {
                showToast('Please switch to Tempo Testnet (Chain ID: 42429)', 'warning');
            }
            
            // Listen for account changes
            ethereum.on('accountsChanged', handleAccountsChanged);
            
            // Listen for network changes
            ethereum.on('chainChanged', handleChainChanged);
            
        } catch (error) {
            console.error('Error initializing Web3:', error);
            showToast('Failed to initialize Web3 provider', 'error');
        }
    } else {
        console.warn('No Web3 provider found');
        showToast('Please install MetaMask to use all features', 'warning');
    }
}

// Initialize swap functionality
function initSwap() {
    // From token amount input
    const fromAmountInput = document.getElementById('fromAmount');
    fromAmountInput.addEventListener('input', updateSwapCalculation);
    
    // Percentage buttons
    document.querySelectorAll('.btn-percent').forEach(btn => {
        btn.addEventListener('click', function() {
            const percent = parseInt(this.dataset.percent);
            setSwapAmountPercentage(percent);
        });
    });
    
    // Max button
    document.getElementById('maxBtn').addEventListener('click', setMaxAmount);
    
    // Switch tokens button
    document.getElementById('switchTokensBtn').addEventListener('click', switchTokens);
    
    // Update initial swap view
    updateSwapView();
}

// Update swap view
function updateSwapView() {
    // Set token logos and names
    updateTokenDisplay('from', 'INSDR');
    updateTokenDisplay('to', 'AlphaUSD');
    
    // Update balances
    updateSwapBalances();
    
    // Update swap button
    updateSwapButton();
}

// Update token display
function updateTokenDisplay(side, symbol) {
    const token = app.tokens[symbol];
    if (!token) return;
    
    const element = document.getElementById(`${side}Token${side === 'from' ? 'Logo' : 'Logo'}`);
    const fallback = document.getElementById(`${side}TokenFallback`);
    const symbolEl = document.getElementById(`${side}TokenSymbol`);
    const nameEl = document.getElementById(`${side}TokenName`);
    
    if (fallback) {
        fallback.textContent = symbol.charAt(0);
        fallback.style.background = token.color;
        fallback.className = `token-fallback ${symbol.toLowerCase().replace('usd', '')}`;
    }
    
    if (symbolEl) symbolEl.textContent = symbol;
    if (nameEl) nameEl.textContent = token.name;
}

// Update swap balances
function updateSwapBalances() {
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const toSymbol = document.getElementById('toTokenSymbol').textContent;
    
    const fromToken = app.tokens[fromSymbol];
    const toToken = app.tokens[toSymbol];
    
    if (fromToken) {
        document.getElementById('fromBalance').textContent = formatNumber(parseFloat(fromToken.balance));
    }
    
    if (toToken) {
        document.getElementById('toBalance').textContent = formatNumber(parseFloat(toToken.balance));
    }
}

// Update swap calculation
function updateSwapCalculation() {
    const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const toSymbol = document.getElementById('toTokenSymbol').textContent;
    
    if (fromAmount <= 0) {
        resetSwapOutput();
        return;
    }
    
    // Get token prices
    const fromToken = app.tokens[fromSymbol];
    const toToken = app.tokens[toSymbol];
    
    if (!fromToken || !toToken) return;
    
    // Calculate exchange rate
    const exchangeRate = (toToken.price / fromToken.price).toFixed(6);
    const toAmount = fromAmount * exchangeRate;
    
    // Update UI
    document.getElementById('toAmount').value = toAmount.toFixed(6);
    document.getElementById('exchangeRate').textContent = `1 ${fromSymbol} = ${exchangeRate} ${toSymbol}`;
    
    // Calculate fiat values
    const fromValue = fromAmount * fromToken.price;
    const toValue = toAmount * toToken.price;
    
    document.getElementById('fromAmountFiat').textContent = `≈ $${formatNumber(fromValue)}`;
    document.getElementById('toAmountFiat').textContent = `≈ $${formatNumber(toValue)}`;
    
    // Calculate fees and minimum received
    const lpFee = toAmount * 0.003; // 0.30%
    const minReceived = toAmount * ((100 - app.slippage) / 100);
    
    document.getElementById('expectedOutput').textContent = `${toAmount.toFixed(6)} ${toSymbol}`;
    document.getElementById('lpFee').textContent = `${lpFee.toFixed(6)} ${toSymbol}`;
    document.getElementById('minimumReceived').textContent = `${minReceived.toFixed(6)} ${toSymbol}`;
    
    // Update price impact (simulated)
    const priceImpact = fromAmount > 1000 ? (fromAmount / 100000).toFixed(2) : '< 0.01';
    document.getElementById('priceImpact').textContent = `${priceImpact}%`;
    
    // Update swap button
    updateSwapButton();
}

// Reset swap output
function resetSwapOutput() {
    document.getElementById('toAmount').value = '';
    document.getElementById('fromAmountFiat').textContent = '≈ $0.00';
    document.getElementById('toAmountFiat').textContent = '≈ $0.00';
    document.getElementById('expectedOutput').textContent = '0.00';
    document.getElementById('lpFee').textContent = '0.00';
    document.getElementById('minimumReceived').textContent = '0.00';
    updateSwapButton();
}

// Set swap amount percentage
function setSwapAmountPercentage(percent) {
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const fromToken = app.tokens[fromSymbol];
    
    if (fromToken) {
        const balance = parseFloat(fromToken.balance);
        const amount = (balance * percent) / 100;
        document.getElementById('fromAmount').value = amount;
        updateSwapCalculation();
    }
}

// Set max amount
function setMaxAmount() {
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const fromToken = app.tokens[fromSymbol];
    
    if (fromToken) {
        document.getElementById('fromAmount').value = fromToken.balance;
        updateSwapCalculation();
    }
}

// Switch tokens
function switchTokens() {
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const toSymbol = document.getElementById('toTokenSymbol').textContent;
    const fromAmount = document.getElementById('fromAmount').value;
    const toAmount = document.getElementById('toAmount').value;
    
    // Swap tokens
    updateTokenDisplay('from', toSymbol);
    updateTokenDisplay('to', fromSymbol);
    
    // Swap amounts
    document.getElementById('fromAmount').value = toAmount;
    document.getElementById('toAmount').value = fromAmount;
    
    // Update calculation
    updateSwapCalculation();
    updateSwapBalances();
}

// Update swap button
function updateSwapButton() {
    const swapBtn = document.getElementById('swapBtn');
    const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const fromToken = app.tokens[fromSymbol];
    
    if (!app.isConnected) {
        swapBtn.innerHTML = `
            <div class="swap-btn-content">
                <i class="fas fa-wallet"></i>
                <span>Connect Wallet</span>
            </div>
        `;
        swapBtn.disabled = false;
        return;
    }
    
    if (fromAmount <= 0) {
        swapBtn.innerHTML = `
            <div class="swap-btn-content">
                <i class="fas fa-exchange-alt"></i>
                <span>Enter Amount</span>
            </div>
        `;
        swapBtn.disabled = true;
    } else if (fromToken && fromAmount > parseFloat(fromToken.balance)) {
        swapBtn.innerHTML = `
            <div class="swap-btn-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Insufficient Balance</span>
            </div>
        `;
        swapBtn.disabled = true;
    } else {
        swapBtn.innerHTML = `
            <div class="swap-btn-content">
                <i class="fas fa-exchange-alt"></i>
                <span>Swap</span>
            </div>
        `;
        swapBtn.disabled = false;
    }
}

// Initialize liquidity functionality
function initLiquidity() {
    // Liquidity tabs
    document.querySelectorAll('.liquidity-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.liquidity-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.dataset.tab === tabName) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Add liquidity button
    document.getElementById('addLiquidityBtn').addEventListener('click', addLiquidity);
    
    // Create pool button
    document.getElementById('createPoolBtn').addEventListener('click', createPool);
    
    // Token amount inputs for liquidity
    document.getElementById('tokenAAmount').addEventListener('input', updateLiquidityCalculation);
    document.getElementById('tokenBAmount').addEventListener('input', updateLiquidityCalculation);
    
    // Update liquidity view
    updateLiquidityView();
}

// Update liquidity view
function updateLiquidityView() {
    // Update token balances
    updateLiquidityBalances();
    
    // Update pool cards
    updatePoolCards();
}

// Update liquidity balances
function updateLiquidityBalances() {
    document.getElementById('tokenABalance').textContent = formatNumber(parseFloat(app.tokens.INSDR.balance));
    document.getElementById('tokenBBalance').textContent = formatNumber(parseFloat(app.tokens.AlphaUSD.balance));
}

// Update liquidity calculation
function updateLiquidityCalculation() {
    const tokenAAmount = parseFloat(document.getElementById('tokenAAmount').value) || 0;
    const tokenBAmount = parseFloat(document.getElementById('tokenBAmount').value) || 0;
    
    // Simple validation
    if (tokenAAmount > 0 && tokenBAmount > 0) {
        // Calculate pool share (simulated)
        const poolShare = Math.min(tokenAAmount / 1000, tokenBAmount / 1000) * 100;
        document.querySelector('.pool-share').textContent = `Your share: ${poolShare.toFixed(2)}%`;
    }
}

// Add liquidity
function addLiquidity() {
    if (!app.isConnected) {
        showWalletModal();
        return;
    }
    
    const tokenAAmount = parseFloat(document.getElementById('tokenAAmount').value) || 0;
    const tokenBAmount = parseFloat(document.getElementById('tokenBAmount').value) || 0;
    
    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
        showToast('Please enter amounts for both tokens', 'warning');
        return;
    }
    
    // Simulate adding liquidity
    showToast('Adding liquidity to pool...', 'info');
    
    setTimeout(() => {
        showToast('Liquidity added successfully!', 'success');
        document.getElementById('tokenAAmount').value = '';
        document.getElementById('tokenBAmount').value = '';
        document.querySelector('.pool-share').textContent = 'Your share: 0%';
    }, 2000);
}

// Create pool
function createPool() {
    if (!app.isConnected) {
        showWalletModal();
        return;
    }
    
    const initialPrice = parseFloat(document.getElementById('initialPrice').value);
    const initialLiquidity = parseFloat(document.getElementById('initialLiquidity').value);
    const feeTier = document.querySelector('input[name="fee"]:checked').value;
    
    if (!initialPrice || !initialLiquidity) {
        showToast('Please fill all fields', 'warning');
        return;
    }
    
    // Simulate pool creation
    showToast('Creating new pool...', 'info');
    
    setTimeout(() => {
        showToast('Pool created successfully!', 'success');
        
        // Add to pools list
        const newPool = {
            pair: 'NEW/POOL',
            tvl: initialLiquidity * 2,
            volume24h: 0,
            apy: 15.00,
            fee: parseFloat(feeTier)
        };
        app.pools.unshift(newPool);
        
        // Update pool cards
        updatePoolCards();
        
        // Reset form
        document.getElementById('initialPrice').value = '';
        document.getElementById('initialLiquidity').value = '';
    }, 3000);
}

// Update pool cards
function updatePoolCards() {
    const poolsGrid = document.querySelector('.pools-grid');
    if (!poolsGrid) return;
    
    // Clear existing cards except first two (template)
    const existingCards = poolsGrid.querySelectorAll('.pool-card');
    for (let i = 2; i < existingCards.length; i++) {
        existingCards[i].remove();
    }
    
    // Add pool cards
    app.pools.forEach(pool => {
        const [tokenA, tokenB] = pool.pair.split('/');
        const poolCard = document.createElement('div');
        poolCard.className = 'pool-card';
        poolCard.innerHTML = `
            <div class="pool-header">
                <div class="pool-tokens">
                    <div class="token-pair">
                        <div class="token-logo-small ${tokenA.toLowerCase().replace('usd', '')}">${tokenA.charAt(0)}</div>
                        <div class="token-logo-small ${tokenB.toLowerCase().replace('usd', '')}">${tokenB.charAt(0)}</div>
                    </div>
                    <div class="pool-name">
                        <h4>${pool.pair}</h4>
                        <span>${pool.fee}% Fee</span>
                    </div>
                </div>
                <div class="pool-apy positive">${pool.apy.toFixed(2)}% APY</div>
            </div>
            <div class="pool-stats">
                <div class="stat">
                    <span>TVL</span>
                    <span>$${formatNumber(pool.tvl)}</span>
                </div>
                <div class="stat">
                    <span>Volume 24h</span>
                    <span>$${formatNumber(pool.volume24h)}</span>
                </div>
                <div class="stat">
                    <span>Your Liquidity</span>
                    <span>$0.00</span>
                </div>
            </div>
            <button class="btn-add-liquidity">
                <i class="fas fa-plus"></i>
                <span>Add Liquidity</span>
            </button>
        `;
        
        poolsGrid.appendChild(poolCard);
        
        // Add event listener to the new button
        const addBtn = poolCard.querySelector('.btn-add-liquidity');
        addBtn.addEventListener('click', function() {
            showToast(`Adding liquidity to ${pool.pair} pool...`, 'info');
            setTimeout(() => {
                showToast('Liquidity added successfully!', 'success');
            }, 2000);
        });
    });
}

// Initialize analytics functionality
function initAnalytics() {
    // Initialize chart
    initChart();
    
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update chart data based on period
            const period = this.textContent;
            updateChartData(period);
        });
    });
    
    // Update analytics view
    updateAnalyticsView();
}

// Update analytics view
function updateAnalyticsView() {
    // Update chart
    updateChartData('24H');
    
    // Update statistics
    updateAnalyticsStats();
}

// Initialize chart
function initChart() {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    
    // Chart configuration
    window.volumeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Volume',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'TVL',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#475569',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// Update chart data
function updateChartData(period) {
    let labels, volumeData, tvlData;
    
    // Generate sample data based on period
    switch(period) {
        case '24H':
            labels = Array.from({length: 24}, (_, i) => `${i}:00`);
            volumeData = generateRandomData(24, 100000, 200000);
            tvlData = generateRandomData(24, 4000000, 6000000);
            break;
        case '7D':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            volumeData = generateRandomData(7, 500000, 1500000);
            tvlData = generateRandomData(7, 4000000, 5500000);
            break;
        case '30D':
            labels = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
            volumeData = generateRandomData(30, 1000000, 3000000);
            tvlData = generateRandomData(30, 3500000, 5500000);
            break;
        case '1Y':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            volumeData = generateRandomData(12, 2000000, 5000000);
            tvlData = generateRandomData(12, 3000000, 6000000);
            break;
    }
    
    // Update chart
    if (window.volumeChart) {
        window.volumeChart.data.labels = labels;
        window.volumeChart.data.datasets[0].data = volumeData;
        window.volumeChart.data.datasets[1].data = tvlData;
        window.volumeChart.update();
    }
}

// Generate random data for chart
function generateRandomData(count, min, max) {
    return Array.from({length: count}, () => 
        Math.floor(Math.random() * (max - min + 1)) + min
    );
}

// Update analytics statistics
function updateAnalyticsStats() {
    // Calculate total TVL
    const totalTVL = app.pools.reduce((sum, pool) => sum + pool.tvl, 0);
    const totalVolume = app.pools.reduce((sum, pool) => sum + pool.volume24h, 0);
    
    // Update cards (these would be dynamic in a real app)
    console.log('Analytics stats updated');
}

// Initialize modals
function initModals() {
    // Wallet modal
    const connectBtn = document.getElementById('connectWalletBtn');
    const closeWalletModal = document.getElementById('closeWalletModal');
    const metamaskOption = document.getElementById('metamaskOption');
    const walletConnectOption = document.getElementById('walletConnectOption');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', showWalletModal);
    }
    
    if (closeWalletModal) {
        closeWalletModal.addEventListener('click', () => hideModal('walletModal'));
    }
    
    if (metamaskOption) {
        metamaskOption.addEventListener('click', connectMetaMask);
    }
    
    if (walletConnectOption) {
        walletConnectOption.addEventListener('click', () => {
            showToast('WalletConnect integration coming soon!', 'info');
        });
    }
    
    // Token modal
    const fromTokenSelector = document.getElementById('fromTokenSelector');
    const toTokenSelector = document.getElementById('toTokenSelector');
    const closeTokenModal = document.getElementById('closeTokenModal');
    
    if (fromTokenSelector) {
        fromTokenSelector.addEventListener('click', () => showTokenModal('from'));
    }
    
    if (toTokenSelector) {
        toTokenSelector.addEventListener('click', () => showTokenModal('to'));
    }
    
    if (closeTokenModal) {
        closeTokenModal.addEventListener('click', () => hideModal('tokenModal'));
    }
    
    // Token search
    const tokenSearch = document.getElementById('tokenSearch');
    if (tokenSearch) {
        tokenSearch.addEventListener('input', searchTokens);
    }
    
    // Slippage modal
    const slippageSettings = document.getElementById('slippageSettings');
    const closeSlippageModal = document.getElementById('closeSlippageModal');
    const saveSlippage = document.getElementById('saveSlippage');
    
    if (slippageSettings) {
        slippageSettings.addEventListener('click', () => showModal('slippageModal'));
    }
    
    if (closeSlippageModal) {
        closeSlippageModal.addEventListener('click', () => hideModal('slippageModal'));
    }
    
    if (saveSlippage) {
        saveSlippage.addEventListener('click', saveSlippageSettings);
    }
    
    // Slippage options
    document.querySelectorAll('.slippage-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.slippage-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            const slippage = parseFloat(this.dataset.slippage);
            document.getElementById('customSlippage').value = '';
            app.slippage = slippage;
            document.querySelector('#slippageSettings span').textContent = `Slippage: ${slippage}%`;
        });
    });
    
    // Custom slippage input
    const customSlippage = document.getElementById('customSlippage');
    if (customSlippage) {
        customSlippage.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value >= 0.1 && value <= 50) {
                document.querySelectorAll('.slippage-option').forEach(o => o.classList.remove('active'));
                app.slippage = value;
            }
        });
    }
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Initialize token list if showing token modal
        if (modalId === 'tokenModal') {
            populateTokenList();
        }
    }
}

// Hide modal
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Show wallet modal
function showWalletModal() {
    showModal('walletModal');
}

// Connect MetaMask
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        showToast('Please install MetaMask extension', 'error');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    try {
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            app.account = accounts[0];
            app.isConnected = true;
            
            // Update UI
            updateWalletUI();
            
            // Hide modal
            hideModal('walletModal');
            
            // Show success message
            showToast('Wallet connected successfully!', 'success');
            
            console.log('Connected account:', app.account);
        }
    } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        
        if (error.code === 4001) {
            showToast('Please connect your wallet to continue', 'warning');
        } else {
            showToast('Failed to connect wallet', 'error');
        }
    }
}

// Disconnect wallet
function disconnectWallet() {
    app.account = null;
    app.isConnected = false;
    updateWalletUI();
    showToast('Wallet disconnected', 'info');
}

// Update wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    const walletBalance = document.getElementById('walletBalance');
    const swapBtn = document.getElementById('swapBtn');
    
    if (app.isConnected && app.account) {
        // Show connected state
        connectBtn.style.display = 'none';
        walletInfo.style.display = 'flex';
        
        // Update address display
        if (walletAddress) {
            walletAddress.textContent = `${app.account.slice(0, 6)}...${app.account.slice(-4)}`;
        }
        
        // Update balance (simulated)
        if (walletBalance) {
            const totalBalance = Object.values(app.tokens).reduce((sum, token) => {
                return sum + (parseFloat(token.balance) * token.price);
            }, 0);
            walletBalance.textContent = `$${formatNumber(totalBalance)}`;
        }
        
        // Update swap button
        if (swapBtn) {
            const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
            if (fromAmount > 0) {
                swapBtn.innerHTML = `
                    <div class="swap-btn-content">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Swap</span>
                    </div>
                `;
                swapBtn.disabled = false;
            }
        }
    } else {
        // Show disconnected state
        connectBtn.style.display = 'flex';
        walletInfo.style.display = 'none';
        
        // Update swap button
        if (swapBtn) {
            swapBtn.innerHTML = `
                <div class="swap-btn-content">
                    <i class="fas fa-wallet"></i>
                    <span>Connect Wallet</span>
                </div>
            `;
            swapBtn.disabled = false;
        }
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        app.account = null;
        app.isConnected = false;
        showToast('Wallet disconnected', 'info');
    } else if (accounts[0] !== app.account) {
        // User switched accounts
        app.account = accounts[0];
        showToast('Account changed', 'info');
    }
    updateWalletUI();
}

// Handle chain changes
function handleChainChanged(chainId) {
    // Reload the page when network changes
    window.location.reload();
}

// Populate token list
function populateTokenList() {
    const tokenList = document.getElementById('tokenList');
    if (!tokenList) return;
    
    tokenList.innerHTML = '';
    
    Object.values(app.tokens).forEach(token => {
        const tokenItem = document.createElement('div');
        tokenItem.className = 'token-item-modal';
        tokenItem.innerHTML = `
            <div class="token-info-modal">
                <div class="token-logo">
                    <div class="token-fallback ${token.symbol.toLowerCase().replace('usd', '')}" 
                         style="background: ${token.color}">${token.symbol.charAt(0)}</div>
                </div>
                <div>
                    <div class="token-symbol-modal">${token.symbol}</div>
                    <div>${token.name}</div>
                </div>
            </div>
            <div>
                <div>${formatNumber(parseFloat(token.balance))}</div>
                <div style="font-size: 12px; color: var(--text-muted)">
                    $${formatNumber(parseFloat(token.balance) * token.price)}
                </div>
            </div>
        `;
        
        tokenItem.addEventListener('click', () => selectToken(token.symbol));
        tokenList.appendChild(tokenItem);
    });
}

// Search tokens
function searchTokens() {
    const searchTerm = document.getElementById('tokenSearch').value.toLowerCase();
    const tokenItems = document.querySelectorAll('.token-item-modal');
    
    tokenItems.forEach(item => {
        const symbol = item.querySelector('.token-symbol-modal').textContent.toLowerCase();
        const name = item.querySelector('.token-info-modal div:nth-child(2) div:nth-child(2)').textContent.toLowerCase();
        
        if (symbol.includes(searchTerm) || name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Select token from modal
function selectToken(symbol) {
    const modal = document.getElementById('tokenModal');
    const side = modal.dataset.side;
    
    if (side === 'from' || side === 'to') {
        updateTokenDisplay(side, symbol);
        
        // If swapping from and to tokens are the same, switch the other one
        const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
        const toSymbol = document.getElementById('toTokenSymbol').textContent;
        
        if (fromSymbol === toSymbol) {
            // Find a different token
            const otherTokens = Object.keys(app.tokens).filter(s => s !== symbol);
            if (otherTokens.length > 0) {
                const otherSide = side === 'from' ? 'to' : 'from';
                updateTokenDisplay(otherSide, otherTokens[0]);
            }
        }
        
        updateSwapBalances();
        updateSwapCalculation();
    }
    
    hideModal('tokenModal');
}

// Save slippage settings
function saveSlippageSettings() {
    const customInput = document.getElementById('customSlippage');
    let slippage = app.slippage;
    
    if (customInput.value) {
        const customValue = parseFloat(customInput.value);
        if (!isNaN(customValue) && customValue >= 0.1 && customValue <= 50) {
            slippage = customValue;
        }
    }
    
    app.slippage = slippage;
    document.querySelector('#slippageSettings span').textContent = `Slippage: ${slippage}%`;
    hideModal('slippageModal');
    updateSwapCalculation();
    showToast(`Slippage set to ${slippage}%`, 'success');
}

// Initialize event listeners
function initEventListeners() {
    // Swap button
    const swapBtn = document.getElementById('swapBtn');
    if (swapBtn) {
        swapBtn.addEventListener('click', executeSwap);
    }
    
    // Disconnect button
    const disconnectBtn = document.getElementById('disconnectBtn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
    }
    
    // Refresh transactions button
    const refreshTransactions = document.getElementById('refreshTransactions');
    if (refreshTransactions) {
        refreshTransactions.addEventListener('click', refreshTransactionsList);
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            hideModal(event.target.id);
        }
    });
}

// Execute swap
function executeSwap() {
    if (!app.isConnected) {
        showWalletModal();
        return;
    }
    
    const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
    const fromSymbol = document.getElementById('fromTokenSymbol').textContent;
    const toSymbol = document.getElementById('toTokenSymbol').textContent;
    const toAmount = parseFloat(document.getElementById('toAmount').value) || 0;
    
    if (fromAmount <= 0) {
        showToast('Please enter an amount', 'warning');
        return;
    }
    
    const fromToken = app.tokens[fromSymbol];
    if (!fromToken || fromAmount > parseFloat(fromToken.balance)) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    // Show processing
    const swapBtn = document.getElementById('swapBtn');
    const originalContent = swapBtn.innerHTML;
    swapBtn.innerHTML = `
        <div class="swap-btn-content">
            <div class="processing-spinner"></div>
            <span>Processing...</span>
        </div>
    `;
    swapBtn.disabled = true;
    
    // Simulate swap
    setTimeout(() => {
        // Update balances
        fromToken.balance = (parseFloat(fromToken.balance) - fromAmount).toString();
        
        const toToken = app.tokens[toSymbol];
        if (toToken) {
            toToken.balance = (parseFloat(toToken.balance) + toAmount).toString();
        }
        
        // Update UI
        updateSwapBalances();
        addTransaction(fromSymbol, toSymbol, fromAmount, toAmount);
        
        // Reset form
        document.getElementById('fromAmount').value = '';
        document.getElementById('toAmount').value = '';
        
        // Restore button
        swapBtn.innerHTML = originalContent;
        swapBtn.disabled = false;
        
        // Show success
        showToast(`Swapped ${fromAmount} ${fromSymbol} for ${toAmount.toFixed(6)} ${toSymbol}`, 'success');
        
        // Update calculation
        updateSwapCalculation();
        
    }, 1500);
}

// Add transaction to history
function addTransaction(from, to, fromAmount, toAmount) {
    const transactionsList = document.getElementById('transactionsList');
    const emptyState = transactionsList.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const transaction = document.createElement('div');
    transaction.className = 'transaction-item';
    transaction.innerHTML = `
        <div class="transaction-icon">
            <i class="fas fa-exchange-alt"></i>
        </div>
        <div class="transaction-details">
            <div class="transaction-type">${from} → ${to}</div>
            <div class="transaction-time">Just now</div>
        </div>
        <div class="transaction-amount positive">+${toAmount.toFixed(2)}</div>
    `;
    
    transactionsList.insertBefore(transaction, transactionsList.firstChild);
}

// Refresh transactions list
function refreshTransactionsList() {
    const refreshBtn = document.getElementById('refreshTransactions');
    refreshBtn.querySelector('i').classList.add('fa-spin');
    
    setTimeout(() => {
        refreshBtn.querySelector('i').classList.remove('fa-spin');
        showToast('Transactions refreshed', 'success');
    }, 1000);
}

// Load initial data
function loadInitialData() {
    // Update wallet UI
    updateWalletUI();
    
    // Update analytics chart
    updateChartData('24H');
    
    // Update pool cards
    updatePoolCards();
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const messageEl = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    // Set message
    messageEl.textContent = message;
    
    // Set type
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    if (icons[type]) {
        icon.className = `fas ${icons[type]}`;
        toast.style.background = colors[type];
    }
    
    // Show toast
    toast.style.display = 'flex';
    
    // Auto hide
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Format number with commas
function formatNumber(num) {
    if (isNaN(num)) return '0.00';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    } else if (num >= 1) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } else {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });
    }
}

// Add processing spinner style
const style = document.createElement('style');
style.textContent = `
    .processing-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
        margin-right: 8px;
        display: inline-block;
    }
    
    .fa-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
