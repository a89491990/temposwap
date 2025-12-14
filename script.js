// TempoSwap DEX - Complete Fixed Version

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initApp();
});

// Global state
let appState = {
    web3: null,
    currentAccount: null,
    isWalletConnected: false,
    userTokens: [],
    isLoading: true,
    retryCount: 0
};

// Initialize application
async function initApp() {
    console.log('Initializing application...');
    
    try {
        // Show loading screen
        showLoading('Initializing DEX...');
        
        // Initialize UI components first
        initUI();
        
        // Check for Web3 provider
        await checkWeb3Availability();
        
        // Check for existing wallet connection
        await checkExistingConnection();
        
        // Initialize default tokens
        initDefaultTokens();
        
        // Hide loading and show main content
        setTimeout(() => {
            hideLoading();
            showMainContent();
            console.log('Application initialized successfully');
        }, 1000);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showLoadingError('Failed to initialize. Please refresh the page.');
    }
}

// Initialize UI components
function initUI() {
    console.log('Initializing UI components...');
    
    // Remove any existing event listeners first
    removeAllEventListeners();
    
    // Initialize buttons and event listeners
    initButtons();
    initModals();
    initTokenSelection();
    initSwapControls();
    
    // Update initial UI state
    updateUIState();
}

// Initialize buttons
function initButtons() {
    // Wallet buttons
    const connectBtn = document.getElementById('connectWalletBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', showWalletModal);
    }
    
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
    }
    
    // Swap controls
    const swapBtn = document.getElementById('swapBtn');
    const switchBtn = document.getElementById('switchTokensBtn');
    const maxBtn = document.getElementById('maxBtn');
    
    if (swapBtn) {
        swapBtn.addEventListener('click', handleSwap);
    }
    
    if (switchBtn) {
        switchBtn.addEventListener('click', switchTokens);
    }
    
    if (maxBtn) {
        maxBtn.addEventListener('click', setMaxAmount);
    }
    
    // Percentage buttons
    document.querySelectorAll('.btn-percent').forEach(btn => {
        btn.addEventListener('click', function() {
            const percent = this.dataset.percent;
            setPercentageAmount(percent);
        });
    });
    
    // Retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', retryInitialization);
    }
}

// Initialize modals
function initModals() {
    // Wallet modal
    const walletModal = document.getElementById('walletModal');
    const closeWalletModal = document.getElementById('closeWalletModal');
    const metamaskOption = document.getElementById('metamaskOption');
    
    if (closeWalletModal) {
        closeWalletModal.addEventListener('click', () => hideModal('walletModal'));
    }
    
    if (metamaskOption) {
        metamaskOption.addEventListener('click', connectMetaMask);
    }
    
    // Token modal
    const closeTokenModal = document.getElementById('closeTokenModal');
    const fromTokenSelector = document.getElementById('fromTokenSelector');
    const toTokenSelector = document.getElementById('toTokenSelector');
    
    if (closeTokenModal) {
        closeTokenModal.addEventListener('click', () => hideModal('tokenModal'));
    }
    
    if (fromTokenSelector) {
        fromTokenSelector.addEventListener('click', () => showTokenModal('from'));
    }
    
    if (toTokenSelector) {
        toTokenSelector.addEventListener('click', () => showTokenModal('to'));
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            hideModal(event.target.id);
        }
    });
}

// Initialize token selection
function initTokenSelection() {
    // Set default tokens
    setToken('from', 'INSDR');
    setToken('to', 'AlphaUSD');
    
    // Initialize token list
    updateTokenList();
    
    // Token search
    const tokenSearch = document.getElementById('tokenSearch');
    if (tokenSearch) {
        tokenSearch.addEventListener('input', searchTokens);
    }
}

// Initialize swap controls
function initSwapControls() {
    const fromAmountInput = document.getElementById('fromAmount');
    if (fromAmountInput) {
        fromAmountInput.addEventListener('input', updateSwapQuote);
        fromAmountInput.addEventListener('change', updateSwapQuote);
    }
}

// Check Web3 availability
async function checkWeb3Availability() {
    return new Promise((resolve) => {
        if (typeof window.ethereum !== 'undefined') {
            console.log('Web3 provider detected');
            resolve(true);
        } else {
            console.log('No Web3 provider found');
            showToast('Please install MetaMask to use all features', 'warning');
            resolve(false);
        }
    });
}

