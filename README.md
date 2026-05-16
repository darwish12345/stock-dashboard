# 📈 StockMarket Pro - Real-Time Stock Dashboard

A professional stock market dashboard that displays real-time stock prices, interactive charts, technical indicators, and watchlist management.

## 📖 About The Project

StockMarket Pro allows users to monitor stock prices, view historical charts, analyze technical indicators, and manage a personal watchlist. Perfect for investors and traders to track market movements.

## ✨ Features

- 📊 Real-time stock data from Alpha Vantage API
- 📈 Interactive charts with multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- ⭐ Watchlist management - add or remove stocks
- 🎯 Technical indicators (RSI, MACD, SMA20, SMA50)
- 📉 Visual price change indicators (up/down)
- 🔄 Auto-refresh every 30 seconds
- 💾 Persistent watchlist using LocalStorage
- 📊 Market statistics (Open, High, Low, Volume, Market Cap, P/E Ratio)
- 📱 Responsive design for all devices

## 🛠️ Tools & Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure and markup |
| CSS3 | Styling and dark theme |
| JavaScript (ES6+) | API integration and chart rendering |
| Bootstrap 5 | Responsive components |
| Font Awesome | Icons |
| Chart.js | Stock price charts |
| Alpha Vantage API | Real-time stock data |

## 🚀 How To Use

**1. Get a Free API Key**

Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key), sign up for free account, and copy your API key.

**2. Add API Key to Code**

Open `js/app.js` and replace `YOUR_API_KEY_HERE` with your actual key:

const API_KEY = 'your_actual_api_key_here';

**3. Run the Application**

Open `index.html` in your web browser or use Live Server in VS Code.

**4. Start Tracking Stocks**

Click any stock in watchlist to view, click "+" button to add new stocks, click timeframe buttons to change chart view, or toggle auto-refresh for live updates.

## 📊 Technical Indicators

| Indicator | Description | Signal |
|-----------|-------------|--------|
| RSI (14) | Relative Strength Index | Overbought > 70 / Oversold < 30 |
| MACD | Moving Average Convergence | Positive = Bullish / Negative = Bearish |
| SMA 20 | 20-day Moving Average | Price above = Uptrend |
| SMA 50 | 50-day Moving Average | Long-term trend indicator |

## 📈 Chart Timeframes

| Timeframe | Best For |
|-----------|----------|
| 1D | Day trading |
| 1W | Short-term trends |
| 1M | Monthly analysis |
| 3M | Quarterly trends |
| 1Y | Long-term investing |

## 💡 Skills Demonstrated

- REST API integration with authentication
- Real-time data fetching
- Chart.js for financial visualization
- Technical indicator calculations
- Watchlist management with LocalStorage
- Auto-refresh functionality
- Responsive dashboard design
- Error handling for API limits

## ⚠️ Note

Alpha Vantage free tier allows 5 API calls per minute and 500 calls per day. The app includes demo mode fallback when limits are reached.

## 🙏 Acknowledgments

- Alpha Vantage for free stock market API
- Chart.js for interactive stock charts
- Bootstrap for responsive components

---

Built with JavaScript, Chart.js, and Alpha Vantage API
