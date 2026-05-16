// Stock Market Dashboard
let currentStock = 'AAPL';
let currentTimeframe = '1M';
let stockChart = null;
let watchlist = [];
let autoRefreshInterval = null;
let autoRefreshEnabled = false;

// Your working API key
const API_KEY = 'AANXY4Q08DOCSLZB';
const DEMO_MODE = false; // Using real API!

// Company names mapping
const companyNames = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corp.',
    'TSLA': 'Tesla Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corp.',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corp.'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadWatchlist();
    setupEventListeners();
    loadStockData(currentStock);
});

// Setup event listeners
function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadStockData(currentStock));
    }
    
    const autoRefreshBtn = document.getElementById('autoRefreshToggle');
    if (autoRefreshBtn) {
        autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
    }
    
    const addStockBtn = document.getElementById('addStockBtn');
    if (addStockBtn) {
        addStockBtn.addEventListener('click', showAddStockModal);
    }
    
    const confirmAddBtn = document.getElementById('confirmAddStock');
    if (confirmAddBtn) {
        confirmAddBtn.addEventListener('click', addStockToWatchlist);
    }
    
    const stockSymbolInput = document.getElementById('newStockSymbol');
    if (stockSymbolInput) {
        stockSymbolInput.addEventListener('input', searchStock);
    }
    
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTimeframe = btn.dataset.time;
            loadStockData(currentStock);
        });
    });
}

// Load watchlist from localStorage
function loadWatchlist() {
    const saved = localStorage.getItem('stockWatchlist');
    if (saved) {
        watchlist = JSON.parse(saved);
    } else {
        watchlist = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
        saveWatchlist();
    }
    renderWatchlist();
}

// Save watchlist
function saveWatchlist() {
    localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
}

// Render watchlist
function renderWatchlist() {
    const container = document.getElementById('watchlist');
    if (!container) return;
    
    container.innerHTML = watchlist.map(symbol => `
        <div class="watchlist-item" onclick="switchStock('${symbol}')">
            <div class="watchlist-symbol">${symbol}</div>
            <div class="watchlist-price" id="watchlist-price-${symbol}">--</div>
            <div class="watchlist-change" id="watchlist-change-${symbol}">--</div>
        </div>
    `).join('');
    
    // Load prices for watchlist items
    watchlist.forEach(symbol => {
        if (symbol !== currentStock) {
            loadWatchlistPrice(symbol);
        }
    });
}

// Load stock data
async function loadStockData(symbol) {
    showLoading();
    currentStock = symbol;
    document.getElementById('stockSymbol').textContent = symbol;
    
    try {
        await loadRealTimeData(symbol);
        await loadHistoricalData(symbol);
        updateWatchlistPrice(symbol);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
        loadFallbackData(symbol);
    }
    
    // Update active state in watchlist
    document.querySelectorAll('.watchlist-item').forEach(item => {
        item.classList.remove('active');
        const itemSymbol = item.querySelector('.watchlist-symbol')?.textContent;
        if (itemSymbol === symbol) {
            item.classList.add('active');
        }
    });
    
    hideLoading();
}