// Check existing connection
async function checkExistingConnection() {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            console.log('Found existing connection:', accounts[0]);
            await handleWalletConnection(accounts[0]);
        }
    } catch (error) {
        console.error('Error checking existing connection:', error);
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
        showLoading('Connecting to MetaMask...');
        
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
            await handleWalletConnection(accounts[0]);
            hideModal('walletModal');
            showToast('Wallet connected successfully!', 'success');
        }
        
    } catch (error) {
        console.error('MetaMask connection error:', error);
        showToast('Failed to connect wallet', 'error');
    } finally {
        hideLoading();
    }
}

// Handle wallet connection
async function handleWalletConnection(account) {
    appState.currentAccount = account;
    appState.isWalletConnected = true;
    
    // Initialize Web3
    appState.web3 = new Web3(window.ethereum);
    
    // Update UI
    updateWalletUI();
    
    // Load user tokens (simulated)
    await loadUserTokens();
    
    // Update portfolio
    updatePortfolio();
}

// Disconnect wallet
function disconnectWallet() {
    appState.currentAccount = null;
    appState.isWalletConnected = false;
    appState.web3 = null;
    appState.userTokens = [];
    
    updateWalletUI();
    resetTokenBalances();
    showToast('Wallet disconnected', 'info');
}

// Update wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const swapBtn = document.getElementById('swapBtn');
    
    if (appState.isWalletConnected && appState.currentAccount) {
        // Show connected state
        if (connectBtn) connectBtn.style.display = 'none';
        if (walletInfo) {
            walletInfo.style.display = 'flex';
            const addressEl = document.getElementById('walletAddress');
            if (addressEl) {
                addressEl.textContent = `${appState.currentAccount.slice(0, 6)}...${appState.currentAccount.slice(-4)}`;
            }
        }
        
        // Update swap button
        if (swapBtn) {
            swapBtn.innerHTML = `
                <div class="swap-btn-content">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Swap Now</span>
                </div>
            `;
            swapBtn.disabled = false;
        }
    } else {
        // Show disconnected state
        if (connectBtn) connectBtn.style.display = 'flex';
        if (walletInfo) walletInfo.style.display = 'none';
        
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

// Load user tokens (simulated)
async function loadUserTokens() {
    // Simulated token data
    appState.userTokens = [
        { symbol: 'INSDR', balance: '990001000', priceUSD: 0.1576 },
        { symbol: 'AlphaUSD', balance: '38999999.917545', priceUSD: 1.00 },
        { symbol: 'BetaUSD', balance: '1000000', priceUSD: 1.00 },
        { symbol: 'ThetaUSD', balance: '1000000', priceUSD: 1.00 }
    ];
    
    updateTokenBalances();
    updateTokenList();
}

// Update token balances in UI
function updateTokenBalances() {
    // Update from token balance
    const fromSymbol = document.getElementById('fromTokenSymbol')?.textContent;
    const fromToken = appState.userTokens.find(t => t.symbol === fromSymbol);
    const fromBalanceEl = document.getElementById('fromBalance');
    
    if (fromBalanceEl && fromToken) {
        fromBalanceEl.textContent = formatNumber(parseFloat(fromToken.balance));
    }
    
    // Update to token balance
    const toSymbol = document.getElementById('toTokenSymbol')?.textContent;
    const toToken = appState.userTokens.find(t => t.symbol === toSymbol);
    const toBalanceEl = document.getElementById('toBalance');
    
    if (toBalanceEl && toToken) {
        toBalanceEl.textContent = formatNumber(parseFloat(toToken.balance));
    }
    
    // Update portfolio
    updatePortfolioTokens();
}

// Reset token balances
function resetTokenBalances() {
    const fromBalanceEl = document.getElementById('fromBalance');
    const toBalanceEl = document.getElementById('toBalance');
    
    if (fromBalanceEl) fromBalanceEl.textContent = '0.00';
    if (toBalanceEl) toBalanceEl.textContent = '0.00';
    
    // Reset portfolio
    const portfolioValue = document.getElementById('portfolioValue');
    if (portfolioValue) portfolioValue.textContent = '$0.00';
    
    document.querySelectorAll('.portfolio-tokens .amount').forEach(el => {
        el.textContent = '0.00';
    });
}

// Update portfolio
function updatePortfolio() {
    let totalValue = 0;
    
    appState.userTokens.forEach(token => {
        const balance = parseFloat(token.balance) || 0;
        totalValue += balance * (token.priceUSD || 0);
    });
    
    const portfolioValue = document.getElementById('portfolioValue');
    if (portfolioValue) {
        portfolioValue.textContent = `$${formatNumber(totalValue)}`;
    }
}

// Update portfolio tokens
function updatePortfolioTokens() {
    appState.userTokens.forEach(token => {
        const element = document.getElementById(`token${token.symbol.replace('USD', '')}`);
        if (element) {
            const amountEl = element.querySelector('.amount');
            const fiatEl = element.querySelector('.amount-fiat-small');
            
            const balance = parseFloat(token.balance) || 0;
            const value = balance * (token.priceUSD || 0);
            
            if (amountEl) amountEl.textContent = formatNumber(balance);
            if (fiatEl) fiatEl.textContent = `$${formatNumber(value)}`;
        }
    });
}

// Initialize default tokens
function initDefaultTokens() {
    const defaultTokens = {
        INSDR: { name: 'Airdrop Insiders', color: '#8B5CF6', priceUSD: 0.1576 },
        AlphaUSD: { name: 'Alpha USD', color: '#3B82F6', priceUSD: 1.00 },
        BetaUSD: { name: 'Beta USD', color: '#10B981', priceUSD: 1.00 },
        ThetaUSD: { name: 'Theta USD', color: '#F59E0B', priceUSD: 1.00 }
    };
    
    // Store in app state
    appState.supportedTokens = defaultTokens;
}

// Set token on UI
function setToken(side, symbol) {
    const token = appState.supportedTokens?.[symbol];
    if (!token) return;
    
    const selector = side === 'from' ? 'from' : 'to';
    
    // Update logo
    const logoElement = document.getElementById(`${selector}TokenLogo`);
    const fallbackElement = document.getElementById(`${selector}TokenFallback`);
    
    if (logoElement && fallbackElement) {
        logoElement.innerHTML = '';
        fallbackElement.textContent = symbol.charAt(0);
        fallbackElement.style.display = 'flex';
        fallbackElement.style.background = token.color;
    }
    
    // Update text
    const symbolEl = document.getElementById(`${selector}TokenSymbol`);
    const nameEl = document.getElementById(`${selector}TokenName`);
    
    if (symbolEl) symbolEl.textContent = symbol;
    if (nameEl) nameEl.textContent = token.name;
    
    // Update balance if available
    if (side === 'from') {
        updateTokenBalances();
    }
}

// Show token modal
function showTokenModal(side) {
    const modal = document.getElementById('tokenModal');
    if (modal) {
        modal.dataset.side = side;
        showModal('tokenModal');
        
        // Highlight current selection
        const currentSymbol = document.getElementById(`${side}TokenSymbol`)?.textContent;
        document.querySelectorAll('.token-item-modal').forEach(item => {
            const symbol = item.querySelector('.token-symbol-modal')?.textContent;
            item.classList.toggle('selected', symbol === currentSymbol);
        });
    }
}

// Update token list
function updateTokenList() {
    const tokenList = document.getElementById('tokenList');
    if (!tokenList || !appState.supportedTokens) return;
    
    tokenList.innerHTML = '';
    
    Object.entries(appState.supportedTokens).forEach(([symbol, token]) => {
        const userToken = appState.userTokens.find(t => t.symbol === symbol);
        const balance = userToken ? parseFloat(userToken.balance) : 0;
        
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token-item-modal';
        tokenElement.innerHTML = `
            <div class="token-info-modal">
                <div class="token-logo" style="background: ${token.color}">
                    <div class="token-fallback">${symbol.charAt(0)}</div>
                </div>
                <div>
                    <div class="token-symbol-modal" style="font-weight: 600">${symbol}</div>
                    <div style="font-size: 12px; color: var(--text-muted)">${token.name}</div>
                </div>
            </div>
            <div style="text-align: right">
                <div style="font-weight: 600">${formatNumber(balance)}</div>
                <div style="font-size: 12px; color: var(--text-muted)">
                    $${formatNumber(balance * (token.priceUSD || 0))}
                </div>
            </div>
        `;
        
        tokenElement.addEventListener('click', () => selectToken(symbol));
        tokenList.appendChild(tokenElement);
    });
}

// Search tokens
function searchTokens() {
    const searchTerm = document.getElementById('tokenSearch').value.toLowerCase();
    const tokenItems = document.querySelectorAll('.token-item-modal');
    
    tokenItems.forEach(item => {
        const symbol = item.querySelector('.token-symbol-modal')?.textContent.toLowerCase() || '';
        const name = item.querySelector('div > div:nth-child(2)')?.textContent.toLowerCase() || '';
        
        item.style.display = (symbol.includes(searchTerm) || name.includes(searchTerm)) 
            ? 'flex' 
            : 'none';
    });
}

// Select token from modal
function selectToken(symbol) {
    const side = document.getElementById('tokenModal')?.dataset.side;
    if (side) {
        setToken(side, symbol);
        hideModal('tokenModal');
        updateSwapQuote();
    }
}

// Switch tokens
function switchTokens() {
    const fromSymbol = document.getElementById('fromTokenSymbol')?.textContent;
    const toSymbol = document.getElementById('toTokenSymbol')?.textContent;
    const fromAmount = document.getElementById('fromAmount')?.value;
    const toAmount = document.getElementById('toAmount')?.value;
    
    if (!fromSymbol || !toSymbol) return;
    
    // Swap tokens
    setToken('from', toSymbol);
    setToken('to', fromSymbol);
    
    // Swap amounts
    const fromAmountInput = document.getElementById('fromAmount');
    const toAmountInput = document.getElementById('toAmount');
    
    if (fromAmountInput && toAmountInput) {
        fromAmountInput.value = toAmount || '';
        toAmountInput.value = fromAmount || '';
    }
    
    updateSwapQuote();
}

// Set max amount
function setMaxAmount() {
    if (!appState.isWalletConnected) {
        showToast('Please connect wallet first', 'warning');
        return;
    }
    
    const fromSymbol = document.getElementById('fromTokenSymbol')?.textContent;
    const userToken = appState.userTokens.find(t => t.symbol === fromSymbol);
    
    if (userToken) {
        const balance = parseFloat(userToken.balance);
        const fromAmountInput = document.getElementById('fromAmount');
        if (fromAmountInput) {
            fromAmountInput.value = balance;
            updateSwapQuote();
        }
    }
}

// Set percentage amount
function setPercentageAmount(percent) {
    if (!appState.isWalletConnected) return;
    
    const fromSymbol = document.getElementById('fromTokenSymbol')?.textContent;
    const userToken = appState.userTokens.find(t => t.symbol === fromSymbol);
    
    if (userToken) {
        const balance = parseFloat(userToken.balance);
        const percentage = parseInt(percent) / 100;
        const fromAmountInput = document.getElementById('fromAmount');
        
        if (fromAmountInput) {
            fromAmountInput.value = balance * percentage;
            updateSwapQuote();
        }
    }
}

// Update swap quote
function updateSwapQuote() {
    const fromSymbol = document.getElementById('fromTokenSymbol')?.textContent;
    const toSymbol = document.getElementById('toTokenSymbol')?.textContent;
    const fromAmount = parseFloat(document.getElementById('fromAmount')?.value) || 0;
    
    if (!fromSymbol || !toSymbol || fromAmount <= 0) {
        resetSwapDetails();
        return;
    }
    
    // Get token prices
    const fromToken = appState.supportedTokens?.[fromSymbol];
    const toToken = appState.supportedTokens?.[toSymbol];
    
    if (!fromToken || !toToken) return;
    
    // Calculate exchange rate
    const exchangeRate = (toToken.priceUSD / fromToken.priceUSD).toFixed(6);
    const toAmount = fromAmount * exchangeRate;
    
    // Update UI
    const toAmountInput = document.getElementById('toAmount');
    const exchangeRateEl = document.getElementById('exchangeRate');
    
    if (toAmountInput) toAmountInput.value = toAmount.toFixed(6);
    if (exchangeRateEl) exchangeRateEl.textContent = `1 ${fromSymbol} = ${exchangeRate} ${toSymbol}`;
    
    // Calculate fiat values
    const fromValue = fromAmount * fromToken.priceUSD;
    const toValue = toAmount * toToken.priceUSD;
    
    const fromFiatEl = document.getElementById('fromAmountFiat');
    const toFiatEl = document.getElementById('toAmountFiat');
    
    if (fromFiatEl) fromFiatEl.textContent = `≈ $${formatNumber(fromValue)}`;
    if (toFiatEl) toFiatEl.textContent = `≈ $${formatNumber(toValue)}`;
    
    // Update swap details
    updateSwapDetails(fromAmount, toAmount, toSymbol);
    
    // Update swap button state
    updateSwapButtonState(fromAmount, fromSymbol);
}

// Reset swap details
function resetSwapDetails() {
    const toAmountInput = document.getElementById('toAmount');
    const fromFiatEl = document.getElementById('fromAmountFiat');
    const toFiatEl = document.getElementById('toAmountFiat');
    
    if (toAmountInput) toAmountInput.value = '';
    if (fromFiatEl) fromFiatEl.textContent = '≈ $0.00';
    if (toFiatEl) toFiatEl.textContent = '≈ $0.00';
    
    // Reset detail rows
    const detailIds = ['expectedOutput', 'lpFee', 'minimumReceived'];
    detailIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0.00';
    });
    
    // Reset swap button
    const swapBtn = document.getElementById('swapBtn');
    if (swapBtn) {
        if (appState.isWalletConnected) {
            swapBtn.innerHTML = `
                <div class="swap-btn-content">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Enter Amount</span>
                </div>
            `;
        } else {
            swapBtn.innerHTML = `
                <div class="swap-btn-content">
                    <i class="fas fa-wallet"></i>
                    <span>Connect Wallet</span>
                </div>
            `;
        }
        swapBtn.disabled = !appState.isWalletConnected;
    }
}

