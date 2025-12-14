document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fromTokenSelector = document.getElementById('from-token');
    const toTokenSelector = document.getElementById('to-token');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const switchTokensBtn = document.getElementById('switch-tokens');
    const swapButton = document.getElementById('swap-button');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const tokenModal = document.getElementById('token-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const tokenItems = document.querySelectorAll('.token-item');
    
    // Token data
    const tokens = {
        'INSDR': {
            name: 'INSDR',
            symbol: 'Airdrop Insiders',
            balance: 990001000,
            icon: 'I',
            address: '0x20c00000000000000000000000000000000'
        },
        'AlphaUSD': {
            name: 'AlphaUSD',
            symbol: 'Alpha Stablecoin',
            balance: 38999999.917545,
            icon: 'A',
            address: '0x20c00000000000000000000000000000001'
        },
        'BetaUSD': {
            name: 'BetaUSD',
            symbol: 'Beta Stablecoin',
            balance: 1000000,
            icon: 'B',
            address: '0x20c00000000000000000000000000000002'
        },
        'ThetaUSD': {
            name: 'ThetaUSD',
            symbol: 'Theta Stablecoin',
            balance: 1000000,
            icon: 'T',
            address: '0x20c00000000000000000000000000000003'
        }
    };
    
    // Exchange rates (mock data)
    const exchangeRates = {
        'INSDR_AlphaUSD': 0.1576,
        'AlphaUSD_INSDR': 6.3452,
        'INSDR_BetaUSD': 0.1521,
        'BetaUSD_INSDR': 6.5746,
        'INSDR_ThetaUSD': 0.1498,
        'ThetaUSD_INSDR': 6.6742,
        'AlphaUSD_BetaUSD': 0.9654,
        'BetaUSD_AlphaUSD': 1.0358,
        'AlphaUSD_ThetaUSD': 0.9512,
        'ThetaUSD_AlphaUSD': 1.0513,
        'BetaUSD_ThetaUSD': 0.9854,
        'ThetaUSD_BetaUSD': 1.0148
    };
    
    // Current selected tokens
    let fromToken = 'INSDR';
    let toToken = 'AlphaUSD';
    
    // Format number with commas
    function formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        });
    }
    
    // Update token display
    function updateTokenDisplay() {
        const fromTokenEl = document.querySelector('#from-token .token-info');
        const toTokenEl = document.querySelector('#to-token .token-info');
        const fromBalance = document.querySelector('.from-section .balance');
        const toBalance = document.querySelector('.to-section .balance');
        
        // Update token info in UI
        fromTokenEl.innerHTML = `
            <div class="token-icon insdr">${tokens[fromToken].icon}</div>
            <span>${fromToken}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        
        toTokenEl.innerHTML = `
            <div class="token-icon alpha">${tokens[toToken].icon}</div>
            <span>${toToken}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // Update balances
        fromBalance.textContent = `Balance: ${formatNumber(tokens[fromToken].balance)}`;
        toBalance.textContent = `Balance: ${formatNumber(tokens[toToken].balance)}`;
        
        // Update exchange rate display
        const exchangeRate = exchangeRates[`${fromToken}_${toToken}`] || 1;
        const rateElement = document.querySelector('.swap-details .detail-row:last-child span:last-child');
        if (rateElement) {
            rateElement.textContent = `1 ${fromToken} = ${exchangeRate.toFixed(4)} ${toToken}`;
        }
        
        // Update pool reserves
        const poolReserves = document.querySelector('.swap-details .detail-row:nth-child(3) span:last-child');
        if (poolReserves) {
            poolReserves.textContent = `${fromToken} 0 - ${toToken} 0`;
        }
        
        // Update min received
        const minReceived = document.querySelector('.swap-details .detail-row:first-child span:last-child');
        if (minReceived && fromAmountInput.value) {
            const amount = parseFloat(fromAmountInput.value) || 0;
            const received = amount * exchangeRate * 0.99; // 1% slippage
            minReceived.textContent = `${received.toFixed(6)} ${toToken}`;
        }
    }
    
    // Calculate swap amount
    function calculateSwapAmount() {
        const fromAmount = parseFloat(fromAmountInput.value) || 0;
        const exchangeRate = exchangeRates[`${fromToken}_${toToken}`] || 1;
        const fee = 0.003; // 0.30%
        
        // Calculate received amount (with fee)
        let receivedAmount = fromAmount * exchangeRate * (1 - fee);
        
        // Apply slippage tolerance (1%)
        receivedAmount = receivedAmount * 0.99;
        
        // Update to amount field
        toAmountInput.value = receivedAmount.toFixed(6);
        
        // Update min received display
        const minReceived = document.querySelector('.swap-details .detail-row:first-child span:last-child');
        if (minReceived) {
            minReceived.textContent = `${receivedAmount.toFixed(6)} ${toToken}`;
        }
        
        // Update swap button state
        updateSwapButton();
    }
    
    // Update swap button text and state
    function updateSwapButton() {
        const fromAmount = parseFloat(fromAmountInput.value) || 0;
        
        if (fromAmount <= 0) {
            swapButton.innerHTML = '<i class="fas fa-wallet"></i><span>Enter an amount</span>';
            swapButton.style.opacity = '0.5';
            swapButton.style.cursor = 'not-allowed';
        } else if (fromAmount > tokens[fromToken].balance) {
            swapButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Insufficient balance</span>';
            swapButton.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            swapButton.style.opacity = '0.5';
            swapButton.style.cursor = 'not-allowed';
        } else {
            swapButton.innerHTML = '<i class="fas fa-exchange-alt"></i><span>Swap</span>';
            swapButton.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
            swapButton.style.opacity = '1';
            swapButton.style.cursor = 'pointer';
        }
    }
    
    // Switch tokens
    switchTokensBtn.addEventListener('click', function() {
        // Swap token selections
        [fromToken, toToken] = [toToken, fromToken];
        
        // Swap amounts
        const tempAmount = fromAmountInput.value;
        fromAmountInput.value = toAmountInput.value;
        toAmountInput.value = tempAmount;
        
        // Update UI
        updateTokenDisplay();
        calculateSwapAmount();
    });
    
    // Token selector click
    fromTokenSelector.addEventListener('click', function() {
        openTokenModal('from');
    });
    
    toTokenSelector.addEventListener('click', function() {
        openTokenModal('to');
    });
    
    // Open token modal
    let currentSelectionType = 'from';
    
    function openTokenModal(type) {
        currentSelectionType = type;
        tokenModal.style.display = 'flex';
        
        // Mark currently selected token
        tokenItems.forEach(item => {
            const tokenName = item.querySelector('.token-name').textContent;
            if ((type === 'from' && tokenName === fromToken) || 
                (type === 'to' && tokenName === toToken)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    // Close modal
    closeModalBtn.addEventListener('click', function() {
        tokenModal.style.display = 'none';
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === tokenModal) {
            tokenModal.style.display = 'none';
        }
    });
    
    // Token selection in modal
    tokenItems.forEach(item => {
        item.addEventListener('click', function() {
            const tokenName = this.querySelector('.token-name').textContent;
            
            // Prevent selecting same token for both sides
            if ((currentSelectionType === 'from' && tokenName === toToken) ||
                (currentSelectionType === 'to' && tokenName === fromToken)) {
                alert('Cannot select the same token for both sides');
                return;
            }
            
            // Update selected token
            if (currentSelectionType === 'from') {
                fromToken = tokenName;
            } else {
                toToken = tokenName;
            }
            
            // Update UI
            updateTokenDisplay();
            calculateSwapAmount();
            
            // Close modal
            tokenModal.style.display = 'none';
        });
    });
    
    // Amount percentage buttons
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            const percentage = this.textContent;
            let amount = 0;
            
            if (percentage === 'Max') {
                amount = tokens[fromToken].balance;
            } else {
                const percent = parseInt(percentage) / 100;
                amount = tokens[fromToken].balance * percent;
            }
            
            fromAmountInput.value = amount.toFixed(6);
            calculateSwapAmount();
        });
    });
    
    // Input events
    fromAmountInput.addEventListener('input', function() {
        calculateSwapAmount();
    });
    
    // Swap button click
    swapButton.addEventListener('click', function() {
        const fromAmount = parseFloat(fromAmountInput.value) || 0;
        
        if (fromAmount <= 0 || fromAmount > tokens[fromToken].balance) {
            return; // Don't proceed if amount is invalid
        }
        
        // Simulate swap
        const exchangeRate = exchangeRates[`${fromToken}_${toToken}`] || 1;
        const receivedAmount = parseFloat(toAmountInput.value) || 0;
        
        // Update balances (mock update)
        tokens[fromToken].balance -= fromAmount;
        tokens[toToken].balance += receivedAmount;
        
        // Show success message
        alert(`Successfully swapped ${fromAmount} ${fromToken} for ${receivedAmount.toFixed(6)} ${toToken}`);
        
        // Reset inputs
        fromAmountInput.value = '';
        toAmountInput.value = '';
        
        // Update UI
        updateTokenDisplay();
        updateSwapButton();
        
        // Add to transaction history
        addTransactionToHistory(fromToken, toToken, fromAmount, receivedAmount);
    });
    
    // Add transaction to history
    function addTransactionToHistory(from, to, fromAmount, toAmount) {
        const transactionList = document.querySelector('.transaction-list');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div class="tx-icon">
                <i class="fas fa-exchange-alt"></i>
            </div>
            <div class="tx-details">
                <div class="tx-pair">${from} → ${to}</div>
                <div class="tx-time">${timeString}</div>
            </div>
            <div class="tx-amount positive">+${toAmount.toFixed(2)}</div>
        `;
        
        // Add to top of list
        transactionList.insertBefore(transactionItem, transactionList.firstChild);
        
        // Limit to 5 transactions
        if (transactionList.children.length > 5) {
            transactionList.removeChild(transactionList.lastChild);
        }
    }
    
    // Initialize
    updateTokenDisplay();
    calculateSwapAmount();
    
    // Mock real-time updates
    setInterval(() => {
        // Randomly update exchange rates slightly
        for (let key in exchangeRates) {
            const change = (Math.random() - 0.5) * 0.001; // ±0.05%
            exchangeRates[key] += exchangeRates[key] * change;
        }
        
        // Recalculate if there's an amount entered
        if (fromAmountInput.value) {
            calculateSwapAmount();
            updateTokenDisplay();
        }
    }, 5000); // Update every 5 seconds
});