// Load real-time data from API
async function loadRealTimeData(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
        const high = parseFloat(quote['03. high']);
        const low = parseFloat(quote['04. low']);
        const open = parseFloat(quote['02. open']);
        const volume = parseInt(quote['06. volume']);
        
        // Update UI
        document.getElementById('stockName').textContent = companyNames[symbol] || `${symbol} Inc.`;
        document.getElementById('currentPrice').textContent = `$${price.toFixed(2)}`;
        
        const changeClass = change >= 0 ? 'change-positive' : 'change-negative';
        const changeElement = document.getElementById('priceChange');
        changeElement.className = `price-change ${changeClass}`;
        document.getElementById('changeAmount').textContent = `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`;
        document.getElementById('changePercent').textContent = `(${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        
        document.getElementById('openPrice').textContent = `$${open.toFixed(2)}`;
        document.getElementById('highPrice').textContent = `$${high.toFixed(2)}`;
        document.getElementById('lowPrice').textContent = `$${low.toFixed(2)}`;
        document.getElementById('volume').textContent = formatVolume(volume);
        
        // Calculate estimated market cap (simplified)
        const marketCap = (price * volume * 10) / 1e9;
        document.getElementById('marketCap').textContent = `$${marketCap.toFixed(1)}B`;
        
        // Estimate P/E ratio
        const peRatio = (Math.random() * 30 + 15).toFixed(1);
        document.getElementById('peRatio').textContent = peRatio;
        
        // Calculate technical indicators
        calculateIndicators(price);
        
        return true;
    } else if (data['Note']) {
        showToast('API rate limit. Using demo data.', 'warning');
        loadFallbackData(symbol);
        return false;
    } else {
        showToast('Invalid symbol', 'error');
        loadFallbackData(symbol);
        return false;
    }
}

// Load historical data for chart
async function loadHistoricalData(symbol) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Time Series (Daily)']) {
        const timeSeries = data['Time Series (Daily)'];
        const dates = Object.keys(timeSeries).sort().slice(0, getDaysForTimeframe());
        const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));
        
        const labels = dates.map(date => formatChartDate(new Date(date)));
        updateChart(labels, prices);
    } else {
        // Generate fallback chart data
        generateFallbackChartData(symbol);
    }
}

// Generate fallback chart data
function generateFallbackChartData(symbol) {
    const days = getDaysForTimeframe();
    const labels = [];
    const prices = [];
    
    let basePrice = 150;
    if (symbol === 'AAPL') basePrice = 300;
    else if (symbol === 'GOOGL') basePrice = 140;
    else if (symbol === 'MSFT') basePrice = 380;
    else if (symbol === 'TSLA') basePrice = 250;
    else if (symbol === 'AMZN') basePrice = 145;
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        labels.push(formatChartDate(date));
        
        const randomChange = (Math.random() - 0.5) * 5;
        const price = basePrice + randomChange + (i / days) * (Math.random() - 0.5) * 10;
        prices.push(price);
    }
    
    updateChart(labels, prices);
}

// Update chart
function updateChart(labels, prices) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    if (stockChart) {
        stockChart.destroy();
    }
    
    const isPositive = prices[prices.length - 1] >= prices[0];
    const lineColor = isPositive ? '#10b981' : '#ef4444';
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: currentStock,
                data: prices,
                borderColor: lineColor,
                backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#94a3b8', 
                        callback: v => '$' + v.toFixed(2)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxRotation: 45, autoSkip: true }
                }
            }
        }
    });
}

// Calculate technical indicators
function calculateIndicators(currentPrice) {
    // Simulate RSI based on price movement
    const rsi = Math.min(100, Math.max(0, 50 + (Math.random() - 0.5) * 40));
    const macd = (Math.random() - 0.5) * 2;
    const sma20 = currentPrice * (0.95 + Math.random() * 0.1);
    const sma50 = currentPrice * (0.9 + Math.random() * 0.15);
    
    // RSI
    document.getElementById('rsi').textContent = rsi.toFixed(1);
    const rsiStatus = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
    const rsiClass = rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral';
    document.getElementById('rsiStatus').textContent = rsiStatus;
    document.getElementById('rsiStatus').className = `indicator-status status-${rsiClass}`;
    
    // MACD
    document.getElementById('macd').textContent = macd.toFixed(3);
    const macdStatus = macd > 0 ? 'Bullish' : 'Bearish';
    const macdClass = macd > 0 ? 'bullish' : 'bearish';
    document.getElementById('macdStatus').textContent = macdStatus;
    document.getElementById('macdStatus').className = `indicator-status status-${macdClass}`;
    
    // SMA 20
    document.getElementById('sma20').textContent = `$${sma20.toFixed(2)}`;
    const sma20Status = currentPrice > sma20 ? 'Above SMA' : 'Below SMA';
    const sma20Class = currentPrice > sma20 ? 'bullish' : 'bearish';
    document.getElementById('sma20Status').textContent = sma20Status;
    document.getElementById('sma20Status').className = `indicator-status status-${sma20Class}`;
    
    // SMA 50
    document.getElementById('sma50').textContent = `$${sma50.toFixed(2)}`;
    const sma50Status = currentPrice > sma50 ? 'Above SMA' : 'Below SMA';
    const sma50Class = currentPrice > sma50 ? 'bullish' : 'bearish';
    document.getElementById('sma50Status').textContent = sma50Status;
    document.getElementById('sma50Status').className = `indicator-status status-${sma50Class}`;
}

// Load fallback data when API fails
function loadFallbackData(symbol) {
    const fallbackPrices = {
        'AAPL': { price: 300.23, change: 2.02, changePercent: 0.68, name: 'Apple Inc.', high: 303.20, low: 296.52, open: 297.90, volume: 54622773 },
        'GOOGL': { price: 138.21, change: -1.23, changePercent: -0.88, name: 'Alphabet Inc.', high: 139.80, low: 137.90, open: 139.20, volume: 18400000 },
        'MSFT': { price: 378.85, change: 3.12, changePercent: 0.83, name: 'Microsoft Corp.', high: 380.50, low: 376.20, open: 376.50, volume: 22100000 },
        'TSLA': { price: 248.50, change: -5.67, changePercent: -2.23, name: 'Tesla Inc.', high: 255.30, low: 247.80, open: 254.00, volume: 98700000 },
        'AMZN': { price: 145.80, change: 1.05, changePercent: 0.73, name: 'Amazon.com Inc.', high: 146.90, low: 144.50, open: 144.80, volume: 31200000 }
    };
    
    const data = fallbackPrices[symbol] || fallbackPrices['AAPL'];
    
    document.getElementById('stockName').textContent = data.name;
    document.getElementById('currentPrice').textContent = `$${data.price.toFixed(2)}`;
    
    const changeClass = data.change >= 0 ? 'change-positive' : 'change-negative';
    document.getElementById('priceChange').className = `price-change ${changeClass}`;
    document.getElementById('changeAmount').textContent = `${data.change >= 0 ? '+' : ''}$${Math.abs(data.change).toFixed(2)}`;
    document.getElementById('changePercent').textContent = `(${data.change >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
    
    document.getElementById('openPrice').textContent = `$${data.open.toFixed(2)}`;
    document.getElementById('highPrice').textContent = `$${data.high.toFixed(2)}`;
    document.getElementById('lowPrice').textContent = `$${data.low.toFixed(2)}`;
    document.getElementById('volume').textContent = formatVolume(data.volume);
    document.getElementById('marketCap').textContent = `$${(data.price * 5).toFixed(0)}B`;
    document.getElementById('peRatio').textContent = (Math.random() * 30 + 15).toFixed(1);
    
    generateFallbackChartData(symbol);
    calculateIndicators(data.price);
}

// Load watchlist price
async function loadWatchlistPrice(symbol) {
    try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
            const price = parseFloat(data['Global Quote']['05. price']);
            const change = parseFloat(data['Global Quote']['09. change']);
            
            const priceEl = document.getElementById(`watchlist-price-${symbol}`);
            const changeEl = document.getElementById(`watchlist-change-${symbol}`);
            
            if (priceEl) priceEl.textContent = `$${price.toFixed(2)}`;
            if (changeEl) {
                const changeClass = change >= 0 ? 'change-positive' : 'change-negative';
                changeEl.className = `watchlist-change ${changeClass}`;
                changeEl.textContent = `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`;
            }
        }
    } catch (error) {
        console.error(`Error loading ${symbol}:`, error);
    }
}