// Update swap details
function updateSwapDetails(fromAmount, toAmount, toSymbol) {
    const lpFee = toAmount * 0.003; // 0.30%
    const minReceived = toAmount * 0.99; // 1% slippage
    
    const expectedOutputEl = document.getElementById('expectedOutput');
    const lpFeeEl = document.getElementById('lpFee');
    const minReceivedEl = document.getElementById('minimumReceived');
    
    if (expectedOutputEl) expectedOutputEl.textContent = `${toAmount.toFixed(6)} ${toSymbol}`;
    if (lpFeeEl) lpFeeEl.textContent = `${lpFee.toFixed(6)} ${toSymbol}`;
    if (minReceivedEl) minReceivedEl.textContent = `${minReceived.toFixed(6)} ${toSymbol}`;
}

// Update swap button state
function updateSwapButtonState(fromAmount, fromSymbol) {
    const swapBtn = document.getElementById('swapBtn');
    if (!swapBtn) return;
    
    if (!appState.isWalletConnected) {
        swapBtn.innerHTML = `
            <div class="swap-btn-content">
                <i class="fas fa-wallet"></i>
                <span>Connect Wallet</span>
            </div>
        `;
        swapBtn.disabled = false;
        return;
    }
    
    // Check balance
    const userToken = appState.userTokens.find(t => t.symbol === fromSymbol);
    const hasBalance = userToken && fromAmount <= parseFloat(userToken.balance);
    
    if (fromAmount <= 0) {
        swapBtn.innerHTML = `
            <div class="swap-btn-content">
                <i class="fas fa-exchange-alt"></i>
                <span>Enter Amount</span>
            </div>
        `;
        swapBtn.disabled = true;
    } else if (!hasBalance) {
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
                <span>Swap Now</span>
            </div>
        `;
        swapBtn.disabled = false;
    }
}

// Handle swap
async function handleSwap() {
    if (!appState.isWalletConnected) {
        showWalletModal();
        return;
    }
    
    const fromAmount = parseFloat(document.getElementById('fromAmount')?.value) || 0;
    const fromSymbol = document.getElementById('fromTokenSymbol')?.textContent;
    const toSymbol = document.getElementById('toTokenSymbol')?.textContent;
    const toAmount = parseFloat(document.getElementById('toAmount')?.value) || 0;
    
    if (fromAmount <= 0) {
        showToast('Please enter an amount', 'warning');
        return;
    }
    
    // Check balance
    const userToken = appState.userTokens.find(t => t.symbol === fromSymbol);
    if (!userToken || fromAmount > parseFloat(userToken.balance)) {
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
        if (userToken) {
            userToken.balance = (parseFloat(userToken.balance) - fromAmount).toString();
        }
        
        const toUserToken = appState.userTokens.find(t => t.symbol === toSymbol);
        if (toUserToken) {
            toUserToken.balance = (parseFloat(toUserToken.balance || 0) + toAmount).toString();
        }
        
        // Update UI
        updateTokenBalances();
        updatePortfolio();
        addTransaction(fromSymbol, toSymbol, fromAmount, toAmount);
        
        // Reset form
        document.getElementById('fromAmount').value = '';
        document.getElementById('toAmount').value = '';
        
        // Restore button
        swapBtn.innerHTML = originalContent;
        swapBtn.disabled = false;
        
        // Show success
        showToast(`Swapped ${fromAmount} ${fromSymbol} for ${toAmount.toFixed(6)} ${toSymbol}`, 'success');
        
        // Update quote
        updateSwapQuote();
        
    }, 1500);
}

// Add transaction to history
function addTransaction(from, to, fromAmount, toAmount) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    const emptyState = transactionsList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
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
    
    // Limit transactions
    if (transactionsList.children.length > 10) {
        transactionsList.removeChild(transactionsList.lastChild);
    }
}

// UI Helper Functions
function showLoading(message = 'Loading...') {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingStatus = document.getElementById('loadingStatus');
    const retryBtn = document.getElementById('retryBtn');
    
    if (loadingScreen) {
        loadingScreen.classList.add('active');
        appState.isLoading = true;
    }
    
    if (loadingStatus) {
        loadingStatus.textContent = message;
    }
    
    if (retryBtn) {
        retryBtn.style.display = 'none';
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
        appState.isLoading = false;
    }
}

function showLoadingError(message) {
    const loadingStatus = document.getElementById('loadingStatus');
    const retryBtn = document.getElementById('retryBtn');
    
    if (loadingStatus) {
        loadingStatus.textContent = message;
        loadingStatus.style.color = 'var(--danger)';
    }
    
    if (retryBtn) {
        retryBtn.style.display = 'flex';
    }
}

function showMainContent() {
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
}

function retryInitialization() {
    appState.retryCount++;
    console.log(`Retry attempt ${appState.retryCount}`);
    
    if (appState.retryCount <= 3) {
        initApp();
    } else {
        showLoadingError('Maximum retry attempts reached. Please refresh the page.');
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showToast(message, type = 'info') {
    // Create toast if doesn't exist
    let toast = document.getElementById('notificationToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'notificationToast';
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-info-circle"></i>
                <span id="toastMessage">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                padding: 16px 24px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: var(--shadow-xl);
                z-index: 1001;
                border-left: 4px solid var(--primary);
                animation: toastSlideIn 0.3s ease, toastFadeOut 0.3s ease 2.7s forwards;
            }
            
            .toast.success { border-left-color: var(--success); }
            .toast.error { border-left-color: var(--danger); }
            .toast.warning { border-left-color: var(--warning); }
            .toast.info { border-left-color: var(--info); }
            
            @keyframes toastSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes toastFadeOut {
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update toast
    const icon = toast.querySelector('i');
    const messageEl = toast.querySelector('#toastMessage');
    
    // Set type
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    if (icon) icon.className = `fas ${icons[type] || 'fa-info-circle'}`;
    if (messageEl) messageEl.textContent = message;
    
    // Show toast
    toast.style.display = 'flex';
    
    // Auto hide
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function updateUIState() {
    updateWalletUI();
    updateSwapQuote();
}

function removeAllEventListeners() {
    // This is a simplified version - in production, you'd want to properly
    // remove event listeners by storing references
    const clone = document.body.cloneNode(true);
    document.body.replaceWith(clone);
}

function formatNumber(num) {
    if (isNaN(num) || num === 0) return '0.00';
    
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

// Add Web3 event listeners
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function(accounts) {
        console.log('Accounts changed:', accounts);
        if (accounts.length > 0) {
            handleWalletConnection(accounts[0]);
            showToast('Account changed', 'info');
        } else {
            disconnectWallet();
        }
    });
    
    window.ethereum.on('chainChanged', function() {
        console.log('Chain changed, reloading...');
        window.location.reload();
    });
}

// Add processing spinner style
document.addEventListener('DOMContentLoaded', function() {
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
        
        .btn-retry {
            padding: 10px 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .btn-retry:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        .loading-subtext {
            font-size: 14px;
            color: var