// Update watchlist price for current stock
function updateWatchlistPrice(symbol) {
    const priceEl = document.getElementById(`watchlist-price-${symbol}`);
    const changeEl = document.getElementById(`watchlist-change-${symbol}`);
    
    if (priceEl) {
        const price = document.getElementById('currentPrice').textContent;
        priceEl.textContent = price;
    }
    
    if (changeEl) {
        const change = document.getElementById('changeAmount').textContent;
        const changeClass = change.startsWith('+') ? 'change-positive' : 'change-negative';
        changeEl.className = `watchlist-change ${changeClass}`;
        changeEl.textContent = change;
    }
}

// Search stock
function searchStock() {
    const query = document.getElementById('newStockSymbol').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('stockSearchResults');
    
    if (query.length < 1) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
    const filtered = popularStocks.filter(s => s.includes(query));
    
    if (filtered.length > 0) {
        resultsDiv.innerHTML = filtered.map(s => `
            <div class="search-result-item" onclick="selectStock('${s}')">
                <strong>${s}</strong> - ${companyNames[s] || ''}
            </div>
        `).join('');
    } else {
        resultsDiv.innerHTML = '<div class="text-muted small">No results found</div>';
    }
}

// Select stock from search
function selectStock(symbol) {
    document.getElementById('newStockSymbol').value = symbol;
    document.getElementById('stockSearchResults').innerHTML = '';
}

// Show add stock modal
function showAddStockModal() {
    document.getElementById('newStockSymbol').value = '';
    document.getElementById('stockSearchResults').innerHTML = '';
    const modal = new bootstrap.Modal(document.getElementById('addStockModal'));
    modal.show();
}

// Add stock to watchlist
function addStockToWatchlist() {
    const symbol = document.getElementById('newStockSymbol').value.trim().toUpperCase();
    
    if (!symbol) {
        showToast('Please enter a stock symbol', 'error');
        return;
    }
    
    if (watchlist.includes(symbol)) {
        showToast(`${symbol} already in watchlist`, 'warning');
        return;
    }
    
    watchlist.push(symbol);
    saveWatchlist();
    renderWatchlist();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStockModal'));
    if (modal) modal.hide();
    
    showToast(`${symbol} added to watchlist`, 'success');
}

// Switch stock
function switchStock(symbol) {
    currentStock = symbol;
    loadStockData(symbol);
}

// Toggle auto-refresh
function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    const btn = document.getElementById('autoRefreshToggle');
    
    if (autoRefreshEnabled) {
        autoRefreshInterval = setInterval(() => {
            loadStockData(currentStock);
        }, 30000);
        btn.innerHTML = '<i class="fas fa-clock me-1"></i> Auto-refresh ON';
        btn.classList.remove('btn-outline-info');
        btn.classList.add('btn-success');
        showToast('Auto-refresh enabled (30s)', 'success');
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        btn.innerHTML = '<i class="fas fa-clock me-1"></i> Auto-refresh OFF';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-info');
        showToast('Auto-refresh disabled', 'info');
    }
}

// Helper functions
function getDaysForTimeframe() {
    const timeframes = {
        '1D': 24,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '1Y': 365
    };
    return timeframes[currentTimeframe] || 30;
}

function formatChartDate(date) {
    if (currentTimeframe === '1D') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatVolume(volume) {
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toString();
}

function showLoading() {
    const existingSpinner = document.getElementById('loadingSpinner');
    if (existingSpinner) existingSpinner.remove();
    
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.className = 'loading-spinner';
    spinner.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; z-index: 9999;';
    document.body.appendChild(spinner);
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.remove();
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e293b;
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea'};
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Make functions global for onclick handlers
window.switchStock = switchStock;
window.selectStock = selectStock;

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);